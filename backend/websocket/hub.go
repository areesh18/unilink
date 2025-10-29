// backend/websocket/hub.go
package websocket

import (
	"encoding/json"
	"log"
	"strconv"
	"strings"
	"sync" // Ensure sync is imported
	"unilink-backend/db"
	"unilink-backend/models"
	// Assuming models are accessible
)

// Message structure for WebSocket communication
type WSMessage struct {
	Type    string      `json:"type"` // e.g., "newMessage", "newAnnouncement", "error", "newFriendRequest", "friendRequestUpdate"
	Payload interface{} `json:"payload"`
}

// Client represents a single WebSocket connection.
type Client struct {
	hub    *Hub
	conn   WebSocketConn // Interface to abstract websocket connection
	send   chan []byte   // Buffered channel of outbound messages.
	userID uint          // Authenticated user ID
	// Add other relevant user info if needed for targeting (CollegeID, Dept, Sem)
	collegeID  uint
	department string
	semester   int
}

// Hub maintains the set of active clients and broadcasts messages.
type Hub struct {
	// Registered clients. Map key is userID, value is a map of client pointers (allows multiple connections per user)
	clients    map[uint]map[*Client]bool
	broadcast  chan []byte  // Inbound messages from the handlers
	register   chan *Client // Register requests from clients.
	unregister chan *Client // Unregister requests from clients.
	mu         sync.RWMutex // *** FIX: Corrected typo from RWMuxex to RWMutex ***
}

// NewHub creates a new Hub instance.
func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[uint]map[*Client]bool),
	}
}

// Run starts the Hub's message processing loop.
func (h *Hub) Run() {
	log.Println("🚀 WebSocket Hub started")
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if _, ok := h.clients[client.userID]; !ok {
				h.clients[client.userID] = make(map[*Client]bool)
			}
			h.clients[client.userID][client] = true
			log.Printf("Client registered: UserID %d", client.userID)
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if userClients, ok := h.clients[client.userID]; ok {
				if _, clientExists := userClients[client]; clientExists { // Check if client pointer exists before closing/deleting
					close(client.send) // Close the channel *before* deleting
					delete(userClients, client)
					if len(userClients) == 0 {
						delete(h.clients, client.userID)
					}
					log.Printf("Client unregistered: UserID %d", client.userID)
				}
			}
			h.mu.Unlock()

		case messageBytes := <-h.broadcast:
			// Parse the message to determine its type and target
			var msg WSMessage
			if err := json.Unmarshal(messageBytes, &msg); err != nil {
				log.Printf("Error unmarshalling broadcast message: %v", err)
				continue
			}

			log.Printf("DEBUG: Hub received broadcast message: Type %s", msg.Type) // Added log

			h.mu.RLock() // Use RLock for reading clients map
			switch msg.Type {
			case "newMessage":
				// Target specific users based on message payload (e.g., conversationID)
				if chatMsg, ok := msg.Payload.(map[string]interface{}); ok {
					h.handleChatMessage(chatMsg, messageBytes)
				} else {
					log.Printf("Error: newMessage payload is not map[string]interface{}: %T", msg.Payload)
				}
			case "newAnnouncement":
				// Target users based on announcement criteria
				if ann, ok := msg.Payload.(map[string]interface{}); ok {
					h.handleAnnouncement(ann, messageBytes)
				} else {
					log.Printf("Error: newAnnouncement payload is not map[string]interface{}: %T", msg.Payload)
				}
			case "newFriendRequest": // *** NEW CASE ***
				// Target the recipient of the friend request
				if payload, ok := msg.Payload.(map[string]interface{}); ok {
					h.handleDirectNotification(payload, messageBytes, "friendId", msg.Type) // Pass type for logging
				} else {
					log.Printf("Error: newFriendRequest payload is not map[string]interface{}: %T", msg.Payload)
				}
			case "friendRequestUpdate": // *** NEW CASE ***
				// Target the original sender of the request about the update (accept/reject)
				if payload, ok := msg.Payload.(map[string]interface{}); ok {
					h.handleDirectNotification(payload, messageBytes, "userId", msg.Type) // Pass type for logging
				} else {
					log.Printf("Error: friendRequestUpdate payload is not map[string]interface{}: %T", msg.Payload)
				}
			case "friendRemoved": // *** NEW CASE ***
				// Target the user who was removed
				if payload, ok := msg.Payload.(map[string]interface{}); ok {
					h.handleDirectNotification(payload, messageBytes, "removedUser", msg.Type) // Pass type for logging
				} else {
					log.Printf("Error: friendRemoved payload is not map[string]interface{}: %T", msg.Payload)
				}
			default:
				log.Printf("Unknown broadcast message type: %s", msg.Type)
				// Potentially broadcast to all or handle differently
			}
			h.mu.RUnlock()
		}
	}
}

