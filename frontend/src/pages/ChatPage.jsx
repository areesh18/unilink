// frontend/src/pages/ChatPage.jsx - Refactored for Light Mode
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  deleteMessage,
} from "../api/messages";
import { useAuth } from "../hooks/useAuth";
import NewChatModal from "../components/NewChatModal";
import {
  ChatBubbleLeftRightIcon, // For mobile toggle
  XMarkIcon,               // For mobile toggle close
  PaperAirplaneIcon,       // For send button
  PlusIcon,                // For New Chat button
  ChatBubbleBottomCenterTextIcon, // Empty state icon
  QuestionMarkCircleIcon, // Not found icon
  ExclamationTriangleIcon // Error icon (though not used in EmptyState directly)
} from '@heroicons/react/24/outline';
import { TrashIcon } from '@heroicons/react/20/solid'; // Solid icon for delete


// ===========================
// HELPER FUNCTIONS
// ===========================

// formatTime remains the same
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

// fallbackAvatar remains the same
const fallbackAvatar = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || 'User'
  )}&background=6366f1&color=fff&bold=true`;

// ===========================
// SUB-COMPONENTS
// ===========================

// ConversationItem - Updated Light Mode Styles
const ConversationItem = ({ conversation, isActive, onClick }) => (
    <div
      onClick={onClick}
      // Adjusted borders, background colors, hover effect
      className={`flex items-center p-3 cursor-pointer transition-colors duration-150 border-b border-gray-100 ${
        isActive
          ? "bg-indigo-50 border-l-4 border-indigo-500" // Active state with indigo accent
          : "hover:bg-gray-50 border-l-4 border-transparent" // Hover state
      }`}
    >
      <div className="relative flex-shrink-0">
        <img
          src={conversation.avatar || fallbackAvatar(conversation.name)}
          alt={conversation.name}
          className="h-11 w-11 rounded-full object-cover border border-gray-200" // Added border
          onError={(e) => { e.target.src = fallbackAvatar(conversation.name); }}
        />
        {/* Unread count styling remains similar */}
        {conversation.unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold shadow-sm">
            {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 ml-3">
        <div className="flex justify-between items-baseline">
          {/* Adjusted text colors for unread/read */}
          <h3 className={`text-sm font-semibold truncate ${ conversation.unreadCount > 0 ? "text-gray-900" : "text-gray-700" }`}>
            {conversation.name}
          </h3>
          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
            {formatTime(conversation.lastMessageTime)}
          </span>
        </div>
        <p className={`text-sm truncate ${ conversation.unreadCount > 0 ? "text-gray-800 font-medium" : "text-gray-500" }`}>
          {conversation.lastMessage || <span className="italic">No messages yet</span>}
        </p>
      </div>
    </div>
  );

// MessageBubble - Updated Light Mode Styles
const MessageBubble = ({ message, isOwn, onDelete, showAvatar = true }) => (
    <div className={`flex mb-3 ${isOwn ? "justify-end" : "justify-start"} group`}>
      {/* Sender Avatar (Left) */}
      {!isOwn && showAvatar && message.sender && (
        <img
          src={ message.sender.profilePicture || fallbackAvatar(message.sender.name) }
          alt={message.sender.name}
          className="h-8 w-8 rounded-full object-cover mr-2 flex-shrink-0 border border-gray-200" // Added border
          onError={(e) => { e.target.src = fallbackAvatar(message.sender.name); }}
        />
      )}
      {!isOwn && !showAvatar && <div className="w-8 mr-2 flex-shrink-0" />} {/* Placeholder for alignment */}

      {/* Message Content */}
      <div className={`max-w-[70%] sm:max-w-[60%] ${ isOwn ? "items-end" : "items-start" } flex flex-col`}>
        {/* Sender Name (Above bubble for others) */}
        {!isOwn && showAvatar && message.sender && (
          <p className="text-xs text-gray-500 mb-0.5 px-2">
            {message.sender.name}
          </p>
        )}
        {/* Bubble Styling */}
        <div className={`px-3 py-2 rounded-lg shadow-sm text-sm ${
              isOwn
                ? "bg-indigo-600 text-white rounded-br-none" // Own message style
                : "bg-white text-gray-800 border border-gray-200 rounded-bl-none" // Other message style
            }`}>
          <p className="whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        {/* Timestamp and Delete Button */}
        <div className="flex items-center gap-2 mt-1 px-2">
          <span className="text-xs text-gray-400">
            {formatTime(message.createdAt)}
          </span>
          {isOwn && message.id && typeof message.id !== 'string' && (
            <button
              onClick={() => onDelete(message.id)}
              className="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center"
              title="Delete message"
            >
              <TrashIcon className="w-3 h-3 mr-0.5"/> Delete
            </button>
          )}
        </div>
      </div>

      {/* Own Avatar (Right) - Hidden for now to simplify, can be re-added if needed */}
      {/* {isOwn && showAvatar && message.sender && ( ... )} */}
      {/* {isOwn && !showAvatar && <div className="w-8 ml-2 flex-shrink-0" />} */}
    </div>
  );


// EmptyState - Updated Light Mode Styles & Icons
const EmptyState = ({ icon: IconComponent, title, description }) => (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
      <IconComponent className="w-16 h-16 text-gray-300 mb-4" strokeWidth={1} />
      <h3 className="text-lg font-semibold mb-1 text-gray-700">
        {title}
      </h3>
      <p className="text-sm max-w-sm">{description}</p>
    </div>
  );


// LoadingSpinner - Adjusted Border Color
const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
    </div>
  );

// ===========================
// MAIN COMPONENT
// ===========================

function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user, addWsMessageListener } = useAuth();

  // State remains the same
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [loading, setLoading] = useState({ conversations: true, messages: false });
  const [error, setError] = useState({ conversations: null, messages: null });
  const [sending, setSending] = useState(false);

  // Refs remain the same
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // Helper Functions remain the same
  const scrollToBottom = useCallback(() => {
     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const groupMessages = useCallback((msgs = []) => {
    const grouped = [];
    let currentGroup = [];
    let lastSenderId = null;
    msgs.forEach((msg) => {
      const currentSenderId = msg?.sender?.id;
      if (!msg || currentSenderId !== lastSenderId || !currentSenderId) {
        if (currentGroup.length > 0) grouped.push([...currentGroup]);
        currentGroup = msg ? [{ ...msg, showAvatar: true }] : [];
        lastSenderId = currentSenderId;
      } else {
        currentGroup.push({ ...msg, showAvatar: false });
      }
    });
    if (currentGroup.length > 0) grouped.push([...currentGroup]);
    return grouped.flat();
  }, []);

  // Effects remain the same (logic unchanged)
  useEffect(() => {
     let isMounted = true;
     const loadConversations = async () => {
       if (isMounted) setLoading((prev) => ({ ...prev, conversations: true }));
       if (isMounted) setError((prev) => ({ ...prev, conversations: null }));
       try {
         const data = await fetchConversations();
         if (isMounted) setConversations(data);
       } catch (err) {
         if (isMounted) setError((prev) => ({ ...prev, conversations: err.toString() }));
       } finally {
          if (isMounted) setLoading((prev) => ({ ...prev, conversations: false }));
       }
     };
     loadConversations();
     return () => { isMounted = false; };
  }, [navigate]);

  useEffect(() => {
      let isMounted = true;
      if (loading.conversations) return;

      if (!conversationId) {
         if (conversations.length > 0) {
            navigate(`/chat/${conversations[0].conversationId}`, { replace: true });
         } else {
             if (isMounted) {
                setCurrentConversation(null);
                setMessages([]);
                setLoading(prev => ({ ...prev, messages: false }));
             }
         }
         return;
      };

      const currentConvData = conversations.find(c => c.conversationId === conversationId);
      if (isMounted) {
         setCurrentConversation(currentConvData || null);
         setIsMobileMenuOpen(false);
      }

      if (currentConvData) {
          const loadMessages = async () => {
              if (isMounted) {
                 setLoading((prev) => ({ ...prev, messages: true }));
                 setError((prev) => ({ ...prev, messages: null }));
              }
              try {
                  const data = await fetchMessages(conversationId);
                  if (isMounted) setMessages(data);
              } catch (err) {
                 if (isMounted) {
                     setError((prev) => ({ ...prev, messages: err.toString() }));
                     setMessages([]);
                 }
              } finally {
                 if (isMounted) setLoading((prev) => ({ ...prev, messages: false }));
              }
          };
          loadMessages();
      } else {
          if (isMounted) {
             setMessages([]);
             setCurrentConversation(null);
             setError(prev => ({ ...prev, messages: "Conversation not found."}));
             setLoading(prev => ({...prev, messages: false}));
          }
      }
      return () => { isMounted = false; };
  }, [conversationId, conversations, loading.conversations, navigate]);

  useEffect(() => {
    if (!loading.messages) {
      const timer = setTimeout(() => { scrollToBottom(); }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, loading.messages, scrollToBottom]);

  useEffect(() => {
    if (!addWsMessageListener || !user) return;

    const removeListener = addWsMessageListener((message) => {
      if (!message || message.type !== 'newMessage' || !message.payload || typeof message.payload.id === 'undefined' || !message.payload.sender) return;

      if (message.payload.conversationId === conversationId) {
        const realMessage = message.payload;
        setMessages((prevMessages) => {
          const realMessageExists = prevMessages.some(m => m.id === realMessage.id && typeof m.id !== 'string');
          if (realMessageExists) return prevMessages;

          const filteredMessages = prevMessages.filter(msg => {
            const isOptimisticMatch = (
              msg.id && typeof msg.id === 'string' && msg.id.startsWith('temp-') &&
              msg.content === realMessage.content &&
              msg.sender?.id === realMessage.sender?.id
            );
            return !isOptimisticMatch;
          });
          return [...filteredMessages, realMessage];
        });
      }
    });

    return () => removeListener();
  }, [addWsMessageListener, conversationId, user]);


  // Event Handlers remain the same (logic unchanged)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentConversation || !user) return;

    setSending(true);
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticMessage = {
      id: tempId,
      content: messageInput.trim(),
      type: 'text',
      conversationType: currentConversation.conversationType,
      conversationId: currentConversation.conversationId,
      sender: { id: user.id, name: user.name || 'You', profilePicture: user.profilePicture || null },
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    const messageToSend = messageInput.trim();
    setMessageInput("");

    try {
      const messageData = {
        content: messageToSend,
        conversationType: currentConversation.conversationType,
        conversationId: currentConversation.conversationId,
      };
      if (currentConversation.conversationType === "dm" && currentConversation.participant) {
        messageData.receiverId = currentConversation.participant.id;
      } else if (currentConversation.conversationType === "group" && currentConversation.groupInfo) {
        messageData.groupId = currentConversation.groupInfo.id;
      }
      await sendMessage(messageData);
    } catch (err) {
      alert(`Failed to send message: ${err}`);
      console.error("Send message error:", err);
      setMessages((prev) => prev.filter(msg => msg.id !== tempId));
      setMessageInput(messageToSend);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!messageId || typeof messageId === 'string') return;
    if (!window.confirm("Delete this message?")) return;
    try {
      await deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      alert(`Failed to delete message: ${err}`);
      console.error("Delete message error:", err);
    }
  };

  const handleSelectConversation = (conv) => {
    if (conv.conversationId !== conversationId) {
      setMessages([]);
      setLoading(prev => ({ ...prev, messages: true }));
      navigate(`/chat/${conv.conversationId}`);
    }
    setIsMobileMenuOpen(false);
  };

  // Render Logic
  const groupedDisplayMessages = groupMessages(messages);

  return (
    <>
      {/* NewChatModal remains unchanged */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
      />

      {/* Main Container - Updated Styles */}
      <div className="flex h-[calc(100vh-6rem)] md:h-[calc(100vh-7rem)] bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        {/* Mobile Menu Toggle Button - Updated Styles & Icon */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden fixed bottom-5 right-5 z-50 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-150"
          aria-label="Toggle chat menu"
        >
          {isMobileMenuOpen ? <XMarkIcon className="w-6 h-6"/> : <ChatBubbleLeftRightIcon className="w-6 h-6"/>}
        </button>

        {/* Conversations Sidebar - Updated Styles */}
        <div
          className={`${
            isMobileMenuOpen ? "fixed inset-0 z-40" : "hidden" // Keep mobile overlay behavior
          } md:relative md:flex w-full md:w-80 border-r border-gray-200 flex-col bg-white`} // Light bg, border
        >
          {/* Sidebar Header - Updated Styles */}
          <div className="p-4 border-b border-gray-200">
             <div className="flex items-center justify-between mb-3">
               <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
             </div>
             {/* New Chat Button - Updated Styles & Icon */}
             <button
                onClick={() => setIsNewChatModalOpen(true)}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-colors duration-150 text-sm font-medium flex items-center justify-center gap-1.5"
             >
                <PlusIcon className="w-4 h-4" strokeWidth={3}/> New Chat
             </button>
          </div>

          {/* Conversations List - Adjusted Styles */}
          <div className="flex-1 overflow-y-auto">
             {loading.conversations && <LoadingSpinner />}
             {error.conversations && <div className="p-3 m-2 bg-red-50 text-red-600 rounded text-xs text-center">Error: {error.conversations}</div>}
             {!loading.conversations && conversations.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">No conversations yet.</div>
             )}
             {!loading.conversations && conversations.map((conv) => (
                <ConversationItem
                   key={conv.conversationId}
                   conversation={conv}
                   isActive={conv.conversationId === conversationId}
                   onClick={() => handleSelectConversation(conv)}
                />
             ))}
          </div>
        </div>

        {/* Messages Area - Updated Background */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Conditional Rendering using updated EmptyState */}
          {!conversationId && !loading.conversations ? (
            <EmptyState icon={ChatBubbleBottomCenterTextIcon} title="Select a Conversation" description="Choose a chat from the left panel to view messages." />
           ) : loading.conversations && !currentConversation ? ( // Loading conv list initially
             <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>
           ) : !currentConversation && !loading.conversations && conversationId ? ( // Conv ID in URL but not found
            <EmptyState icon={QuestionMarkCircleIcon} title="Conversation Not Found" description="This conversation doesn't exist or you don't have access." />
           ) : ( // We have a valid conversationId
             <>
               {/* Chat Header - Updated Styles */}
               {currentConversation && (
                 <div className="p-3 border-b border-gray-200 flex items-center bg-white shadow-sm sticky top-0 z-10 h-16">
                   <img src={currentConversation.avatar || fallbackAvatar(currentConversation.name)} alt={currentConversation.name} className="h-9 w-9 rounded-full object-cover mr-3 border border-gray-200"/>
                   <div className="flex-1 min-w-0">
                     <h3 className="font-semibold text-sm text-gray-800 truncate">{currentConversation.name}</h3>
                     <p className="text-xs text-gray-500">{currentConversation.conversationType === 'dm' ? 'Direct Message' : 'Group Chat'}</p>
                   </div>
                   {/* Add Actions like search, info later if needed */}
                 </div>
               )}

               {/* Messages Display Area - Updated Padding */}
               <div className="flex-1 overflow-y-auto p-4 space-y-1">
                 {loading.messages && messages.length === 0 ? (
                   <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>
                 ) : error.messages ? (
                   <div className="p-3 m-2 bg-red-50 text-red-600 rounded text-xs text-center">Error loading messages: {error.messages}</div>
                 ) : messages.length === 0 && !loading.messages ? (
                   <EmptyState icon={ChatBubbleBottomCenterTextIcon} title="Start Chatting!" description={`Send the first message to ${currentConversation?.name || 'this chat'}.`} />
                 ) : (
                   <>
                     {/* Render messages with updated MessageBubble */}
                     {groupedDisplayMessages.map((msg) => (
                       <MessageBubble
                         key={msg.id && typeof msg.id === 'string' && msg.id.startsWith('temp-') ? msg.id : `${msg.id}-${msg.createdAt}`}
                         message={msg}
                         isOwn={msg.sender?.id === user?.id}
                         onDelete={handleDeleteMessage}
                         showAvatar={msg.showAvatar}
                       />
                     ))}
                     <div ref={messagesEndRef} className="h-1"/> {/* Scroll anchor */}
                   </>
                 )}
               </div>

               {/* Message Input Form - Updated Styles */}
               {currentConversation && (
                 <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 bg-white">
                   <div className="flex items-center space-x-2">
                     <input
                        ref={messageInputRef}
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        disabled={sending || (loading.messages && messages.length === 0) || !currentConversation}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-gray-50 placeholder-gray-400 disabled:opacity-60"
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }} // Send on Enter, prevent newline
                     />
                     <button
                        type="submit"
                        disabled={sending || !messageInput.trim() || (loading.messages && messages.length === 0) || !currentConversation}
                        className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                        aria-label="Send message"
                     >
                       {sending
                         ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                         : <PaperAirplaneIcon className="w-5 h-5"/>
                       }
                     </button>
                   </div>
                 </form>
               )}
             </>
           )}
        </div>
      </div>
    </>
  );
}

export default ChatPage;