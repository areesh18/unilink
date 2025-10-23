package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"unilink-backend/db"
	"unilink-backend/models"
	"unilink-backend/utils"
)

// CheckCollegeRequest is the payload for college verification
type CheckCollegeRequest struct {
	CollegeCode string `json:"collegeCode"`
}

// CheckCollegeResponse returns public college data
type CheckCollegeResponse struct {
	CollegeName string `json:"collegeName"`
	LogoURL     string `json:"logoUrl"`
}

// RegisterRequest is the payload for student registration
type RegisterRequest struct {
	CollegeCode string `json:"collegeCode"`
	StudentID   string `json:"studentId"`
	Password    string `json:"password"`
}

// LoginRequest is the payload for user login
type LoginRequest struct {
	StudentID string `json:"studentId"`
	Password  string `json:"password"`
}

// LoginResponse returns JWT token and user data
type LoginResponse struct {
	Token string           `json:"token"`
	User  UserResponseData `json:"user"`
}

// UserResponseData contains safe user data for frontend
type UserResponseData struct {
	ID             uint   `json:"id"`
	Name           string `json:"name"`
	Email          string `json:"email"`
	Role           string `json:"role"`
	StudentID      string `json:"studentId"`
	CollegeID      uint   `json:"collegeId"`
	CollegeCode    string `json:"collegeCode"`
	CollegeName    string `json:"collegeName"`
	CollegeLogoURL string `json:"collegeLogoUrl"`
}

// CheckCollege verifies if a college exists (Step 1 of onboarding)
func CheckCollege(w http.ResponseWriter, r *http.Request) {
	var req CheckCollegeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate input
	req.CollegeCode = strings.ToUpper(strings.TrimSpace(req.CollegeCode))
	if req.CollegeCode == "" {
		respondWithError(w, http.StatusBadRequest, "College code is required")
		return
	}

	// Query database for college
	var college models.College
	result := db.DB.Where("college_code = ?", req.CollegeCode).First(&college)

	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "College not found")
		return
	}

	// Return public college data
	response := CheckCollegeResponse{
		CollegeName: college.Name,
		LogoURL:     college.LogoURL,
	}

	respondWithJSON(w, http.StatusOK, response)
}

// RegisterStudent handles new student registration (Step 2 of onboarding)
func RegisterStudent(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate input
	req.CollegeCode = strings.ToUpper(strings.TrimSpace(req.CollegeCode))
	req.StudentID = strings.TrimSpace(req.StudentID)

	if req.CollegeCode == "" || req.StudentID == "" || req.Password == "" {
		respondWithError(w, http.StatusBadRequest, "All fields are required")
		return
	}

	if len(req.Password) < 6 {
		respondWithError(w, http.StatusBadRequest, "Password must be at least 6 characters")
		return
	}

	// Step 1: Verify student ID with mock college database
	studentInfo, err := db.VerifyStudentID(req.CollegeCode, req.StudentID)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Invalid student ID for this college")
		return
	}

	// Step 2: Find the college's internal ID
	var college models.College
	result := db.DB.Where("college_code = ?", req.CollegeCode).First(&college)
	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "College not found")
		return
	}

	// Step 3: Check if student already registered
	var existingUser models.User
	db.DB.Where("student_id = ?", req.StudentID).First(&existingUser)
	if existingUser.ID != 0 {
		respondWithError(w, http.StatusConflict, "Student ID already registered")
		return
	}

	// Step 4: Hash password
	passwordHash, err := utils.HashPassword(req.Password)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to process password")
		return
	}

	// Step 5: Create user in database
	newUser := models.User{
		Name:         studentInfo.Name,
		Email:        studentInfo.Email,
		PasswordHash: passwordHash,
		Role:         "student", // Default role
		StudentID:    req.StudentID,
		CollegeID:    college.ID, // Link to college
	}

	result = db.DB.Create(&newUser)
	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]string{
		"message": "Registration successful",
	})
}

// Login handles user authentication and JWT generation
func Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate input
	req.StudentID = strings.TrimSpace(req.StudentID)
	if req.StudentID == "" || req.Password == "" {
		respondWithError(w, http.StatusBadRequest, "Student ID and password are required")
		return
	}

	// Step 1: Find user by student ID and preload college data
	var user models.User
	result := db.DB.Preload("College").Where("student_id = ?", req.StudentID).First(&user)
	if result.Error != nil {
		respondWithError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	// Step 2: Verify password
	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		respondWithError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	// Step 3: Generate JWT token
	token, err := utils.GenerateJWT(&user)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	// Step 4: Prepare response with user data
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

// Helper function to send JSON responses
func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, _ := json.Marshal(payload)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

// Helper function to send error responses
func respondWithError(w http.ResponseWriter, code int, message string) {
	respondWithJSON(w, code, map[string]string{"error": message})
}
