package utils

import (
	"net/http"

	"github.com/gorilla/handlers"
)

// SetupCORS configures CORS middleware for the application
func SetupCORS() func(http.Handler) http.Handler {
	// Allowed origins (frontend URLs)
	allowedOrigins := handlers.AllowedOrigins([]string{
		"http://localhost:3000",          // React dev server
		"http://localhost:5173",          // Vite dev server
		"https://unilink.yourdomain.com", // Production frontend (update this)
	})

	// Allowed HTTP methods
	allowedMethods := handlers.AllowedMethods([]string{
		"GET",
		"POST",
		"PUT",
		"DELETE",
		"OPTIONS",
	})

	// Allowed headers
	allowedHeaders := handlers.AllowedHeaders([]string{
		"Content-Type",
		"Authorization",
		"X-Requested-With",
	})

	// Allow credentials (cookies, authorization headers)
	allowCredentials := handlers.AllowCredentials()

	// Combine all CORS options
	return func(next http.Handler) http.Handler {
		return handlers.CORS(
			allowedOrigins,
			allowedMethods,
			allowedHeaders,
			allowCredentials,
		)(next)
	}
}
