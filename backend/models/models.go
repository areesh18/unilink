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
	ProfilePicture string `json:"profilePicture"` // URL to profile image
	Bio            string `gorm:"type:text" json:"bio"`
	Department     string `json:"department"`                     // e.g., "Computer Science"
	Semester       int    `json:"semester"`                       // e.g., 4
	IsPublic       bool   `gorm:"default:true" json:"isPublic"`   // Privacy control
	Status         string `gorm:"default:'active'" json:"status"` // "active", "suspended"

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

// Announcement represents official notices from college admins (Module 2)
type Announcement struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Title    string `gorm:"not null" json:"title"`
	Content  string `gorm:"type:text;not null" json:"content"`
	Priority string `gorm:"default:'medium'" json:"priority"` // "low", "medium", "high"

	// Targeting - determines who sees this announcement
	CollegeID  uint    `gorm:"not null" json:"collegeId"`
	College    College `gorm:"foreignKey:CollegeID" json:"college"`
	Department *string `json:"department"` // nil = all departments
	Semester   *int    `json:"semester"`   // nil = all semesters

	// Author
	CreatedBy uint `gorm:"not null" json:"createdBy"`
	Author    User `gorm:"foreignKey:CreatedBy" json:"author"`

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

// Friendship represents friend connections between students (Module 3)
type Friendship struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null" json:"userId"`
	User      User      `gorm:"foreignKey:UserID" json:"user"`
	FriendID  uint      `gorm:"not null" json:"friendId"`
	Friend    User      `gorm:"foreignKey:FriendID" json:"friend"`
	Status    string    `gorm:"default:'pending'" json:"status"` // "pending", "accepted", "rejected", "blocked"
	CollegeID uint      `gorm:"not null" json:"collegeId"`       // Both users must be from same college
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// Group represents chat groups (auto-created department/semester groups or public clubs)
type Group struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Name        string `gorm:"not null" json:"name"`
	Description string `gorm:"type:text" json:"description"`
	Type        string `gorm:"not null" json:"type"` // "auto" (dept/sem) or "public" (clubs)
	Avatar      string `json:"avatar"`               // Group image URL

	// College isolation
	CollegeID uint    `gorm:"not null" json:"collegeId"`
	College   College `gorm:"foreignKey:CollegeID" json:"college"`

	// For auto groups (department/semester groups)
	Department *string `json:"department"` // e.g., "Computer Science and Engineering"
	Semester   *int    `json:"semester"`   // e.g., 4

	// For public groups (clubs)
	CreatedBy *uint `json:"createdBy"` // User who created the club
	Creator   *User `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`

	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// GroupMember represents membership in a group
type GroupMember struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	GroupID   uint      `gorm:"not null" json:"groupId"`
	Group     Group     `gorm:"foreignKey:GroupID" json:"group"`
	UserID    uint      `gorm:"not null" json:"userId"`
	User      User      `gorm:"foreignKey:UserID" json:"user"`
	Role      string    `gorm:"default:'member'" json:"role"` // "member", "moderator", "admin"
	JoinedAt  time.Time `json:"joinedAt"`
	CreatedAt time.Time `json:"createdAt"`
}

// Message represents a chat message (DM or group)
type Message struct {
	ID      uint   `gorm:"primaryKey" json:"id"`
	Content string `gorm:"type:text;not null" json:"content"`
	Type    string `gorm:"default:'text'" json:"type"` // "text", "image", "file"

	// Conversation identification
	ConversationType string `gorm:"not null" json:"conversationType"`     // "dm" or "group"
	ConversationID   string `gorm:"not null;index" json:"conversationId"` // Format: "dm_{userId1}_{userId2}" or "group_{groupId}"

	// Sender
	SenderID uint `gorm:"not null" json:"senderId"`
	Sender   User `gorm:"foreignKey:SenderID" json:"sender"`

	// For DMs - store both participant IDs for easier querying
	ReceiverID *uint `json:"receiverId,omitempty"` // Only for DMs

	// For Group messages
	GroupID *uint `json:"groupId,omitempty"` // Only for group messages

	// Message status
	IsRead    bool `gorm:"default:false" json:"isRead"`
	IsDeleted bool `gorm:"default:false" json:"isDeleted"`

	// College isolation (for security)
	CollegeID uint `gorm:"not null" json:"collegeId"`

	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
