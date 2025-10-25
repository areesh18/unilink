package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

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
	ProfilePicture string `json:"profilePicture"` // NEW
	Bio            string `json:"bio"`            // NEW
	Department     string `json:"department"`     // NEW
	Semester       int    `json:"semester"`       // NEW
	IsPublic       bool   `json:"isPublic"`       // NEW
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
		CollegeID:    college.ID,             // Link to college
		Department:   studentInfo.Department, // NEW: From mock DB
		Semester:     studentInfo.Semester,   // NEW: From mock DB
	}

	result = db.DB.Create(&newUser)
	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	// NEW: Auto-join student to their department and semester groups (Module 3)
	autoJoinGroups(&newUser)

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
		ProfilePicture: user.ProfilePicture, // NEW
		Bio:            user.Bio,            // NEW
		Department:     user.Department,     // NEW
		Semester:       user.Semester,       // NEW
		IsPublic:       user.IsPublic,       // NEW
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

// autoJoinGroups automatically adds a new student to their department and semester groups
func autoJoinGroups(user *models.User) {
	// Only auto-join for students
	if user.Role != "student" {
		return
	}

	// 1. Find or create department group (e.g., "Computer Science and Engineering")
	deptGroupName := user.Department
	var deptGroup models.Group

	result := db.DB.Where("college_id = ? AND type = ? AND department = ? AND semester IS NULL",
		user.CollegeID, "auto", user.Department).First(&deptGroup)

	if result.Error != nil {
		// Create the department group if it doesn't exist
		deptGroup = models.Group{
			Name:        deptGroupName,
			Description: "Official group for all " + user.Department + " students",
			Type:        "auto",
			CollegeID:   user.CollegeID,
			Department:  &user.Department,
			Semester:    nil, // Department-wide group
		}
		db.DB.Create(&deptGroup)
	}

	// Add user to department group
	db.DB.Create(&models.GroupMember{
		GroupID:  deptGroup.ID,
		UserID:   user.ID,
		Role:     "member",
		JoinedAt: time.Now(),
	})

	// 2. Find or create department + semester group (e.g., "CSE - Semester 4")
	semGroupName := fmt.Sprintf("%s - Semester %d", user.Department, user.Semester)
	var semGroup models.Group

	result = db.DB.Where("college_id = ? AND type = ? AND department = ? AND semester = ?",
		user.CollegeID, "auto", user.Department, user.Semester).First(&semGroup)

	if result.Error != nil {
		// Create the semester group if it doesn't exist
		semGroup = models.Group{
			Name:        semGroupName,
			Description: fmt.Sprintf("Official group for %s Semester %d students", user.Department, user.Semester),
			Type:        "auto",
			CollegeID:   user.CollegeID,
			Department:  &user.Department,
			Semester:    &user.Semester,
		}
		db.DB.Create(&semGroup)
	}

	// Add user to semester group
	db.DB.Create(&models.GroupMember{
		GroupID:  semGroup.ID,
		UserID:   user.ID,
		Role:     "member",
		JoinedAt: time.Now(),
	})
}
