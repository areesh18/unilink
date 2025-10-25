package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"unilink-backend/db"
	"unilink-backend/models"
	"unilink-backend/utils"

	"github.com/gorilla/mux"
)

// CreateAnnouncementRequest is the payload for creating announcements
type CreateAnnouncementRequest struct {
	Title      string  `json:"title"`
	Content    string  `json:"content"`
	Priority   string  `json:"priority"`   // "low", "medium", "high"
	Department *string `json:"department"` // nil = all departments
	Semester   *int    `json:"semester"`   // nil = all semesters
}

// AnnouncementResponse contains announcement data for display
type AnnouncementResponse struct {
	ID         uint    `json:"id"`
	Title      string  `json:"title"`
	Content    string  `json:"content"`
	Priority   string  `json:"priority"`
	Department *string `json:"department"`
	Semester   *int    `json:"semester"`
	AuthorName string  `json:"authorName"`
	CreatedAt  string  `json:"createdAt"`
	UpdatedAt  string  `json:"updatedAt"`
}

// ============================================
// COLLEGE ADMIN FUNCTIONS
// ============================================

// CreateAnnouncement allows college admin to post a new notice
func CreateAnnouncement(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	var req CreateAnnouncementRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate input
	req.Title = strings.TrimSpace(req.Title)
	req.Content = strings.TrimSpace(req.Content)

	if req.Title == "" || req.Content == "" {
		respondWithError(w, http.StatusBadRequest, "Title and content are required")
		return
	}

	// Validate priority
	validPriorities := map[string]bool{"low": true, "medium": true, "high": true}
	if req.Priority == "" {
		req.Priority = "medium"
	}
	if !validPriorities[req.Priority] {
		respondWithError(w, http.StatusBadRequest, "Priority must be 'low', 'medium', or 'high'")
		return
	}

	// Create announcement
	announcement := models.Announcement{
		Title:      req.Title,
		Content:    req.Content,
		Priority:   req.Priority,
		CollegeID:  claims.CollegeID,
		Department: req.Department,
		Semester:   req.Semester,
		CreatedBy:  claims.UserID,
	}

	result := db.DB.Create(&announcement)
	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create announcement")
		return
	}

	// Preload author info for response
	db.DB.Preload("Author").First(&announcement, announcement.ID)

	response := AnnouncementResponse{
		ID:         announcement.ID,
		Title:      announcement.Title,
		Content:    announcement.Content,
		Priority:   announcement.Priority,
		Department: announcement.Department,
		Semester:   announcement.Semester,
		AuthorName: announcement.Author.Name,
		CreatedAt:  announcement.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:  announcement.UpdatedAt.Format("2006-01-02 15:04:05"),
	}

	respondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"message":      "Announcement created successfully",
		"announcement": response,
	})
}

// GetCollegeAnnouncements returns all announcements created by the admin's college
func GetCollegeAnnouncements(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get all announcements from admin's college
	var announcements []models.Announcement
	result := db.DB.Preload("Author").
		Where("college_id = ?", claims.CollegeID).
		Order("created_at DESC").
		Find(&announcements)

	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch announcements")
		return
	}

	// Transform to response
	var response []AnnouncementResponse
	for _, a := range announcements {
		response = append(response, AnnouncementResponse{
			ID:         a.ID,
			Title:      a.Title,
			Content:    a.Content,
			Priority:   a.Priority,
			Department: a.Department,
			Semester:   a.Semester,
			AuthorName: a.Author.Name,
			CreatedAt:  a.CreatedAt.Format("2006-01-02 15:04:05"),
			UpdatedAt:  a.UpdatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"total":         len(response),
		"announcements": response,
	})
}

// UpdateAnnouncement allows college admin to edit an existing notice
func UpdateAnnouncement(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get announcement ID from URL
	vars := mux.Vars(r)
	announcementID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid announcement ID")
		return
	}

	// Parse request
	var req CreateAnnouncementRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Find announcement
	var announcement models.Announcement
	result := db.DB.Where("id = ? AND college_id = ?", announcementID, claims.CollegeID).First(&announcement)
	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "Announcement not found")
		return
	}

	// Update fields
	announcement.Title = strings.TrimSpace(req.Title)
	announcement.Content = strings.TrimSpace(req.Content)
	announcement.Priority = req.Priority
	announcement.Department = req.Department
	announcement.Semester = req.Semester

	if announcement.Title == "" || announcement.Content == "" {
		respondWithError(w, http.StatusBadRequest, "Title and content are required")
		return
	}

	// Save
	if err := db.DB.Save(&announcement).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to update announcement")
		return
	}

	// Preload author
	db.DB.Preload("Author").First(&announcement, announcement.ID)

	response := AnnouncementResponse{
		ID:         announcement.ID,
		Title:      announcement.Title,
		Content:    announcement.Content,
		Priority:   announcement.Priority,
		Department: announcement.Department,
		Semester:   announcement.Semester,
		AuthorName: announcement.Author.Name,
		CreatedAt:  announcement.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:  announcement.UpdatedAt.Format("2006-01-02 15:04:05"),
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message":      "Announcement updated successfully",
		"announcement": response,
	})
}

// DeleteAnnouncement allows college admin to delete a notice
func DeleteAnnouncement(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get announcement ID
	vars := mux.Vars(r)
	announcementID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid announcement ID")
		return
	}

	// Find and verify ownership
	var announcement models.Announcement
	result := db.DB.Where("id = ? AND college_id = ?", announcementID, claims.CollegeID).First(&announcement)
	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "Announcement not found")
		return
	}

	// Soft delete
	db.DB.Delete(&announcement)

	respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Announcement deleted successfully",
	})
}

// ============================================
// STUDENT FUNCTIONS
// ============================================

// GetStudentFeed returns announcements relevant to the student
// This is THE KEY FUNCTION - implements the targeting logic!
func GetStudentFeed(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get student's profile to know their department and semester
	var user models.User
	if err := db.DB.First(&user, claims.UserID).Error; err != nil {
		respondWithError(w, http.StatusNotFound, "User not found")
		return
	}

	// Build the query with targeting logic
	// Student sees announcement if:
	// 1. It's from their college
	// 2. AND (department is null OR department matches theirs)
	// 3. AND (semester is null OR semester matches theirs)

	var announcements []models.Announcement
	result := db.DB.Preload("Author").
		Where("college_id = ?", claims.CollegeID).
		Where("(department IS NULL OR department = ?)", user.Department).
		Where("(semester IS NULL OR semester = ?)", user.Semester).
		Order("created_at DESC").
		Find(&announcements)

	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch feed")
		return
	}

	// Transform to response
	var response []AnnouncementResponse
	for _, a := range announcements {
		response = append(response, AnnouncementResponse{
			ID:         a.ID,
			Title:      a.Title,
			Content:    a.Content,
			Priority:   a.Priority,
			Department: a.Department,
			Semester:   a.Semester,
			AuthorName: a.Author.Name,
			CreatedAt:  a.CreatedAt.Format("2006-01-02 15:04:05"),
			UpdatedAt:  a.UpdatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"total":         len(response),
		"announcements": response,
	})
}
