import axios from 'axios';

// Assuming getAuthConfig is defined or use interceptors
const getAuthToken = () => localStorage.getItem('authToken');
const apiClient = axios.create({});
const getAuthConfig = () => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication token not found.');
    return { headers: { Authorization: `Bearer ${token}` } };
};

// Fetch the logged-in user's profile
export const fetchMyProfile = async () => {
    try {
        const config = getAuthConfig();
        const response = await apiClient.get('/api/profile/me', config);
        return response.data; // ProfileResponse object
    } catch (error) {
        console.error("Error fetching my profile:", error);
        throw error.response?.data?.error || error.message || 'Failed to fetch profile';
    }
};

// Fetch another user's profile by ID
export const fetchUserProfile = async (userId) => {
    try {
        const config = getAuthConfig();
        const response = await apiClient.get(`/api/profile/${userId}`, config);
        return response.data; // ProfileResponse object
    } catch (error) {
        console.error(`Error fetching profile for user ${userId}:`, error);
        throw error.response?.data?.error || error.message || 'Failed to fetch user profile';
    }
};

// Update the logged-in user's profile
export const updateMyProfile = async (profileData) => {
    // profileData should be { profilePicture, bio, isPublic }
    try {
        const config = getAuthConfig();
        const response = await apiClient.put('/api/profile/me', profileData, config);
        return response.data; // { message: "...", profile: ProfileResponse }
    } catch (error) {
        console.error("Error updating profile:", error);
        throw error.response?.data?.error || error.message || 'Failed to update profile';
    }
};

// Search for users within the college directory
export const searchUsers = async (query) => {
    if (!query || query.trim() === '') {
        return []; // Return empty array if query is empty
    }
    try {
        const config = getAuthConfig();
        // Encode the query parameter properly
        const response = await apiClient.get(`/api/directory?q=${encodeURIComponent(query)}`, config);
        // Backend returns { total: ..., students: [...] }
        return response.data.students || []; // Return students array
    } catch (error) {
        console.error("Error searching users:", error);
        throw error.response?.data?.error || error.message || 'Failed to search users';
    }
};