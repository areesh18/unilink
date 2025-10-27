import axios from 'axios';

// Assuming getAuthConfig is defined similarly to listings.js or use interceptors
const getAuthToken = () => {
    return localStorage.getItem('authToken');
};

const apiClient = axios.create({});

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

// Fetch current friends
export const fetchFriends = async () => {
    try {
        const config = getAuthConfig();
        const response = await apiClient.get('/api/friends', config);
        return response.data.friends || []; // Return friends array
    } catch (error) {
        console.error("Error fetching friends:", error);
        throw error.response?.data?.error || error.message || 'Failed to fetch friends';
    }
};

// Fetch pending incoming friend requests
export const fetchPendingRequests = async () => {
    try {
        const config = getAuthConfig();
        const response = await apiClient.get('/api/friends/requests/pending', config);
        return response.data.requests || []; // Return requests array
    } catch (error) {
        console.error("Error fetching pending requests:", error);
        throw error.response?.data?.error || error.message || 'Failed to fetch pending requests';
    }
};

// Accept a friend request
export const acceptFriendRequest = async (friendshipId) => {
    try {
        const config = getAuthConfig();
        const response = await apiClient.post(`/api/friends/accept/${friendshipId}`, {}, config); // Empty body for POST
        return response.data; // { message: "..." }
    } catch (error) {
        console.error(`Error accepting request ${friendshipId}:`, error);
        throw error.response?.data?.error || error.message || 'Failed to accept friend request';
    }
};

// Reject a friend request
export const rejectFriendRequest = async (friendshipId) => {
    try {
        const config = getAuthConfig();
        const response = await apiClient.post(`/api/friends/reject/${friendshipId}`, {}, config); // Empty body for POST
        return response.data; // { message: "..." }
    } catch (error) {
        console.error(`Error rejecting request ${friendshipId}:`, error);
        throw error.response?.data?.error || error.message || 'Failed to reject friend request';
    }
};

// Remove a friend
export const removeFriend = async (friendUserId) => {
    try {
        const config = getAuthConfig();
        const response = await apiClient.delete(`/api/friends/${friendUserId}`, config);
        return response.data; // { message: "..." }
    } catch (error) {
        console.error(`Error removing friend ${friendUserId}:`, error);
        throw error.response?.data?.error || error.message || 'Failed to remove friend';
    }
};

// Fetch friend suggestions
export const fetchFriendSuggestions = async () => {
    try {
        const config = getAuthConfig();
        const response = await apiClient.get('/api/friends/suggestions', config);
        return response.data.suggestions || []; // Return suggestions array
    } catch (error) {
        console.error("Error fetching suggestions:", error);
        throw error.response?.data?.error || error.message || 'Failed to fetch suggestions';
    }
};

// Send a friend request
export const sendFriendRequest = async (friendUserId) => {
    try {
        const config = getAuthConfig();
        const response = await apiClient.post('/api/friends/request', { friendId: friendUserId }, config);
        return response.data; // { message: "..." }
    } catch (error) {
        console.error(`Error sending friend request to ${friendUserId}:`, error);
        throw error.response?.data?.error || error.message || 'Failed to send friend request';
    }
};