package models

import (
	"time"

	"gorm.io/gorm"
)

// College represents an educational institution in the system
type College struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	CollegeCode string         `gorm:"uniqueIndex;not null" json:"collegeCode"` // e.g., "VIT", "MIT"
	Name        string         `gorm:"not null" json:"name"`                    // e.g., "Vellore Institute of Technology"
	LogoURL     string         `json:"logoUrl"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// User represents any user in the system (students, admins, etc.)
type User struct {
	ID           uint   `gorm:"primaryKey" json:"id"`
	Name         string `gorm:"not null" json:"name"`
	Email        string `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string `gorm:"not null" json:"-"`                      // Never send to frontend
	Role         string `gorm:"not null;default:'student'" json:"role"` // "student", "college_admin", "platform_admin"
	StudentID    string `gorm:"uniqueIndex;not null" json:"studentId"`  // e.g., "21BCE1001"

	// Profile fields (Module 1)
	ProfilePicture string         `json:"profilePicture"` // URL to profile image
	Bio            string         `gorm:"type:text" json:"bio"`
	Department     string         `json:"department"` // e.g., "Computer Science"
	Semester       int            `json:"semester"`   // e.g., 4
	IsPublic       bool           `gorm:"default:true" json:"isPublic"` // Privacy control
	Status         string         `gorm:"default:'active'" json:"status"` // "active", "suspended"
	
	// Foreign Key Relationship
	CollegeID uint    `gorm:"not null" json:"collegeId"`
	College   College `gorm:"foreignKey:CollegeID" json:"college"` // Preload this for JWT

	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// MarketplaceListing represents items students want to sell/buy
type MarketplaceListing struct {
	ID          uint    `gorm:"primaryKey" json:"id"`
	Title       string  `gorm:"not null" json:"title"`
	Description string  `json:"description"`
	Price       float64 `gorm:"not null" json:"price"`
	ImageURL    string  `json:"imageUrl"`
	Status      string  `gorm:"default:'available'" json:"status"` // "available", "sold"

	// Foreign Keys
	SellerID  uint    `gorm:"not null" json:"sellerId"`
	Seller    User    `gorm:"foreignKey:SellerID" json:"seller"`
	CollegeID uint    `gorm:"not null" json:"collegeId"` // CRITICAL: College isolation
	College   College `gorm:"foreignKey:CollegeID" json:"college"`

	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// JWTClaims represents the custom claims we'll store in the JWT token
// This is not a database model, but it's related to User
type JWTClaims struct {
	UserID         uint   `json:"userID"`
	Email          string `json:"email"`
	Role           string `json:"role"`
	CollegeID      uint   `json:"collegeID"`
	CollegeCode    string `json:"collegeCode"`
	CollegeLogoURL string `json:"collegeLogoUrl"`
}
