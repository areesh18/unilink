// frontend/src/components/NewChatModal.jsx - NEW FILE
import React, { useState, useEffect } from 'react';
import { fetchFriends } from '../api/friends';
import { useNavigate } from 'react-router-dom';

// Helper for fallback avatar
const fallbackAvatar = (name) => 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&bold=true`;

function NewChatModal({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadFriends();
        }
    }, [isOpen]);

    const loadFriends = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchFriends();
            setFriends(data);
        } catch (err) {
            setError(err.toString());
        } finally {
            setLoading(false);
        }
    };

    const handleStartChat = (friend) => {
        // Generate conversation ID (sorted IDs for consistency)
        const currentUserId = 1; // This would come from useAuth in real implementation
        const conversationId = currentUserId < friend.id 
            ? `dm_${currentUserId}_${friend.id}`
            : `dm_${friend.id}_${currentUserId}`;
        
        onClose();
        navigate(`/chat/${conversationId}`);
    };

    const filteredFriends = friends.filter(friend =>
        friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.studentId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4 max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Start New Chat
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <input
                        type="text"
                        placeholder="Search friends..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                </div>

                {/* Friends List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading && (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg p-3 text-sm">
                            Error: {error}
                        </div>
                    )}

                    {!loading && !error && friends.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <p className="mb-2">No friends yet</p>
                            <button
                                onClick={() => {
                                    onClose();
                                    navigate('/friends');
                                }}
                                className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
                            >
                                Add friends to start chatting
                            </button>
                        </div>
                    )}

                    {!loading && !error && filteredFriends.length === 0 && friends.length > 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No friends match your search
                        </div>
                    )}

                    {!loading && !error && filteredFriends.length > 0 && (
                        <div className="space-y-2">
                            {filteredFriends.map((friend) => (
                                <button
                                    key={friend.id}
                                    onClick={() => handleStartChat(friend)}
                                    className="w-full flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <img
                                        src={friend.profilePicture || fallbackAvatar(friend.name)}
                                        alt={friend.name}
                                        className="h-10 w-10 rounded-full object-cover"
                                        onError={(e) => { e.target.src = fallbackAvatar(friend.name); }}
                                    />
                                    <div className="ml-3 text-left flex-1">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {friend.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {friend.studentId} • {friend.department}
                                        </p>
                                    </div>
                                    <span className="text-indigo-600 dark:text-indigo-400 text-xl">
                                        →
                                    </span>
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