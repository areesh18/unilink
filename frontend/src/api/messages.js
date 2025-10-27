import axios from 'axios';

// Assuming getAuthConfig is defined or use interceptors
const getAuthToken = () => localStorage.getItem('authToken');
const apiClient = axios.create({});
const getAuthConfig = () => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication token not found.');
    return { headers: { Authorization: `Bearer ${token}` } };
};

/**
 * Fetches the list of conversations (DMs and Groups) for the logged-in user.
 * @returns {Promise<Array>} A promise that resolves to an array of conversation summary objects.
 */
export const fetchConversations = async () => {
    try {
        const config = getAuthConfig();
        const response = await apiClient.get('/api/conversations', config);
        // Backend returns array directly in response.data based on GetConversations handler
        return response.data || [];
    } catch (error) {
        console.error("Error fetching conversations:", error);
        throw error.response?.data?.error || error.message || 'Failed to fetch conversations';
    }
};

/**
 * Fetches messages for a specific conversation.
 * @param {string} conversationId - The ID of the conversation (e.g., "dm_1_2" or "group_1").
 * @param {number} [limit=50] - Number of messages to fetch.
 * @param {number} [offset=0] - Offset for pagination.
 * @returns {Promise<Object>} A promise that resolves to an object { total: number, messages: Array }.
 */
export const fetchMessages = async (conversationId, limit = 50, offset = 0) => {
     if (!conversationId) {
        throw new Error('Conversation ID is required to fetch messages.');
    }
    try {
        const config = getAuthConfig();
        const response = await apiClient.get(
            `/api/conversations/${conversationId}/messages`,
            {
                ...config,
                params: { limit, offset } // Pass limit and offset as query params
            }
        );
        // Backend returns { total: ..., messages: [...] }
        return response.data;
    } catch (error) {
        console.error(`Error fetching messages for ${conversationId}:`, error);
        throw error.response?.data?.error || error.message || 'Failed to fetch messages';
    }
};

/**
 * Sends a message to a specific conversation.
 * @param {string} conversationId - The ID of the conversation.
 * @param {string} content - The text content of the message.
 * @param {string} [type='text'] - The type of message (currently only 'text').
 * @returns {Promise<Object>} A promise that resolves to the sent message object.
 */
export const sendMessage = async (conversationId, content, type = 'text') => {
     if (!conversationId || !content) {
        throw new Error('Conversation ID and content are required to send a message.');
    }
    try {
        const config = getAuthConfig();
        const payload = { content, type };
        const response = await apiClient.post(
            `/api/conversations/${conversationId}/messages`,
            payload,
            config
        );
        return response.data; // Returns the created message object
    } catch (error) {
        console.error(`Error sending message to ${conversationId}:`, error);
        throw error.response?.data?.error || error.message || 'Failed to send message';
    }
};

// Add delete message function later if needed
// export const deleteMessage = async (messageId) => { ... };