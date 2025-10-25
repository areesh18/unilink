package main

import (
	"log"
	"net/http"
	"os"

	"unilink-backend/db"
	"unilink-backend/handlers"
	"unilink-backend/utils"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found, using system environment variables")
	}

	// Connect to database
	db.ConnectDB()

	// Create router
	router := mux.NewRouter()

	// Apply CORS middleware
	corsMiddleware := utils.SetupCORS()

	// Public routes (no authentication required)
	router.HandleFunc("/api/check-college", handlers.CheckCollege).Methods("POST", "OPTIONS")
	router.HandleFunc("/api/register", handlers.RegisterStudent).Methods("POST", "OPTIONS")
	router.HandleFunc("/api/login", handlers.Login).Methods("POST", "OPTIONS")
	router.HandleFunc("/api/admin/login", handlers.LoginAdmin).Methods("POST", "OPTIONS")

	// TEMPORARY: First-time platform admin setup (REMOVE AFTER FIRST ADMIN CREATED)
	router.HandleFunc("/api/setup/platform-admin", handlers.CreateFirstPlatformAdmin).Methods("POST", "OPTIONS")

	// Health check endpoint
	router.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status": "healthy", "message": "UniLink backend is running"}`))
	}).Methods("GET")

	// Protected routes (require authentication)
	protected := router.PathPrefix("/api").Subrouter()
	protected.Use(utils.ValidateToken) // All routes here require valid JWT

	// Student marketplace routes
	protected.HandleFunc("/listings", handlers.GetAllListings).Methods("GET")
	protected.HandleFunc("/listings", handlers.CreateListing).Methods("POST")
	protected.HandleFunc("/listings/my", handlers.GetMyListings).Methods("GET") // MUST come before /{id}
	protected.HandleFunc("/listings/{id}", handlers.GetListingByID).Methods("GET")
	protected.HandleFunc("/listings/{id}", handlers.DeleteListing).Methods("DELETE")

	// Profile routes (Module 1)
	protected.HandleFunc("/profile/me", handlers.GetMyProfile).Methods("GET")
	protected.HandleFunc("/profile/me", handlers.UpdateMyProfile).Methods("PUT")
	protected.HandleFunc("/profile/{id}", handlers.GetUserProfile).Methods("GET")
	protected.HandleFunc("/directory", handlers.SearchDirectory).Methods("GET")
	protected.HandleFunc("/departments", handlers.GetDepartments).Methods("GET")

	// Student announcement feed (Module 2)
	protected.HandleFunc("/feed", handlers.GetStudentFeed).Methods("GET")

	// Friend system routes (Module 3)
	protected.HandleFunc("/friends/request", handlers.SendFriendRequest).Methods("POST")
	protected.HandleFunc("/friends/requests/pending", handlers.GetPendingRequests).Methods("GET")
	protected.HandleFunc("/friends/accept/{id}", handlers.AcceptFriendRequest).Methods("POST")
	protected.HandleFunc("/friends/reject/{id}", handlers.RejectFriendRequest).Methods("POST")
	protected.HandleFunc("/friends", handlers.GetFriends).Methods("GET")
	protected.HandleFunc("/friends/{id}", handlers.RemoveFriend).Methods("DELETE")
	protected.HandleFunc("/friends/suggestions", handlers.GetFriendSuggestions).Methods("GET")

	// ============================================
	// COLLEGE ADMIN ROUTES (College-Scoped)
	// ============================================
	collegeAdmin := protected.PathPrefix("/college-admin").Subrouter()
	collegeAdmin.Use(utils.RequireRole("college_admin"))

	collegeAdmin.HandleFunc("/students", handlers.GetCollegeStudents).Methods("GET")
	collegeAdmin.HandleFunc("/listings", handlers.GetCollegeListings).Methods("GET")
	collegeAdmin.HandleFunc("/listings/{id}", handlers.DeleteCollegeListing).Methods("DELETE")
	collegeAdmin.HandleFunc("/stats", handlers.GetCollegeStats).Methods("GET")

	collegeAdmin.HandleFunc("/announcements", handlers.CreateAnnouncement).Methods("POST")
	collegeAdmin.HandleFunc("/announcements", handlers.GetCollegeAnnouncements).Methods("GET")
	collegeAdmin.HandleFunc("/announcements/{id}", handlers.UpdateAnnouncement).Methods("PUT")
	collegeAdmin.HandleFunc("/announcements/{id}", handlers.DeleteAnnouncement).Methods("DELETE")

	// ============================================
	// PLATFORM ADMIN ROUTES (Global Access)
	// ============================================
	platformAdmin := protected.PathPrefix("/platform-admin").Subrouter()
	platformAdmin.Use(utils.RequireRole("platform_admin"))

	platformAdmin.HandleFunc("/colleges", handlers.AddCollege).Methods("POST")
	platformAdmin.HandleFunc("/college-admins", handlers.CreateCollegeAdmin).Methods("POST")
	platformAdmin.HandleFunc("/students", handlers.GetAllStudents).Methods("GET")
	platformAdmin.HandleFunc("/listings", handlers.GetAllListingsPlatform).Methods("GET")
	platformAdmin.HandleFunc("/stats", handlers.GetPlatformStats).Methods("GET")
	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Wrap router with CORS
	handler := corsMiddleware(router)

	// Start server
	log.Printf("🚀 Server starting on port %s", port)
	log.Printf("📍 Health check: http://localhost:%s/api/health", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}
