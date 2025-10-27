import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchConversations } from '../api/messages'; // Import API function
import { useAuth } from '../hooks/useAuth'; // To get current user ID

// Helper for fallback avatar
const fallbackAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'C')}&background=random&color=fff`;

// Helper function to format date/time for last message
const formatLastMessageTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) { // Today
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) { // Yesterday
        return 'Yesterday';
    } else if (diffDays < 7) { // This week
        return date.toLocaleDateString([], { weekday: 'short' });
    } else { // Older
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
};

// --- Component for Conversation List Item ---
const ConversationListItem = ({ conversation, isSelected, onSelect }) => {
    const { user: currentUser } = useAuth();
    const lastMessage = conversation.lastMessage;

    // Determine prefix for last message (You: or Sender Name:)
    let lastMessagePrefix = '';
    if (lastMessage) {
        if (lastMessage.senderId === currentUser?.id) {
            lastMessagePrefix = 'You: ';
        } else if (conversation.type === 'dm' && lastMessage.sender) {
             // For DMs, show nothing extra if the other person sent it
             // Or optionally: lastMessagePrefix = `${lastMessage.sender.name.split(' ')[0]}: `;
        } else if(conversation.type === 'group' && lastMessage.sender) {
             lastMessagePrefix = `${lastMessage.sender.name.split(' ')[0]}: `; // Show sender name in groups
        }
    }

    return (
        <button
            onClick={() => onSelect(conversation.id)}
            className={`w-full text-left p-3 flex items-center space-x-3 rounded-lg transition-colors duration-150 ${
                isSelected
                    ? 'bg-indigo-100 dark:bg-gray-700'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
        >
            {/* Avatar */}
            <img
                className="h-12 w-12 rounded-full object-cover flex-shrink-0 bg-gray-300 dark:bg-gray-600"
                src={conversation.avatar || fallbackAvatar(conversation.name)}
                alt={conversation.name}
                 onError={(e) => { e.target.onerror = null; e.target.src=fallbackAvatar(conversation.name)}}
            />
            {/* Name & Last Message */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {conversation.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                         {formatLastMessageTime(conversation.updatedAt)} {/* Use updatedAt for sorting */}
                    </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        <span className="font-medium">{lastMessagePrefix}</span>
                        {lastMessage ? lastMessage.content : <span className="italic">No messages yet</span>}
                    </p>
                    {/* Unread Count Badge */}
                    {conversation.unreadCount > 0 && (
                        <span className="ml-2 flex-shrink-0 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-indigo-600 rounded-full">
                            {conversation.unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
};


function ChatPage() {
    const [conversations, setConversations] = useState([]);
    const [isLoadingConvos, setIsLoadingConvos] = useState(true);
    const [errorConvos, setErrorConvos] = useState(null);
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    // --- NEW STATE FOR MESSAGES ---
    const [messages, setMessages] = useState([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [errorMessages, setErrorMessages] = useState(null);
    const [newMessageContent, setNewMessageContent] = useState(''); // For input field
    const [isSending, setIsSending] = useState(false); // For send button loading
    // --- END NEW STATE ---
    // Ref for scrolling to bottom
    const messagesEndRef = useRef(null);
    // Fetch conversations on mount
    useEffect(() => {
        const loadConversations = async () => {
            setIsLoadingConvos(true);
            setErrorConvos(null);
            try {
                const data = await fetchConversations();
                // --- Add this check ---
                if (Array.isArray(data)) {
                    // Sort conversations by last message time (updatedAt)
                    data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                    setConversations(data);
                } else {
                    // Handle unexpected data type (e.g., if API returned an object on error)
                    console.error("fetchConversations did not return an array:", data);
                    setConversations([]); // Set to empty array as a fallback
                    // Optionally set an error state here as well
                    // setErrorConvos("Received invalid data format for conversations.");
                }
                // --- End check ---
            } catch (err) {
                setErrorConvos(err.toString());
                setConversations([]); // Ensure it's an empty array on error
            } finally {
                setIsLoadingConvos(false);
            }
        };
        loadConversations();
    }, []);

    // --- NEW: Fetch messages when selectedConversationId changes ---
    useEffect(() => {
        if (!selectedConversationId) {
            setMessages([]); // Clear messages if no conversation selected
            return;
        }

        const loadMessages = async () => {
            setIsLoadingMessages(true);
            setErrorMessages(null);
            try {
                // Fetch messages for the selected conversation
                // Result is { total: number, messages: Array }
                const data = await fetchMessages(selectedConversationId);
                // Reverse messages to display oldest first for mapping, but keep scroll at bottom
                setMessages((data.messages || []).reverse());
            } catch (err) {
                setErrorMessages(err.toString());
                setMessages([]); // Clear messages on error
            } finally {
                setIsLoadingMessages(false);
            }
        };

        loadMessages();
    }, [selectedConversationId]); // Re-run whenever the selected ID changes

    // --- NEW: Scroll to bottom when messages change ---
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]); // Run when messages state updates

    const handleSelectConversation = (conversationId) => {
        setSelectedConversationId(conversationId);
        // Message fetching now happens in the useEffect above
    };

    // --- NEW: Handle sending a message ---
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessageContent.trim() || !selectedConversationId || isSending) {
            return;
        }

        setIsSending(true);
        setErrorMessages(null); // Clear previous message errors
        const contentToSend = newMessageContent.trim(); // Capture current content
        setNewMessageContent(''); // Clear input immediately

        try {
            const sentMessage = await sendMessage(selectedConversationId, contentToSend);
            // Add the newly sent message to the local state immediately
            // Note: sentMessage.sender might not be fully populated from backend yet, adjust if needed
            setMessages(prevMessages => [...prevMessages, sentMessage]);
             // TODO: Update the conversation list's last message? (More complex state update or refetch)
        } catch (err) {
            setErrorMessages(`Failed to send: ${err.toString()}`);
            setNewMessageContent(contentToSend); // Restore input content on error
        } finally {
            setIsSending(false);
        }
    };

    

    return (
        // Full height chat layout
        <div className="flex h-[calc(100vh-4rem)]"> {/* Full height minus Navbar height (h-16 = 4rem) */}

            {/* Left Column: Conversation List */}
            <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                {/* Header */}
                 <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                     <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Chats</h1>
                     {/* TODO: Add Search or New Chat button here */}
                 </div>

                 {/* List Area */}
                 <div className="flex-1 overflow-y-auto p-2 space-y-1">
                     {isLoadingConvos && <p className="p-4 text-center text-gray-500 dark:text-gray-400">Loading chats...</p>}
                     {errorConvos && !isLoadingConvos && <p className="p-4 text-center text-red-500 dark:text-red-400">Error loading chats: {errorConvos}</p>}
                     {!isLoadingConvos && !errorConvos && conversations.length === 0 && <p className="p-4 text-center text-gray-500 dark:text-gray-400">No conversations yet.</p>}
                     {!isLoadingConvos && !errorConvos && conversations.map(convo => (
                         <ConversationListItem
                             key={convo.id}
                             conversation={convo}
                             isSelected={selectedConversationId === convo.id}
                             onSelect={handleSelectConversation}
                         />
                     ))}
                 </div>
            </div>

            {/* Right Column: Message View (Placeholder for now) */}
            <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
                {selectedConversationId ? (
                    <>
                        {/* Message Area Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center space-x-3">
                             {/* Placeholder avatar - could fetch group/friend avatar */}
                             <img
                                className="h-10 w-10 rounded-full object-cover bg-gray-300 dark:bg-gray-600"
                                src={conversations.find(c => c.id === selectedConversationId)?.avatar || fallbackAvatar(conversations.find(c => c.id === selectedConversationId)?.name)}
                                alt={conversations.find(c => c.id === selectedConversationId)?.name}
                                onError={(e) => { e.target.onerror = null; e.target.src=fallbackAvatar(conversations.find(c => c.id === selectedConversationId)?.name)}}
                            />
                            <h2 className="font-semibold text-gray-900 dark:text-white">
                                {conversations.find(c => c.id === selectedConversationId)?.name || 'Chat'}
                            </h2>
                            {/* TODO: Add more info like group members link or DM status */}
                        </div>

                        {/* Message List Area */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {isLoadingMessages && <p className="text-center text-gray-500 dark:text-gray-400">Loading messages...</p>}
                            {errorMessages && !isLoadingMessages && <p className="text-center text-red-500 dark:text-red-400">Error: {errorMessages}</p>}
                            {!isLoadingMessages && !errorMessages && messages.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400">No messages in this chat yet.</p>}
                            {!isLoadingMessages && !errorMessages && messages.map((msg) => (
                                // --- Message Bubble Component (Example) ---
                                <div key={msg.id} className={`flex ${msg.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow ${
                                        msg.senderId === currentUser?.id
                                            ? 'bg-indigo-500 text-white'
                                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                                    }`}>
                                        {/* Show sender name in groups for messages not from current user */}
                                        {selectedConversationId.startsWith('group_') && msg.senderId !== currentUser?.id && msg.sender && (
                                            <p className="text-xs font-semibold mb-1 opacity-80">{msg.sender.name}</p>
                                        )}
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        <p className="text-xs opacity-70 mt-1 text-right">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                // --- End Message Bubble ---
                            ))}
                             {/* Dummy div to scroll to */}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input Area */}
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                             {/* Show sending errors here */}
                             {errorMessages && isSending && <p className="text-xs text-red-500 dark:text-red-400 mb-2">Error: {errorMessages}</p>}

                            <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                                <input
                                    type="text"
                                    value={newMessageContent}
                                    onChange={(e) => setNewMessageContent(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                                    disabled={isSending} // Disable while sending
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessageContent.trim() || isSending}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                                >
                                    {isSending ? '...' : 'Send'}
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400">Select a conversation to start chatting.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChatPage;