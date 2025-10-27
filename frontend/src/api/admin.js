// frontend/src/api/admin.js (New File)
import axios from 'axios';

const getAuthToken = () => localStorage.getItem('authToken');
// Function to automatically add the auth header
const getAuthConfig = () => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication token not found.');
    return { headers: { Authorization: `Bearer ${token}` } };
};
// API call function for admin login
export const loginAdminApi = async (email, password) => {
  try {
    // Uses the relative path '/api/admin/login', relying on the Vite proxy
    const response = await axios.post('/api/admin/login', {
      email,
      password,
    });
    // Axios throws an error for non-2xx responses automatically
    return response.data; // Returns { token: "...", user: {...} } on success
  } catch (error) {
    console.error("Admin login error:", error);
    // Rethrow a user-friendly error message
    throw error.response?.data?.error || error.message || 'Admin login failed';
  }
};
// Fetch all announcements for the admin's college
export const fetchAdminAnnouncements = async () => {
    try {
        const config = getAuthConfig();
        // Endpoint: GET /api/college-admin/announcements
        const response = await axios.get('/api/college-admin/announcements', config);
        return response.data.announcements || []; // Returns array of AnnouncementResponse
    } catch (error) {
        console.error("Error fetching admin announcements:", error);
        throw error.response?.data?.error || error.message || 'Failed to fetch announcements';
    }
};

// Create a new announcement
export const createAnnouncement = async (announcementData) => {
    // announcementData: { title, content, priority, department (optional string), semester (optional int) }
    try {
        const config = getAuthConfig();
        // Endpoint: POST /api/college-admin/announcements
        const response = await axios.post('/api/college-admin/announcements', announcementData, config);
        return response.data; // Returns { message: "...", announcement: {...} }
    } catch (error) {
        console.error("Error creating announcement:", error);
        throw error.response?.data?.error || error.message || 'Failed to create announcement';
    }
};

// Delete an announcement
export const deleteAnnouncement = async (announcementId) => {
    try {
        const config = getAuthConfig();
        // Endpoint: DELETE /api/college-admin/announcements/{id}
        const response = await axios.delete(`/api/college-admin/announcements/${announcementId}`, config);
        return response.data; // Returns { message: "..." }
    } catch (error) {
        console.error(`Error deleting announcement ${announcementId}:`, error);
        throw error.response?.data?.error || error.message || 'Failed to delete announcement';
    }
};
// Fetch all student users from the admin's college
export const fetchCollegeStudents = async () => {
    try {
        const config = getAuthConfig();
        // Endpoint: GET /api/college-admin/students
        const response = await axios.get('/api/college-admin/students', config);
        // The backend returns an array of objects like:
        // { id, name, email, studentId, createdAt }
        return response.data || [];
    } catch (error) {
        console.error("Error fetching college students:", error);
        throw error.response?.data?.error || error.message || 'Failed to fetch college students';
    }
};

// Fetch all marketplace listings from the admin's college
export const fetchCollegeListings = async () => {
    try {
        const config = getAuthConfig();
        // Endpoint: GET /api/college-admin/listings
        const response = await axios.get('/api/college-admin/listings', config);
        // The backend returns an array of ListingResponse objects
        return response.data || [];
    } catch (error) {
        console.error("Error fetching college listings:", error);
        throw error.response?.data?.error || error.message || 'Failed to fetch college listings';
    }
};

// Delete a marketplace listing from the admin's college
export const deleteCollegeListing = async (listingId) => {
    try {
        const config = getAuthConfig();
        // Endpoint: DELETE /api/college-admin/listings/{id}
        const response = await axios.delete(`/api/college-admin/listings/${listingId}`, config);
        return response.data; // { message: "..." }
    } catch (error) {
        console.error(`Error deleting listing ${listingId}:`, error);
        throw error.response?.data?.error || error.message || 'Failed to delete listing';
    }
};
// Add other admin-related API calls here later