// frontend/src/contexts/AuthContext.jsx
/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loginAdminApi } from '../api/admin';
import { fetchConversations } from '../api/messages'; // Keep import

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
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';

// Create the provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // --- WebSocket State ---
  const [ws, setWs] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  // --- End WebSocket State ---

  // --- Message Handlers State ---
  const messageListenersRef = useRef(new Set());
  // --- End Message Handlers State ---

  // --- Notification State ---
  const [notifications, setNotifications] = useState([]);
  // --- End Notification State ---

  // --- Unread Count State ---
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  // --- End Unread Count State ---

  // --- Unread Announcements State ---
  const [hasUnreadAnnouncements, setHasUnreadAnnouncements] = useState(false);
  // --- End Unread Announcements State ---

  // Ref to store the current user ID
  const currentUserIdRef = useRef(null);
  useEffect(() => {
    currentUserIdRef.current = user?.id;
  }, [user]);


  // --- Function to add a message listener ---
  const addWsMessageListener = useCallback((listener) => {
    messageListenersRef.current.add(listener);
    return () => {
      messageListenersRef.current.delete(listener);
    };
  }, []);
  // --- End Function to add a message listener ---

  // --- Function to remove a notification ---
  const removeNotification = useCallback((id) => {
    setNotifications((prevNotifications) =>
      prevNotifications.filter((n) => n.id !== id)
    );
  }, []);
  // --- End Function to remove a notification ---

  // --- Function to mark announcements as read ---
  const markAnnouncementsRead = useCallback(() => {
    // +++ ADD LOGGING HERE +++
    console.log("AuthContext: markAnnouncementsRead called, setting hasUnreadAnnouncements to false");
    setHasUnreadAnnouncements(false);
  }, []);
  // --- End Function to mark announcements as read ---


  // --- WebSocket Connection Logic ---
  const connectWebSocket = useCallback((authToken) => {
    if (!authToken || wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log(`WebSocket connect aborted: No token or already ${wsRef.current?.readyState === WebSocket.OPEN ? 'connected' : 'connecting'}.`);
      return;
    }
    console.log('Attempting WebSocket connection...');

    if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        if (wsRef.current.readyState !== WebSocket.CLOSED) {
            wsRef.current.close();
        }
    }

    const socket = new WebSocket(`${WS_URL}?token=${authToken}`);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket Connected');
      setWsConnected(true);
      setWs(socket);
      if (reconnectTimeoutRef.current) {
         clearTimeout(reconnectTimeoutRef.current);
         reconnectTimeoutRef.current = null;
      }
    };

    socket.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            console.log('WebSocket message received:', message);

            const currentUserId = currentUserIdRef.current;
            const senderId = message.payload?.sender?.id;
            console.log(`WS Message Check: currentUserId=${currentUserId}, senderId=${senderId}, type=${message.type}`);
            const isValidSenderId = typeof senderId === 'number';
            const isValidCurrentUserId = typeof currentUserId === 'number';

            // --- Handle Notifications ---
            if (message.type === 'newMessage' && isValidSenderId && isValidCurrentUserId && senderId !== currentUserId) {
                const messageId = message.payload?.id;
                // Use functional update to get latest notifications state for check
                setNotifications((prevNots) => {
                    const notificationExists = prevNots.some(n => n.messageId === messageId);
                    if (!notificationExists) {
                        console.log(`Adding 'newMessage' notification for msg ID ${messageId}`);
                        const newNotification = {
                            id: Date.now() + Math.random(), messageId: messageId, type: 'message',
                            message: `New message from ${message.payload.sender.name || 'someone'}`,
                        };
                        setTotalUnreadCount(prevCount => prevCount + 1); // Increment count here
                        return [newNotification, ...prevNots].slice(0, 5);
                    } else {
                        console.log(`Duplicate 'newMessage' notification skipped for msg ID ${messageId}`);
                        return prevNots; // Return previous state if duplicate
                    }
                });

            } else if (message.type === 'newAnnouncement') {
                 const announcementId = message.payload?.id;
                 // Use functional update
                 setNotifications((prevNots) => {
                    const notificationExists = prevNots.some(n => n.announcementId === announcementId);
                     if (!notificationExists) {
                        console.log(`Adding 'newAnnouncement' notification for ann ID ${announcementId}`);
                        const newNotification = {
                            id: Date.now() + Math.random(), announcementId: announcementId, type: 'announcement',
                            message: `New Announcement: ${message.payload.title || 'Check the feed!'}`,
                        };
                        // --- Set unread announcement flag ---
                        setHasUnreadAnnouncements(true);
                        // +++ ADD LOGGING HERE +++
                        console.log("AuthContext: setHasUnreadAnnouncements called with true");
                        return [newNotification, ...prevNots].slice(0, 5);
                     } else {
                        console.log(`Duplicate 'newAnnouncement' notification skipped for ann ID ${announcementId}`);
                        return prevNots; // Return previous state if duplicate
                     }
                 });
            } else if (message.type === 'newMessage' && senderId === currentUserId) {
                console.log("WS Message is from self, skipping notification.");
            }
            // --- End Handle Notifications ---

            // --- Notify component listeners ---
            messageListenersRef.current.forEach(listener => listener(message));
            // --- End Notify listeners ---
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }; // --- End of onmessage assignment ---

    socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    socket.onclose = (event) => {
      console.log(`WebSocket Disconnected: Code=${event.code}, Reason=${event.reason}`);
      setWsConnected(false);
      setWs(null);
      wsRef.current = null;

      if (event.code !== 1000 && localStorage.getItem('authToken')) {
          console.log('Attempting WebSocket reconnection in 5 seconds...');
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
              const currentToken = localStorage.getItem('authToken');
              if (currentToken) {
                connectWebSocket(currentToken);
              } else {
                console.log("WebSocket reconnect aborted: No auth token found after delay.");
              }
          }, 5000);
      }
    };
  // Removed notifications from dependency array to prevent potential loops if setNotifications triggers reconnect
  // removeNotification is stable due to useCallback
  }, [removeNotification]); // <-- Corrected Dependency Array

  const disconnectWebSocket = useCallback(() => {
      if (reconnectTimeoutRef.current) {
         clearTimeout(reconnectTimeoutRef.current);
         reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        console.log('Closing WebSocket connection...');
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        if (wsRef.current.readyState !== WebSocket.CLOSED && wsRef.current.readyState !== WebSocket.CLOSING) {
             wsRef.current.close(1000);
        }
        wsRef.current = null;
      }
      setWsConnected(false);
      setWs(null);
  }, []);
  // --- End WebSocket Connection Logic ---

  // --- Function to fetch and update total unread count ---
  const fetchAndUpdateUnreadCount = useCallback(async () => {
    if (!localStorage.getItem('authToken')) {
        setTotalUnreadCount(0);
        return;
    }
    console.log("Attempting to fetch and update unread count...");
    try {
      const conversationsData = await fetchConversations();
      const totalCount = conversationsData.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      console.log("Total unread count calculated:", totalCount);
      setTotalUnreadCount(totalCount);
    } catch (error) {
      console.error("Failed to fetch conversations for unread count:", error);
    }
  }, []);
  // --- End Unread Count Function ---


  // Load initial state from localStorage
  useEffect(() => {
    let initialToken = null;
    let initialUser = null;
    try {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('userData');

      if (storedToken && storedUser) {
        initialToken = storedToken;
        initialUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(initialUser);
        currentUserIdRef.current = initialUser?.id;
      }
    } catch (error) {
      console.error("Failed to load auth state from localStorage", error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    } finally {
      setIsLoading(false);
      if (initialToken && initialUser) {
          connectWebSocket(initialToken);
          fetchAndUpdateUnreadCount();
      } else {
          setTotalUnreadCount(0);
      }
    }
    return () => disconnectWebSocket();
  }, [connectWebSocket, disconnectWebSocket, fetchAndUpdateUnreadCount]);


  // Login function
  const login = async (credentials, loginType = 'student') => {
    let data;
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

    setToken(data.token);
    setUser(data.user);
    currentUserIdRef.current = data.user?.id;
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userData', JSON.stringify(data.user));

    disconnectWebSocket();
    connectWebSocket(data.token);
    fetchAndUpdateUnreadCount();


    if (data.user.role === 'college_admin' || data.user.role === 'platform_admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  // Logout function
  const logout = () => {
    disconnectWebSocket();

    setUser(null);
    setToken(null);
    currentUserIdRef.current = null;
    setNotifications([]);
    setTotalUnreadCount(0);
    setHasUnreadAnnouncements(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  // updateUserContext
  const updateUserContext = (newUserData) => {
     if (newUserData) {
        setUser(newUserData);
        currentUserIdRef.current = newUserData?.id;
        localStorage.setItem('userData', JSON.stringify(newUserData));
        console.log("AuthContext user updated:", newUserData);
    } else {
        console.error("Attempted to update user context with invalid data");
    }
  };

  // Context value
  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    updateUserContext,
    // --- WebSocket context ---
    ws,
    wsConnected,
    addWsMessageListener,
    // --- Notification Context ---
    notifications,
    removeNotification,
    // --- Unread Count Context ---
    totalUnreadCount,
    fetchAndUpdateUnreadCount,
    // --- Unread Announcements Context ---
    hasUnreadAnnouncements,
    markAnnouncementsRead,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading ? children : <div>Loading App...</div>}
    </AuthContext.Provider>
  );
};