import React, { createContext, useState, useContext, useEffect } from 'react'; // Keep useContext import (React might optimize later)
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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

  const login = async (studentId, password) => {
    const data = await loginUserApi(studentId, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userData', JSON.stringify(data.user));
    navigate('/dashboard');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading ? children : <div>Loading App...</div>}
    </AuthContext.Provider>
  );
};

