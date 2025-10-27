// frontend/src/api/messages.js
import axios from 'axios';

const getAuthToken = () => localStorage.getItem('authToken');
const apiClient = axios.create({});

const getAuthConfig = () => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication token not found.');
    return { headers: { Authorization: `Bearer ${token}` } };
};

// Fetch all conversations (DMs + Groups)
export const fetchConversations = async () => {
    try {
        const config = getAuthConfig();
        const response = await apiClient.get('/api/conversations', config);
        return response.data.conversations || [];
    } catch (error) {
        console.error("Error fetching conversations:", error);
        throw error.response?.data?.error || error.message || 'Failed to fetch conversations';
    }
};

// Fetch messages for a specific conversation
export const fetchMessages = async (conversationId, limit = 50, offset = 0) => {
    try {
        const config = getAuthConfig();
        const response = await apiClient.get(
            `/api/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`,
            config
        );
        return response.data.messages || [];
    } catch (error) {
        console.error(`Error fetching messages for ${conversationId}:`, error);
        throw error.response?.data?.error || error.message || 'Failed to fetch messages';
    }
};

// Send a message to a conversation
export const sendMessage = async (messageData) => {
    // messageData: { content, conversationType, conversationId, receiverId?, groupId? }
    try {
        const config = getAuthConfig();
        const response = await apiClient.post(
            `/api/conversations/${messageData.conversationId}/messages`,
            messageData,
            config
        );
        return response.data.message;
    } catch (error) {
        console.error("Error sending message:", error);
        throw error.response?.data?.error || error.message || 'Failed to send message';
    }
};

// Delete a message
export const deleteMessage = async (messageId) => {
    try {
        const config = getAuthConfig();
        const response = await apiClient.delete(`/api/messages/${messageId}`, config);
        return response.data;
    } catch (error) {
        console.error(`Error deleting message ${messageId}:`, error);
        throw error.response?.data?.error || error.message || 'Failed to delete message';
    }
};