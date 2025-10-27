// frontend/src/api/groups.js
import axios from 'axios';

const getAuthToken = () => localStorage.getItem('authToken');
const apiClient = axios.create({});

const getAuthConfig = () => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication token not found.');
    return { headers: { Authorization: `Bearer ${token}` } };
};

// Fetch groups the user is a member of
export const fetchMyGroups = async () => {
    try {
        const config = getAuthConfig();
        const response = await apiClient.get('/api/groups/my', config);
        return response.data.groups || [];
    } catch (error) {
        console.error("Error fetching my groups:", error);
        throw error.response?.data?.error || error.message || 'Failed to fetch groups';
    }
};

// Fetch all public groups (clubs) in the college
export const fetchPublicGroups = async () => {
    try {
        const config = getAuthConfig();
        const response = await apiClient.get('/api/groups/public', config);
        return response.data.groups || [];
    } catch (error) {
        console.error("Error fetching public groups:", error);
        throw error.response?.data?.error || error.message || 'Failed to fetch public groups';
    }
};

// Fetch detailed info about a specific group
export const fetchGroupDetail = async (groupId) => {
    try {
        const config = getAuthConfig();
        const response = await apiClient.get(`/api/groups/${groupId}`, config);
        return response.data;
    } catch (error) {
        console.error(`Error fetching group ${groupId}:`, error);
        throw error.response?.data?.error || error.message || 'Failed to fetch group details';
    }
};

// Join a public group
export const joinGroup = async (groupId) => {
    try {
        const config = getAuthConfig();
        const response = await apiClient.post(`/api/groups/${groupId}/join`, {}, config);
        return response.data;
    } catch (error) {
        console.error(`Error joining group ${groupId}:`, error);
        throw error.response?.data?.error || error.message || 'Failed to join group';
    }
};

// Leave a public group
export const leaveGroup = async (groupId) => {
    try {
        const config = getAuthConfig();
        const response = await apiClient.post(`/api/groups/${groupId}/leave`, {}, config);
        return response.data;
    } catch (error) {
        console.error(`Error leaving group ${groupId}:`, error);
        throw error.response?.data?.error || error.message || 'Failed to leave group';
    }
};