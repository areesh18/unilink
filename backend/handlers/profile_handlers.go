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

// ProfileResponse contains safe user profile data
type ProfileResponse struct {
	ID               uint   `json:"id"`
	Name             string `json:"name"`
	Email            string `json:"email"`
	StudentID        string `json:"studentId"`
	ProfilePicture   string `json:"profilePicture"`
	Bio              string `json:"bio"`
	Department       string `json:"department"`
	Semester         int    `json:"semester"`
	CollegeCode      string `json:"collegeCode"`
	CollegeName      string `json:"collegeName"`
	IsPublic         bool   `json:"isPublic"`
	CreatedAt        string `json:"createdAt"`
	FriendshipStatus string `json:"friendshipStatus"`
}

// UpdateProfileRequest is the payload for updating profile
type UpdateProfileRequest struct {
	ProfilePicture string `json:"profilePicture"`
	Bio            string `json:"bio"`
	IsPublic       bool   `json:"isPublic"`
}

// GetMyProfile returns the authenticated user's profile
func GetMyProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}
	// Get user with college info
	var user models.User
	result := db.DB.Preload("College").First(&user, claims.UserID)
	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "User not found")
		return
	}

	// Transform to response
	profile := ProfileResponse{
		ID:             user.ID,
		Name:           user.Name,
		Email:          user.Email,
		StudentID:      user.StudentID,
		ProfilePicture: user.ProfilePicture,
		Bio:            user.Bio,
		Department:     user.Department,
		Semester:       user.Semester,
		CollegeCode:    user.College.CollegeCode,
		CollegeName:    user.College.Name,
		IsPublic:       user.IsPublic,
		CreatedAt:      user.CreatedAt.Format("2006-01-02 15:04:05"),
	}

	respondWithJSON(w, http.StatusOK, profile)
}

// UpdateMyProfile allows users to update their profile
func UpdateMyProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	var req UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Find user
	var user models.User
	result := db.DB.First(&user, claims.UserID)
	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "User not found")
		return
	}

	// Update fields
	user.ProfilePicture = req.ProfilePicture
	user.Bio = strings.TrimSpace(req.Bio)
	user.IsPublic = req.IsPublic

	// Validate bio length
	if len(user.Bio) > 500 {
		respondWithError(w, http.StatusBadRequest, "Bio must be less than 500 characters")
		return
	}

	// Save updates
	if err := db.DB.Save(&user).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Profile updated successfully",
		"profile": ProfileResponse{
			ID:             user.ID,
			Name:           user.Name,
			Email:          user.Email,
			StudentID:      user.StudentID,
			ProfilePicture: user.ProfilePicture,
			Bio:            user.Bio,
			Department:     user.Department,
			Semester:       user.Semester,
			IsPublic:       user.IsPublic,
			CreatedAt:      user.CreatedAt.Format("2006-01-02 15:04:05"),
		},
	})
}

// GetUserProfile returns another user's public profile
func GetUserProfile(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get user ID from URL
	vars := mux.Vars(r)
	userID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Find user with college info
	var user models.User
	result := db.DB.Preload("College").
		Where("id = ? AND college_id = ?", userID, claims.CollegeID). // College isolation
		First(&user)

	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "User not found or not in your college")
		return
	}

	/* // Check privacy settings
	if !user.IsPublic && user.ID != claims.UserID {
		respondWithError(w, http.StatusForbidden, "This profile is private")
		return
	} */
	// --- Updated Privacy Check ---
	// Allow access if:
	// 1. It's the user's own profile (user.ID == claims.UserID)
	// 2. The profile is public (user.IsPublic)
	// 3. They are friends (check friendship table)
	isOwnProfile := user.ID == claims.UserID
	canView := isOwnProfile || user.IsPublic

	if !canView { // If not own profile and not public, check friendship
		var friendship models.Friendship
		resultFriendship := db.DB.Where(
			"((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)) AND status = ?",
			claims.UserID, user.ID, // Check both directions
			user.ID, claims.UserID,
			"accepted", // Must be accepted friends
		).First(&friendship)

		if resultFriendship.Error == nil { // If a friendship record is found
			canView = true // Friends can view private profiles
		}
	}

	// Final check
	if !canView {
		respondWithError(w, http.StatusForbidden, "This profile is private or you do not have access.")
		return
	}
	// --- End Updated Privacy Check ---

	// Transform to response
	profile := ProfileResponse{
		ID:             user.ID,
		Name:           user.Name,
		Email:          user.Email,
		StudentID:      user.StudentID,
		ProfilePicture: user.ProfilePicture,
		Bio:            user.Bio,
		Department:     user.Department,
		Semester:       user.Semester,
		CollegeCode:    user.College.CollegeCode,
		CollegeName:    user.College.Name,
		IsPublic:       user.IsPublic,
		CreatedAt:      user.CreatedAt.Format("2006-01-02 15:04:05"),
	}

	respondWithJSON(w, http.StatusOK, profile)
}

