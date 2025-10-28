package handlers

import (
	"encoding/json"
	"log" // <-- Ensure log is imported
	"net/http"
	"strconv"
	"strings"
	"time" // Keep time

	"unilink-backend/db"
	"unilink-backend/models"
	"unilink-backend/utils" // <-- Ensure utils is imported
	"unilink-backend/websocket"

	"github.com/gorilla/mux"
)

// --- REMOVE local key definitions ---

// ... (Keep CreateAnnouncementRequest, AnnouncementResponse structs) ...
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

	req.Title = strings.TrimSpace(req.Title)
	req.Content = strings.TrimSpace(req.Content)
	if req.Title == "" || req.Content == "" {
		respondWithError(w, http.StatusBadRequest, "Title and content are required")
		return
	}

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
		Department: req.Department, // Assign directly (can be nil)
		Semester:   req.Semester,   // Assign directly (can be nil)
		CreatedBy:  claims.UserID,
		CreatedAt:  time.Now(), // Explicitly set
		UpdatedAt:  time.Now(),
	}

	result := db.DB.Create(&announcement)
	if result.Error != nil {
		log.Printf("Error creating announcement in DB: %v", result.Error)
		respondWithError(w, http.StatusInternalServerError, "Failed to create announcement")
		return
	}

	// Preload author info for response & broadcast
	db.DB.Preload("Author").First(&announcement, announcement.ID)

	// Prepare response payload
	responsePayload := AnnouncementResponse{
		ID:         announcement.ID,
		Title:      announcement.Title,
		Content:    announcement.Content,
		Priority:   announcement.Priority,
		Department: announcement.Department,
		Semester:   announcement.Semester,
		AuthorName: announcement.Author.Name, // Make sure Author was loaded
		CreatedAt:  announcement.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:  announcement.UpdatedAt.Format("2006-01-02 15:04:05"),
	}

	// Broadcast the new announcement via Hub
	hub, ok := r.Context().Value(utils.HubKey).(*websocket.Hub) // Use key from utils
	if ok && hub != nil {
		// Create payload including top-level collegeId for easier targeting in hub
		broadcastPayload := map[string]interface{}{
			"id":         responsePayload.ID,
			"title":      responsePayload.Title,
			"content":    responsePayload.Content,
			"priority":   responsePayload.Priority,
			"department": responsePayload.Department, // Can be nil
			"semester":   responsePayload.Semester,   // Can be nil
			"authorName": responsePayload.AuthorName,
			"createdAt":  responsePayload.CreatedAt,
			"updatedAt":  responsePayload.UpdatedAt,
			"collegeId":  announcement.CollegeID, // Add required collegeId
		}
		wsMsg := &websocket.WSMessage{
			Type:    "newAnnouncement",
			Payload: broadcastPayload,
		}
		hub.BroadcastJSON(wsMsg)
		log.Printf("DEBUG: Successfully retrieved Hub and broadcasting announcement %d", responsePayload.ID)
	} else {
		log.Printf("Warning: Hub not found in context for CreateAnnouncement. Ok: %v, HubNil: %v", ok, hub == nil)
	}

	// Send HTTP response
	respondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"message":      "Announcement created successfully",
		"announcement": responsePayload,
	})
}

// ... (Keep GetCollegeAnnouncements, UpdateAnnouncement, DeleteAnnouncement, GetStudentFeed functions) ...
// GetCollegeAnnouncements returns all announcements created by the admin's college
func GetCollegeAnnouncements(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	var announcements []models.Announcement
	result := db.DB.Preload("Author").
		Where("college_id = ?", claims.CollegeID).
		Order("created_at DESC").
		Find(&announcements)

	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch announcements")
		return
	}

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

	vars := mux.Vars(r)
	announcementID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid announcement ID")
		return
	}

	var req CreateAnnouncementRequest // Reuse request struct
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	var announcement models.Announcement
	result := db.DB.Where("id = ? AND college_id = ?", announcementID, claims.CollegeID).First(&announcement)
	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "Announcement not found")
		return
	}

	// Update fields from request
	announcement.Title = strings.TrimSpace(req.Title)
	announcement.Content = strings.TrimSpace(req.Content)
	announcement.Priority = req.Priority // Assume validated on frontend or handle here
	announcement.Department = req.Department
	announcement.Semester = req.Semester
	announcement.UpdatedAt = time.Now()

	if announcement.Title == "" || announcement.Content == "" {
		respondWithError(w, http.StatusBadRequest, "Title and content cannot be empty")
		return
	}
	// Add priority validation if needed

	if err := db.DB.Save(&announcement).Error; err != nil {
		log.Printf("Error updating announcement %d: %v", announcementID, err)
		respondWithError(w, http.StatusInternalServerError, "Failed to update announcement")
		return
	}

	// Preload author for the response
	db.DB.Preload("Author").First(&announcement, announcement.ID)

	responsePayload := AnnouncementResponse{
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

	// TODO: Optionally broadcast "announcementUpdated" event via WebSocket

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message":      "Announcement updated successfully",
		"announcement": responsePayload,
	})
}

// DeleteAnnouncement allows college admin to delete a notice
func DeleteAnnouncement(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	vars := mux.Vars(r)
	announcementID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid announcement ID")
		return
	}

	// Find announcement belonging to the admin's college
	var announcement models.Announcement
	result := db.DB.Where("id = ? AND college_id = ?", announcementID, claims.CollegeID).First(&announcement)
	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "Announcement not found")
		return
	}

	// Perform soft delete
	if err := db.DB.Delete(&announcement).Error; err != nil {
		log.Printf("Error deleting announcement %d: %v", announcementID, err)
		respondWithError(w, http.StatusInternalServerError, "Failed to delete announcement")
		return
	}

	// TODO: Optionally broadcast "announcementDeleted" event via WebSocket

	respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Announcement deleted successfully",
	})
}

// GetStudentFeed returns announcements relevant to the student
func GetStudentFeed(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	var user models.User
	if err := db.DB.First(&user, claims.UserID).Error; err != nil {
		respondWithError(w, http.StatusNotFound, "User profile not found")
		return
	}

	var announcements []models.Announcement
	query := db.DB.Preload("Author").
		Where("college_id = ?", claims.CollegeID)

	// Apply targeting filters
	// Department filter: Show if announcement has no department OR department matches user's
	if user.Department != "" {
		query = query.Where("(department IS NULL OR department = ?)", user.Department)
	} else {
		// If user has no department set, only show college-wide (department IS NULL)
		query = query.Where("department IS NULL")
	}

	// Semester filter: Show if announcement has no semester OR semester matches user's
	if user.Semester > 0 {
		query = query.Where("(semester IS NULL OR semester = ?)", user.Semester)
	} else {
		// If user has no semester set, only show non-semester-specific (semester IS NULL)
		query = query.Where("semester IS NULL")
	}

	result := query.Order("created_at DESC").Find(&announcements)

	if result.Error != nil {
		log.Printf("Error fetching student feed for user %d: %v", claims.UserID, result.Error)
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch feed")
		return
	}

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
