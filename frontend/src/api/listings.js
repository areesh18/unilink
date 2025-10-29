import axios from "axios";

// Function to get the auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

// Create an axios instance
const apiClient = axios.create({
  // baseURL: '/api', // Can set base URL if preferred over proxy
});

// Function to automatically add the auth header
const getAuthConfig = () => {
  const token = getAuthToken();
  if (!token) {
    // Redirect to login or handle appropriately if no token
    console.error("Authentication token not found.");
    // For now, throw error, but you might want to navigate to login
    throw new Error("Authentication token not found. Please log in.");
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Function to fetch all marketplace listings (only 'available' ones)
export const fetchListings = async () => {
  try {
    const config = getAuthConfig(); // Get headers with token
    const response = await apiClient.get("/api/listings", config); // Pass config
    return response.data; // Returns the array of listings
  } catch (error) {
    console.error("Error fetching listings:", error);
    throw (
      error.response?.data?.error || error.message || "Failed to fetch listings"
    );
  }
};

// *** ADDED/VERIFIED THIS FUNCTION ***
// Function to fetch listings created by the current user
export const fetchMyListings = async () => {
  try {
    const config = getAuthConfig();
    const response = await apiClient.get("/api/listings/my", config);
    // Backend returns array of ListingResponse objects (including reserved/sold)
    return response.data; 
  } catch (error)
  {
    console.error("Error fetching my listings:", error);
    throw (
      error.response?.data?.error || error.message || "Failed to fetch my listings"
    );
  }
};
// *** END ADDED/VERIFIED FUNCTION ***


export const createListing = async (listingData) => {
  // listingData should be { title, description, price, imageUrl }
  try {
    const config = getAuthConfig();
    const response = await apiClient.post("/api/listings", listingData, config);
    return response.data; // Returns the newly created listing object
  } catch (error) {
    console.error("Error creating listing:", error);
    throw (
      error.response?.data?.error || error.message || "Failed to create listing"
    );
  }
};

export const getListingById = async (id) => {
  try {
    const config = getAuthConfig();
    const response = await apiClient.get(`/api/listings/${id}`, config);
    return response.data; // Returns the single listing object
  } catch (error) {
    console.error(`Error fetching listing ${id}:`, error);
    throw (
      error.response?.data?.error ||
      error.message ||
      "Failed to fetch listing details"
    );
  }
};

export const deleteListing = async (id) => {
  try {
    const config = getAuthConfig();
    const response = await apiClient.delete(`/api/listings/${id}`, config);
    return response.data; // Returns { message: "..." }
  } catch (error) {
    console.error(`Error deleting listing ${id}:`, error);
    throw (
      error.response?.data?.error || error.message || "Failed to delete listing"
    );
  }
};

// *** NEW API FUNCTIONS (from previous step) ***

// Reserve a listing
export const reserveListing = async (id) => {
    try {
        const config = getAuthConfig();
        // Send POST request, empty body {} might be needed if API expects JSON
        const response = await apiClient.post(`/api/listings/${id}/reserve`, {}, config);
        // Backend returns { message: "...", listing: {...} }
        return response.data;
    } catch (error) {
        console.error(`Error reserving listing ${id}:`, error);
        throw (
            error.response?.data?.error || error.message || "Failed to reserve listing"
        );
    }
};

// Cancel a reservation (by buyer or seller)
export const cancelReservation = async (id) => {
    try {
        const config = getAuthConfig();
        const response = await apiClient.post(`/api/listings/${id}/cancel-reservation`, {}, config);
        // Backend returns { message: "...", listing: {...} }
        return response.data;
    } catch (error) {
        console.error(`Error cancelling reservation for listing ${id}:`, error);
        throw (
            error.response?.data?.error || error.message || "Failed to cancel reservation"
        );
    }
};

// Mark a listing as sold (by seller)
export const markListingSold = async (id) => {
    try {
        const config = getAuthConfig();
        const response = await apiClient.post(`/api/listings/${id}/mark-sold`, {}, config);
        // Backend returns { message: "...", listing: {...} }
        return response.data;
    } catch (error) {
        console.error(`Error marking listing ${id} as sold:`, error);
        throw (
            error.response?.data?.error || error.message || "Failed to mark listing as sold"
        );
    }
};

// Fetch all listings reserved by the current user
export const fetchMyReservations = async () => {
    try {
        const config = getAuthConfig();
        const response = await apiClient.get("/api/listings/my-reservations", config);
        // Backend returns a flat array of ListingResponse objects
        return response.data || []; 
    } catch (error) {
        console.error("Error fetching my reservations:", error);
        throw (
            error.response?.data?.error || error.message || "Failed to fetch reservations"
        );
    }
};