// SearchDirectory allows students to search for other students in their college
func SearchDirectory(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get query parameters
	searchQuery := r.URL.Query().Get("q") // Search term

	if searchQuery == "" {
		// Return empty list or specific message if search query is required
		respondWithJSON(w, http.StatusOK, map[string]interface{}{
			"total":    0,
			"students": []ProfileResponse{}, // Return empty list
		})
		// respondWithError(w, http.StatusBadRequest, "Search query 'q' is required")
		return
	}

	// Build query - Fetch ALL active students in the college initially
	query := db.DB.Preload("College"). // Preload College if needed for response
						Where("college_id = ? AND role = ? AND status = ? AND id != ?", // Exclude self
			claims.CollegeID, "student", "active", claims.UserID)

	// Apply search filter (name, studentId) - case-insensitive
	searchPattern := "%" + strings.ToLower(searchQuery) + "%"
	query = query.Where("LOWER(name) LIKE ? OR LOWER(student_id) LIKE ?",
		searchPattern, searchPattern)

	// Execute query
	var users []models.User
	result := query.Order("name ASC").Limit(20).Find(&users) // Limit results

	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to search directory")
		return
	}

	// Get all relevant friendships involving the current user in one go for efficiency
	var friendships []models.Friendship
	db.DB.Where("(user_id = ? OR friend_id = ?) AND college_id = ?", claims.UserID, claims.UserID, claims.CollegeID).Find(&friendships)
	friendshipMap := make(map[uint]string) // Key: other user's ID, Value: friendship status
	for _, f := range friendships {
		otherUserID := f.FriendID
		status := f.Status
		// Determine status relative to the current user
		if f.FriendID == claims.UserID {
			otherUserID = f.UserID
			// If the current user is the 'friend', reverse 'pending' meaning
			if status == "pending" {
				status = "pending_received" // Current user received the request
			}
		} else if status == "pending" {
			status = "pending_sent" // Current user sent the request
		}
		friendshipMap[otherUserID] = status
	}

	// Transform to response, including isPublic and friendshipStatus
	var profiles []ProfileResponse
	for _, user := range users {
		status, found := friendshipMap[user.ID]
		if !found {
			status = "none" // No existing friendship record
		}

		profiles = append(profiles, ProfileResponse{
			ID:               user.ID,
			Name:             user.Name,
			StudentID:        user.StudentID,
			ProfilePicture:   user.ProfilePicture,
			Department:       user.Department, // Include fields needed for display
			Semester:         user.Semester,   // Include fields needed for display
			IsPublic:         user.IsPublic,   // <-- Include privacy status
			FriendshipStatus: status,          // <-- Include friendship status
			// Add other fields like CollegeCode, CollegeName if needed for display context
		})
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"total":    len(profiles),
		"students": profiles,
	})
}

// GetDepartments returns list of unique departments in the college
func GetDepartments(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get unique departments
	var departments []string
	db.DB.Model(&models.User{}).
		Where("college_id = ? AND role = ?", claims.CollegeID, "student").
		Distinct("department").
		Pluck("department", &departments)

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"departments": departments,
	})
}
