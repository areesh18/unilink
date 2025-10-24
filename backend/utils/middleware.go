package utils

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
)

// ContextKey is a custom type for context keys to avoid collisions
type ContextKey string

const UserClaimsKey ContextKey = "userClaims"

// ValidateToken is middleware that validates JWT and attaches claims to request context
func ValidateToken(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			respondWithError(w, http.StatusUnauthorized, "Authorization header required")
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			respondWithError(w, http.StatusUnauthorized, "Invalid authorization header format")
			return
		}

		tokenString := parts[1]

		// Validate token
		claims, err := ValidateJWT(tokenString)
		if err != nil {
			respondWithError(w, http.StatusUnauthorized, "Invalid or expired token")
			return
		}

		// Attach claims to request context
		ctx := context.WithValue(r.Context(), UserClaimsKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireRole is middleware that checks if the user has the required role
func RequireRole(role string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get claims from context (set by ValidateToken middleware)
			claims, ok := r.Context().Value(UserClaimsKey).(*CustomClaims)
			if !ok {
				respondWithError(w, http.StatusUnauthorized, "User claims not found in context")
				return
			}

			// Check if user has required role
			if claims.Role != role {
				respondWithError(w, http.StatusForbidden, "Insufficient permissions")
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// GetUserClaims extracts user claims from request context
func GetUserClaims(r *http.Request) (*CustomClaims, bool) {
	claims, ok := r.Context().Value(UserClaimsKey).(*CustomClaims)
	return claims, ok
}

// respondWithError is a helper to send JSON error responses
func respondWithError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

// RequireAnyAdminRole allows both college_admin and platform_admin
func RequireAnyAdminRole(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := r.Context().Value(UserClaimsKey).(*CustomClaims)
		if !ok {
			respondWithError(w, http.StatusUnauthorized, "User claims not found in context")
			return
		}

		// Check if user is any type of admin
		if claims.Role != "college_admin" && claims.Role != "platform_admin" {
			respondWithError(w, http.StatusForbidden, "Admin access required")
			return
		}

		next.ServeHTTP(w, r)
	})
}