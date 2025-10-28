// backend/websocket/hub.go
package websocket

import (
	"encoding/json"
	"log"
	"strconv"
	"strings"
	"sync"
	"unilink-backend/db"
	"unilink-backend/models"
	// Assuming models are accessible
)

// Message structure for WebSocket communication
type WSMessage struct {
	Type    string      `json:"type"` // e.g., "newMessage", "newAnnouncement", "error"
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
	mu         sync.RWMutex // Mutex to protect concurrent access to clients map
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
				if _, ok := userClients[client]; ok {
					delete(userClients, client)
					close(client.send)
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

			h.mu.RLock() // Use RLock for reading clients map
			switch msg.Type {
			case "newMessage":
				// Target specific users based on message payload (e.g., conversationID)
				if chatMsg, ok := msg.Payload.(map[string]interface{}); ok {
					h.handleChatMessage(chatMsg, messageBytes)
				}
			case "newAnnouncement":
				// Target users based on announcement criteria
				if ann, ok := msg.Payload.(map[string]interface{}); ok {
					h.handleAnnouncement(ann, messageBytes)
				}
			default:
				log.Printf("Unknown broadcast message type: %s", msg.Type)
				// Potentially broadcast to all or handle differently
			}
			h.mu.RUnlock()
		}
	}
}

// --- Helper methods for Hub (to be filled in) ---

// handleChatMessage determines recipients for a chat message and sends it.
// Needs access to message details (ConversationID, SenderID, ReceiverID, GroupID)
// RLock is already held by Run() when this is called
func (h *Hub) handleChatMessage(payload map[string]interface{}, messageBytes []byte) {
	conversationID, convOk := payload["conversationId"].(string)
	senderIDFloat, senderOk := payload["sender"].(map[string]interface{})["id"].(float64)
	senderID := uint(senderIDFloat)

	if !convOk || !senderOk {
		log.Printf("Error: Could not parse conversationId or senderId from chat message payload: %+v", payload)
		return
	}

	log.Printf("Handling chat message for conversation: %s from sender: %d", conversationID, senderID)

	// --- TARGETING LOGIC ---
	recipientIDs := make(map[uint]bool) // Use a map to avoid duplicate sends to the same user ID

	// 1. Always include the sender (so they see their own message)
	recipientIDs[senderID] = true

	// 2. Determine other recipients based on conversation type
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
				// Fetch group members from DB (Consider caching this later for performance)
				var members []models.GroupMember
				db.DB.Where("group_id = ?", uint(groupID)).Find(&members)
				for _, member := range members {
					recipientIDs[member.UserID] = true // Add all members
				}
			} else {
				log.Printf("Error: Invalid Group ID in conversation ID: %s", conversationID)
			}
		} else {
			log.Printf("Error: Invalid Group conversation ID format: %s", conversationID)
		}
	}

	// 3. Send the message to all clients associated with the recipient User IDs
	log.Printf("Broadcasting message for conv %s to user IDs: %v", conversationID, recipientIDs)
	for userID := range recipientIDs {
		if userClients, userOnline := h.clients[userID]; userOnline {
			for client := range userClients {
				client.sendMessage(messageBytes) // Use the safe send helper
			}
		} else {
			// Optional: Log if a target user is offline
			// log.Printf("User %d is offline for conversation %s", userID, conversationID)
		}
	}
	// --- END TARGETING LOGIC ---
}

// handleAnnouncement determines recipients based on targeting and sends it.
// Needs access to announcement details (CollegeID, Department, Semester)
// RLock is already held by Run() when this is called
func (h *Hub) handleAnnouncement(payload map[string]interface{}, messageBytes []byte) {
	targetCollegeIDFloat, _ := payload["collegeId"].(float64)
	targetCollegeID := uint(targetCollegeIDFloat)
	targetDeptPayload, deptOk := payload["department"] // Get the interface{}
	targetSemPayload, semOk := payload["semester"]     // Get the interface{}

	// Convert department payload if it's not nil
	var targetDept *string
	if deptOk && targetDeptPayload != nil {
		if deptStr, okStr := targetDeptPayload.(string); okStr {
			targetDept = &deptStr // Assign address if it's a non-nil string
		}
	}

	// Convert semester payload if it's not nil
	var targetSem *int
	if semOk && targetSemPayload != nil {
		// JSON numbers often unmarshal as float64
		if semFloat, okFloat := targetSemPayload.(float64); okFloat {
			semInt := int(semFloat)
			targetSem = &semInt // Assign address if it's a non-nil number
		}
	}

	log.Printf("Handling announcement for College %d (Dept: %v, Sem: %v)",
		targetCollegeID, targetDept, targetSem) // Use converted pointers

	for _, userClients := range h.clients {
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
		}
	}
}

// sendMessage is a helper for safely sending messages to a client's channel
func (c *Client) sendMessage(message []byte) {
	select {
	case c.send <- message:
	default:
		// If channel is full or closed, assume client is gone/slow
		log.Printf("Send channel blocked/closed for UserID %d, unregistering client.", c.userID)
		c.hub.unregister <- c // Request unregistration
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
	// Use a select with a timeout or default to prevent blocking if the hub is busy
	select {
	case h.broadcast <- bytes:
	default:
		log.Println("Hub broadcast channel is full, message dropped.")
	}
}

// Placeholder for WebSocket connection interface (allows testing)
type WebSocketConn interface {
	ReadMessage() (messageType int, p []byte, err error)
	WriteMessage(messageType int, data []byte) error
	Close() error
	// Add other necessary methods like SetReadDeadline, etc.
}
