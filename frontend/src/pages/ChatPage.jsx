// frontend/src/pages/ChatPage.jsx - COMPLETE IMPLEMENTATION (with duplicate fix v5 - Filter Logic)
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
          onError={(e) => { e.target.src = fallbackAvatar(conversation.name); }}
        />
        {conversation.unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg">
            {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 ml-3">
        <div className="flex justify-between items-baseline">
          <h3 className={`text-sm font-semibold truncate ${ conversation.unreadCount > 0 ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300" }`}>
            {conversation.name}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
            {formatTime(conversation.lastMessageTime)}
          </span>
        </div>
        <p className={`text-sm truncate ${ conversation.unreadCount > 0 ? "text-gray-900 dark:text-white font-medium" : "text-gray-500 dark:text-gray-400" }`}>
          {conversation.lastMessage || "No messages yet"}
        </p>
      </div>
    </div>
  );

const MessageBubble = ({ message, isOwn, onDelete, showAvatar = true }) => (
    <div className={`flex mb-4 ${isOwn ? "justify-end" : "justify-start"} group`}>
      {!isOwn && showAvatar && message.sender && (
        <img
          src={ message.sender.profilePicture || fallbackAvatar(message.sender.name) }
          alt={message.sender.name}
          className="h-8 w-8 rounded-full object-cover mr-2 flex-shrink-0"
          onError={(e) => { e.target.src = fallbackAvatar(message.sender.name); }}
        />
      )}
      {!isOwn && !showAvatar && <div className="w-8 mr-2 flex-shrink-0" />}

      <div className={`max-w-xs lg:max-w-md ${ isOwn ? "items-end" : "items-start" } flex flex-col`}>
        {!isOwn && showAvatar && message.sender && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 px-2">
            {message.sender.name}
          </p>
        )}
        <div className={`px-4 py-2 rounded-2xl shadow-sm ${ isOwn ? "bg-indigo-600 text-white rounded-br-sm" : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm" }`}>
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1 px-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatTime(message.createdAt)}
          </span>
          {isOwn && message.id && typeof message.id !== 'string' && ( // Check ID is not string (i.e., not temp)
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

      {isOwn && showAvatar && message.sender && (
        <img
          src={message.sender.profilePicture || fallbackAvatar("You")}
          alt="You"
          className="h-8 w-8 rounded-full object-cover ml-2 flex-shrink-0"
          onError={(e) => { e.target.src = fallbackAvatar("You"); }}
        />
      )}
      {isOwn && !showAvatar && <div className="w-8 ml-2 flex-shrink-0" />}
    </div>
  );

const EmptyState = ({ icon, title, description }) => (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 p-8 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">
        {title}
      </h3>
      <p className="text-sm max-w-md">{description}</p>
    </div>
  );

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
  const { user, addWsMessageListener } = useAuth();

  // State
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [loading, setLoading] = useState({ conversations: true, messages: false });
  const [error, setError] = useState({ conversations: null, messages: null });
  const [sending, setSending] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  // ===========================
  // HELPER FUNCTIONS
  // ===========================

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); // Smooth scroll back
  }, []);

  const groupMessages = useCallback((msgs = []) => {
    const grouped = [];
    let currentGroup = [];
    let lastSenderId = null;
    msgs.forEach((msg) => {
      const currentSenderId = msg?.sender?.id;
      if (!msg || currentSenderId !== lastSenderId || !currentSenderId) { // Check msg exists
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

  // ===========================
  // EFFECTS
  // ===========================

   // Load conversations
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
   }, [navigate]); // Only trigger once


   // Load messages & Set Current Conversation / Auto-select first
   useEffect(() => {
      let isMounted = true;
      if (loading.conversations) return; // Wait until conversations are loaded

      if (!conversationId) {
         // Auto-select first conversation if URL has no ID
         if (conversations.length > 0) {
            navigate(`/chat/${conversations[0].conversationId}`, { replace: true });
         } else {
            // No conversations exist yet
             if (isMounted) {
                setCurrentConversation(null);
                setMessages([]);
                setLoading(prev => ({ ...prev, messages: false })); // Stop messages loading
             }
         }
         return;
      };

      // Find current conv details now that conversations are loaded
      const currentConvData = conversations.find(c => c.conversationId === conversationId);
      if (isMounted) {
         setCurrentConversation(currentConvData || null);
         setIsMobileMenuOpen(false); // Close mobile menu
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
          // ConversationId in URL not found in list
          if (isMounted) {
             setMessages([]);
             setCurrentConversation(null); // Explicitly clear current conversation
             setError(prev => ({ ...prev, messages: "Conversation not found."}));
             setLoading(prev => ({...prev, messages: false}));
          }
      }
      return () => { isMounted = false; };
   }, [conversationId, conversations, loading.conversations, navigate]);


  // Auto-scroll effect
  useEffect(() => {
    if (!loading.messages) {
      const timer = setTimeout(() => { scrollToBottom(); }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, loading.messages, scrollToBottom]);


  // --- WebSocket Listener (v4 - Filter/Add Logic with Type Safety) ---
  useEffect(() => {
    if (!addWsMessageListener || !user) {
      console.log("WS Listener: Waiting for context or user...");
      return;
    }

    console.log(`WS Listener: Subscribing for conversation ${conversationId}`);

    const removeListener = addWsMessageListener((message) => {
      if (!message || message.type !== 'newMessage' || !message.payload || typeof message.payload.id === 'undefined' || !message.payload.sender) {
           console.warn("WS Listener: Received invalid message structure", message);
           return;
      }

      if (message.payload.conversationId === conversationId) {
        const realMessage = message.payload;
        console.log(`ChatPage received matching WS message (ID: ${realMessage.id}):`, realMessage);

        setMessages((prevMessages) => {
          // Check if the REAL message (by its final ID, ensuring it's not a string) already exists
          const realMessageExists = prevMessages.some(m => m.id === realMessage.id && typeof m.id !== 'string');
          if (realMessageExists) {
            console.log(`WS Listener: Real message ${realMessage.id} already exists, skipping.`);
            return prevMessages;
          }

          // Filter out the corresponding optimistic message
          let optimisticRemoved = false;
          const filteredMessages = prevMessages.filter(msg => {
            // Check if msg.id exists and is a string before calling startsWith
            const isOptimisticMatch = (
              msg.id && typeof msg.id === 'string' && msg.id.startsWith('temp-') &&
              msg.content === realMessage.content &&
              msg.sender?.id === realMessage.sender?.id
            );
            if (isOptimisticMatch) {
                console.log(`WS Listener: Filtering out optimistic message ${msg.id}`);
                optimisticRemoved = true;
            }
            // Keep the message if it's NOT the optimistic one to remove
            return !isOptimisticMatch;
          });

          // Add the REAL message to the filtered list
          console.log(`WS Listener: Adding real message ${realMessage.id}. Optimistic removed: ${optimisticRemoved}`);
          return [...filteredMessages, realMessage];
        });
      }
    });

    return () => {
      console.log("ChatPage removing WS listener for:", conversationId);
      removeListener();
    };
  }, [addWsMessageListener, conversationId, user]);
  // --- End WebSocket Listener ---

  // ===========================
  // EVENT HANDLERS
  // ===========================

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
      await sendMessage(messageData); // API call - WS listener handles adding/replacing
    } catch (err) {
      alert(`Failed to send message: ${err}`);
      console.error("Send message error:", err);
      setMessages((prev) => prev.filter(msg => msg.id !== tempId)); // Remove optimistic on error
      setMessageInput(messageToSend); // Restore input
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    // Prevent deleting optimistic or invalid IDs
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

  // ===========================
  // RENDER
  // ===========================

  const groupedDisplayMessages = groupMessages(messages);

  return (
    <>
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
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
             <div className="flex items-center justify-between mb-3">
               <h2 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h2>
             </div>
             <button
                onClick={() => setIsNewChatModalOpen(true)}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
             >
                <span className="text-lg">+</span> New Chat
             </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
             {loading.conversations && <div className="p-4 text-center"><LoadingSpinner /></div>}
             {error.conversations && <div className="p-4 m-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded text-sm">Error: {error.conversations}</div>}
             {!loading.conversations && conversations.length === 0 && (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">No conversations yet.</div>
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

        {/* Messages Area */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
          {/* Conditional Rendering based on state */}
          {!conversationId && !loading.conversations ? (
            <EmptyState icon="👈" title="Select a Conversation" description="Choose a chat from the left panel." />
           ) : loading.conversations && !currentConversation ? (
             <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>
           ) : !currentConversation && !loading.conversations ? (
            <EmptyState icon="❓" title="Conversation Not Found" description="Select a valid conversation." />
           ) : ( // We have a valid conversationId and potentially a currentConversation object
             <>
               {/* Chat Header (Render only when currentConversation is loaded) */}
               {currentConversation && (
                 <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
                   <img src={currentConversation.avatar || fallbackAvatar(currentConversation.name)} alt={currentConversation.name} className="h-10 w-10 rounded-full object-cover mr-3"/>
                   <div className="flex-1 min-w-0">
                     <h3 className="font-semibold text-gray-900 dark:text-white truncate">{currentConversation.name}</h3>
                     <p className="text-xs text-gray-500 dark:text-gray-400">{currentConversation.conversationType === 'dm' ? 'Direct Message' : 'Group Chat'}</p>
                   </div>
                 </div>
               )}

               {/* Messages Display Area */}
               <div className="flex-1 overflow-y-auto p-4 space-y-1">
                 {loading.messages && messages.length === 0 ? ( // Show loading only when empty and loading
                   <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>
                 ) : error.messages ? (
                   <div className="p-4 m-4 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded text-sm text-center">Error: {error.messages}</div>
                 ) : messages.length === 0 && !loading.messages ? ( // Show empty only when not loading and empty
                   <EmptyState icon="👋" title="Start Chatting!" description="Send the first message." />
                 ) : (
                   <>
                     {/* Render messages */}
                     {groupedDisplayMessages.map((msg) => (
                       <MessageBubble
                         key={msg.id && typeof msg.id === 'string' && msg.id.startsWith('temp-') ? msg.id : `${msg.id}-${msg.createdAt}`} // Robust key
                         message={msg}
                         isOwn={msg.sender?.id === user?.id}
                         onDelete={handleDeleteMessage}
                         showAvatar={msg.showAvatar}
                       />
                     ))}
                     <div ref={messagesEndRef} />
                   </>
                 )}
               </div>

               {/* Message Input Form (Render only if currentConversation exists) */}
               {currentConversation && (
                 <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                   <div className="flex space-x-2">
                     <input ref={messageInputRef} type="text" value={messageInput} onChange={(e) => setMessageInput(e.target.value)} placeholder="Type a message..." disabled={sending || (loading.messages && messages.length === 0) || !currentConversation} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400 disabled:opacity-50" />
                     <button type="submit" disabled={sending || !messageInput.trim() || (loading.messages && messages.length === 0) || !currentConversation} className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium">
                       {sending ? "..." : "Send"}
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