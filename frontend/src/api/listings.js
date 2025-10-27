import axios from "axios";

// Function to get the auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem("authToken");
};

// Create an axios instance (optional but good practice)
// You can configure base URL and interceptors here later if needed
const apiClient = axios.create({
  // baseURL: '/api', // Can set base URL if preferred over proxy
});
// Function to automatically add the auth header
const getAuthConfig = () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication token not found.");
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};
// Function to fetch all marketplace listings
export const fetchListings = async () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication token not found.");
  }

  try {
    const response = await apiClient.get("/api/listings", {
      headers: {
        Authorization: `Bearer ${token}`, // Add the Authorization header
      },
    });
    return response.data; // Returns the array of listings
  } catch (error) {
    console.error("Error fetching listings:", error);
    // Rethrow or handle error appropriately
    throw (
      error.response?.data?.error || error.message || "Failed to fetch listings"
    );
  }
};
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
// Add functions for creating, getting by ID, deleting listings later
// export const createListing = async (listingData) => { ... };
// export const getListingById = async (id) => { ... };
