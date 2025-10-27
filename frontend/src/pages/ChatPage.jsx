// frontend/src/pages/ChatPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchConversations, fetchMessages, sendMessage, deleteMessage } from '../api/messages';
import { useAuth } from '../hooks/useAuth';

// Helper to format time
const formatTime = (dateString) => {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    } catch {
        return dateString;
    }
};

// Conversation List Item Component
const ConversationItem = ({ conversation, isActive, onClick }) => (
    <div
        onClick={onClick}
        className={`flex items-center p-3 cursor-pointer transition-colors ${
            isActive
                ? 'bg-indigo-100 dark:bg-indigo-900'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        } border-b border-gray-200 dark:border-gray-700`}
    >
        <img
            src={conversation.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.name)}&background=random`}
            alt={conversation.name}
            className="h-12 w-12 rounded-full object-cover mr-3"
        />
        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {conversation.name}
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    {formatTime(conversation.lastMessageTime)}
                </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {conversation.lastMessage || 'No messages yet'}
            </p>
        </div>
        {conversation.unreadCount > 0 && (
            <div className="ml-2 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {conversation.unreadCount}
            </div>
        )}
    </div>
);

// Message Bubble Component
const MessageBubble = ({ message, isOwn, onDelete }) => (
    <div className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
            {!isOwn && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 px-2">
                    {message.sender.name}
                </p>
            )}
            <div
                className={`px-4 py-2 rounded-lg ${
                    isOwn
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
            >
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                <div className="flex justify-between items-center mt-1">
                    <span className={`text-xs ${isOwn ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>
                        {formatTime(message.createdAt)}
                    </span>
                    {isOwn && (
                        <button
                            onClick={() => onDelete(message.id)}
                            className="text-xs text-red-300 hover:text-red-100 ml-2"
                            title="Delete message"
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
        {!isOwn && (
            <img
                src={message.sender.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender.name)}&background=random`}
                alt={message.sender.name}
                className="h-8 w-8 rounded-full object-cover ml-2 order-2"
            />
        )}
        {isOwn && (
            <img
                src={message.sender.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender.name)}&background=random`}
                alt="You"
                className="h-8 w-8 rounded-full object-cover mr-2 order-1"
            />
        )}
    </div>
);

// Main Chat Page Component
function ChatPage() {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');

    const [loading, setLoading] = useState({ conversations: true, messages: false });
    const [error, setError] = useState({ conversations: null, messages: null });
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef(null);

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Load conversations
    useEffect(() => {
        const loadConversations = async () => {
            setLoading(prev => ({ ...prev, conversations: true }));
            setError(prev => ({ ...prev, conversations: null }));
            try {
                const data = await fetchConversations();
                setConversations(data);
                
                // If conversationId in URL, find and set current conversation
                if (conversationId) {
                    const conv = data.find(c => c.conversationId === conversationId);
                    setCurrentConversation(conv || null);
                } else if (data.length > 0) {
                    // Auto-select first conversation if none selected
                    navigate(`/chat/${data[0].conversationId}`, { replace: true });
                }
            } catch (err) {
                setError(prev => ({ ...prev, conversations: err.toString() }));
            } finally {
                setLoading(prev => ({ ...prev, conversations: false }));
            }
        };
        loadConversations();
    }, [conversationId, navigate]);

    // Load messages when conversation changes
    useEffect(() => {
        if (!conversationId) return;

        const loadMessages = async () => {
            setLoading(prev => ({ ...prev, messages: true }));
            setError(prev => ({ ...prev, messages: null }));
            try {
                const data = await fetchMessages(conversationId);
                setMessages(data);
            } catch (err) {
                setError(prev => ({ ...prev, messages: err.toString() }));
            } finally {
                setLoading(prev => ({ ...prev, messages: false }));
            }
        };
        loadMessages();
    }, [conversationId]);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle sending message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !currentConversation) return;

        setSending(true);
        try {
            const messageData = {
                content: messageInput.trim(),
                conversationType: currentConversation.conversationType,
                conversationId: currentConversation.conversationId,
            };

            // Add receiverId or groupId based on conversation type
            if (currentConversation.conversationType === 'dm' && currentConversation.participant) {
                messageData.receiverId = currentConversation.participant.id;
            } else if (currentConversation.conversationType === 'group' && currentConversation.groupInfo) {
                messageData.groupId = currentConversation.groupInfo.id;
            }

            const newMessage = await sendMessage(messageData);
            setMessages(prev => [...prev, newMessage]);
            setMessageInput('');
        } catch (err) {
            alert(`Failed to send message: ${err}`);
        } finally {
            setSending(false);
        }
    };

    // Handle deleting message
    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm('Delete this message?')) return;
        try {
            await deleteMessage(messageId);
            setMessages(prev => prev.filter(m => m.id !== messageId));
        } catch (err) {
            alert(`Failed to delete message: ${err}`);
        }
    };

    // Handle conversation selection
    const handleSelectConversation = (conv) => {
        navigate(`/chat/${conv.conversationId}`);
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {/* Conversations Sidebar */}
            <div className="w-full md:w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loading.conversations && (
                        <p className="text-center py-4 text-gray-500 dark:text-gray-400">Loading...</p>
                    )}
                    {error.conversations && (
                        <p className="text-center py-4 text-red-500 dark:text-red-400">
                            Error: {error.conversations}
                        </p>
                    )}
                    {!loading.conversations && conversations.length === 0 && (
                        <p className="text-center py-4 text-gray-500 dark:text-gray-400">
                            No conversations yet. Add friends or join groups to start chatting!
                        </p>
                    )}
                    {conversations.map(conv => (
                        <ConversationItem
                            key={conv.conversationId}
                            conversation={conv}
                            isActive={conv.conversationId === conversationId}
                            onClick={() => handleSelectConversation(conv)}
                        />
                    ))}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
                {currentConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
                            <img
                                src={currentConversation.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentConversation.name)}&background=random`}
                                alt={currentConversation.name}
                                className="h-10 w-10 rounded-full object-cover mr-3"
                            />
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {currentConversation.name}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {currentConversation.conversationType === 'dm' ? 'Direct Message' : 'Group Chat'}
                                </p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
                            {loading.messages && (
                                <p className="text-center text-gray-500 dark:text-gray-400">Loading messages...</p>
                            )}
                            {error.messages && (
                                <p className="text-center text-red-500 dark:text-red-400">
                                    Error: {error.messages}
                                </p>
                            )}
                            {messages.map(msg => (
                                <MessageBubble
                                    key={msg.id}
                                    message={msg}
                                    isOwn={msg.sender.id === user.id}
                                    onDelete={handleDeleteMessage}
                                />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Type a message..."
                                    disabled={sending}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !messageInput.trim()}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                                >
                                    {sending ? '...' : 'Send'}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <p>Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChatPage;