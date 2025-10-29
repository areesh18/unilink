package handlers

import (
	"encoding/json"
	"log" // <-- Ensure log is imported
	"net/http"
	"strconv"
	"time"

	"unilink-backend/db"
	"unilink-backend/models"
	"unilink-backend/utils"
	"unilink-backend/websocket" // <-- Ensure websocket is imported

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
	Friend    FriendProfileData `json:"friend"` // This is the SENDER when getting pending requests
	CreatedAt string            `json:"createdAt"`
}

// FriendProfileData contains friend's basic info
type FriendProfileData struct {
	ID             uint   `json:"id"`
	Name           string `json:"name"`
	Email          string `json:"email"` // Consider removing email if not needed on frontend for this
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
		// Existing logic for conflict checks remains...
		if existingFriendship.Status == "accepted" {
			respondWithError(w, http.StatusConflict, "Already friends")
			return
		} else if existingFriendship.Status == "pending" {
			// Check who sent the pending request
			if existingFriendship.UserID == claims.UserID {
				respondWithError(w, http.StatusConflict, "You already sent a request")
			} else {
				respondWithError(w, http.StatusConflict, "This user already sent you a request")
			}
			return
		} else if existingFriendship.Status == "blocked" {
			respondWithError(w, http.StatusForbidden, "Cannot send friend request")
			return
		} else if existingFriendship.Status == "rejected" {
			// Allow re-sending request after rejection (or implement cooldown if desired)
			// Decide whether to reuse the rejected record or create a new one.
			// For simplicity here, we'll create a new one, ignoring the old rejected one.
			// Alternatively, update the existing rejected one:
			// existingFriendship.UserID = claims.UserID // Ensure sender is correct
			// existingFriendship.FriendID = req.FriendID
			// existingFriendship.Status = "pending"
			// existingFriendship.UpdatedAt = time.Now()
			// if err := db.DB.Save(&existingFriendship).Error; err != nil { ... }
			// goto SendNotification // Skip creating new, jump to notify
		}
	}

	// Create friendship
	friendship := models.Friendship{
		UserID:    claims.UserID, // The sender (current user)
		FriendID:  req.FriendID,  // The recipient
		Status:    "pending",
		CollegeID: claims.CollegeID,
	}

	if err := db.DB.Create(&friendship).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to send friend request")
		return
	}

	// --- Broadcast WebSocket Notification ---
	// Get Hub from context
	hub, hubOk := r.Context().Value(utils.HubKey).(*websocket.Hub)
	if hubOk && hub != nil {
		// Get sender details (current user)
		var sender models.User
		db.DB.First(&sender, claims.UserID) // Fetch minimal sender details needed

		// Construct payload for the recipient
		wsPayload := map[string]interface{}{
			"id":       friendship.ID, // Friendship record ID
			"type":     "newFriendRequest",
			"userId":   friendship.UserID,   // The ID of the person who sent the request
			"friendId": friendship.FriendID, // The ID of the person receiving the request (TARGET USER)
			"sender": FriendProfileData{ // Include info about the sender
				ID:             sender.ID,
				Name:           sender.Name,
				StudentID:      sender.StudentID,
				ProfilePicture: sender.ProfilePicture,
				Department:     sender.Department,
				Semester:       sender.Semester,
			},
			"createdAt": friendship.CreatedAt.Format("2006-01-02 15:04:05"),
		}

		wsMsg := &websocket.WSMessage{
			Type:    "newFriendRequest",
			Payload: wsPayload,
		}
		hub.BroadcastJSON(wsMsg)
		log.Printf("WS Broadcast: Sent 'newFriendRequest' notification to UserID %d", friendship.FriendID)

	} else {
		log.Printf("Warning: Hub not found in context for SendFriendRequest. HubOk: %v, HubNil: %v", hubOk, hub == nil)
	}
	// --- End Broadcast ---

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
	// Preload the 'User' which represents the SENDER of the request
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
		// 'Friend' in the response should be the sender ('User' from the preload)
		requests = append(requests, FriendshipResponse{
			ID:     f.ID,
			Status: f.Status,
			Friend: FriendProfileData{ // Friend here refers to the SENDER
				ID:             f.User.ID,
				Name:           f.User.Name,
				Email:          f.User.Email, // Consider removing
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

	vars := mux.Vars(r)
	friendshipID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid friendship ID")
		return
	}

	// Find friendship where current user is the receiver (friend_id)
	var friendship models.Friendship
	// Preload User (sender) and Friend (receiver - current user)
	result := db.DB.Preload("User").Preload("Friend").
		Where("id = ? AND friend_id = ? AND status = ?", friendshipID, claims.UserID, "pending").
		First(&friendship)

	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "Friend request not found or already actioned")
		return
	}

	// Update status to accepted
	friendship.Status = "accepted"
	if err := db.DB.Save(&friendship).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to accept request")
		return
	}

	// --- Broadcast WebSocket Notification to the original sender ---
	hub, hubOk := r.Context().Value(utils.HubKey).(*websocket.Hub)
	if hubOk && hub != nil {
		// Construct payload for the original sender (friendship.User)
		wsPayload := map[string]interface{}{
			"id":       friendship.ID,
			"type":     "friendRequestUpdate",
			"userId":   friendship.UserID,   // The ID of the original sender (TARGET USER)
			"friendId": friendship.FriendID, // The ID of the user who accepted
			"status":   "accepted",
			"accepter": FriendProfileData{ // Include info about who accepted
				ID:             friendship.Friend.ID,
				Name:           friendship.Friend.Name,
				StudentID:      friendship.Friend.StudentID,
				ProfilePicture: friendship.Friend.ProfilePicture,
				Department:     friendship.Friend.Department,
				Semester:       friendship.Friend.Semester,
			},
			"updatedAt": friendship.UpdatedAt.Format("2006-01-02 15:04:05"),
		}

		wsMsg := &websocket.WSMessage{
			Type:    "friendRequestUpdate",
			Payload: wsPayload,
		}
		hub.BroadcastJSON(wsMsg)
		log.Printf("WS Broadcast: Sent 'friendRequestUpdate' (accepted) notification to UserID %d", friendship.UserID)
	} else {
		log.Printf("Warning: Hub not found in context for AcceptFriendRequest. HubOk: %v, HubNil: %v", hubOk, hub == nil)
	}
	// --- End Broadcast ---

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

	vars := mux.Vars(r)
	friendshipID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid friendship ID")
		return
	}

	// Find friendship where current user is the receiver
	var friendship models.Friendship
	// Preload User (sender) only needed for notification
	result := db.DB.Preload("User").
		Where("id = ? AND friend_id = ? AND status = ?", friendshipID, claims.UserID, "pending").
		First(&friendship)

	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "Friend request not found or already actioned")
		return
	}

	// Update status to rejected
	// Option 1: Update status (keeps record, allows re-sending later maybe)
	friendship.Status = "rejected"
	if err := db.DB.Save(&friendship).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to reject request")
		return
	}

	// Option 2: Delete the request entirely (simpler, but loses history)
	// if err := db.DB.Delete(&friendship).Error; err != nil { ... }

	// --- Broadcast WebSocket Notification to the original sender ---
	hub, hubOk := r.Context().Value(utils.HubKey).(*websocket.Hub)
	if hubOk && hub != nil {
		// Construct payload for the original sender (friendship.User)
		wsPayload := map[string]interface{}{
			"id":         friendship.ID,
			"type":       "friendRequestUpdate",
			"userId":     friendship.UserID,   // The ID of the original sender (TARGET USER)
			"friendId":   friendship.FriendID, // The ID of the user who rejected
			"status":     "rejected",
			"rejecterId": friendship.FriendID, // ID of who rejected
			"updatedAt":  friendship.UpdatedAt.Format("2006-01-02 15:04:05"),
		}

		wsMsg := &websocket.WSMessage{
			Type:    "friendRequestUpdate",
			Payload: wsPayload,
		}
		hub.BroadcastJSON(wsMsg)
		log.Printf("WS Broadcast: Sent 'friendRequestUpdate' (rejected) notification to UserID %d", friendship.UserID)
	} else {
		log.Printf("Warning: Hub not found in context for RejectFriendRequest. HubOk: %v, HubNil: %v", hubOk, hub == nil)
	}
	// --- End Broadcast ---

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
			Email:          friendUser.Email, // Consider removing
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

	vars := mux.Vars(r)
	friendUserID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Find the friendship record to know who was who (needed for potential notification)
	var friendship models.Friendship
	findResult := db.DB.Where("((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)) AND status = ?",
		claims.UserID, friendUserID, friendUserID, claims.UserID, "accepted").
		First(&friendship)

	if findResult.Error != nil {
		respondWithError(w, http.StatusNotFound, "Friendship not found")
		return
	}

	// Delete the friendship record
	deleteResult := db.DB.Delete(&friendship)
	if deleteResult.Error != nil || deleteResult.RowsAffected == 0 {
		// Should not happen if findResult succeeded, but check anyway
		respondWithError(w, http.StatusInternalServerError, "Failed to remove friend")
		return
	}

	// --- Broadcast WebSocket Notification to the *removed* friend ---
	hub, hubOk := r.Context().Value(utils.HubKey).(*websocket.Hub)
	if hubOk && hub != nil {
		// *** FIX: Fetch the remover's details (current user) to get their name ***
		var removerUser models.User
		db.DB.Select("name").First(&removerUser, claims.UserID) // Only select the name

		// The target is the other user involved in the friendship
		targetUserID := uint(friendUserID)

		// Construct payload for the removed friend
		wsPayload := map[string]interface{}{
			"id":          friendship.ID,    // ID of the friendship record that was deleted
			"type":        "friendRemoved",  // New type
			"removedById": claims.UserID,    // ID of the user who initiated the removal
			"removedUser": targetUserID,     // ID of the user who was removed (TARGET USER)
			"removerName": removerUser.Name, // *** FIX: Use fetched name ***
			"updatedAt":   time.Now().Format("2006-01-02 15:04:05"),
		}

		wsMsg := &websocket.WSMessage{
			Type:    "friendRemoved", // Match payload type
			Payload: wsPayload,
		}
		hub.BroadcastJSON(wsMsg)
		log.Printf("WS Broadcast: Sent 'friendRemoved' notification to UserID %d", targetUserID)
	} else {
		log.Printf("Warning: Hub not found in context for RemoveFriend. HubOk: %v, HubNil: %v", hubOk, hub == nil)
	}
	// --- End Broadcast ---

	respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Friend removed successfully",
	})
}

