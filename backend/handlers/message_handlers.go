package handlers

import (
	"encoding/json"
	"fmt" // Keep fmt
	"log"
	"net/http"
	"strconv" // Keep strconv
	"strings" // Keep strings
	"time"    // Keep time

	"unilink-backend/db"
	"unilink-backend/models"
	"unilink-backend/utils" // <-- Ensure utils is imported
	"unilink-backend/websocket"

	"github.com/gorilla/mux"
)

// --- REMOVE local key definitions ---

// ... (Keep SendMessageRequest, MessageResponse, MessageSenderData, ConversationListItem structs) ...
// SendMessageRequest is the payload for sending a message
type SendMessageRequest struct {
	Content          string `json:"content"`
	ConversationType string `json:"conversationType"`     // "dm" or "group"
	ConversationID   string `json:"conversationId"`       // "dm_{userId1}_{userId2}" or "group_{groupId}"
	ReceiverID       *uint  `json:"receiverId,omitempty"` // For DMs
	GroupID          *uint  `json:"groupId,omitempty"`    // For group messages
}

// MessageResponse contains message data
type MessageResponse struct {
	ID               uint              `json:"id"`
	Content          string            `json:"content"`
	Type             string            `json:"type"`
	ConversationType string            `json:"conversationType"`
	ConversationID   string            `json:"conversationId"`
	Sender           MessageSenderData `json:"sender"`
	IsRead           bool              `json:"isRead"`
	CreatedAt        string            `json:"createdAt"`
}

// MessageSenderData contains sender info
type MessageSenderData struct {
	ID             uint   `json:"id"`
	Name           string `json:"name"`
	ProfilePicture string `json:"profilePicture"`
}

// ConversationListItem represents a conversation in the list
type ConversationListItem struct {
	ConversationType string             `json:"conversationType"`
	ConversationID   string             `json:"conversationId"`
	Name             string             `json:"name"` // Friend name or Group name
	Avatar           string             `json:"avatar"`
	LastMessage      string             `json:"lastMessage"`
	LastMessageTime  string             `json:"lastMessageTime"`
	UnreadCount      int                `json:"unreadCount"`
	Participant      *MessageSenderData `json:"participant,omitempty"` // For DMs
	GroupInfo        *GroupResponse     `json:"groupInfo,omitempty"`   // For groups
}

// ... (Keep GetConversations, GetMessages functions) ...
// GetConversations returns all conversations (DMs + Groups) for the user
func GetConversations(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	var conversations []ConversationListItem

	// 1. Get DM conversations (friendships with accepted status)
	var friendships []models.Friendship
	db.DB.Preload("User").Preload("Friend").
		Where("(user_id = ? OR friend_id = ?) AND status = ?", claims.UserID, claims.UserID, "accepted").
		Find(&friendships)

	for _, f := range friendships {
		var friend models.User
		if f.UserID == claims.UserID {
			friend = f.Friend
		} else {
			friend = f.User
		}

		var conversationID string
		if claims.UserID < friend.ID {
			conversationID = fmt.Sprintf("dm_%d_%d", claims.UserID, friend.ID)
		} else {
			conversationID = fmt.Sprintf("dm_%d_%d", friend.ID, claims.UserID)
		}

		var lastMsg models.Message
		db.DB.Where("conversation_id = ?", conversationID).Order("created_at DESC").First(&lastMsg)

		var unreadCount int64
		db.DB.Model(&models.Message{}).
			Where("conversation_id = ? AND sender_id != ? AND is_read = ?", conversationID, claims.UserID, false).
			Count(&unreadCount)

		conversations = append(conversations, ConversationListItem{
			ConversationType: "dm",
			ConversationID:   conversationID,
			Name:             friend.Name,
			Avatar:           friend.ProfilePicture,
			LastMessage:      lastMsg.Content,
			LastMessageTime:  lastMsg.CreatedAt.Format("2006-01-02 15:04:05"), // Use format
			UnreadCount:      int(unreadCount),
			Participant: &MessageSenderData{
				ID:             friend.ID,
				Name:           friend.Name,
				ProfilePicture: friend.ProfilePicture,
			},
		})
	}

	// 2. Get Group conversations (groups user is member of)
	var memberships []models.GroupMember
	db.DB.Preload("Group").Where("user_id = ?", claims.UserID).Find(&memberships)

	for _, m := range memberships {
		conversationID := fmt.Sprintf("group_%d", m.Group.ID)

		var lastMsg models.Message
		db.DB.Preload("Sender").Where("conversation_id = ?", conversationID).Order("created_at DESC").First(&lastMsg)

		var unreadCount int64
		db.DB.Model(&models.Message{}).
			Where("conversation_id = ? AND sender_id != ? AND is_read = ?", conversationID, claims.UserID, false).
			Count(&unreadCount)

		lastMessage := lastMsg.Content
		if lastMsg.SenderID != 0 {
			// Ensure sender name isn't empty before prepending
			senderName := lastMsg.Sender.Name
			if senderName == "" { // Fallback if sender preload failed or name is empty
				senderName = "User"
			}
			lastMessage = senderName + ": " + lastMsg.Content
		}

		conversations = append(conversations, ConversationListItem{
			ConversationType: "group",
			ConversationID:   conversationID,
			Name:             m.Group.Name,
			Avatar:           m.Group.Avatar,
			LastMessage:      lastMessage,
			LastMessageTime:  lastMsg.CreatedAt.Format("2006-01-02 15:04:05"), // Use format
			UnreadCount:      int(unreadCount),
			GroupInfo: &GroupResponse{ // Assuming GroupResponse is defined elsewhere or inline it
				ID:          m.Group.ID,
				Name:        m.Group.Name,
				Description: m.Group.Description,
				Type:        m.Group.Type,
				Avatar:      m.Group.Avatar,
				// MemberCount needs separate query if required here
			},
		})
	}

	// TODO: Sort conversations by LastMessageTime DESC before sending

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"total":         len(conversations),
		"conversations": conversations,
	})
}

