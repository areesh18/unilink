package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"unilink-backend/db"
	"unilink-backend/models"
	"unilink-backend/utils"

	"github.com/gorilla/mux"
)

// CreateGroupRequest is the payload for creating a public group
type CreateGroupRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Avatar      string `json:"avatar"`
}

// GroupResponse contains group data
type GroupResponse struct {
	ID          uint   `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Type        string `json:"type"`
	Avatar      string `json:"avatar"`
	MemberCount int64  `json:"memberCount"`
	IsMember    bool   `json:"isMember"`
	CreatedAt   string `json:"createdAt"`
}

// GroupDetailResponse contains detailed group info including members
type GroupDetailResponse struct {
	GroupResponse
	Members []GroupMemberData `json:"members"`
}

// GroupMemberData contains member info
type GroupMemberData struct {
	ID             uint   `json:"id"`
	Name           string `json:"name"`
	ProfilePicture string `json:"profilePicture"`
	Department     string `json:"department"`
	Semester       int    `json:"semester"`
	Role           string `json:"role"`
	JoinedAt       string `json:"joinedAt"`
}

// GetMyGroups returns all groups the user is a member of (auto + public)
func GetMyGroups(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get all groups where user is a member
	var memberships []models.GroupMember
	result := db.DB.Preload("Group").
		Where("user_id = ?", claims.UserID).
		Find(&memberships)

	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch groups")
		return
	}

	// Transform to response
	var groups []GroupResponse
	for _, m := range memberships {
		// Count members
		var memberCount int64
		db.DB.Model(&models.GroupMember{}).Where("group_id = ?", m.Group.ID).Count(&memberCount)

		groups = append(groups, GroupResponse{
			ID:          m.Group.ID,
			Name:        m.Group.Name,
			Description: m.Group.Description,
			Type:        m.Group.Type,
			Avatar:      m.Group.Avatar,
			MemberCount: memberCount,
			IsMember:    true,
			CreatedAt:   m.Group.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"total":  len(groups),
		"groups": groups,
	})
}

// GetPublicGroups returns all public groups (clubs) in the college
func GetPublicGroups(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get all public groups from user's college
	var groups []models.Group
	result := db.DB.Where("college_id = ? AND type = ?", claims.CollegeID, "public").
		Order("created_at DESC").
		Find(&groups)

	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch public groups")
		return
	}

	// Get user's memberships to mark which groups they're in
	var userMemberships []models.GroupMember
	db.DB.Where("user_id = ?", claims.UserID).Find(&userMemberships)

	memberGroupIDs := make(map[uint]bool)
	for _, m := range userMemberships {
		memberGroupIDs[m.GroupID] = true
	}

	// Transform to response
	var response []GroupResponse
	for _, g := range groups {
		var memberCount int64
		db.DB.Model(&models.GroupMember{}).Where("group_id = ?", g.ID).Count(&memberCount)

		response = append(response, GroupResponse{
			ID:          g.ID,
			Name:        g.Name,
			Description: g.Description,
			Type:        g.Type,
			Avatar:      g.Avatar,
			MemberCount: memberCount,
			IsMember:    memberGroupIDs[g.ID],
			CreatedAt:   g.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"total":  len(response),
		"groups": response,
	})
}

// CreatePublicGroup allows college admin to create a new official club/group
func CreatePublicGroup(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	var req CreateGroupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate input
	req.Name = strings.TrimSpace(req.Name)
	req.Description = strings.TrimSpace(req.Description)

	if req.Name == "" {
		respondWithError(w, http.StatusBadRequest, "Group name is required")
		return
	}

	// Check if group name already exists in this college
	var existingGroup models.Group
	db.DB.Where("college_id = ? AND name = ? AND type = ?", claims.CollegeID, req.Name, "public").First(&existingGroup)
	if existingGroup.ID != 0 {
		respondWithError(w, http.StatusConflict, "Group name already exists")
		return
	}

	// Create group (admin creates but doesn't auto-join)
	group := models.Group{
		Name:        req.Name,
		Description: req.Description,
		Type:        "public",
		Avatar:      req.Avatar,
		CollegeID:   claims.CollegeID,
		CreatedBy:   &claims.UserID,
	}

	if err := db.DB.Create(&group).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create group")
		return
	}

	respondWithJSON(w, http.StatusCreated, map[string]interface{}{
		"message": "Official group created successfully",
		"group": GroupResponse{
			ID:          group.ID,
			Name:        group.Name,
			Description: group.Description,
			Type:        group.Type,
			Avatar:      group.Avatar,
			MemberCount: 0, // No members yet
			IsMember:    false,
			CreatedAt:   group.CreatedAt.Format("2006-01-02 15:04:05"),
		},
	})
}

// GetGroupDetail returns detailed info about a specific group including members
func GetGroupDetail(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get group ID from URL
	vars := mux.Vars(r)
	groupID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	// Find group (college-scoped)
	var group models.Group
	result := db.DB.Where("id = ? AND college_id = ?", groupID, claims.CollegeID).First(&group)
	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "Group not found")
		return
	}

	// Get members
	var memberships []models.GroupMember
	db.DB.Preload("User").Where("group_id = ?", groupID).Find(&memberships)

	// Check if current user is member
	isMember := false
	for _, m := range memberships {
		if m.UserID == claims.UserID {
			isMember = true
			break
		}
	}

	// Transform members
	var members []GroupMemberData
	for _, m := range memberships {
		members = append(members, GroupMemberData{
			ID:             m.User.ID,
			Name:           m.User.Name,
			ProfilePicture: m.User.ProfilePicture,
			Department:     m.User.Department,
			Semester:       m.User.Semester,
			Role:           m.Role,
			JoinedAt:       m.JoinedAt.Format("2006-01-02 15:04:05"),
		})
	}

	response := GroupDetailResponse{
		GroupResponse: GroupResponse{
			ID:          group.ID,
			Name:        group.Name,
			Description: group.Description,
			Type:        group.Type,
			Avatar:      group.Avatar,
			MemberCount: int64(len(members)),
			IsMember:    isMember,
			CreatedAt:   group.CreatedAt.Format("2006-01-02 15:04:05"),
		},
		Members: members,
	}

	respondWithJSON(w, http.StatusOK, response)
}

// JoinGroup allows a student to join a public group
func JoinGroup(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get group ID from URL
	vars := mux.Vars(r)
	groupID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	// Find group (must be public and in same college)
	var group models.Group
	result := db.DB.Where("id = ? AND college_id = ? AND type = ?", groupID, claims.CollegeID, "public").First(&group)
	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "Group not found or cannot join auto groups")
		return
	}

	// Check if already a member
	var existingMembership models.GroupMember
	db.DB.Where("group_id = ? AND user_id = ?", groupID, claims.UserID).First(&existingMembership)
	if existingMembership.ID != 0 {
		respondWithError(w, http.StatusConflict, "Already a member of this group")
		return
	}

	// Add user as member
	membership := models.GroupMember{
		GroupID:  uint(groupID),
		UserID:   claims.UserID,
		Role:     "member",
		JoinedAt: time.Now(),
	}

	if err := db.DB.Create(&membership).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to join group")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Successfully joined group",
	})
}

// LeaveGroup allows a student to leave a public group
func LeaveGroup(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get group ID from URL
	vars := mux.Vars(r)
	groupID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	// Find group (must be public - can't leave auto groups)
	var group models.Group
	result := db.DB.Where("id = ? AND college_id = ? AND type = ?", groupID, claims.CollegeID, "public").First(&group)
	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "Group not found or cannot leave auto groups")
		return
	}

	// Find and delete membership
	result = db.DB.Where("group_id = ? AND user_id = ?", groupID, claims.UserID).Delete(&models.GroupMember{})
	if result.Error != nil || result.RowsAffected == 0 {
		respondWithError(w, http.StatusNotFound, "Not a member of this group")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Successfully left group",
	})
}

// ============================================
// COLLEGE ADMIN FUNCTIONS (Group Management)
// ============================================

// GetCollegeGroups returns all groups in the admin's college (for management)
func GetCollegeGroups(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get all groups (auto + public) from admin's college
	var groups []models.Group
	result := db.DB.Where("college_id = ?", claims.CollegeID).
		Order("type ASC, created_at DESC").
		Find(&groups)

	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch groups")
		return
	}

	// Transform to response with member counts
	var response []GroupResponse
	for _, g := range groups {
		var memberCount int64
		db.DB.Model(&models.GroupMember{}).Where("group_id = ?", g.ID).Count(&memberCount)

		response = append(response, GroupResponse{
			ID:          g.ID,
			Name:        g.Name,
			Description: g.Description,
			Type:        g.Type,
			Avatar:      g.Avatar,
			MemberCount: memberCount,
			IsMember:    false, // Not relevant for admin view
			CreatedAt:   g.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"total":  len(response),
		"groups": response,
	})
}

// DeleteGroup allows admin to delete a public group (cannot delete auto groups)
func DeleteGroup(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get group ID from URL
	vars := mux.Vars(r)
	groupID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid group ID")
		return
	}

	// Find group (must be public, cannot delete auto groups)
	var group models.Group
	result := db.DB.Where("id = ? AND college_id = ? AND type = ?", groupID, claims.CollegeID, "public").First(&group)
	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "Group not found or cannot delete auto groups")
		return
	}

	// Delete all memberships first
	db.DB.Where("group_id = ?", groupID).Delete(&models.GroupMember{})

	// Delete the group
	db.DB.Delete(&group)

	respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Group deleted successfully",
	})
}