// ... (rest of the file remains the same) ...

// GetFriendSuggestions returns students from same department/semester (potential friends)
func GetFriendSuggestions(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	var currentUser models.User
	db.DB.First(&currentUser, claims.UserID)

	// Get IDs of users involved in *any* friendship status with the current user
	var existingRelations []models.Friendship
	db.DB.Where("user_id = ? OR friend_id = ?", claims.UserID, claims.UserID).Find(&existingRelations)

	excludeIDs := []uint{claims.UserID} // Exclude self
	for _, f := range existingRelations {
		if f.UserID == claims.UserID {
			excludeIDs = append(excludeIDs, f.FriendID)
		} else {
			excludeIDs = append(excludeIDs, f.UserID)
		}
	}

	// Find students from same department OR same semester (broader suggestions)
	// Exclude those already related (pending, accepted, rejected, blocked)
	var suggestions []models.User
	db.DB.Where("college_id = ? AND role = ? AND id NOT IN ? AND (department = ? OR semester = ?)",
		claims.CollegeID, "student", excludeIDs, currentUser.Department, currentUser.Semester).
		// Optionally order by something relevant, e.g., name or randomly
		Order("name ASC").
		Limit(20).
		Find(&suggestions)

	// Transform to response
	var response []FriendProfileData
	for _, user := range suggestions {
		response = append(response, FriendProfileData{
			ID:             user.ID,
			Name:           user.Name,
			Email:          user.Email, // Consider removing
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
