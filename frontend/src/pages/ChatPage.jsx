// src/pages/ChatPage.jsx - MODIFIED (Height, Mobile Sidebar Logic)
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
  Bars3Icon, // For mobile toggle in header
  XMarkIcon,
  PaperAirplaneIcon,
  PlusIcon,
  ChatBubbleBottomCenterTextIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { TrashIcon } from '@heroicons/react/20/solid';


// ===========================
// HELPER FUNCTIONS
// ===========================

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

const fallbackAvatar = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || 'User'
  )}&background=6366f1&color=fff&bold=true`;

// ===========================
// SUB-COMPONENTS
// ===========================

const ConversationItem = ({ conversation, isActive, onClick }) => (
    <div
      onClick={onClick}
      className={`flex items-center p-3 cursor-pointer transition-colors duration-150 border-b border-gray-100 ${
        isActive
          ? "bg-indigo-50 border-l-4 border-indigo-500"
          : "hover:bg-gray-50 border-l-4 border-transparent"
      }`}
    >
      <div className="relative flex-shrink-0">
        <img
          src={conversation.avatar || fallbackAvatar(conversation.name)}
          alt={conversation.name}
          className="h-11 w-11 rounded-full object-cover border border-gray-200"
          onError={(e) => { e.target.src = fallbackAvatar(conversation.name); }}
        />
        {conversation.unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold shadow-sm">
            {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 ml-3">
        <div className="flex justify-between items-baseline">
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

const MessageBubble = ({ message, isOwn, onDelete, showAvatar = true }) => (
    <div className={`flex mb-3 ${isOwn ? "justify-end" : "justify-start"} group`}>
      {!isOwn && showAvatar && message.sender && (
        <img
          src={ message.sender.profilePicture || fallbackAvatar(message.sender.name) }
          alt={message.sender.name}
          className="h-8 w-8 rounded-full object-cover mr-2 flex-shrink-0 border border-gray-200"
          onError={(e) => { e.target.src = fallbackAvatar(message.sender.name); }}
        />
      )}
      {!isOwn && !showAvatar && <div className="w-8 mr-2 flex-shrink-0" />}

      <div className={`max-w-[70%] sm:max-w-[60%] ${ isOwn ? "items-end" : "items-start" } flex flex-col`}>
        {!isOwn && showAvatar && message.sender && (
          <p className="text-xs text-gray-500 mb-0.5 px-2">
            {message.sender.name}
          </p>
        )}
        <div className={`px-3 py-2 rounded-lg shadow-sm text-sm ${
              isOwn
                ? "bg-indigo-600 text-white rounded-br-none"
                : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
            }`}>
          <p className="whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
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
    </div>
  );

const EmptyState = ({ icon: IconComponent, title, description }) => (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
      <IconComponent className="w-16 h-16 text-gray-300 mb-4" strokeWidth={1} />
      <h3 className="text-lg font-semibold mb-1 text-gray-700">
        {title}
      </h3>
      <p className="text-sm max-w-sm">{description}</p>
    </div>
  );

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

  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [loading, setLoading] = useState({ conversations: true, messages: false });
  const [error, setError] = useState({ conversations: null, messages: null });
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

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
         setIsMobileMenuOpen(false); // Close mobile sidebar when conversation changes
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
       // Focus input after sending or error
      messageInputRef.current?.focus();
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
    // No need to setIsMobileMenuOpen(false) here, it's handled in useEffect
  };

  // Render Logic
  const groupedDisplayMessages = groupMessages(messages);

  return (
    <>
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
      />

      {/* Main Container - Updated Height Calculation */}
      {/* 4rem top nav + 4rem bottom nav = 8rem total on mobile */}
      <div className="flex h-[calc(100vh-4rem-4rem)] md:h-[calc(100vh-4rem)] bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">

        {/* Conversations Sidebar - Adjusted Mobile Overlay */}
        <div
          className={`
            ${isMobileMenuOpen ? 'fixed md:static inset-0 z-40 bg-white' : 'hidden'}
             md:flex w-full md:w-80 border-r border-gray-200 flex-col
          `}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0 h-16 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
              {/* Close button for mobile overlay */}
              <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="md:hidden p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Close menu"
              >
                  <XMarkIcon className="w-5 h-5" />
              </button>
          </div>
          {/* New Chat Button (Below Header) */}
          <div className="p-4 border-b border-gray-100 flex-shrink-0">
             <button
                onClick={() => setIsNewChatModalOpen(true)}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-colors duration-150 text-sm font-medium flex items-center justify-center gap-1.5"
             >
                <PlusIcon className="w-4 h-4" strokeWidth={3}/> New Chat
             </button>
          </div>

          {/* Conversations List */}
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

        {/* Messages Area - Added overlay for mobile */}
        <div
            className={`flex-1 flex flex-col bg-gray-50 transition-opacity duration-200 ${
              isMobileMenuOpen ? 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto' : 'opacity-100' // Hide visually on mobile when sidebar open
            }`}
          >
           {/* Conditional Rendering */}
           {!conversationId && !loading.conversations ? (
             <EmptyState icon={ChatBubbleBottomCenterTextIcon} title="Select a Conversation" description="Choose a chat from the left panel to view messages." />
            ) : loading.conversations && !currentConversation ? (
              <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>
            ) : !currentConversation && !loading.conversations && conversationId ? (
             <EmptyState icon={QuestionMarkCircleIcon} title="Conversation Not Found" description="This conversation doesn't exist or you don't have access." />
            ) : (
              <>
                {/* Chat Header */}
                {currentConversation && (
                  <div className="p-3 border-b border-gray-200 flex items-center bg-white shadow-sm flex-shrink-0 h-16">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden mr-2 p-2 -ml-1 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
                        aria-label="Toggle chat list"
                    >
                         <Bars3Icon className="w-6 h-6" />
                    </button>
                    <img src={currentConversation.avatar || fallbackAvatar(currentConversation.name)} alt={currentConversation.name} className="h-9 w-9 rounded-full object-cover mr-3 border border-gray-200"/>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-800 truncate">{currentConversation.name}</h3>
                      <p className="text-xs text-gray-500">{currentConversation.conversationType === 'dm' ? 'Direct Message' : 'Group Chat'}</p>
                    </div>
                  </div>
                )}

                {/* Messages Display Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                   {loading.messages && messages.length === 0 ? (
                     <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>
                   ) : error.messages ? (
                     <div className="p-3 m-2 bg-red-50 text-red-600 rounded text-xs text-center">Error loading messages: {error.messages}</div>
                   ) : messages.length === 0 && !loading.messages ? (
                     <EmptyState icon={ChatBubbleBottomCenterTextIcon} title="Start Chatting!" description={`Send the first message to ${currentConversation?.name || 'this chat'}.`} />
                   ) : (
                     <>
                       {groupedDisplayMessages.map((msg) => (
                         <MessageBubble
                           key={msg.id && typeof msg.id === 'string' && msg.id.startsWith('temp-') ? msg.id : `${msg.id}-${msg.createdAt}`}
                           message={msg}
                           isOwn={msg.sender?.id === user?.id}
                           onDelete={handleDeleteMessage}
                           showAvatar={msg.showAvatar}
                         />
                       ))}
                       <div ref={messagesEndRef} className="h-1"/>
                     </>
                   )}
                </div>

                {/* Message Input Form */}
                {currentConversation && (
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
                     <div className="flex items-center space-x-2">
                     <input
                        ref={messageInputRef}
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        disabled={sending || (loading.messages && messages.length === 0) || !currentConversation}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-gray-50 placeholder-gray-400 disabled:opacity-60"
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
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