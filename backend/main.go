package main

import (
	"context" // <-- Make sure context is imported
	"log"
	"net/http"
	"os"

	"unilink-backend/db"
	"unilink-backend/handlers"
	"unilink-backend/utils" // <-- Make sure utils is imported
	"unilink-backend/websocket"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

// Global WebSocket Hub instance
var wsHub *websocket.Hub

// --- REMOVE local key definitions ---

// Middleware to inject Hub into context
func withHub(hub *websocket.Hub) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			log.Printf("DEBUG: withHub middleware running for path: %s", r.URL.Path)
			if hub == nil {
				log.Printf("!!! DEBUG: Hub instance is nil in withHub middleware for path: %s", r.URL.Path)
			}

			// --- USE utils.HubKey here ---
			ctx := context.WithValue(r.Context(), utils.HubKey, hub) // Use key from utils package
			// --- END USE ---

			// Verification log using utils.HubKey
			retrievedHub, retrievedOk := ctx.Value(utils.HubKey).(*websocket.Hub) // Use key from utils package
			if !retrievedOk || retrievedHub == nil {
				log.Printf("!!! DEBUG: Failed to retrieve Hub immediately after setting in withHub for path: %s. Ok: %v, HubNil: %v", r.URL.Path, retrievedOk, retrievedHub == nil)
			} else {
				log.Printf("DEBUG: Successfully set and retrieved Hub in withHub for path: %s", r.URL.Path)
			}

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func main() {
	// Load environment variables from .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found, using system environment variables")
	}

	// Connect to database
	db.ConnectDB()

	// Initialize and run the WebSocket Hub
	wsHub = websocket.NewHub()
	go wsHub.Run()

	// Create router
	router := mux.NewRouter()

	// Apply CORS middleware
	corsMiddleware := utils.SetupCORS()

	// Public routes
	router.HandleFunc("/api/check-college", handlers.CheckCollege).Methods("POST", "OPTIONS")
	router.HandleFunc("/api/register", handlers.RegisterStudent).Methods("POST", "OPTIONS")
	router.HandleFunc("/api/login", handlers.Login).Methods("POST", "OPTIONS")
	router.HandleFunc("/api/admin/login", handlers.LoginAdmin).Methods("POST", "OPTIONS")
	router.HandleFunc("/api/setup/platform-admin", handlers.CreateFirstPlatformAdmin).Methods("POST", "OPTIONS") // REMOVE LATER
	router.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		websocket.ServeWs(wsHub, w, r)
	})
	router.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status": "healthy", "message": "UniLink backend is running"}`))
	}).Methods("GET")

	// Protected routes
	protected := router.PathPrefix("/api").Subrouter()
	// --- APPLY MIDDLEWARE ---
	protected.Use(withHub(wsHub))          // Apply Hub middleware FIRST
	protected.Use(utils.ValidateToken) // Then validate token
	// --- END APPLY ---

	// Define all protected routes
	// Student marketplace routes
	protected.HandleFunc("/listings", handlers.GetAllListings).Methods("GET")
	protected.HandleFunc("/listings", handlers.CreateListing).Methods("POST")
	protected.HandleFunc("/listings/my", handlers.GetMyListings).Methods("GET")
	protected.HandleFunc("/listings/{id}", handlers.GetListingByID).Methods("GET")
	protected.HandleFunc("/listings/{id}", handlers.DeleteListing).Methods("DELETE")
	// Profile routes
	protected.HandleFunc("/profile/me", handlers.GetMyProfile).Methods("GET")
	protected.HandleFunc("/profile/me", handlers.UpdateMyProfile).Methods("PUT")
	protected.HandleFunc("/profile/{id}", handlers.GetUserProfile).Methods("GET")
	protected.HandleFunc("/directory", handlers.SearchDirectory).Methods("GET")
	protected.HandleFunc("/departments", handlers.GetDepartments).Methods("GET")
	// Student announcement feed
	protected.HandleFunc("/feed", handlers.GetStudentFeed).Methods("GET")
	// Friend system routes
	protected.HandleFunc("/friends/request", handlers.SendFriendRequest).Methods("POST")
	protected.HandleFunc("/friends/requests/pending", handlers.GetPendingRequests).Methods("GET")
	protected.HandleFunc("/friends/accept/{id}", handlers.AcceptFriendRequest).Methods("POST")
	protected.HandleFunc("/friends/reject/{id}", handlers.RejectFriendRequest).Methods("POST")
	protected.HandleFunc("/friends", handlers.GetFriends).Methods("GET")
	protected.HandleFunc("/friends/{id}", handlers.RemoveFriend).Methods("DELETE")
	protected.HandleFunc("/friends/suggestions", handlers.GetFriendSuggestions).Methods("GET")
	// Group system routes
	protected.HandleFunc("/groups/my", handlers.GetMyGroups).Methods("GET")
	protected.HandleFunc("/groups/public", handlers.GetPublicGroups).Methods("GET")
	protected.HandleFunc("/groups/{id}", handlers.GetGroupDetail).Methods("GET")
	protected.HandleFunc("/groups/{id}/join", handlers.JoinGroup).Methods("POST")
	protected.HandleFunc("/groups/{id}/leave", handlers.LeaveGroup).Methods("POST")
	// Messaging routes
	protected.HandleFunc("/conversations", handlers.GetConversations).Methods("GET")
	protected.HandleFunc("/conversations/{conversationId}/messages", handlers.GetMessages).Methods("GET")
	protected.HandleFunc("/conversations/{conversationId}/messages", handlers.SendMessage).Methods("POST")
	protected.HandleFunc("/messages/{id}", handlers.DeleteMessage).Methods("DELETE")

	// College Admin Routes
	collegeAdmin := protected.PathPrefix("/college-admin").Subrouter()
	collegeAdmin.Use(utils.RequireRole("college_admin")) // Hub middleware already applied via 'protected'
	collegeAdmin.HandleFunc("/students", handlers.GetCollegeStudents).Methods("GET")
	collegeAdmin.HandleFunc("/listings", handlers.GetCollegeListings).Methods("GET")
	collegeAdmin.HandleFunc("/listings/{id}", handlers.DeleteCollegeListing).Methods("DELETE")
	collegeAdmin.HandleFunc("/stats", handlers.GetCollegeStats).Methods("GET")
	collegeAdmin.HandleFunc("/announcements", handlers.CreateAnnouncement).Methods("POST")
	collegeAdmin.HandleFunc("/announcements", handlers.GetCollegeAnnouncements).Methods("GET")
	collegeAdmin.HandleFunc("/announcements/{id}", handlers.UpdateAnnouncement).Methods("PUT")
	collegeAdmin.HandleFunc("/announcements/{id}", handlers.DeleteAnnouncement).Methods("DELETE")
	collegeAdmin.HandleFunc("/groups", handlers.CreatePublicGroup).Methods("POST")
	collegeAdmin.HandleFunc("/groups", handlers.GetCollegeGroups).Methods("GET")
	collegeAdmin.HandleFunc("/groups/{id}", handlers.DeleteGroup).Methods("DELETE")

	// Platform Admin Routes
	platformAdmin := protected.PathPrefix("/platform-admin").Subrouter()
	platformAdmin.Use(utils.RequireRole("platform_admin")) // Hub middleware already applied via 'protected'
	platformAdmin.HandleFunc("/colleges", handlers.AddCollege).Methods("POST")
	platformAdmin.HandleFunc("/college-admins", handlers.CreateCollegeAdmin).Methods("POST")
	platformAdmin.HandleFunc("/students", handlers.GetAllStudents).Methods("GET")
	platformAdmin.HandleFunc("/listings", handlers.GetAllListingsPlatform).Methods("GET")
	platformAdmin.HandleFunc("/stats", handlers.GetPlatformStats).Methods("GET")

	// Get port
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Wrap router with CORS
	handler := corsMiddleware(router)

	// Start server
	log.Printf("🚀 Server starting on port %s", port)
	log.Printf("🔌 WebSocket endpoint: ws://localhost:%s/ws", port)
	log.Printf("📍 Health check: http://localhost:%s/api/health", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}