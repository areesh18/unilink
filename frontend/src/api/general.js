// frontend/src/api/general.js (New File)
import axios from 'axios';

const getAuthToken = () => localStorage.getItem('authToken');

const getAuthConfig = () => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication token not found.');
    return { headers: { Authorization: `Bearer ${token}` } };
};

// Fetches a list of unique departments within the user's college.
export const fetchCollegeDepartments = async () => {
    try {
        const config = getAuthConfig();
        // Endpoint: GET /api/departments
        const response = await axios.get('/api/departments', config);
        // The backend returns { departments: [...] }
        return response.data.departments || [];
    } catch (error) {
        console.error("Error fetching college departments:", error);
        throw error.response?.data?.error || error.message || 'Failed to fetch departments';
    }
};