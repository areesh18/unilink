// backend/websocket/handler.go
package websocket

import (
	"log"
	"net/http"
	"unilink-backend/db" // For fetching user details
	"unilink-backend/models"
	"unilink-backend/utils" // For JWT validation

	"github.com/gorilla/websocket"
)

// Configure the upgrader
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Allow connections from your frontend development/production origins
	CheckOrigin: func(r *http.Request) bool {
		// TODO: Implement proper origin checking for security
		// For development, you might allow localhost origins:
		// origin := r.Header.Get("Origin")
		// return origin == "http://localhost:3000" || origin == "http://localhost:5173"
		return true // Allow all for now (less secure)
	},
}

// ServeWs handles WebSocket requests from clients.
func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	// 1. Authenticate the user (e.g., via JWT in query param)
	tokenString := r.URL.Query().Get("token")
	if tokenString == "" {
		http.Error(w, "Missing authentication token", http.StatusUnauthorized)
		return
	}

	claims, err := utils.ValidateJWT(tokenString)
	if err != nil {
		log.Printf("Invalid WebSocket token: %v", err)
		http.Error(w, "Invalid authentication token", http.StatusUnauthorized)
		return
	}

	// 2. Fetch user details needed for targeting (optional but useful)
	var user models.User
	if err := db.DB.First(&user, claims.UserID).Error; err != nil {
		log.Printf("User not found for WebSocket connection (UserID: %d): %v", claims.UserID, err)
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// 3. Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade WebSocket connection (UserID: %d): %v", claims.UserID, err)
		// Upgrader already sends an error response
		return
	}

	// Wrap the gorilla conn to match our interface (for potential abstraction/testing later)
	wsConn := &GorillaConnWrapper{conn: conn}

	// 4. Create and register the client
	client := &Client{
		hub:    hub,
		conn:   wsConn,
		send:   make(chan []byte, 256), // Buffered channel
		userID: claims.UserID,
		// Store details for announcement targeting
		collegeID:  user.CollegeID,
		department: user.Department,
		semester:   user.Semester,
	}
	client.hub.register <- client

	log.Printf("WebSocket connection established for UserID: %d", claims.UserID)

	// 5. Start client goroutines for reading and writing
	// Allow collection of memory referenced by the caller by doing all work in
	// new goroutines.
	go client.writePump()
	go client.readPump() // Call readPump last as it blocks until connection closes
}

// GorillaConnWrapper adapts *websocket.Conn to the WebSocketConn interface
type GorillaConnWrapper struct {
	conn *websocket.Conn
}

func (gcw *GorillaConnWrapper) ReadMessage() (messageType int, p []byte, err error) {
	return gcw.conn.ReadMessage()
}

func (gcw *GorillaConnWrapper) WriteMessage(messageType int, data []byte) error {
	return gcw.conn.WriteMessage(messageType, data)
}

func (gcw *GorillaConnWrapper) Close() error {
	return gcw.conn.Close()
}

// Add other methods like SetReadDeadline if needed