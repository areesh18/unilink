package handlers

import (
	"encoding/json"
	"fmt" // <-- Make sure fmt is imported
	"log" // <-- Make sure log is imported
	"net/http"
	"strconv"
	"time" // <-- Ensure time is imported

	"gorm.io/gorm" // <-- Ensure gorm is imported

	"unilink-backend/db"
	"unilink-backend/models"
	"unilink-backend/utils"

	"github.com/gorilla/mux"
)

// ... (CreateListingRequest, ListingResponse, SellerInfo, toListingResponse functions remain the same) ...
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
	// *** NEW Fields for Reservation ***
	Buyer         *SellerInfo `json:"buyer,omitempty"`         // Use SellerInfo for buyer details
	ReservedUntil *string     `json:"reservedUntil,omitempty"` // String for JSON response
}

// SellerInfo contains safe seller data (also used for Buyer info)
type SellerInfo struct {
	ID        uint   `json:"id"`
	Name      string `json:"name"`
	StudentID string `json:"studentId"`
}

// Function to convert MarketplaceListing to ListingResponse
func toListingResponse(listing models.MarketplaceListing) ListingResponse {
	var buyerInfo *SellerInfo
	if listing.Buyer != nil {
		buyerInfo = &SellerInfo{
			ID:        listing.Buyer.ID,
			Name:      listing.Buyer.Name,
			StudentID: listing.Buyer.StudentID,
		}
	}

	var reservedUntilStr *string
	if listing.ReservedUntil != nil {
		str := listing.ReservedUntil.Format(time.RFC3339) // Use standard format
		reservedUntilStr = &str
	}

	return ListingResponse{
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
		Buyer:         buyerInfo,
		ReservedUntil: reservedUntilStr,
		CreatedAt:     listing.CreatedAt.Format("2006-01-02 15:04:05"),
	}
}

// ... (GetAllListings, CreateListing, GetListingByID, GetMyListings, DeleteListing handlers remain the same) ...

// GetAllListings returns marketplace listings filtered by user's college
func GetAllListings(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	var listings []models.MarketplaceListing
	result := db.DB.
		Preload("Seller").
		// Preload("Buyer"). // Optional: Preload Buyer info if needed on the main list
		Where("college_id = ? AND status = ?", claims.CollegeID, "available"). // Only show available by default
		Order("created_at DESC").
		Find(&listings)

	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch listings")
		return
	}

	var response []ListingResponse
	for _, listing := range listings {
		response = append(response, toListingResponse(listing)) // Use helper
	}

	respondWithJSON(w, http.StatusOK, response)
}

// CreateListing creates a new marketplace listing
func CreateListing(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	var req CreateListingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if req.Title == "" || req.Price <= 0 {
		respondWithError(w, http.StatusBadRequest, "Title and valid price are required")
		return
	}

	newListing := models.MarketplaceListing{
		Title:       req.Title,
		Description: req.Description,
		Price:       req.Price,
		ImageURL:    req.ImageURL,
		Status:      "available",
		SellerID:    claims.UserID,
		CollegeID:   claims.CollegeID,
	}

	result := db.DB.Create(&newListing)
	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to create listing")
		return
	}

	db.DB.Preload("Seller").First(&newListing, newListing.ID) // Preload for response

	respondWithJSON(w, http.StatusCreated, toListingResponse(newListing)) // Use helper
}

// GetListingByID returns a single listing (with college check)
func GetListingByID(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	vars := mux.Vars(r)
	listingID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid listing ID")
		return
	}

	var listing models.MarketplaceListing
	result := db.DB.
		Preload("Seller").
		Preload("Buyer"). // *** Preload Buyer info for detail view ***
		Where("id = ? AND college_id = ?", listingID, claims.CollegeID).
		First(&listing)

	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "Listing not found or access denied")
		return
	}

	respondWithJSON(w, http.StatusOK, toListingResponse(listing)) // Use helper
}

// GetMyListings returns all listings created by the authenticated user
func GetMyListings(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	var listings []models.MarketplaceListing
	result := db.DB.
		Preload("Seller").
		Preload("Buyer"). // *** Preload Buyer info ***
		Where("seller_id = ?", claims.UserID).
		Order("created_at DESC").
		Find(&listings)

	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch listings")
		return
	}

	var response []ListingResponse
	for _, listing := range listings {
		response = append(response, toListingResponse(listing)) // Use helper
	}

	respondWithJSON(w, http.StatusOK, response)
}

