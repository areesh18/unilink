import axios from 'axios';

// Re-use or import token logic if needed, or use interceptors
const getAuthToken = () => {
    return localStorage.getItem('authToken');
};

const apiClient = axios.create({
    // baseURL: '/api', // If you prefer
});

const getAuthConfig = () => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('Authentication token not found.');
    }
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

// Function to fetch the student's announcement feed
export const fetchFeed = async () => {
    try {
        const config = getAuthConfig();
        const response = await apiClient.get('/api/feed', config);
        // The backend returns { total: ..., announcements: [...] }
        // Let's just return the array part for simplicity in the component
        return response.data.announcements || []; // Return announcements array or empty array
    } catch (error) {
        console.error("Error fetching feed:", error);
        throw error.response?.data?.error || error.message || 'Failed to fetch feed';
    }
};

// Add functions for admin actions later if needed
// export const createAnnouncement = async (data) => { ... };