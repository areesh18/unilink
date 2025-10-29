// frontend/src/contexts/AuthContext.jsx
/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loginAdminApi } from '../api/admin';
import { fetchConversations } from '../api/messages';
import { fetchPendingRequests } from '../api/friends'; // Import API to fetch requests count

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

  // --- Friend Request Count State --- // <-- NEW
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  // --- End Friend Request Count State --- // <-- NEW

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
    console.log("AuthContext: markAnnouncementsRead called, setting hasUnreadAnnouncements to false");
    setHasUnreadAnnouncements(false);
  }, []);
  // --- End Function to mark announcements as read ---

  // --- Function to fetch and update friend request count --- // <-- NEW
  const fetchAndUpdateRequestCount = useCallback(async () => {
    if (!localStorage.getItem('authToken')) {
      setPendingRequestCount(0);
      return;
    }
    console.log("Attempting to fetch and update friend request count...");
    try {
      // Assuming fetchPendingRequests returns an array of request objects
      const requestsData = await fetchPendingRequests();
      const count = requestsData.length;
      console.log("Pending friend request count calculated:", count);
      setPendingRequestCount(count);
    } catch (error) {
      console.error("Failed to fetch pending requests for count:", error);
      // Optionally set count to 0 or leave it as is on error
      // setPendingRequestCount(0);
    }
  }, []);
  // --- End Friend Request Count Function --- // <-- NEW


  // --- WebSocket Connection Logic ---
  const connectWebSocket = useCallback((authToken) => {
    // ... (keep existing connection setup logic) ...
    if (!authToken || wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log(`WebSocket connect aborted: No token or already ${wsRef.current?.readyState === WebSocket.OPEN ? 'connected' : 'connecting'}.`);
      return;
    }
    console.log('Attempting WebSocket connection...');

    // Cleanup previous connection resources
    if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        if (wsRef.current.readyState !== WebSocket.CLOSED && wsRef.current.readyState !== WebSocket.CLOSING) {
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
            const payload = message.payload || {}; // Ensure payload exists

            // Helper to add notification safely
            const addNotification = (newNotificationData) => {
                 setNotifications((prevNots) => {
                    const uniqueId = Date.now() + Math.random(); // Simple unique ID
                    // Optionally add checks to prevent duplicate notifications based on content/IDs
                    console.log(`Adding notification: Type=${newNotificationData.type}, Msg=${newNotificationData.message}`);
                    return [{ id: uniqueId, ...newNotificationData }, ...prevNots].slice(0, 5); // Keep max 5
                 });
            };

            // --- Handle Notifications & State Updates ---
            switch (message.type) {
                case 'newMessage':
                    const senderIdMsg = payload.sender?.id;
                    const isValidSenderIdMsg = typeof senderIdMsg === 'number';
                    const isValidCurrentUserIdMsg = typeof currentUserId === 'number';

                    if (isValidSenderIdMsg && isValidCurrentUserIdMsg && senderIdMsg !== currentUserId) {
                        setTotalUnreadCount(prevCount => prevCount + 1); // Increment unread count
                        addNotification({
                            type: 'message',
                            messageId: payload.id, // Store message ID if needed later
                            message: `New message from ${payload.sender.name || 'someone'}`,
                        });
                    } else if (senderIdMsg === currentUserId) {
                         console.log("WS 'newMessage' is from self, skipping notification and count increment.");
                    } else {
                        console.warn("WS 'newMessage' received, but sender or current user ID is invalid/missing.");
                    }
                    break;

                case 'newAnnouncement':
                    setHasUnreadAnnouncements(true);
                    console.log("AuthContext: setHasUnreadAnnouncements called with true");
                    addNotification({
                        type: 'announcement',
                        announcementId: payload.id,
                        message: `New Announcement: ${payload.title || 'Check the feed!'}`,
                    });
                    break;

                // --- Handle Friend Request Events --- // <-- NEW
                case 'newFriendRequest':
                    // This message is for the recipient (payload.friendId)
                    if (payload.friendId === currentUserId) {
                        setPendingRequestCount(prev => prev + 1); // Increment count
                        addNotification({
                            type: 'friend_request_received', // Specific type
                            friendshipId: payload.id,
                            senderId: payload.sender?.id,
                            message: `New friend request from ${payload.sender?.name || 'Someone'}`,
                        });
                    }
                    break;

                case 'friendRequestUpdate':
                    // This message is for the original sender (payload.userId)
                    if (payload.userId === currentUserId) {
                        if (payload.status === 'accepted') {
                            fetchAndUpdateRequestCount(); // Re-fetch count if needed (though this doesn't change *received* count)
                            addNotification({
                                type: 'friend_request_accepted', // Specific type
                                friendshipId: payload.id,
                                accepterId: payload.accepter?.id,
                                message: `${payload.accepter?.name || 'Someone'} accepted your friend request!`,
                            });
                            // Optionally trigger a friend list refresh here or let Friendspage handle it
                        } else if (payload.status === 'rejected') {
                             fetchAndUpdateRequestCount(); // Re-fetch count
                             addNotification({
                                type: 'friend_request_rejected', // Specific type
                                friendshipId: payload.id,
                                rejecterId: payload.rejecterId,
                                message: `Your friend request was rejected.`, // Keep it simple
                            });
                        }
                    }
                    break;

                 case 'friendRemoved':
                     // This message is for the user who was removed (payload.removedUser)
                     if (payload.removedUser === currentUserId) {
                         addNotification({
                             type: 'friend_removed', // Specific type
                             friendshipId: payload.id, // ID of the removed relationship
                             removerId: payload.removedById,
                             message: `${payload.removerName || 'Someone'} removed you as a friend.`,
                         });
                         // Optionally trigger a friend list refresh
                     }
                     break;
                 // --- End Friend Request Event Handling --- // <-- NEW

                default:
                    console.log("Received unhandled WebSocket message type:", message.type);
            }
            // --- End Notifications & State Updates ---

            // --- Notify component listeners ---
            messageListenersRef.current.forEach(listener => listener(message));
            // --- End Notify listeners ---
        } catch (error) {
            console.error('Failed to parse or handle WebSocket message:', error);
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
  // Removed notifications dependency, added fetchAndUpdateRequestCount
  }, [removeNotification, fetchAndUpdateRequestCount]); // <-- MODIFIED Dependency Array

  const disconnectWebSocket = useCallback(() => {
    // ... (keep as is) ...
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

  // --- Function to fetch and update total unread message count ---
  const fetchAndUpdateUnreadCount = useCallback(async () => {
    // ... (keep as is) ...
    if (!localStorage.getItem('authToken')) {
        setTotalUnreadCount(0);
        return;
    }
    console.log("Attempting to fetch and update unread message count...");
    try {
      const conversationsData = await fetchConversations();
      const totalCount = conversationsData.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      console.log("Total unread message count calculated:", totalCount);
      setTotalUnreadCount(totalCount);
    } catch (error) {
      console.error("Failed to fetch conversations for unread count:", error);
    }
  }, []);
  // --- End Unread Count Function ---


  // Load initial state from localStorage
  useEffect(() => {
    // ... (keep existing token/user loading logic) ...
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
          fetchAndUpdateUnreadCount(); // Fetch message count
          fetchAndUpdateRequestCount(); // <-- Fetch request count on initial load
      } else {
          setTotalUnreadCount(0);
          setPendingRequestCount(0); // <-- Reset request count
      }
    }
    // Added fetchAndUpdateRequestCount dependency
    return () => disconnectWebSocket();
  }, [connectWebSocket, disconnectWebSocket, fetchAndUpdateUnreadCount, fetchAndUpdateRequestCount]); // <-- MODIFIED Dependency Array


  // Login function
  const login = async (credentials, loginType = 'student') => {
    // ... (keep existing login logic) ...
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

    disconnectWebSocket(); // Disconnect any previous WS
    connectWebSocket(data.token); // Connect new WS
    fetchAndUpdateUnreadCount(); // Fetch message count
    fetchAndUpdateRequestCount(); // <-- Fetch request count on login

    // Navigation logic remains
    if (data.user.role === 'college_admin' || data.user.role === 'platform_admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  // Logout function
  const logout = () => {
    // ... (keep existing logout logic) ...
    disconnectWebSocket();

    setUser(null);
    setToken(null);
    currentUserIdRef.current = null;
    setNotifications([]);
    setTotalUnreadCount(0);
    setHasUnreadAnnouncements(false);
    setPendingRequestCount(0); // <-- Reset request count on logout
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  // updateUserContext (keep as is)
  const updateUserContext = (newUserData) => {
    // ... (keep as is) ...
     if (newUserData) {
        setUser(newUserData);
        currentUserIdRef.current = newUserData?.id;
        localStorage.setItem('userData', JSON.stringify(newUserData));
        console.log("AuthContext user updated:", newUserData);
    } else {
        console.error("Attempted to update user context with invalid data");
    }
  };

  // Context value - add friend request count state and updater
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
    // --- Friend Request Context --- // <-- NEW
    pendingRequestCount,
    fetchAndUpdateRequestCount,
    // --- End Friend Request Context --- // <-- NEW
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading ? children : <div>Loading App...</div>} {/* Simple loading indicator */}
    </AuthContext.Provider>
  );
};