// GetMessages returns message history for a conversation
func GetMessages(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	vars := mux.Vars(r)
	conversationID := vars["conversationId"]

	if !strings.HasPrefix(conversationID, "dm_") && !strings.HasPrefix(conversationID, "group_") {
		respondWithError(w, http.StatusBadRequest, "Invalid conversation ID format")
		return
	}

	if !userHasAccessToConversation(claims.UserID, conversationID) {
		respondWithError(w, http.StatusForbidden, "Access denied to this conversation")
		return
	}

	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")
	limit := 50
	offset := 0
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
		limit = l
	}
	if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
		offset = o
	}

	var messages []models.Message
	result := db.DB.Preload("Sender").
		Where("conversation_id = ? AND is_deleted = ?", conversationID, false).
		Order("created_at ASC"). // Fetch in ascending order for easier display
		Limit(limit).
		Offset(offset).
		Find(&messages)

	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch messages")
		return
	}

	// Mark messages as read (can be done async or after response for perf)
	go func(convID string, userID uint) {
		db.DB.Model(&models.Message{}).
			Where("conversation_id = ? AND sender_id != ? AND is_read = ?", convID, userID, false).
			Update("is_read", true)
	}(conversationID, claims.UserID)

	var response []MessageResponse
	// No need to reverse if fetched in ASC order
	for _, msg := range messages {
		response = append(response, MessageResponse{
			ID:               msg.ID,
			Content:          msg.Content,
			Type:             msg.Type,
			ConversationType: msg.ConversationType,
			ConversationID:   msg.ConversationID,
			Sender: MessageSenderData{
				ID:             msg.Sender.ID,
				Name:           msg.Sender.Name,
				ProfilePicture: msg.Sender.ProfilePicture,
			},
			IsRead:    msg.IsRead,
			CreatedAt: msg.CreatedAt.Format("2006-01-02 15:04:05"), // Use format
		})
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"total":    len(response), // This might not be the *total* in DB if paginated
		"messages": response,
	})
}

func SendMessage(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	var req SendMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload: "+err.Error())
		return
	}

	req.Content = strings.TrimSpace(req.Content)
	if req.Content == "" {
		respondWithError(w, http.StatusBadRequest, "Message content is required")
		return
	}
	if req.ConversationType != "dm" && req.ConversationType != "group" {
		respondWithError(w, http.StatusBadRequest, "Invalid conversation type")
		return
	}

	// Re-verify or generate conversation ID
	if req.ConversationType == "dm" {
		if req.ReceiverID == nil || *req.ReceiverID == 0 {
			respondWithError(w, http.StatusBadRequest, "Missing receiverId for DM")
			return
		}
		if claims.UserID < *req.ReceiverID {
			req.ConversationID = fmt.Sprintf("dm_%d_%d", claims.UserID, *req.ReceiverID)
		} else {
			req.ConversationID = fmt.Sprintf("dm_%d_%d", *req.ReceiverID, claims.UserID)
		}
		req.GroupID = nil // Ensure GroupID is nil for DMs
	} else { // group
		if req.GroupID == nil || *req.GroupID == 0 {
			respondWithError(w, http.StatusBadRequest, "Missing groupId for group message")
			return
		}
		req.ConversationID = fmt.Sprintf("group_%d", *req.GroupID)
		req.ReceiverID = nil // Ensure ReceiverID is nil for group messages
	}

	// Verify user has access
	if !userHasAccessToConversation(claims.UserID, req.ConversationID) {
		respondWithError(w, http.StatusForbidden, "Access denied to this conversation")
		return
	}

	// Create message
	message := models.Message{
		Content:          req.Content,
		Type:             "text",
		ConversationType: req.ConversationType,
		ConversationID:   req.ConversationID,
		SenderID:         claims.UserID,
		ReceiverID:       req.ReceiverID, // Will be nil for group messages
		GroupID:          req.GroupID,    // Will be nil for DMs
		CollegeID:        claims.CollegeID,
		IsRead:           false, // Initially unread for others
		IsDeleted:        false,
		CreatedAt:        time.Now(), // Explicitly set creation time
		UpdatedAt:        time.Now(),
	}

	// Save to DB
	if err := db.DB.Create(&message).Error; err != nil {
		log.Printf("Error creating message in DB: %v", err) // Log DB error
		respondWithError(w, http.StatusInternalServerError, "Failed to send message")
		return
	}

	// Preload sender for response/broadcast (even though we have claims, this ensures consistency)
	db.DB.Preload("Sender").First(&message, message.ID)

	// Prepare response payload
	responsePayload := MessageResponse{
		ID:               message.ID,
		Content:          message.Content,
		Type:             message.Type,
		ConversationType: message.ConversationType,
		ConversationID:   message.ConversationID,
		Sender: MessageSenderData{
			ID:             message.Sender.ID,
			Name:           message.Sender.Name,
			ProfilePicture: message.Sender.ProfilePicture,
		},
		IsRead:    message.IsRead,
		CreatedAt: message.CreatedAt.Format("2006-01-02 15:04:05"),
	}

	// --- Broadcast the new message via Hub ---
	hub, ok := r.Context().Value(utils.HubKey).(*websocket.Hub) // Use key from utils
	if ok && hub != nil {
		wsMsg := &websocket.WSMessage{
			Type:    "newMessage",
			Payload: responsePayload,
		}
		hub.BroadcastJSON(wsMsg)
		log.Printf("DEBUG: Successfully retrieved Hub and broadcasting message for conv %s", responsePayload.ConversationID) // Success Log
	} else {
		log.Printf("Warning: Hub not found in context for SendMessage. Ok: %v, HubNil: %v", ok, hub == nil)
	}
	// --- End Broadcast ---

	// Send HTTP response
	respondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"message": responsePayload, // Send back the created message object
	})
}