// DeleteListing allows a user to delete their own listing (if available or cancelled)
func DeleteListing(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	vars := mux.Vars(r)
	listingID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid listing ID")
		return
	}

	// Find listing and verify ownership and status (cannot delete if reserved or sold by seller)
	var listing models.MarketplaceListing
	result := db.DB.Where("id = ? AND seller_id = ?", listingID, claims.UserID).First(&listing)

	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "Listing not found or you don't own it")
		return
	}

	// *** ADD Status Check ***
	if listing.Status == "reserved" || listing.Status == "sold" {
		respondWithError(w, http.StatusForbidden, "Cannot delete a reserved or sold listing. Cancel the reservation first if applicable.")
		return
	}

	// Soft delete (or hard delete: db.DB.Unscoped().Delete(&listing))
	if err := db.DB.Delete(&listing).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to delete listing")
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{
		"message": "Listing deleted successfully",
	})
}

// *** UPDATED HANDLER: ReserveListing ***
func ReserveListing(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	vars := mux.Vars(r)
	listingID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid listing ID")
		return
	}

	// Use a transaction to prevent race conditions
	tx := db.DB.Begin()
	if tx.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Database error")
		return
	}
	// Defer rollback in case of panic
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r) // re-panic after rollback
		}
	}()

	// Find listing within the transaction, lock for update
	var listing models.MarketplaceListing
	result := tx.Set("gorm:query_option", "FOR UPDATE").
		// Preload("Seller"). // Preloading Seller here isn't strictly necessary, SellerID is on the listing
		Where("id = ? AND college_id = ?", listingID, claims.CollegeID).
		First(&listing)

	if result.Error != nil {
		tx.Rollback()
		respondWithError(w, http.StatusNotFound, "Listing not found or access denied")
		return
	}

	// Check current status
	if listing.Status != "available" {
		tx.Rollback()
		respondWithError(w, http.StatusConflict, "Listing is no longer available for reservation")
		return
	}

	// Check if user is trying to reserve their own item
	if listing.SellerID == claims.UserID {
		tx.Rollback()
		respondWithError(w, http.StatusBadRequest, "You cannot reserve your own listing")
		return
	}

	// Update listing status and buyer ID
	listing.Status = "reserved"
	listing.BuyerID = &claims.UserID // Assign buyer ID
	// expiryTime := time.Now().Add(24 * time.Hour) // Example: 24 hour reservation
	// listing.ReservedUntil = &expiryTime

	if err := tx.Save(&listing).Error; err != nil {
		tx.Rollback()
		respondWithError(w, http.StatusInternalServerError, "Failed to reserve listing")
		return
	}

	// *** NEW CHAT INTEGRATION LOGIC ***
	// After reserving, check if buyer and seller are already friends.
	// If not, create an "accepted" friendship to enable DM.
	buyerID := claims.UserID
	sellerID := listing.SellerID

	var existingFriendship models.Friendship
	// Check for friendship in either direction
	err = tx.Where("(user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
		buyerID, sellerID, sellerID, buyerID).
		First(&existingFriendship).Error

	if err != nil && err == gorm.ErrRecordNotFound {
		// No friendship exists, create one
		newFriendship := models.Friendship{
			UserID:    buyerID,          // Buyer
			FriendID:  sellerID,         // Seller
			Status:    "accepted",       // Auto-accept to enable chat
			CollegeID: claims.CollegeID, // Both are from the same college
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		if err := tx.Create(&newFriendship).Error; err != nil {
			// Don't fail the whole reservation, just log the error
			log.Printf("Warning: Failed to auto-create friendship for chat (ListingID: %d): %v", listing.ID, err)
		} else {
			log.Printf("Info: Auto-created friendship for chat (ListingID: %d) between Buyer %d and Seller %d", listing.ID, buyerID, sellerID)
		}
	} else if err != nil {
		// Database error checking for friendship, log it but don't fail reservation
		log.Printf("Warning: DB error checking friendship for chat (ListingID: %d): %v", listing.ID, err)
	}
	// If err == nil, a friendship (pending, accepted, rejected, blocked) already exists.
	// We'll assume any existing record is fine and chat will be available or handled by friend logic.
	// *** END NEW CHAT INTEGRATION LOGIC ***

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		// tx.Rollback() // Rollback is implicitly called by Commit() on error
		respondWithError(w, http.StatusInternalServerError, "Failed to finalize reservation")
		return
	}

	// Preload data for response after successful commit
	db.DB.Preload("Seller").Preload("Buyer").First(&listing, listing.ID)

	// Create the conversation ID for the frontend to use
	var conversationID string
	if buyerID < sellerID {
		conversationID = fmt.Sprintf("dm_%d_%d", buyerID, sellerID)
	} else {
		conversationID = fmt.Sprintf("dm_%d_%d", sellerID, buyerID)
	}

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message":        "Listing reserved successfully! You can now chat with the seller.",
		"listing":        toListingResponse(listing),
		"conversationId": conversationID, // *** Send back the conversation ID ***
	})
}

