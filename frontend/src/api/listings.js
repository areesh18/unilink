import axios from 'axios';

// Function to get the auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('authToken');
};

// Create an axios instance (optional but good practice)
// You can configure base URL and interceptors here later if needed
const apiClient = axios.create({
    // baseURL: '/api', // Can set base URL if preferred over proxy
});

// Function to fetch all marketplace listings
export const fetchListings = async () => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('Authentication token not found.');
    }

    try {
        const response = await apiClient.get('/api/listings', {
            headers: {
                Authorization: `Bearer ${token}` // Add the Authorization header
            }
        });
        return response.data; // Returns the array of listings
    } catch (error) {
        console.error("Error fetching listings:", error);
        // Rethrow or handle error appropriately
        throw error.response?.data?.error || error.message || 'Failed to fetch listings';
    }
};

// Add functions for creating, getting by ID, deleting listings later
// export const createListing = async (listingData) => { ... };
// export const getListingById = async (id) => { ... };