// ... (Keep DeleteMessage, userHasAccessToConversation functions) ...
// DeleteMessage allows user to delete their own message
func DeleteMessage(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	vars := mux.Vars(r)
	messageID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid message ID")
		return
	}

	var message models.Message
	// Also check IsDeleted status to prevent multiple deletes
	result := db.DB.Where("id = ? AND sender_id = ? AND is_deleted = ?", messageID, claims.UserID, false).First(&message)
	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "Message not found or already deleted")
		return
	}

	// Soft delete
	message.IsDeleted = true
	message.Content = "This message was deleted." // Optionally clear/replace content
	message.UpdatedAt = time.Now()                // Update timestamp
	if err := db.DB.Save(&message).Error; err != nil {
		log.Printf("Error soft deleting message %d: %v", messageID, err)
		respondWithError(w, http.StatusInternalServerError, "Failed to delete message")
		return
	}

	// TODO: Optionally broadcast a "messageDeleted" event via WebSocket
	// hub, ok := r.Context().Value(utils.HubKey).(*websocket.Hub)
	// if ok && hub != nil {
	//  wsMsg := &websocket.WSMessage{
	//      Type: "messageDeleted",
	//      Payload: map[string]interface{}{"messageId": messageID, "conversationId": message.ConversationID},
	//  }
	//  hub.BroadcastJSON(wsMsg) // Need targeting logic here too
	// }

	respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Message deleted successfully",
	})
}

// userHasAccessToConversation checks if user can access a conversation
func userHasAccessToConversation(userID uint, conversationID string) bool {
	if strings.HasPrefix(conversationID, "dm_") {
		var userID1, userID2 uint
		// Use Sscanf for safer parsing
		_, err := fmt.Sscanf(conversationID, "dm_%d_%d", &userID1, &userID2)
		if err != nil || (userID != userID1 && userID != userID2) {
			log.Printf("User %d check failed for DM %s: Parse error or user not participant", userID, conversationID)
			return false
		}

		// Check friendship status
		var friendship models.Friendship
		result := db.DB.Where(
			"((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)) AND status = ?",
			userID1, userID2, userID2, userID1, "accepted",
		).First(&friendship)

		if result.Error != nil {
			log.Printf("User %d check failed for DM %s: Friendship not found or not accepted", userID, conversationID)
			return false // No accepted friendship found
		}
		return true // User is participant AND friendship exists

	} else if strings.HasPrefix(conversationID, "group_") {
		var groupID uint
		_, err := fmt.Sscanf(conversationID, "group_%d", &groupID)
		if err != nil {
			log.Printf("User %d check failed for Group %s: Group ID parse error", userID, conversationID)
			return false
		}

		// Check group membership
		var membership models.GroupMember
		result := db.DB.Where("group_id = ? AND user_id = ?", groupID, userID).First(&membership)
		if result.Error != nil {
			log.Printf("User %d check failed for Group %s: Not a member", userID, conversationID)
			return false // Not a member
		}
		return true // Is a member
	}

	log.Printf("User %d check failed: Invalid conversation format %s", userID, conversationID)
	return false // Invalid conversation ID format
}