// *** NEW HANDLER: CancelReservation ***
func CancelReservation(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	vars := mux.Vars(r)
	listingID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid listing ID")
		return
	}

	var listing models.MarketplaceListing
	result := db.DB.Where("id = ? AND college_id = ?", listingID, claims.CollegeID).First(&listing)

	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "Listing not found or access denied")
		return
	}

	// Check if listing is actually reserved
	if listing.Status != "reserved" {
		respondWithError(w, http.StatusBadRequest, "Listing is not currently reserved")
		return
	}

	// Check if the current user is either the buyer or the seller
	isBuyer := listing.BuyerID != nil && *listing.BuyerID == claims.UserID
	isSeller := listing.SellerID == claims.UserID

	if !isBuyer && !isSeller {
		respondWithError(w, http.StatusForbidden, "You do not have permission to cancel this reservation")
		return
	}

	// Update listing status back to available and clear buyer info
	listing.Status = "available" // Or "cancelled" if you want to track
	listing.BuyerID = nil
	// listing.Buyer = nil // GORM might need help clearing relation, use Update columns
	listing.ReservedUntil = nil

	// Use Update columns to correctly set fields to NULL
	if err := db.DB.Model(&listing).Updates(map[string]interface{}{
		"status":         "available",
		"buyer_id":       nil,
		"reserved_until": nil,
	}).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to cancel reservation")
		return
	}

	// Preload data for response
	db.DB.Preload("Seller").First(&listing, listing.ID) // Buyer is now nil

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Reservation cancelled successfully.",
		"listing": toListingResponse(listing),
	})
}

// *** NEW HANDLER: MarkListingSold ***
func MarkListingSold(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	vars := mux.Vars(r)
	listingID, err := strconv.Atoi(vars["id"])
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid listing ID")
		return
	}

	var listing models.MarketplaceListing
	// Preload Buyer - might be needed even if just checking status
	result := db.DB.Preload("Buyer").Where("id = ? AND college_id = ?", listingID, claims.CollegeID).First(&listing)

	if result.Error != nil {
		respondWithError(w, http.StatusNotFound, "Listing not found or access denied")
		return
	}

	// Only the SELLER can mark as sold
	if listing.SellerID != claims.UserID {
		respondWithError(w, http.StatusForbidden, "Only the seller can mark this listing as sold")
		return
	}

	// *** CORRECTED CHECK: Can only mark as sold if it's currently RESERVED ***
	if listing.Status != "reserved" {
		respondWithError(w, http.StatusBadRequest, "Listing must be reserved by a buyer before it can be marked as sold")
		return
	}
	// *** END CORRECTION ***

	// Check if there actually is a buyer associated (should be true if reserved)
	if listing.BuyerID == nil {
		log.Printf("Error: Listing %d is reserved but has no BuyerID. Seller: %d", listing.ID, listing.SellerID)
		respondWithError(w, http.StatusInternalServerError, "Inconsistent reservation data. Cannot mark as sold.")
		return
	}

	// Update status to sold
	listing.Status = "sold"
	listing.ReservedUntil = nil // Clear reservation time if set

	if err := db.DB.Save(&listing).Error; err != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to mark listing as sold")
		return
	}

	// Preload data for response
	db.DB.Preload("Seller").Preload("Buyer").First(&listing, listing.ID)

	respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"message": "Listing marked as sold successfully.",
		"listing": toListingResponse(listing),
	})
}

// *** NEW HANDLER: GetMyReservations ***
// GetMyReservations returns all listings currently reserved by the authenticated user
func GetMyReservations(w http.ResponseWriter, r *http.Request) {
	claims, ok := utils.GetUserClaims(r)
	if !ok {
		respondWithError(w, http.StatusUnauthorized, "User claims not found")
		return
	}

	var listings []models.MarketplaceListing
	result := db.DB.
		Preload("Seller").                                               // Preload the Seller info
		Preload("Buyer").                                                // Preload our own info (Buyer)
		Where("buyer_id = ? AND status = ?", claims.UserID, "reserved"). // Find items reserved by this user
		Order("updated_at DESC").                                        // Show most recently reserved first
		Find(&listings)

	if result.Error != nil {
		respondWithError(w, http.StatusInternalServerError, "Failed to fetch reservations")
		return
	}

	var response []ListingResponse
	for _, listing := range listings {
		response = append(response, toListingResponse(listing)) // Use the helper
	}

	respondWithJSON(w, http.StatusOK, response) // Return as a flat array
}
