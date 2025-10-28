// backend/websocket/client.go
package websocket

import (
	"log"
	"time"
	"runtime/debug"
	"github.com/gorilla/websocket" // Import gorilla websocket
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 512
)

// readPump pumps messages from the WebSocket connection to the hub.
// (We might not need incoming messages from clients initially, but it's good practice)
func (c *Client) readPump() {
	// --- Add Panic Recovery ---
	defer func() {
		if r := recover(); r != nil {
			log.Printf("!!! PANIC in readPump (UserID: %d): %v\n%s", c.userID, r, debug.Stack())
		}
		c.hub.unregister <- c
		c.conn.Close()
		log.Printf("Exiting readPump for UserID: %d", c.userID) // Added exit log
	}()
	// --- End Panic Recovery ---
	// c.conn.SetReadLimit(maxMessageSize) // If needed
	// c.conn.SetReadDeadline(time.Now().Add(pongWait)) // If using pings/pongs
	// c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })

	for {
		// ReadMessage is blocking
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket read error (UserID: %d): %v", c.userID, err)
			} else {
				log.Printf("WebSocket closed normally (UserID: %d)", c.userID)
			}
			break // Exit loop on error or close
		}

		// Process the received message if needed
		log.Printf("Received message from UserID %d: %s", c.userID, string(message))
		// Example: If clients could send messages *to the hub*
		// h.broadcast <- message
	}
}

// writePump pumps messages from the hub to the WebSocket connection.
func (c *Client) writePump() {
	// ticker := time.NewTicker(pingPeriod) // If using pings
	// --- Add Panic Recovery ---
	defer func() {
		if r := recover(); r != nil {
			log.Printf("!!! PANIC in writePump (UserID: %d): %v\n%s", c.userID, r, debug.Stack())
			// Attempt to unregister, although connection might already be broken
			// c.hub.unregister <- c // Be careful with potential deadlocks if hub is blocked
		}
		// ticker.Stop() // Stop ticker if using pings
		c.conn.Close() // Ensure connection is closed on exit
		log.Printf("Exiting writePump for UserID: %d", c.userID) // Added exit log
	}()
	// --- End Panic Recovery ---
	for {
		select {
		case message, ok := <-c.send:
			// c.conn.SetWriteDeadline(time.Now().Add(writeWait)) // Reset deadline on write
			if !ok {
				// The hub closed the channel.
				log.Printf("Client send channel closed for UserID %d", c.userID)
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return // Exit goroutine
			}

			err := c.conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				log.Printf("WebSocket write error (UserID: %d): %v", c.userID, err)
				return // Exit goroutine on write error
			}

			// Optional: Handle batched writes if needed for performance
			// n := len(c.send)
			// for i := 0; i < n; i++ { ... }

			// case <-ticker.C: // If using pings
			// 	// c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			// 	if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
			// 		return
			// 	}
		}
	}
}
