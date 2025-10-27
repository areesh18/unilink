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
// Reusable component for displaying a user profile summary
const UserCard = ({ user, children }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md shadow-sm">
    <div className="flex items-center space-x-3">
      <img
        className="h-10 w-10 rounded-full object-cover bg-gray-300 dark:bg-gray-600"
        src={
          user.profilePicture ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            user.name
          )}&background=random`
        } // Basic fallback avatar
        alt={user.name}
      />
      <div>
        <Link
          to={`/profile/${user.id}`}
          className="text-sm font-medium text-gray-900 dark:text-white hover:underline"
        >
          {user.name}
        </Link>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {user.studentId}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {user.department} - Sem {user.semester}
        </p>
      </div>
    </div>
    <div className="flex space-x-2">{children}</div>{" "}
    {/* Action buttons go here */}
  </div>
);

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
  const [actionLoading, setActionLoading] = useState({}); // Track loading state for specific buttons
  const [sentRequests, setSentRequests] = useState(new Set());
  const { user } = useAuth(); // GET CURRENT USER

  // Function to load all data
  const loadAllData = useCallback(async () => {
    setLoading({ friends: true, requests: true, suggestions: true });
    setError({ friends: null, requests: null, suggestions: null });

    try {
      const [friendsData, requestsData, suggestionsData] = await Promise.all([
        fetchFriends(),
        fetchPendingRequests(),
        fetchFriendSuggestions(),
      ]);
      setFriends(friendsData);
      setRequests(requestsData);
      setSuggestions(suggestionsData);
    } catch (err) {
      console.error("Failed to load friends data:", err);
      // Show a general error, or set specific errors if needed
      setError((prev) => ({
        ...prev,
        friends: err.toString(),
        requests: err.toString(),
        suggestions: err.toString(),
      }));
    } finally {
      setLoading({ friends: false, requests: false, suggestions: false });
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]); // Run once on mount

  // --- Action Handlers ---
  const handleAccept = async (requestId) => {
    setActionLoading((prev) => ({ ...prev, [`accept-${requestId}`]: true }));
    try {
      await acceptFriendRequest(requestId);
      // Refresh all data to reflect changes
      await loadAllData();
    } catch (err) {
      alert(`Error accepting request: ${err}`); // Simple alert for now
    } finally {
      setActionLoading((prev) => ({ ...prev, [`accept-${requestId}`]: false }));
    }
  };

  const handleReject = async (requestId) => {
    setActionLoading((prev) => ({ ...prev, [`reject-${requestId}`]: true }));
    try {
      await rejectFriendRequest(requestId);
      await loadAllData(); // Refresh data
    } catch (err) {
      alert(`Error rejecting request: ${err}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [`reject-${requestId}`]: false }));
    }
  };

  const handleRemove = async (friendId) => {
    if (!window.confirm("Are you sure you want to remove this friend?")) return;
    setActionLoading((prev) => ({ ...prev, [`remove-${friendId}`]: true }));
    try {
      await removeFriend(friendId);
      await loadAllData(); // Refresh data
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
      // --- Add user ID to sent requests state ---
      setSentRequests((prev) => new Set(prev).add(userId));
      // --- End addition ---
      // No need for alert if button state changes
      // alert('Friend request sent!');

      // Optional: Refresh suggestions slightly later or not at all
      // await loadAllData(); // You might delay or remove this immediate refresh
    } catch (err) {
      alert(`Error sending request: ${err}`);
    } finally {
      // Clear loading state regardless of success/error
      setActionLoading((prev) => ({ ...prev, [`add-${userId}`]: false }));
    }
  };

  // --- Render Helper Functions ---
  const renderSection = (title, data, isLoading, errorMsg, renderItem) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
        {title}
      </h2>
      {isLoading && (
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      )}
      {errorMsg && !isLoading && (
        <p className="text-red-500 dark:text-red-400">Error: {errorMsg}</p>
      )}
      {!isLoading && !errorMsg && data.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">
          Nothing to show here.
        </p>
      )}
      {!isLoading && !errorMsg && data.length > 0 && (
        <div className="space-y-3">{data.map(renderItem)}</div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Friends & Connections
      </h1>

      {/* Friend Requests Section */}
      {renderSection(
        "Pending Friend Requests",
        requests,
        loading.requests,
        error.requests,
        (request) => (
          <UserCard key={request.id} user={request.friend}>
            {" "}
            {/* request.friend is the sender */}
            <button
              onClick={() => handleAccept(request.id)}
              disabled={actionLoading[`accept-${request.id}`]}
              className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {actionLoading[`accept-${request.id}`] ? "..." : "Accept"}
            </button>
            <button
              onClick={() => handleReject(request.id)}
              disabled={actionLoading[`reject-${request.id}`]}
              className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              {actionLoading[`reject-${request.id}`] ? "..." : "Reject"}
            </button>
          </UserCard>
        )
      )}

      {/* My Friends Section */}
      {renderSection(
        "My Friends",
        friends,
        loading.friends,
        error.friends,
        (friend) => (
          <UserCard key={friend.id} user={friend}>
            {/* NEW MESSAGE BUTTON */}
            <Link
              to={`/chat/dm_${Math.min(user.id, friend.id)}_${Math.max(
                user.id,
                friend.id
              )}`}
              className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
              title="Send message"
            >
              Message
            </Link>
            <button
              onClick={() => handleRemove(friend.id)}
              disabled={actionLoading[`remove-${friend.id}`]}
              className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading[`remove-${friend.id}`] ? "..." : "Remove"}
            </button>
          </UserCard>
        )
      )}

      {/* Friend Suggestions Section */}
      {renderSection(
        "Suggestions",
        suggestions,
        loading.suggestions,
        error.suggestions,
        (suggestion) => {
          // Check if a request has been sent to this suggestion
          const hasSentRequest = sentRequests.has(suggestion.id);

          return (
            <UserCard key={suggestion.id} user={suggestion}>
              <button
                onClick={() => handleAddFriend(suggestion.id)}
                // Disable if request sent OR if action is loading
                disabled={
                  actionLoading[`add-${suggestion.id}`] || hasSentRequest
                }
                className={`px-3 py-1 text-xs font-medium text-white rounded disabled:opacity-50 ${
                  hasSentRequest
                    ? "bg-gray-400 cursor-not-allowed" // Style for pending/sent
                    : "bg-indigo-600 hover:bg-indigo-700" // Style for add
                }`}
              >
                {actionLoading[`add-${suggestion.id}`]
                  ? "..."
                  : hasSentRequest
                  ? "Pending" // Change text after sending
                  : "Add Friend"}
              </button>
            </UserCard>
          );
        }
      )}
    </div>
  );
}

export default FriendsPage;
