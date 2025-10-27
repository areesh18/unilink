// frontend/src/api/admin.js (New File)
import axios from 'axios';

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

// Add other admin-related API calls here later