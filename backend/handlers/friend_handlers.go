package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"unilink-backend/db"
	"unilink-backend/models"
	"unilink-backend/utils"

	"github.com/gorilla/mux"
)

// FriendRequestRequest is the payload for sending friend request
type FriendRequestRequest struct {
	FriendID uint `json:"friendId"`
}

// FriendshipResponse contains friendship data
type FriendshipResponse struct {
	ID        uint              `json:"id"`
	Status    string            `json:"status"`
	Friend    FriendProfileData `json:"friend"`
	CreatedAt string            `json:"createdAt"`
}

// FriendProfileData contains friend's basic info
type FriendProfileData struct {
	ID             uint   `json:"id"`
	Name           string `json:"name"`
	Email          string `json:"email"`
	StudentID      string `json:"studentId"`
	ProfilePicture string `json:"profilePicture"`
	Department     string `json:"department"`
	Semester       int    `json:"semester"`
}

// SendFriendRequest allows a student to send friend request to another student
func SendFriendRequest(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	var req FriendRequestRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate friend ID
	if req.FriendID == 0 {
		respondWithError(w, http.StatusBadRequest, "Friend ID is required")
		return
	}

	// Can't send request to yourself
	if req.FriendID == claims.UserID {
		respondWithError(w, http.StatusBadRequest, "Cannot send friend request to yourself")
		return
	}

	// Check if friend exists and is in same college
	var friend models.User
	result := db.DB.Where("id = ? AND college_id = ? AND role = ?", req.FriendID, claims.CollegeID, "student").First(&friend)
	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "User not found or not in your college")
		return
	}

	// Check if friendship already exists (in either direction)
	var existingFriendship models.Friendship
	db.DB.Where("(user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
		claims.UserID, req.FriendID, req.FriendID, claims.UserID).First(&existingFriendship)

	if existingFriendship.ID != 0 {
		if existingFriendship.Status == "accepted" {
			respondWithError(w, http.StatusConflict, "Already friends")
			return
		} else if existingFriendship.Status == "pending" {
			respondWithError(w, http.StatusConflict, "Friend request already pending")
			return
		} else if existingFriendship.Status == "blocked" {
			respondWithError(w, http.StatusForbidden, "Cannot send friend request")
			return
		}
	}

	// Create friendship
	friendship := models.Friendship{
		UserID:    claims.UserID,
		FriendID:  req.FriendID,
		Status:    "pending",
		CollegeID: claims.CollegeID,
	}

	if err := db.DB.Create(&friendship).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to send friend request")
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]string{
		"message": "Friend request sent successfully",
	})
}

// GetPendingRequests returns friend requests that the user has received
func GetPendingRequests(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get all pending requests where current user is the friend (receiver)
	var friendships []models.Friendship
	result := db.DB.Preload("User").
		Where("friend_id = ? AND status = ?", claims.UserID, "pending").
		Order("created_at DESC").
		Find(&friendships)

	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch requests")
		return
	}

	// Transform to response
	var requests []FriendshipResponse
	for _, f := range friendships {
		requests = append(requests, FriendshipResponse{
			ID:     f.ID,
			Status: f.Status,
			Friend: FriendProfileData{
				ID:             f.User.ID,
				Name:           f.User.Name,
				Email:          f.User.Email,
				StudentID:      f.User.StudentID,
				ProfilePicture: f.User.ProfilePicture,
				Department:     f.User.Department,
				Semester:       f.User.Semester,
			},
			CreatedAt: f.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"total":    len(requests),
		"requests": requests,
	})
}

// AcceptFriendRequest allows user to accept a pending friend request
func AcceptFriendRequest(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get friendship ID from URL
	vars := mux.Vars(r)
	friendshipID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid friendship ID")
		return
	}

	// Find friendship and verify it's for current user
	var friendship models.Friendship
	result := db.DB.Where("id = ? AND friend_id = ? AND status = ?", friendshipID, claims.UserID, "pending").First(&friendship)
	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "Friend request not found")
		return
	}

	// Update status to accepted
	friendship.Status = "accepted"
	if err := db.DB.Save(&friendship).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to accept request")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Friend request accepted",
	})
}

