package utils

import (
	"fmt"
	"os"
	"time"

	"unilink-backend/models"

	"github.com/golang-jwt/jwt/v5"
)

// CustomClaims extends jwt.RegisteredClaims with our custom fields
type CustomClaims struct {
	UserID         uint   `json:"userID"`
	Email          string `json:"email"`
	Role           string `json:"role"`
	CollegeID      uint   `json:"collegeID"`
	CollegeCode    string `json:"collegeCode"`
	CollegeLogoURL string `json:"collegeLogoUrl"`
	Name           string `json:"name"` // *** Already Added in previous step's model update ***
	jwt.RegisteredClaims
}

// GenerateJWT creates a new JWT token for an authenticated user
func GenerateJWT(user *models.User) (string, error) {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return "", fmt.Errorf("JWT_SECRET not set in environment")
	}

	// Create custom claims
	claims := CustomClaims{
		UserID:         user.ID,
		Email:          user.Email,
		Role:           user.Role,
		CollegeID:      user.CollegeID,
		CollegeCode:    user.College.CollegeCode, // Assumes user.College is preloaded
		CollegeLogoURL: user.College.LogoURL,   // Assumes user.College is preloaded
		Name:           user.Name,             // *** ADDED user.Name here ***
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)), // Token valid for 24 hours
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "unilink-backend",
			Subject:   fmt.Sprintf("%d", user.ID), // Good practice to add Subject
		},
	}

	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token with secret
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ValidateJWT parses and validates a JWT token string
func ValidateJWT(tokenString string) (*CustomClaims, error) {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET not set in environment")
	}

	// Parse token
	token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(jwtSecret), nil
	})

	// Improved error handling for specific JWT errors
	if err != nil {
		// You can check for specific errors like jwt.ErrTokenExpired, jwt.ErrTokenNotValidYet etc.
		// For example:
		// if errors.Is(err, jwt.ErrTokenExpired) {
		//  return nil, fmt.Errorf("token has expired")
		// }
		return nil, fmt.Errorf("invalid token: %w", err) // Wrap original error
	}

	// Extract and return claims
	if claims, ok := token.Claims.(*CustomClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}