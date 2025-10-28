// frontend/src/pages/Friendspage.jsx - Refactored for Light Mode
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  fetchFriends,
  fetchPendingRequests,
  fetchFriendSuggestions,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
} from "../api/friends"; // Import API functions
import { useAuth } from "../hooks/useAuth";
import {
    UserPlusIcon,
    UserMinusIcon,
    CheckIcon,
    XMarkIcon,
    ChatBubbleLeftEllipsisIcon,
    ClockIcon
} from '@heroicons/react/20/solid'; // Using solid Heroicons for actions

// Helper for fallback avatar
const fallbackAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random&color=fff`;

// UserCard component - Refactored for Light Mode
const UserCard = ({ user, children }) => (
  // Card styling: white background, border, rounded corners, subtle hover
  <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors duration-150">
    <div className="flex items-center space-x-3 min-w-0"> {/* Added min-w-0 for truncation */}
      <img
        className="h-10 w-10 rounded-full object-cover border border-gray-200" // Added border
        src={user.profilePicture || fallbackAvatar(user.name)}
        alt={user.name || 'User'}
        onError={(e) => { e.target.onerror = null; e.target.src=fallbackAvatar(user.name)}}
      />
      <div className="min-w-0"> {/* Added min-w-0 */}
        <Link
          to={`/profile/${user.id}`}
          className="text-sm font-semibold text-gray-800 hover:text-indigo-600 truncate block" // Truncate and block
          title={user.name} // Add title for full name on hover
        >
          {user.name}
        </Link>
        <p className="text-xs text-gray-500 truncate" title={user.studentId}>
          {user.studentId}
        </p>
        {/* Optional: Show department/semester, ensure truncation if needed */}
        {/* <p className="text-xs text-gray-500 truncate" title={`${user.department} - Sem ${user.semester}`}>
          {user.department} - Sem {user.semester}
        </p> */}
      </div>
    </div>
    {/* Action Buttons Container */}
    <div className="flex space-x-2 flex-shrink-0">{children}</div>
  </div>
);

// Loading Placeholder
const LoadingSkeleton = () => (
    <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md">
        <div className="flex items-center space-x-3 animate-pulse">
            <div className="h-10 w-10 rounded-full bg-gray-200"></div>
            <div className="space-y-1.5">
                <div className="h-3 w-24 bg-gray-200 rounded"></div>
                <div className="h-2 w-16 bg-gray-200 rounded"></div>
            </div>
        </div>
        <div className="flex space-x-2">
            <div className="h-6 w-16 bg-gray-200 rounded"></div>
            <div className="h-6 w-16 bg-gray-200 rounded"></div>
        </div>
    </div>
);

// Main FriendsPage Component
function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState({
    friends: true,
    requests: true,
    suggestions: true,
  });
  const [error, setError] = useState({
    friends: null,
    requests: null,
    suggestions: null,
  });
  const [actionLoading, setActionLoading] = useState({});
  const [sentRequests, setSentRequests] = useState(new Set());
  const { user } = useAuth(); // GET CURRENT USER

  // Function to load all data (logic remains the same)
  const loadAllData = useCallback(async () => {
    // Keep loading state combined for initial load shimmer effect
    setLoading({ friends: true, requests: true, suggestions: true });
    setError({ friends: null, requests: null, suggestions: null });

    try {
      const [friendsData, requestsData, suggestionsData] = await Promise.all([
        fetchFriends(),
        fetchPendingRequests(),
        fetchFriendSuggestions(),
      ]);
      setFriends(friendsData || []);
      setRequests(requestsData || []);
      setSuggestions(suggestionsData || []);
       // Clear specific errors on success
      setError({ friends: null, requests: null, suggestions: null });
    } catch (err) {
      console.error("Failed to load friends data:", err);
      // Set a general error for simplicity, or specific if needed
      const errorMsg = err.toString();
      setError({ friends: errorMsg, requests: errorMsg, suggestions: errorMsg });
    } finally {
      setLoading({ friends: false, requests: false, suggestions: false });
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Action Handlers (logic remains the same)
  const handleAccept = async (requestId) => {
    setActionLoading((prev) => ({ ...prev, [`accept-${requestId}`]: true }));
    try {
      await acceptFriendRequest(requestId);
      await loadAllData();
    } catch (err) {
      alert(`Error accepting request: ${err}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`accept-${requestId}`]: false }));
    }
  };

  const handleReject = async (requestId) => {
    setActionLoading((prev) => ({ ...prev, [`reject-${requestId}`]: true }));
    try {
      await rejectFriendRequest(requestId);
      await loadAllData();
    } catch (err) {
      alert(`Error rejecting request: ${err}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`reject-${requestId}`]: false }));
    }
  };

  const handleRemove = async (friendId, friendName) => {
    if (!window.confirm(`Are you sure you want to remove ${friendName} as a friend?`)) return;
    setActionLoading((prev) => ({ ...prev, [`remove-${friendId}`]: true }));
    try {
      await removeFriend(friendId);
      await loadAllData();
    } catch (err) {
      alert(`Error removing friend: ${err}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`remove-${friendId}`]: false }));
    }
  };

  const handleAddFriend = async (userId) => {
    setActionLoading((prev) => ({ ...prev, [`add-${userId}`]: true }));
    try {
      await sendFriendRequest(userId);
      setSentRequests((prev) => new Set(prev).add(userId));
    } catch (err) {
      alert(`Error sending request: ${err}`);
        // Optionally remove from sentRequests on error?
        // setSentRequests(prev => {
        //     const next = new Set(prev);
        //     next.delete(userId);
        //     return next;
        // });
    } finally {
      setActionLoading((prev) => ({ ...prev, [`add-${userId}`]: false }));
    }
  };

  // Render Section Helper - Refactored for Light Mode
  const renderSection = (title, data, isLoading, errorMsg, renderItem, sectionKey) => (
    // Section styling: white bg, border, rounded, shadow
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-800">
          {title}
        </h2>
      </div>
      <div className="p-4">
        {isLoading && (
            // Show skeleton loaders during initial load
             <div className="space-y-3">
                {[...Array(3)].map((_, i) => <LoadingSkeleton key={`${sectionKey}-skel-${i}`} />)}
             </div>
        )}
        {errorMsg && !isLoading && (
          <p className="text-center text-sm text-red-600 py-4">Error loading data: {errorMsg}</p>
        )}
        {!isLoading && !errorMsg && data.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-4">
            Nothing to show here.
          </p>
        )}
        {!isLoading && !errorMsg && data.length > 0 && (
          <div className="space-y-3">{data.map(renderItem)}</div>
        )}
      </div>
    </div>
  );

  // Determine if any section is still in the initial loading phase
  const isInitialLoading = loading.requests || loading.friends || loading.suggestions;

  return (
    // Main container styling
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">
        Friends & Connections
      </h1>

      {/* Friend Requests Section */}
      {renderSection(
        "Pending Friend Requests",
        requests,
        isInitialLoading, // Use combined loading state for shimmer
        error.requests,
        (request) => (
          <UserCard key={`req-${request.id}`} user={request.friend}>
            {/* Action Buttons - Refactored Styles & Icons */}
            <button
              onClick={() => handleAccept(request.id)}
              disabled={actionLoading[`accept-${request.id}`]}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500"
              title="Accept Request"
            >
              <CheckIcon className="w-3.5 h-3.5"/>
              {actionLoading[`accept-${request.id}`] ? "..." : "Accept"}
            </button>
            <button
              onClick={() => handleReject(request.id)}
              disabled={actionLoading[`reject-${request.id}`]}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300"
              title="Reject Request"
            >
              <XMarkIcon className="w-3.5 h-3.5"/>
              {actionLoading[`reject-${request.id}`] ? "..." : "Reject"}
            </button>
          </UserCard>
        ),
        "requests" // sectionKey for skeleton keys
      )}

      {/* My Friends Section */}
      {renderSection(
        "My Friends",
        friends,
        isInitialLoading, // Use combined loading state for shimmer
        error.friends,
        (friend) => (
          <UserCard key={`friend-${friend.id}`} user={friend}>
             {/* Action Buttons - Refactored Styles & Icons */}
            <Link
              to={`/chat/dm_${Math.min(user.id, friend.id)}_${Math.max(user.id, friend.id)}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
              title={`Send message to ${friend.name}`}
            >
              <ChatBubbleLeftEllipsisIcon className="w-3.5 h-3.5"/>
              Message
            </Link>
            <button
              onClick={() => handleRemove(friend.id, friend.name)}
              disabled={actionLoading[`remove-${friend.id}`]}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
              title={`Remove ${friend.name}`}
            >
               <UserMinusIcon className="w-3.5 h-3.5"/>
              {actionLoading[`remove-${friend.id}`] ? "..." : "Remove"}
            </button>
          </UserCard>
        ),
        "friends" // sectionKey for skeleton keys
      )}

      {/* Friend Suggestions Section */}
      {renderSection(
        "Suggestions",
        suggestions,
        isInitialLoading, // Use combined loading state for shimmer
        error.suggestions,
        (suggestion) => {
          const hasSentRequest = sentRequests.has(suggestion.id);
          const isLoadingAction = actionLoading[`add-${suggestion.id}`];

          return (
            <UserCard key={`sug-${suggestion.id}`} user={suggestion}>
               {/* Action Button - Refactored Styles & Icons */}
              <button
                onClick={() => handleAddFriend(suggestion.id)}
                disabled={isLoadingAction || hasSentRequest}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 ${
                  hasSentRequest
                    ? "bg-gray-400 cursor-not-allowed" // Pending style
                    : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500" // Add style
                }`}
                title={hasSentRequest ? "Request Pending" : `Send friend request to ${suggestion.name}`}
              >
                {isLoadingAction ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                ) : hasSentRequest ? (
                   <ClockIcon className="w-3.5 h-3.5"/>
                ) : (
                   <UserPlusIcon className="w-3.5 h-3.5"/>
                )}
                {isLoadingAction
                  ? "Sending..."
                  : hasSentRequest
                  ? "Pending"
                  : "Add Friend"}
              </button>
            </UserCard>
          );
        },
        "suggestions" // sectionKey for skeleton keys
      )}
    </div>
  );
}

export default FriendsPage;