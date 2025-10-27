/* eslint-disable react-refresh/only-export-components */ 

import React, { createContext, useState, useEffect } from 'react'; // Keep useContext import (React might optimize later)
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loginAdminApi } from '../api/admin';
// Create the context AND EXPORT IT
export const AuthContext = createContext(null); // <-- Add export here

// API call function
const loginUserApi = async (studentId, password) => {
  const response = await axios.post('/api/login', {
    studentId,
    password,
  });
  return response.data;
};

// Create the provider component (remains the same)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('userData');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load auth state from localStorage", error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials, loginType = 'student') => {
    let data;
    if (loginType === 'admin') {
      // Admin Login
      if (!credentials.email || !credentials.password) {
        throw new Error('Admin login requires email and password.');
      }
      data = await loginAdminApi(credentials.email, credentials.password);
    } else {
      // Student Login (default)
      if (!credentials.studentId || !credentials.password) {
          throw new Error('Student login requires studentId and password.');
      }
      data = await loginUserApi(credentials.studentId, credentials.password);
    }

    // Set state and local storage (common for both)
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userData', JSON.stringify(data.user));

    // Navigate based on role
    if (data.user.role === 'college_admin' || data.user.role === 'platform_admin') {
      navigate('/admin/dashboard'); // Navigate admins to admin dashboard
    } else {
      navigate('/dashboard'); // Navigate students to student dashboard
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    navigate('/login');
  };
  // Function to update user data in context and localStorage
  const updateUserContext = (newUserData) => {
    if (newUserData) {
        setUser(newUserData);
        localStorage.setItem('userData', JSON.stringify(newUserData));
        console.log("AuthContext user updated:", newUserData);
    } else {
        console.error("Attempted to update user context with invalid data");
    }
  };
  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    updateUserContext,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading ? children : <div>Loading App...</div>}
    </AuthContext.Provider>
  );
};

