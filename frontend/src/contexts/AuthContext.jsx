/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useState, useEffect, useRef, useCallback } from 'react'; // Added useRef, useCallback
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loginAdminApi } from '../api/admin';

// Create the context AND EXPORT IT
export const AuthContext = createContext(null);

// API call function
const loginUserApi = async (studentId, password) => {
  const response = await axios.post('/api/login', {
    studentId,
    password,
  });
  return response.data;
};

// --- WebSocket URL ---
// Use environment variable or default. Ensure protocol is ws:// or wss://
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'; // Adjust if backend runs elsewhere

// Create the provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // --- WebSocket State ---
  const [ws, setWs] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null); // Ref to hold the WebSocket instance
  const reconnectTimeoutRef = useRef(null); // Ref for reconnection timer
  // --- End WebSocket State ---

  // --- Message Handlers State ---
  // Store callbacks registered by components (ChatPage, FeedPage, etc.)
  const messageListenersRef = useRef(new Set());
  // --- End Message Handlers State ---


  // --- Function to add a message listener ---
  const addWsMessageListener = useCallback((listener) => {
    messageListenersRef.current.add(listener);
    return () => { // Return a function to remove the listener
      messageListenersRef.current.delete(listener);
    };
  }, []);
  // --- End Function to add a message listener ---

  // --- WebSocket Connection Logic ---
  const connectWebSocket = useCallback((authToken) => {
    if (!authToken || wsRef.current) {
      console.log("WebSocket connect aborted: No token or already connected/connecting.");
      return; // Don't connect without token or if already connected
    }
    console.log('Attempting WebSocket connection...');

    const socket = new WebSocket(`${WS_URL}?token=${authToken}`);
    wsRef.current = socket; // Store instance in ref immediately

    socket.onopen = () => {
      console.log('WebSocket Connected');
      setWsConnected(true);
      setWs(socket); // Update state once connected
      // Clear any reconnect timer on successful connection
      if (reconnectTimeoutRef.current) {
         clearTimeout(reconnectTimeoutRef.current);
         reconnectTimeoutRef.current = null;
      }
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', message);
        // --- Notify all registered listeners ---
        messageListenersRef.current.forEach(listener => listener(message));
        // --- End Notify listeners ---
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
      // Error often precedes close. Close handler will manage state.
    };

    socket.onclose = (event) => {
      console.log(`WebSocket Disconnected: Code=${event.code}, Reason=${event.reason}`);
      setWsConnected(false);
      setWs(null);
      wsRef.current = null; // Clear ref on close

      // Simple Reconnection Logic (Retry after 5 seconds if not a clean logout)
      // Avoid reconnect if event.code is 1000 (Normal Closure) or if token is gone
      if (event.code !== 1000 && localStorage.getItem('authToken')) {
          console.log('Attempting WebSocket reconnection in 5 seconds...');
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current); // Clear existing timer
          reconnectTimeoutRef.current = setTimeout(() => {
              connectWebSocket(localStorage.getItem('authToken')); // Retry with current token
          }, 5000);
      }
    };

  }, []); // Empty dependency array, relies on passed token

  const disconnectWebSocket = useCallback(() => {
      if (reconnectTimeoutRef.current) {
         clearTimeout(reconnectTimeoutRef.current); // Stop trying to reconnect
         reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        console.log('Closing WebSocket connection...');
        wsRef.current.close(1000); // Send normal closure code
        wsRef.current = null;
      }
      setWsConnected(false);
      setWs(null);
  }, []);
  // --- End WebSocket Connection Logic ---


  // Load initial state from localStorage
  useEffect(() => {
    let initialToken = null;
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('userData');

      if (storedToken && storedUser) {
        initialToken = storedToken; // Capture token for WS connect
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load auth state from localStorage", error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    } finally {
      setIsLoading(false);
      // --- Connect WebSocket after initial auth load ---
      if (initialToken) {
          connectWebSocket(initialToken);
      }
      // --- End Connect WebSocket ---
    }
    // Cleanup on unmount
    return () => disconnectWebSocket();
  }, [connectWebSocket, disconnectWebSocket]); // Include WS functions in dependency array


  // Login function (modified to connect WebSocket)
  const login = async (credentials, loginType = 'student') => {
    let data;
    // ... (existing login API call logic) ...
    if (loginType === 'admin') {
      if (!credentials.email || !credentials.password) {
        throw new Error('Admin login requires email and password.');
      }
      data = await loginAdminApi(credentials.email, credentials.password);
    } else {
      if (!credentials.studentId || !credentials.password) {
          throw new Error('Student login requires studentId and password.');
      }
      data = await loginUserApi(credentials.studentId, credentials.password);
    }


    // Set state and local storage
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userData', JSON.stringify(data.user));

    // --- Connect WebSocket AFTER successful login ---
    disconnectWebSocket(); // Disconnect any previous session first
    connectWebSocket(data.token);
    // --- End Connect WebSocket ---


    // Navigate based on role
    if (data.user.role === 'college_admin' || data.user.role === 'platform_admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  // Logout function (modified to disconnect WebSocket)
  const logout = () => {
    // --- Disconnect WebSocket BEFORE clearing auth state ---
    disconnectWebSocket();
    // --- End Disconnect WebSocket ---

    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  // updateUserContext (remains the same)
  const updateUserContext = (newUserData) => {
    // ... (existing logic) ...
     if (newUserData) {
        setUser(newUserData);
        localStorage.setItem('userData', JSON.stringify(newUserData));
        console.log("AuthContext user updated:", newUserData);
    } else {
        console.error("Attempted to update user context with invalid data");
    }
  };

  // Context value (add WebSocket related items)
  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    updateUserContext,
    // --- Expose WebSocket context ---
    ws,             // The WebSocket instance (can be null)
    wsConnected,    // Boolean status
    addWsMessageListener // Function for components to subscribe
    // --- End Expose WebSocket context ---
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading ? children : <div>Loading App...</div>}
    </AuthContext.Provider>
  );
};