// --- Helper methods for Hub ---

// handleChatMessage determines recipients for a chat message and sends it.
// RLock is already held by Run() when this is called
func (h *Hub) handleChatMessage(payload map[string]interface{}, messageBytes []byte) {
	conversationID, convOk := payload["conversationId"].(string)

	senderPayload, senderPayloadOk := payload["sender"].(map[string]interface{})
	if !senderPayloadOk {
		log.Printf("Error: Could not parse sender payload from chat message: %+v", payload)
		return
	}
	senderIDFloat, senderOk := senderPayload["id"].(float64)
	senderID := uint(senderIDFloat)

	if !convOk || !senderOk {
		log.Printf("Error: Could not parse conversationId or senderId from chat message payload: %+v", payload)
		return
	}

	log.Printf("Handling chat message for conversation: %s from sender: %d", conversationID, senderID)

	// --- TARGETING LOGIC ---
	recipientIDs := make(map[uint]bool) // Use a map to avoid duplicate sends to the same user ID

	// 1. Determine recipients based on conversation type
	if strings.HasPrefix(conversationID, "dm_") {
		// Direct Message: dm_{userID1}_{userID2}
		parts := strings.Split(conversationID, "_")
		if len(parts) == 3 {
			id1, _ := strconv.ParseUint(parts[1], 10, 64)
			id2, _ := strconv.ParseUint(parts[2], 10, 64)
			// Add the *other* user to recipients
			if senderID == uint(id1) {
				recipientIDs[uint(id2)] = true
			} else if senderID == uint(id2) {
				recipientIDs[uint(id1)] = true
			} else {
				log.Printf("Warning: Sender %d not part of DM conversation %s", senderID, conversationID)
			}
		} else {
			log.Printf("Error: Invalid DM conversation ID format: %s", conversationID)
		}

	} else if strings.HasPrefix(conversationID, "group_") {
		// Group Message: group_{groupID}
		parts := strings.Split(conversationID, "_")
		if len(parts) == 2 {
			groupID, err := strconv.ParseUint(parts[1], 10, 64)
			if err == nil {
				// Fetch group members from DB
				var members []models.GroupMember
				// Exclude the sender
				db.DB.Where("group_id = ? AND user_id != ?", uint(groupID), senderID).Find(&members)
				for _, member := range members {
					recipientIDs[member.UserID] = true // Add all *other* members
				}
			} else {
				log.Printf("Error: Invalid Group ID in conversation ID: %s", conversationID)
			}
		} else {
			log.Printf("Error: Invalid Group conversation ID format: %s", conversationID)
		}
	} else {
		log.Printf("Error: Unrecognized conversation ID format for chat message: %s", conversationID)
		return // Don't proceed if format is wrong
	}

	// 2. Send the message to all clients associated with the recipient User IDs
	log.Printf("Broadcasting message for conv %s from %d to user IDs: %v", conversationID, senderID, recipientIDs)
	for userID := range recipientIDs {
		h.sendToUser(userID, messageBytes) // Use helper
	}
	// --- END TARGETING LOGIC ---
}

// handleAnnouncement determines recipients based on targeting and sends it.
// RLock is already held by Run() when this is called
func (h *Hub) handleAnnouncement(payload map[string]interface{}, messageBytes []byte) {
	targetCollegeIDFloat, _ := payload["collegeId"].(float64)
	targetCollegeID := uint(targetCollegeIDFloat)
	targetDeptPayload, deptOk := payload["department"] // Get the interface{}
	targetSemPayload, semOk := payload["semester"]     // Get the interface{}

	// Convert department payload if it's not nil
	var targetDept *string
	if deptOk && targetDeptPayload != nil {
		if deptStr, okStr := targetDeptPayload.(string); okStr && deptStr != "" { // Check for non-empty string
			targetDept = &deptStr // Assign address if it's a non-nil, non-empty string
		}
	}

	// Convert semester payload if it's not nil
	var targetSem *int
	if semOk && targetSemPayload != nil {
		// JSON numbers often unmarshal as float64
		if semFloat, okFloat := targetSemPayload.(float64); okFloat {
			semInt := int(semFloat)
			if semInt > 0 { // Ensure semester is positive
				targetSem = &semInt // Assign address if it's a non-nil, positive number
			}
		}
	}

	log.Printf("Handling announcement for College %d (Dept: %v, Sem: %v)",
		targetCollegeID, targetDept, targetSem) // Use converted pointers

	sentCount := 0
	// Iterate through all connected clients directly
	for _, userClients := range h.clients { // *** FIX: iterate over userID map value (userClients) ***
		for client := range userClients {
			// Match College
			if client.collegeID != targetCollegeID {
				continue
			}
			// Match Department (if specified)
			if targetDept != nil && client.department != *targetDept { // Dereference pointer
				continue
			}
			// Match Semester (if specified)
			if targetSem != nil && client.semester != *targetSem { // Dereference pointer
				continue
			}
			// If all checks pass, send the message
			client.sendMessage(messageBytes)
			sentCount++
			// Since multiple clients per user can exist, we only need to log once per user if needed
			// But sending to all clients of the user is correct.
		}
		// Log after checking all clients for a user
		// log.Printf("Sent announcement to user %d", userID) // userID is not available here easily, log count instead
	}
	log.Printf("Finished broadcasting announcement. Sent to %d clients.", sentCount)

}

