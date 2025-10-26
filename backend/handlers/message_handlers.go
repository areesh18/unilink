package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"unilink-backend/db"
	"unilink-backend/models"
	"unilink-backend/utils"

	"github.com/gorilla/mux"
)

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
		// Determine the other user (friend)
		var friend models.User
		if f.UserID == claims.UserID {
			friend = f.Friend
		} else {
			friend = f.User
		}

		// Generate conversation ID (sorted user IDs for consistency)
		var conversationID string
		if claims.UserID < friend.ID {
			conversationID = fmt.Sprintf("dm_%d_%d", claims.UserID, friend.ID)
		} else {
			conversationID = fmt.Sprintf("dm_%d_%d", friend.ID, claims.UserID)
		}

		// Get last message
		var lastMsg models.Message
		db.DB.Where("conversation_id = ?", conversationID).Order("created_at DESC").First(&lastMsg)

		// Count unread messages
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
			LastMessageTime:  lastMsg.CreatedAt.Format("2006-01-02 15:04:05"),
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

		// Get last message
		var lastMsg models.Message
		db.DB.Preload("Sender").Where("conversation_id = ?", conversationID).Order("created_at DESC").First(&lastMsg)

		// Count unread messages
		var unreadCount int64
		db.DB.Model(&models.Message{}).
			Where("conversation_id = ? AND sender_id != ? AND is_read = ?", conversationID, claims.UserID, false).
			Count(&unreadCount)

		lastMessage := lastMsg.Content
		if lastMsg.SenderID != 0 {
			lastMessage = lastMsg.Sender.Name + ": " + lastMsg.Content
		}

		conversations = append(conversations, ConversationListItem{
			ConversationType: "group",
			ConversationID:   conversationID,
			Name:             m.Group.Name,
			Avatar:           m.Group.Avatar,
			LastMessage:      lastMessage,
			LastMessageTime:  lastMsg.CreatedAt.Format("2006-01-02 15:04:05"),
			UnreadCount:      int(unreadCount),
			GroupInfo: &GroupResponse{
				ID:          m.Group.ID,
				Name:        m.Group.Name,
				Description: m.Group.Description,
				Type:        m.Group.Type,
			},
		})
	}

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

	// Get conversation ID from URL
	vars := mux.Vars(r)
	conversationID := vars["conversationId"]

	// Validate conversation ID format
	if !strings.HasPrefix(conversationID, "dm_") && !strings.HasPrefix(conversationID, "group_") {
		respondWithError(w, http.StatusBadRequest, "Invalid conversation ID format")
		return
	}

	// Verify user has access to this conversation
	if !userHasAccessToConversation(claims.UserID, conversationID) {
		respondWithError(w, http.StatusForbidden, "Access denied to this conversation")
		return
	}

	// Get pagination parameters
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 50 // Default
	offset := 0

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil {
			limit = l
		}
	}
	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil {
			offset = o
		}
	}

	// Get messages
	var messages []models.Message
	result := db.DB.Preload("Sender").
		Where("conversation_id = ? AND is_deleted = ?", conversationID, false).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&messages)

	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch messages")
		return
	}

	// Mark messages as read (where current user is receiver)
	db.DB.Model(&models.Message{}).
		Where("conversation_id = ? AND sender_id != ? AND is_read = ?", conversationID, claims.UserID, false).
		Update("is_read", true)

	// Transform to response (reverse order for chronological display)
	var response []MessageResponse
	for i := len(messages) - 1; i >= 0; i-- {
		msg := messages[i]
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
			CreatedAt: msg.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"total":    len(response),
		"messages": response,
	})
}

// SendMessage sends a new message to a conversation
func SendMessage(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	var req SendMessageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate input
	req.Content = strings.TrimSpace(req.Content)
	if req.Content == "" {
		respondWithError(w, http.StatusBadRequest, "Message content is required")
		return
	}

	if req.ConversationType != "dm" && req.ConversationType != "group" {
		respondWithError(w, http.StatusBadRequest, "Invalid conversation type")
		return
	}

	// Generate conversation ID if not provided
	if req.ConversationID == "" {
		if req.ConversationType == "dm" && req.ReceiverID != nil {
			if claims.UserID < *req.ReceiverID {
				req.ConversationID = fmt.Sprintf("dm_%d_%d", claims.UserID, *req.ReceiverID)
			} else {
				req.ConversationID = fmt.Sprintf("dm_%d_%d", *req.ReceiverID, claims.UserID)
			}
		} else if req.ConversationType == "group" && req.GroupID != nil {
			req.ConversationID = fmt.Sprintf("group_%d", *req.GroupID)
		} else {
			respondWithError(w, http.StatusBadRequest, "Missing receiver ID or group ID")
			return
		}
	}

	// Verify user has access to this conversation
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
		ReceiverID:       req.ReceiverID,
		GroupID:          req.GroupID,
		CollegeID:        claims.CollegeID,
		IsRead:           false,
	}

	if err := db.DB.Create(&message).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to send message")
		return
	}

	// Preload sender info
	db.DB.Preload("Sender").First(&message, message.ID)

	response := MessageResponse{
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

	respondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"message": response,
	})
}

// DeleteMessage allows user to delete their own message
func DeleteMessage(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get message ID
	vars := mux.Vars(r)
	messageID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid message ID")
		return
	}

	// Find message and verify ownership
	var message models.Message
	result := db.DB.Where("id = ? AND sender_id = ?", messageID, claims.UserID).First(&message)
	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "Message not found or access denied")
		return
	}

	// Soft delete (mark as deleted)
	message.IsDeleted = true
	db.DB.Save(&message)

	respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Message deleted successfully",
	})
}

// userHasAccessToConversation checks if user can access a conversation
func userHasAccessToConversation(userID uint, conversationID string) bool {
	if strings.HasPrefix(conversationID, "dm_") {
		// Extract both user IDs from conversation ID
		var userID1, userID2 uint
		fmt.Sscanf(conversationID, "dm_%d_%d", &userID1, &userID2)

		// Check if current user is one of the participants
		if userID != userID1 && userID != userID2 {
			return false
		}

		// Check if they are actually friends (accepted friendship)
		var friendship models.Friendship
		db.DB.Where(
			"((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)) AND status = ?",
			userID1, userID2, userID2, userID1, "accepted",
		).First(&friendship)

		return friendship.ID != 0

	} else if strings.HasPrefix(conversationID, "group_") {
		// Extract group ID
		var groupID uint
		fmt.Sscanf(conversationID, "group_%d", &groupID)

		// Check if user is member of the group
		var membership models.GroupMember
		db.DB.Where("group_id = ? AND user_id = ?", groupID, userID).First(&membership)
		return membership.ID != 0
	}
	return false
}
