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

	// Health check endpoint
	router.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status": "healthy", "message": "UniLink backend is running"}`))
	}).Methods("GET")

	// Protected routes will be added here later
	// Example:
	// protected := router.PathPrefix("/api").Subrouter()
	// protected.Use(utils.ValidateToken)
	// protected.HandleFunc("/listings", handlers.GetListings).Methods("GET")

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
