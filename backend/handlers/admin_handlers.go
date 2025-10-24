package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"unilink-backend/db"
	"unilink-backend/models"
	"unilink-backend/utils"

	"github.com/gorilla/mux"
)

// ============================================
// SETUP FUNCTION (For creating first platform admin)
// ============================================

// CreateFirstPlatformAdmin is a one-time setup function
// Should be removed after first platform admin is created
func CreateFirstPlatformAdmin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name        string `json:"name"`
		Email       string `json:"email"`
		Password    string `json:"password"`
		CollegeCode string `json:"collegeCode"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate input
	req.CollegeCode = strings.ToUpper(strings.TrimSpace(req.CollegeCode))
	req.Email = strings.TrimSpace(req.Email)
	req.Name = strings.TrimSpace(req.Name)

	if req.Name == "" || req.Email == "" || req.Password == "" || req.CollegeCode == "" {
		respondWithError(w, http.StatusBadRequest, "All fields are required")
		return
	}

	if len(req.Password) < 6 {
		respondWithError(w, http.StatusBadRequest, "Password must be at least 6 characters")
		return
	}

	// Find college
	var college models.College
	result := db.DB.Where("college_code = ?", req.CollegeCode).First(&college)
	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "College not found")
		return
	}

	// Check if email already exists
	var existingUser models.User
	db.DB.Where("email = ?", req.Email).First(&existingUser)
	if existingUser.ID != 0 {
		respondWithError(w, http.StatusConflict, "Email already registered")
		return
	}

	// Hash password
	passwordHash, err := utils.HashPassword(req.Password)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to process password")
		return
	}

	// Create platform admin
	newAdmin := models.User{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: passwordHash,
		Role:         "platform_admin",
		StudentID:    "PADMIN_" + strings.ToUpper(req.Email[:5]),
		CollegeID:    college.ID,
	}

	result = db.DB.Create(&newAdmin)
	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create platform admin")
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"message": "Platform admin created successfully",
		"admin": map[string]interface{}{
			"id":    newAdmin.ID,
			"name":  newAdmin.Name,
			"email": newAdmin.Email,
			"role":  newAdmin.Role,
		},
	})
}

// ============================================
// COMMON ADMIN FUNCTIONS
// ============================================

// LoginAdmin handles authentication for both college_admin and platform_admin
func LoginAdmin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate input
	req.Email = strings.TrimSpace(req.Email)
	if req.Email == "" || req.Password == "" {
		respondWithError(w, http.StatusBadRequest, "Email and password are required")
		return
	}

	// Find admin by email (both college_admin and platform_admin)
	var user models.User
	result := db.DB.Preload("College").
		Where("email = ? AND (role = ? OR role = ?)", req.Email, "college_admin", "platform_admin").
		First(&user)
	
	if result.Error != nil {
		respondWithError(w, http.StatusUnauthorized, "Invalid credentials or not an admin")
		return
	}

	// Verify password
	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		respondWithError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	// Generate JWT token
	token, err := utils.GenerateJWT(&user)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	// Prepare response
	userData := UserResponseData{
		ID:             user.ID,
		Name:           user.Name,
		Email:          user.Email,
		Role:           user.Role,
		StudentID:      user.StudentID,
		CollegeID:      user.CollegeID,
		CollegeCode:    user.College.CollegeCode,
		CollegeName:    user.College.Name,
		CollegeLogoURL: user.College.LogoURL,
	}

	response := LoginResponse{
		Token: token,
		User:  userData,
	}

	respondWithJSON(w, http.StatusOK, response)
}

// ============================================
// COLLEGE ADMIN FUNCTIONS (College-Scoped)
// ============================================

// GetCollegeStudents returns all students from the admin's college
func GetCollegeStudents(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get students from admin's college only
	var users []models.User
	result := db.DB.Preload("College").
		Where("college_id = ? AND role = ?", claims.CollegeID, "student").
		Order("created_at DESC").
		Find(&users)

	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch students")
		return
	}

	// Transform to safe response
	var response []map[string]interface{}
	for _, user := range users {
		response = append(response, map[string]interface{}{
			"id":        user.ID,
			"name":      user.Name,
			"email":     user.Email,
			"studentId": user.StudentID,
			"createdAt": user.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	respondWithJSON(w, http.StatusOK, response)
}

// GetCollegeListings returns all marketplace listings from the admin's college
func GetCollegeListings(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get listings from admin's college only
	var listings []models.MarketplaceListing
	result := db.DB.Preload("Seller").
		Where("college_id = ?", claims.CollegeID).
		Order("created_at DESC").
		Find(&listings)

	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch listings")
		return
	}

	// Transform to response
	var response []ListingResponse
	for _, listing := range listings {
		response = append(response, ListingResponse{
			ID:          listing.ID,
			Title:       listing.Title,
			Description: listing.Description,
			Price:       listing.Price,
			ImageURL:    listing.ImageURL,
			Status:      listing.Status,
			Seller: SellerInfo{
				ID:        listing.Seller.ID,
				Name:      listing.Seller.Name,
				StudentID: listing.Seller.StudentID,
			},
			CreatedAt: listing.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	respondWithJSON(w, http.StatusOK, response)
}

// DeleteCollegeListing allows college admin to delete listings from their college
func DeleteCollegeListing(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get listing ID
	vars := mux.Vars(r)
	listingID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid listing ID")
		return
	}

	// Find listing and verify it belongs to admin's college
	var listing models.MarketplaceListing
	result := db.DB.Where("id = ? AND college_id = ?", listingID, claims.CollegeID).First(&listing)
	
	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "Listing not found in your college")
		return
	}

	// Delete listing
	db.DB.Delete(&listing)

	respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Listing deleted successfully",
	})
}

// GetCollegeStats returns statistics for the admin's college
func GetCollegeStats(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get college info
	var college models.College
	if err := db.DB.First(&college, claims.CollegeID).Error; err != nil {
		respondWithError(w, http.StatusNotFound, "College not found")
		return
	}

	// Count students
	var studentCount int64
	db.DB.Model(&models.User{}).Where("college_id = ? AND role = ?", claims.CollegeID, "student").Count(&studentCount)

	// Count total listings
	var totalListings int64
	db.DB.Model(&models.MarketplaceListing{}).Where("college_id = ?", claims.CollegeID).Count(&totalListings)

	// Count active listings
	var activeListings int64
	db.DB.Model(&models.MarketplaceListing{}).
		Where("college_id = ? AND status = ?", claims.CollegeID, "available").
		Count(&activeListings)

	stats := map[string]interface{}{
		"collegeId":      college.ID,
		"collegeCode":    college.CollegeCode,
		"collegeName":    college.Name,
		"totalStudents":  studentCount,
		"totalListings":  totalListings,
		"activeListings": activeListings,
	}

	respondWithJSON(w, http.StatusOK, stats)
}

// ============================================
// PLATFORM ADMIN FUNCTIONS (Global Access)
// ============================================

// CreateCollegeAdmin allows platform admin to create a college admin
func CreateCollegeAdmin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name        string `json:"name"`
		Email       string `json:"email"`
		Password    string `json:"password"`
		CollegeCode string `json:"collegeCode"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate input
	req.CollegeCode = strings.ToUpper(strings.TrimSpace(req.CollegeCode))
	req.Email = strings.TrimSpace(req.Email)
	req.Name = strings.TrimSpace(req.Name)

	if req.Name == "" || req.Email == "" || req.Password == "" || req.CollegeCode == "" {
		respondWithError(w, http.StatusBadRequest, "All fields are required")
		return
	}

	if len(req.Password) < 6 {
		respondWithError(w, http.StatusBadRequest, "Password must be at least 6 characters")
		return
	}

	// Find college
	var college models.College
	result := db.DB.Where("college_code = ?", req.CollegeCode).First(&college)
	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "College not found")
		return
	}

	// Check if email already exists
	var existingUser models.User
	db.DB.Where("email = ?", req.Email).First(&existingUser)
	if existingUser.ID != 0 {
		respondWithError(w, http.StatusConflict, "Email already registered")
		return
	}

	// Hash password
	passwordHash, err := utils.HashPassword(req.Password)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to process password")
		return
	}

	// Create college admin
	newAdmin := models.User{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: passwordHash,
		Role:         "college_admin",
		StudentID:    "CADMIN_" + strings.ToUpper(req.Email[:5]),
		CollegeID:    college.ID,
	}

	result = db.DB.Create(&newAdmin)
	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create college admin")
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"message": "College admin created successfully",
		"admin": map[string]interface{}{
			"id":          newAdmin.ID,
			"name":        newAdmin.Name,
			"email":       newAdmin.Email,
			"role":        newAdmin.Role,
			"collegeCode": college.CollegeCode,
		},
	})
}

