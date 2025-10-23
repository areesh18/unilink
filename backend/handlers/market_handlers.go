package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"unilink-backend/db"
	"unilink-backend/models"
	"unilink-backend/utils"

	"github.com/gorilla/mux"
)

// CreateListingRequest is the payload for creating a new listing
type CreateListingRequest struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	ImageURL    string  `json:"imageUrl"`
}

// ListingResponse includes seller info for display
type ListingResponse struct {
	ID          uint       `json:"id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Price       float64    `json:"price"`
	ImageURL    string     `json:"imageUrl"`
	Status      string     `json:"status"`
	Seller      SellerInfo `json:"seller"`
	CreatedAt   string     `json:"createdAt"`
}

// SellerInfo contains safe seller data
type SellerInfo struct {
	ID        uint   `json:"id"`
	Name      string `json:"name"`
	StudentID string `json:"studentId"`
}

// GetAllListings returns marketplace listings filtered by user's college
// This is the CRITICAL college isolation feature
func GetAllListings(w http.ResponseWriter, r *http.Request) {
	// Get user claims from context (set by ValidateToken middleware)
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Query listings ONLY from the user's college
	var listings []models.MarketplaceListing
	result := db.DB.
		Preload("Seller").                                                     // Load seller info
		Where("college_id = ? AND status = ?", claims.CollegeID, "available"). // COLLEGE FILTER
		Order("created_at DESC").
		Find(&listings)

	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch listings")
		return
	}

	// Transform to response format
	var response []ListingResponse
	for _, listing := range listings {
		response = append(response, ListingResponse{
			ID:          listing.ID,
			Title:       listing.Title,
			Description: listing.Description,
			Price:       listing.Price,
			ImageURL:    listing.ImageURL,
			Status:      listing.Status,
			Seller: SellerInfo{
				ID:        listing.Seller.ID,
				Name:      listing.Seller.Name,
				StudentID: listing.Seller.StudentID,
			},
			CreatedAt: listing.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	respondWithJSON(w, http.StatusOK, response)
}

// CreateListing creates a new marketplace listing
// Automatically tags it with the user's college
func CreateListing(w http.ResponseWriter, r *http.Request) {
	// Get user claims
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Parse request
	var req CreateListingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Validate input
	if req.Title == "" || req.Price <= 0 {
		respondWithError(w, http.StatusBadRequest, "Title and valid price are required")
		return
	}

	// Create listing with user's college ID (AUTOMATIC COLLEGE TAGGING)
	newListing := models.MarketplaceListing{
		Title:       req.Title,
		Description: req.Description,
		Price:       req.Price,
		ImageURL:    req.ImageURL,
		Status:      "available",
		SellerID:    claims.UserID,    // From JWT
		CollegeID:   claims.CollegeID, // From JWT - CRITICAL FOR ISOLATION
	}

	result := db.DB.Create(&newListing)
	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create listing")
		return
	}

	// Preload seller info for response
	db.DB.Preload("Seller").First(&newListing, newListing.ID)

	response := ListingResponse{
		ID:          newListing.ID,
		Title:       newListing.Title,
		Description: newListing.Description,
		Price:       newListing.Price,
		ImageURL:    newListing.ImageURL,
		Status:      newListing.Status,
		Seller: SellerInfo{
			ID:        newListing.Seller.ID,
			Name:      newListing.Seller.Name,
			StudentID: newListing.Seller.StudentID,
		},
		CreatedAt: newListing.CreatedAt.Format("2006-01-02 15:04:05"),
	}

	respondWithJSON(w, http.StatusCreated, response)
}

// GetListingByID returns a single listing (with college check)
func GetListingByID(w http.ResponseWriter, r *http.Request) {
	// Get user claims
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get listing ID from URL
	vars := mux.Vars(r)
	listingID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid listing ID")
		return
	}

	// Find listing with college check
	var listing models.MarketplaceListing
	result := db.DB.
		Preload("Seller").
		Where("id = ? AND college_id = ?", listingID, claims.CollegeID). // COLLEGE CHECK
		First(&listing)

	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "Listing not found or access denied")
		return
	}

	response := ListingResponse{
		ID:          listing.ID,
		Title:       listing.Title,
		Description: listing.Description,
		Price:       listing.Price,
		ImageURL:    listing.ImageURL,
		Status:      listing.Status,
		Seller: SellerInfo{
			ID:        listing.Seller.ID,
			Name:      listing.Seller.Name,
			StudentID: listing.Seller.StudentID,
		},
		CreatedAt: listing.CreatedAt.Format("2006-01-02 15:04:05"),
	}

	respondWithJSON(w, http.StatusOK, response)
}

// GetMyListings returns all listings created by the authenticated user
func GetMyListings(w http.ResponseWriter, r *http.Request) {
	// Get user claims
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Find user's listings
	var listings []models.MarketplaceListing
	result := db.DB.
		Preload("Seller").
		Where("seller_id = ?", claims.UserID).
		Order("created_at DESC").
		Find(&listings)

	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch listings")
		return
	}

	// Transform to response
	var response []ListingResponse
	for _, listing := range listings {
		response = append(response, ListingResponse{
			ID:          listing.ID,
			Title:       listing.Title,
			Description: listing.Description,
			Price:       listing.Price,
			ImageURL:    listing.ImageURL,
			Status:      listing.Status,
			Seller: SellerInfo{
				ID:        listing.Seller.ID,
				Name:      listing.Seller.Name,
				StudentID: listing.Seller.StudentID,
			},
			CreatedAt: listing.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	respondWithJSON(w, http.StatusOK, response)
}

// DeleteListing allows a user to delete their own listing
func DeleteListing(w http.ResponseWriter, r *http.Request) {
	// Get user claims
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	// Get listing ID
	vars := mux.Vars(r)
	listingID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid listing ID")
		return
	}

	// Find listing and verify ownership
	var listing models.MarketplaceListing
	result := db.DB.Where("id = ? AND seller_id = ?", listingID, claims.UserID).First(&listing)

	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "Listing not found or you don't have permission")
		return
	}

	// Soft delete
	db.DB.Delete(&listing)

	respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Listing deleted successfully",
	})
}