// *** NEW HELPER ***
// handleDirectNotification sends a message to a single target user ID specified in the payload.
// RLock is already held by Run() when this is called
func (h *Hub) handleDirectNotification(payload map[string]interface{}, messageBytes []byte, targetUserIDKey string, messageType string) {
	targetUserIDFloat, ok := payload[targetUserIDKey].(float64) // JSON numbers are float64
	if !ok {
		// Attempt to parse if it might be an integer (though less likely from JSON)
		targetUserIDInt, okInt := payload[targetUserIDKey].(int)
		if okInt {
			targetUserIDFloat = float64(targetUserIDInt)
			ok = true
		} else {
			log.Printf("Error: Could not parse target user ID from key '%s' (type %T) in payload for %s: %+v", targetUserIDKey, payload[targetUserIDKey], messageType, payload)
			return
		}
	}
	targetUserID := uint(targetUserIDFloat)
	if targetUserID == 0 {
		log.Printf("Error: Target user ID is zero for key '%s' in payload for %s.", targetUserIDKey, messageType)
		return
	}

	log.Printf("Handling direct notification type '%s' targeted at UserID %d", messageType, targetUserID)
	h.sendToUser(targetUserID, messageBytes)
}

// *** NEW HELPER ***
// sendToUser safely sends a message to all connected clients for a specific user ID.
// Assumes RLock is held by the caller (Run method).
func (h *Hub) sendToUser(userID uint, messageBytes []byte) {
	if userClients, userOnline := h.clients[userID]; userOnline {
		clientCount := 0
		for client := range userClients {
			client.sendMessage(messageBytes) // Use the safe send helper
			clientCount++
		}
		log.Printf("Sent message to %d client(s) for UserID %d", clientCount, userID) // Log count
	} else {
		// Optional: Log if a target user is offline
		// log.Printf("User %d is offline, message not sent in real-time.", userID)
	}
}

// sendMessage is a helper for safely sending messages to a client's channel
func (c *Client) sendMessage(message []byte) {
	// Add a check to ensure the channel is not closed before sending
	// This helps prevent panics if unregister happens concurrently
	defer func() {
		if r := recover(); r != nil {
			// This might happen if the channel was closed between the check and the send.
			log.Printf("Recovered from panic in sendMessage (UserID: %d): %v. Likely channel closed.", c.userID, r)
			// Consider triggering unregister again if necessary, but be cautious of loops.
			// c.hub.unregister <- c // Maybe not needed if unregister is robust
		}
	}()

	// Use select to send with a default case to handle full/closed channels
	select {
	case c.send <- message:
		// Message sent successfully or buffered
	default:
		// If channel is full or potentially closed
		log.Printf("Send channel blocked/closed for UserID %d during send attempt, requesting unregister.", c.userID)
		// Non-blocking send to unregister channel. If unregister is also blocked, this might fail,
		// but readPump/writePump closure should eventually trigger unregister.
		select {
		case c.hub.unregister <- c:
			log.Printf("Requested unregister for UserID %d due to blocked send.", c.userID)
		default:
			log.Printf("Unregister channel blocked for UserID %d during sendMessage.", c.userID)
		}
	}
}

// Helper function to broadcast a message object through the hub
func (h *Hub) BroadcastJSON(message *WSMessage) {
	bytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshalling broadcast message: %v", err)
		return
	}
	// Send the marshalled bytes to the broadcast channel
	// Use a select with a default to prevent blocking if the hub is busy
	select {
	case h.broadcast <- bytes:
		log.Printf("DEBUG: Message added to hub broadcast channel: Type %s", message.Type) // Optional debug log
	default:
		log.Println("Hub broadcast channel is full, message dropped.") // Keep this warning
	}
}

// Placeholder for WebSocket connection interface (allows testing)
type WebSocketConn interface {
	ReadMessage() (messageType int, p []byte, err error)
	WriteMessage(messageType int, data []byte) error
	Close() error
	// Add other necessary methods like SetReadDeadline, etc.
}