// RejectFriendRequest allows user to reject a pending friend request
func RejectFriendRequest(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get friendship ID from URL
	vars := mux.Vars(r)
	friendshipID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid friendship ID")
		return
	}

	// Find friendship and verify it's for current user
	var friendship models.Friendship
	result := db.DB.Where("id = ? AND friend_id = ? AND status = ?", friendshipID, claims.UserID, "pending").First(&friendship)
	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "Friend request not found")
		return
	}

	// Update status to rejected
	friendship.Status = "rejected"
	if err := db.DB.Save(&friendship).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to reject request")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Friend request rejected",
	})
}

// GetFriends returns all accepted friends of the user
func GetFriends(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get all accepted friendships where user is either sender or receiver
	var friendships []models.Friendship
	result := db.DB.Preload("User").Preload("Friend").
		Where("(user_id = ? OR friend_id = ?) AND status = ?", claims.UserID, claims.UserID, "accepted").
		Find(&friendships)

	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch friends")
		return
	}

	// Transform to response (get the "other" person in each friendship)
	var friends []FriendProfileData
	for _, f := range friendships {
		var friendUser models.User

		// Determine which user is the friend (not current user)
		if f.UserID == claims.UserID {
			friendUser = f.Friend
		} else {
			friendUser = f.User
		}

		friends = append(friends, FriendProfileData{
			ID:             friendUser.ID,
			Name:           friendUser.Name,
			Email:          friendUser.Email,
			StudentID:      friendUser.StudentID,
			ProfilePicture: friendUser.ProfilePicture,
			Department:     friendUser.Department,
			Semester:       friendUser.Semester,
		})
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"total":   len(friends),
		"friends": friends,
	})
}

// RemoveFriend allows user to unfriend someone
func RemoveFriend(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get friend user ID from URL
	vars := mux.Vars(r)
	friendUserID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Find and delete friendship (in either direction)
	result := db.DB.Where("((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)) AND status = ?",
		claims.UserID, friendUserID, friendUserID, claims.UserID, "accepted").
		Delete(&models.Friendship{})

	if result.Error != nil || result.RowsAffected == 0 {
		respondWithError(w, http.StatusNotFound, "Friendship not found")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Friend removed successfully",
	})
}

// GetFriendSuggestions returns students from same department/semester (potential friends)
func GetFriendSuggestions(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get current user's info
	var currentUser models.User
	db.DB.First(&currentUser, claims.UserID)

	// Get existing friend IDs (to exclude them)
	var friendships []models.Friendship
	db.DB.Where("(user_id = ? OR friend_id = ?) AND status = ?", claims.UserID, claims.UserID, "accepted").
		Find(&friendships)

	excludeIDs := []uint{claims.UserID} // Exclude self
	for _, f := range friendships {
		if f.UserID == claims.UserID {
			excludeIDs = append(excludeIDs, f.FriendID)
		} else {
			excludeIDs = append(excludeIDs, f.UserID)
		}
	}

	// Find students from same department and semester, not already friends
	var suggestions []models.User
	db.DB.Where("college_id = ? AND role = ? AND department = ? AND semester = ? AND id NOT IN ?",
		claims.CollegeID, "student", currentUser.Department, currentUser.Semester, excludeIDs).
		Limit(20).
		Find(&suggestions)

	// Transform to response
	var response []FriendProfileData
	for _, user := range suggestions {
		response = append(response, FriendProfileData{
			ID:             user.ID,
			Name:           user.Name,
			Email:          user.Email,
			StudentID:      user.StudentID,
			ProfilePicture: user.ProfilePicture,
			Department:     user.Department,
			Semester:       user.Semester,
		})
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"total":       len(response),
		"suggestions": response,
	})
}