// AddCollege allows platform admin to add a new college
func AddCollege(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CollegeCode string `json:"collegeCode"`
		Name        string `json:"name"`
		LogoURL     string `json:"logoUrl"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate input
	req.CollegeCode = strings.ToUpper(strings.TrimSpace(req.CollegeCode))
	req.Name = strings.TrimSpace(req.Name)

	if req.CollegeCode == "" || req.Name == "" {
		respondWithError(w, http.StatusBadRequest, "College code and name are required")
		return
	}

	// Check if college exists
	var existingCollege models.College
	db.DB.Where("college_code = ?", req.CollegeCode).First(&existingCollege)
	if existingCollege.ID != 0 {
		respondWithError(w, http.StatusConflict, "College code already exists")
		return
	}

	// Create college
	newCollege := models.College{
		CollegeCode: req.CollegeCode,
		Name:        req.Name,
		LogoURL:     req.LogoURL,
	}

	result := db.DB.Create(&newCollege)
	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create college")
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"message": "College added successfully",
		"college": newCollege,
	})
}

// GetAllStudents returns ALL students from ALL colleges (platform admin only)
func GetAllStudents(w http.ResponseWriter, r *http.Request) {
	var users []models.User
	result := db.DB.Preload("College").
		Where("role = ?", "student").
		Order("created_at DESC").
		Find(&users)

	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch students")
		return
	}

	// Transform to response
	var response []map[string]interface{}
	for _, user := range users {
		response = append(response, map[string]interface{}{
			"id":          user.ID,
			"name":        user.Name,
			"email":       user.Email,
			"studentId":   user.StudentID,
			"collegeCode": user.College.CollegeCode,
			"collegeName": user.College.Name,
			"createdAt":   user.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	respondWithJSON(w, http.StatusOK, response)
}

// GetAllListingsPlatform returns ALL marketplace listings from ALL colleges (platform admin only)
func GetAllListingsPlatform(w http.ResponseWriter, r *http.Request) {
	var listings []models.MarketplaceListing
	result := db.DB.Preload("Seller").Preload("College").
		Order("created_at DESC").
		Find(&listings)

	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch listings")
		return
	}

	// Transform to response
	type PlatformListingResponse struct {
		ListingResponse
		CollegeCode string `json:"collegeCode"`
		CollegeName string `json:"collegeName"`
	}

	var response []PlatformListingResponse
	for _, listing := range listings {
		response = append(response, PlatformListingResponse{
			ListingResponse: ListingResponse{
				ID:          listing.ID,
				Title:       listing.Title,
				Description: listing.Description,
				Price:       listing.Price,
				ImageURL:    listing.ImageURL,
				Status:      listing.Status,
				Seller: SellerInfo{
					ID:        listing.Seller.ID,
					Name:      listing.Seller.Name,
					StudentID: listing.Seller.StudentID,
				},
				CreatedAt: listing.CreatedAt.Format("2006-01-02 15:04:05"),
			},
			CollegeCode: listing.College.CollegeCode,
			CollegeName: listing.College.Name,
		})
	}

	respondWithJSON(w, http.StatusOK, response)
}

// GetPlatformStats returns platform-wide statistics
func GetPlatformStats(w http.ResponseWriter, r *http.Request) {
	// Count colleges
	var totalColleges int64
	db.DB.Model(&models.College{}).Count(&totalColleges)

	// Count total students
	var totalStudents int64
	db.DB.Model(&models.User{}).Where("role = ?", "student").Count(&totalStudents)

	// Count total listings
	var totalListings int64
	db.DB.Model(&models.MarketplaceListing{}).Count(&totalListings)

	// Per-college breakdown
	var colleges []models.College
	db.DB.Find(&colleges)

	type CollegeStat struct {
		CollegeCode    string `json:"collegeCode"`
		CollegeName    string `json:"collegeName"`
		StudentCount   int64  `json:"studentCount"`
		ListingCount   int64  `json:"listingCount"`
		ActiveListings int64  `json:"activeListings"`
	}

	var collegeStats []CollegeStat
	for _, college := range colleges {
		var studentCount int64
		db.DB.Model(&models.User{}).Where("college_id = ? AND role = ?", college.ID, "student").Count(&studentCount)

		var listingCount int64
		db.DB.Model(&models.MarketplaceListing{}).Where("college_id = ?", college.ID).Count(&listingCount)

		var activeCount int64
		db.DB.Model(&models.MarketplaceListing{}).
			Where("college_id = ? AND status = ?", college.ID, "available").
			Count(&activeCount)

		collegeStats = append(collegeStats, CollegeStat{
			CollegeCode:    college.CollegeCode,
			CollegeName:    college.Name,
			StudentCount:   studentCount,
			ListingCount:   listingCount,
			ActiveListings: activeCount,
		})
	}

	response := map[string]interface{}{
		"totalColleges":  totalColleges,
		"totalStudents":  totalStudents,
		"totalListings":  totalListings,
		"collegeStats":   collegeStats,
	}

	respondWithJSON(w, http.StatusOK, response)
}