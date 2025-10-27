// frontend/src/pages/ChatPage.jsx - COMPLETE IMPLEMENTATION
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  deleteMessage,
} from "../api/messages";
import { useAuth } from "../hooks/useAuth";
import NewChatModal from "../components/NewChatModal";

// ===========================
// HELPER FUNCTIONS
// ===========================

// Format time intelligently
const formatTime = (dateString) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
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

// Generate fallback avatar
const fallbackAvatar = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=6366f1&color=fff&bold=true`;

// ===========================
// SUB-COMPONENTS
// ===========================

// Conversation List Item Component
const ConversationItem = ({ conversation, isActive, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center p-3 cursor-pointer transition-all duration-200 border-b border-gray-100 dark:border-gray-700 ${
      isActive
        ? "bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-600"
        : "hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-4 border-transparent"
    }`}
  >
    <div className="relative flex-shrink-0">
      <img
        src={conversation.avatar || fallbackAvatar(conversation.name)}
        alt={conversation.name}
        className="h-12 w-12 rounded-full object-cover"
        onError={(e) => {
          e.target.src = fallbackAvatar(conversation.name);
        }}
      />
      {conversation.unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg">
          {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0 ml-3">
      <div className="flex justify-between items-baseline">
        <h3
          className={`text-sm font-semibold truncate ${
            conversation.unreadCount > 0
              ? "text-gray-900 dark:text-white"
              : "text-gray-700 dark:text-gray-300"
          }`}
        >
          {conversation.name}
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
          {formatTime(conversation.lastMessageTime)}
        </span>
      </div>
      <p
        className={`text-sm truncate ${
          conversation.unreadCount > 0
            ? "text-gray-900 dark:text-white font-medium"
            : "text-gray-500 dark:text-gray-400"
        }`}
      >
        {conversation.lastMessage || "No messages yet"}
      </p>
    </div>
  </div>
);

// Message Bubble Component
const MessageBubble = ({ message, isOwn, onDelete, showAvatar = true }) => (
  <div className={`flex mb-4 ${isOwn ? "justify-end" : "justify-start"} group`}>
    {!isOwn && showAvatar && (
      <img
        src={
          message.sender.profilePicture || fallbackAvatar(message.sender.name)
        }
        alt={message.sender.name}
        className="h-8 w-8 rounded-full object-cover mr-2 flex-shrink-0"
        onError={(e) => {
          e.target.src = fallbackAvatar(message.sender.name);
        }}
      />
    )}
    {!isOwn && !showAvatar && <div className="w-8 mr-2 flex-shrink-0" />}

    <div
      className={`max-w-xs lg:max-w-md ${
        isOwn ? "items-end" : "items-start"
      } flex flex-col`}
    >
      {!isOwn && showAvatar && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 px-2">
          {message.sender.name}
        </p>
      )}
      <div
        className={`px-4 py-2 rounded-2xl shadow-sm ${
          isOwn
            ? "bg-indigo-600 text-white rounded-br-sm"
            : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
      </div>
      <div className="flex items-center gap-2 mt-1 px-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatTime(message.createdAt)}
        </span>
        {isOwn && (
          <button
            onClick={() => onDelete(message.id)}
            className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete message"
          >
            Delete
          </button>
        )}
      </div>
    </div>

    {isOwn && showAvatar && (
      <img
        src={message.sender.profilePicture || fallbackAvatar("You")}
        alt="You"
        className="h-8 w-8 rounded-full object-cover ml-2 flex-shrink-0"
        onError={(e) => {
          e.target.src = fallbackAvatar("You");
        }}
      />
    )}
    {isOwn && !showAvatar && <div className="w-8 ml-2 flex-shrink-0" />}
  </div>
);

// Empty State Component
const EmptyState = ({ icon, title, description }) => (
  <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-8">
    <div className="text-6xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">
      {title}
    </h3>
    <p className="text-center text-sm max-w-md">{description}</p>
  </div>
);

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

// ===========================
// MAIN COMPONENT
// ===========================

function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  const [loading, setLoading] = useState({
    conversations: true,
    messages: false,
  });
  const [error, setError] = useState({ conversations: null, messages: null });
  const [sending, setSending] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // ===========================
  // HELPER FUNCTIONS
  // ===========================

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Group consecutive messages from same sender for better UI
  const groupMessages = (messages) => {
    const grouped = [];
    let currentGroup = [];
    let lastSenderId = null;

    messages.forEach((msg) => {
      if (msg.sender.id !== lastSenderId) {
        if (currentGroup.length > 0) {
          grouped.push([...currentGroup]);
        }
        currentGroup = [{ ...msg, showAvatar: true }];
        lastSenderId = msg.sender.id;
      } else {
        currentGroup.push({ ...msg, showAvatar: false });
      }
    });

    if (currentGroup.length > 0) {
      grouped.push(currentGroup);
    }

    return grouped.flat();
  };

  // ===========================
  // EFFECTS
  // ===========================

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      setLoading((prev) => ({ ...prev, conversations: true }));
      setError((prev) => ({ ...prev, conversations: null }));
      try {
        const data = await fetchConversations();
        setConversations(data);

        // Handle conversation selection
        if (conversationId) {
          const conv = data.find((c) => c.conversationId === conversationId);
          setCurrentConversation(conv || null);
          setIsMobileMenuOpen(false);
        } else if (data.length > 0) {
          // Auto-select first conversation if none selected
          navigate(`/chat/${data[0].conversationId}`, { replace: true });
        }
      } catch (err) {
        setError((prev) => ({ ...prev, conversations: err.toString() }));
        console.error("Error loading conversations:", err);
      } finally {
        setLoading((prev) => ({ ...prev, conversations: false }));
      }
    };
    loadConversations();
  }, [conversationId, navigate]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!conversationId) return;

    const loadMessages = async () => {
      setLoading((prev) => ({ ...prev, messages: true }));
      setError((prev) => ({ ...prev, messages: null }));
      try {
        const data = await fetchMessages(conversationId);
        setMessages(data);
      } catch (err) {
        setError((prev) => ({ ...prev, messages: err.toString() }));
        console.error("Error loading messages:", err);
      } finally {
        setLoading((prev) => ({ ...prev, messages: false }));
      }
    };
    loadMessages();
  }, [conversationId]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ===========================
  // EVENT HANDLERS
  // ===========================

  // Handle sending a new message
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
      if (
        currentConversation.conversationType === "dm" &&
        currentConversation.participant
      ) {
        messageData.receiverId = currentConversation.participant.id;
      } else if (
        currentConversation.conversationType === "group" &&
        currentConversation.groupInfo
      ) {
        messageData.groupId = currentConversation.groupInfo.id;
      }

      const newMessage = await sendMessage(messageData);
      setMessages((prev) => [...prev, newMessage]);
      setMessageInput("");
      messageInputRef.current?.focus();
    } catch (err) {
      alert(`Failed to send message: ${err}`);
      console.error("Send message error:", err);
    } finally {
      setSending(false);
    }
  };

  // Handle deleting a message
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message? This action cannot be undone."))
      return;

    try {
      await deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      alert(`Failed to delete message: ${err}`);
      console.error("Delete message error:", err);
    }
  };

  // Handle conversation selection
  const handleSelectConversation = (conv) => {
    navigate(`/chat/${conv.conversationId}`);
  };

  // ===========================
  // RENDER
  // ===========================

  const groupedMessages = groupMessages(messages);

  return (
    <>
      {/* NEW CHAT MODAL */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
      />

      <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden fixed bottom-4 right-4 z-50 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
          aria-label="Toggle chat menu"
        >
          {isMobileMenuOpen ? "✕" : "💬"}
        </button>

        {/* Conversations Sidebar */}
        <div
          className={`${
            isMobileMenuOpen ? "fixed inset-0 z-40" : "hidden"
          } md:relative md:flex w-full md:w-80 border-r border-gray-200 dark:border-gray-700 flex-col bg-white dark:bg-gray-800`}
        >
          {/* Sidebar Header WITH NEW CHAT BUTTON */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Messages
              </h2>
              <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs font-bold px-2 py-1 rounded-full">
                {conversations.reduce((acc, c) => acc + c.unreadCount, 0)}
              </span>
            </div>
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <span className="text-lg">+</span>
              New Chat
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loading.conversations && (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            )}

            {error.conversations && (
              <div className="p-4 m-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                <strong className="font-bold">Error:</strong>{" "}
                {error.conversations}
              </div>
            )}

            {!loading.conversations && conversations.length === 0 && (
              <div className="p-4">
                <EmptyState
                  icon="💬"
                  title="No Conversations"
                  description="Click 'New Chat' above to start chatting with friends!"
                />
              </div>
            )}

            {!loading.conversations &&
              conversations.length > 0 &&
              conversations.map((conv) => (
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
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center bg-white dark:bg-gray-800 shadow-sm">
                <img
                  src={
                    currentConversation.avatar ||
                    fallbackAvatar(currentConversation.name)
                  }
                  alt={currentConversation.name}
                  className="h-10 w-10 rounded-full object-cover mr-3"
                  onError={(e) => {
                    e.target.src = fallbackAvatar(currentConversation.name);
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {currentConversation.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentConversation.conversationType === "dm"
                      ? "Direct Message"
                      : `Group Chat • ${
                          currentConversation.groupInfo?.type === "auto"
                            ? "Department"
                            : "Club"
                        }`}
                  </p>
                </div>
              </div>

              {/* Messages Display Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
                {loading.messages ? (
                  <div className="flex items-center justify-center h-full">
                    <LoadingSpinner />
                  </div>
                ) : error.messages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg p-4 text-sm max-w-md text-center">
                      <strong className="font-bold block mb-2">
                        Error Loading Messages
                      </strong>
                      {error.messages}
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <EmptyState
                    icon="👋"
                    title="No Messages Yet"
                    description="Start the conversation by sending the first message!"
                  />
                ) : (
                  <>
                    {groupedMessages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isOwn={msg.sender.id === user.id}
                        onDelete={handleDeleteMessage}
                        showAvatar={msg.showAvatar}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Input Form */}
              <form
                onSubmit={handleSendMessage}
                className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <div className="flex space-x-2">
                  <input
                    ref={messageInputRef}
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={sending || !messageInput.trim()}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                  >
                    {sending ? "..." : "Send"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <EmptyState
              icon="💬"
              title="Select a Conversation"
              description="Choose a conversation from the list to start chatting"
            />
          )}
        </div>
      </div>
    </>
  );
}

export default ChatPage;
