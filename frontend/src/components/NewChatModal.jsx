// frontend/src/components/NewChatModal.jsx - Refactored for Light Mode
import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { fetchFriends } from '../api/friends';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Import useAuth to get current user ID
import { UsersIcon,XMarkIcon, UserPlusIcon, ArrowRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'; // Icons

// Helper for fallback avatar
const fallbackAvatar = (name) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=6366f1&color=fff&bold=true`;

// Loading Spinner Component
const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
    </div>
  );

function NewChatModal({ isOpen, onClose }) {
    const navigate = useNavigate();
    const { user } = useAuth(); // Get current user from context
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Use useCallback for loadFriends
    const loadFriends = useCallback(async () => {
        setLoading(true);
        setError(null);
        setSearchQuery(''); // Reset search on open/reload
        try {
            const data = await fetchFriends();
            setFriends(data || []); // Ensure friends is always an array
        } catch (err) {
            setError(err.toString());
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency array as it doesn't depend on external state/props

    useEffect(() => {
        if (isOpen) {
            loadFriends();
        }
    }, [isOpen, loadFriends]); // Add loadFriends to dependency array

    const handleStartChat = (friend) => {
        if (!user) {
             console.error("Current user not found, cannot start chat.");
             setError("Could not identify current user."); // Show error to user
             return;
        }
        // Use current user's ID from context
        const currentUserId = user.id;
        const conversationId = currentUserId < friend.id
            ? `dm_${currentUserId}_${friend.id}`
            : `dm_${friend.id}_${currentUserId}`;

        onClose(); // Close modal first
        navigate(`/chat/${conversationId}`); // Navigate to chat page
    };

    // Filter friends based on search query (name, studentId, department)
    const filteredFriends = friends.filter(friend =>
        friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (friend.department && friend.department.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Don't render if not open
    if (!isOpen) return null;

    return (
        // Modal Backdrop: fixed position, z-index, centered content, background overlay
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity duration-200">
            {/* Modal Container: white bg, rounded, shadow, size constraints, flex layout */}
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden border border-gray-200">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Start New Chat
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-150 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                        aria-label="Close modal"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-gray-100 flex-shrink-0 relative">
                    <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-7 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search friends by name, ID, or department..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm placeholder-gray-400"
                    />
                </div>

                {/* Friends List Area */}
                <div className="flex-1 overflow-y-auto p-2"> {/* Reduced padding for list items */}
                    {loading && <LoadingSpinner />}

                    {error && (
                        <div className="m-2 bg-red-50 text-red-700 rounded-md p-3 text-sm border border-red-200">
                            Error: {error}
                        </div>
                    )}

                    {/* Empty state: No friends */}
                    {!loading && !error && friends.length === 0 && (
                        <div className="text-center py-10 px-4 text-gray-500">
                             <UsersIcon className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                            <p className="mb-2 text-sm font-medium text-gray-700">No friends yet</p>
                            <p className="text-xs mb-4">Add friends to start chatting with them.</p>
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate('/friends');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                            >
                                <UserPlusIcon className="w-3.5 h-3.5" />
                                Find Friends
                            </button>
                        </div>
                    )}

                    {/* Empty state: No search results */}
                    {!loading && !error && filteredFriends.length === 0 && friends.length > 0 && (
                        <div className="text-center py-10 px-4 text-sm text-gray-500">
                            No friends match your search.
                        </div>
                    )}

                    {/* Display filtered friends */}
                    {!loading && !error && filteredFriends.length > 0 && (
                        <div className="space-y-1 p-2">
                            {filteredFriends.map((friend) => (
                                <button
                                    key={friend.id}
                                    onClick={() => handleStartChat(friend)}
                                    className="w-full flex items-center p-2.5 rounded-md hover:bg-gray-100 transition-colors duration-150 text-left group" // Adjusted padding and hover
                                >
                                    <img
                                        src={friend.profilePicture || fallbackAvatar(friend.name)}
                                        alt={friend.name}
                                        className="h-9 w-9 rounded-full object-cover border border-gray-200 flex-shrink-0" // Adjusted size and added border
                                        onError={(e) => { e.target.onerror = null; e.target.src = fallbackAvatar(friend.name); }}
                                    />
                                    <div className="ml-3 flex-1 min-w-0"> {/* Ensure truncation works */}
                                        <p className="text-sm font-medium text-gray-800 truncate group-hover:text-indigo-600">
                                            {friend.name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {friend.studentId} {friend.department ? `• ${friend.department}` : ''}
                                        </p>
                                    </div>
                                    <ArrowRightIcon className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 ml-2 flex-shrink-0 transition-colors duration-150" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default NewChatModal;