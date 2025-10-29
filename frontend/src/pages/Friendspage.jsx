// frontend/src/pages/Friendspage.jsx - Fully Optimized & Responsive & Real-time Updates
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  fetchFriends,
  fetchPendingRequests,
  fetchFriendSuggestions,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  sendFriendRequest,
} from "../api/friends";
import { searchUsers } from "../api/profile";
import { useAuth } from "../hooks/useAuth"; // Import useAuth
import {
    UserPlusIcon,
    UserMinusIcon,
    CheckIcon,
    XMarkIcon,
    ChatBubbleLeftEllipsisIcon,
    ClockIcon,
    MagnifyingGlassIcon,
    UsersIcon,
    UserGroupIcon,
    SparklesIcon,
    InboxIcon,
    ArrowPathIcon, // For manual refresh button
} from '@heroicons/react/24/outline';

// Helper for fallback avatar (remains the same)
const fallbackAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=random&color=fff&bold=true`;

// Enhanced UserCard component (remains the same)
const UserCard = ({ user, children, variant = 'default' }) => (
    <div className="group flex items-center gap-3 p-3 sm:p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all duration-200">
      <Link to={`/profile/${user.id}`} className="flex-shrink-0">
        <img
          className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover border-2 border-gray-100 group-hover:border-indigo-200 transition-colors"
          src={user.profilePicture || fallbackAvatar(user.name)}
          alt={user.name || 'User'}
          onError={(e) => { e.target.onerror = null; e.target.src=fallbackAvatar(user.name)}}
        />
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          to={`/profile/${user.id}`}
          className="block text-sm sm:text-base font-semibold text-gray-900 hover:text-indigo-600 transition-colors group-hover:text-indigo-600"
          title={user.name}
        >
          <span className="line-clamp-1">{user.name}</span>
        </Link>
        <p className="text-xs sm:text-sm text-gray-500 font-medium truncate mt-0.5" title={user.studentId}>
          {user.studentId}
        </p>
        {(user.department || user.semester > 0) && (
          <p className="text-xs text-gray-400 truncate mt-1 flex items-center gap-1">
            {user.department}{user.department && user.semester > 0 && <span className="text-gray-300">•</span>}
            {user.semester > 0 && `Semester ${user.semester}`}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
        {children}
      </div>
    </div>
  );

// SearchResultCard component (remains the same)
const SearchResultCard = ({ userResult, onAddFriend, actionState }) => {
    const { id, name, studentId, profilePicture, department, semester, isPublic, friendshipStatus } = userResult;
    const isLoading = actionState?.loading;
    const isSent = actionState?.sent;

    let actionButton;

    if (friendshipStatus === 'none' || friendshipStatus === 'rejected') {
        actionButton = (
             <button
                onClick={() => onAddFriend(id)}
                disabled={isLoading || isSent}
                className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-white rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[90px] ${
                  isSent
                    ? "bg-gray-400 focus:ring-gray-300"
                    : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-md focus:ring-indigo-500"
                }`}
                title={isSent ? "Request Pending" : `Send friend request to ${name}`}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : isSent ? (
                  <>
                    <ClockIcon className="w-4 h-4"/>
                    <span className="hidden sm:inline">Pending</span>
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="w-4 h-4"/>
                    <span className="hidden sm:inline">Add</span>
                  </>
                )}
              </button>
        );
    } else if (friendshipStatus === 'pending_sent') {
         actionButton = (
           <span className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 rounded-lg cursor-not-allowed min-w-[90px]">
             <ClockIcon className="w-4 h-4"/>
             <span className="hidden sm:inline">Pending</span>
           </span>
         );
    } else if (friendshipStatus === 'pending_received') {
         actionButton = (
           <Link
             to="/friends" // Link to the same page to potentially highlight the request section
             className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-all duration-150 min-w-[90px]"
             title="Respond to request"
           >
             <InboxIcon className="w-4 h-4"/>
             <span className="hidden sm:inline">Respond</span>
           </Link>
         );
    } else if (friendshipStatus === 'accepted') {
         actionButton = (
           <span className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg cursor-default min-w-[90px]">
             <CheckIcon className="w-4 h-4"/>
             <span className="hidden sm:inline">Friends</span>
           </span>
         );
    }

    return <UserCard user={userResult}>{actionButton}</UserCard>;
};

// Enhanced Loading Placeholder (remains the same)
const LoadingSkeleton = () => (
    <div className="flex items-center gap-3 p-3 sm:p-4 bg-white border border-gray-200 rounded-lg">
        <div className="flex-shrink-0 animate-pulse">
            <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gray-200"></div>
        </div>
        <div className="flex-1 space-y-2 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="flex gap-2 animate-pulse">
            <div className="h-8 w-20 bg-gray-200 rounded-lg"></div>
        </div>
    </div>
);

// Main FriendsPage Component
function FriendsPage() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState({ friends: true, requests: true, suggestions: true });
  const [error, setError] = useState({ friends: null, requests: null, suggestions: null });
  const [actionLoading, setActionLoading] = useState({});
  const { user, addWsMessageListener, fetchAndUpdateRequestCount } = useAuth(); // Get WS listener add function and request count updater

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [friendActionState, setFriendActionState] = useState({});
  const debounceTimeoutRef = useRef(null);

  // --- Modified loadConnections ---
  const loadConnections = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading({ friends: true, requests: true, suggestions: true });
    }
    setError({ friends: null, requests: null, suggestions: null }); // Clear previous errors

    try {
      // Use Promise.allSettled to handle potential errors in individual fetches
      const results = await Promise.allSettled([
        fetchFriends(),
        fetchPendingRequests(),
        fetchFriendSuggestions(),
      ]);

      const [friendsResult, requestsResult, suggestionsResult] = results;

      if (friendsResult.status === 'fulfilled') {
        setFriends(friendsResult.value || []);
        setError(prev => ({...prev, friends: null}));
      } else {
        console.error("Failed to load friends:", friendsResult.reason);
        setError(prev => ({...prev, friends: friendsResult.reason?.toString() || 'Failed to load'}));
        // Keep existing friends list on error? setFriends([]); // Or clear
      }

      if (requestsResult.status === 'fulfilled') {
        setRequests(requestsResult.value || []);
        setError(prev => ({...prev, requests: null}));
        // Update count in AuthContext after successful fetch
        fetchAndUpdateRequestCount();
      } else {
        console.error("Failed to load requests:", requestsResult.reason);
        setError(prev => ({...prev, requests: requestsResult.reason?.toString() || 'Failed to load'}));
      }

      if (suggestionsResult.status === 'fulfilled') {
        setSuggestions(suggestionsResult.value || []);
         setError(prev => ({...prev, suggestions: null}));
      } else {
        console.error("Failed to load suggestions:", suggestionsResult.reason);
        setError(prev => ({...prev, suggestions: suggestionsResult.reason?.toString() || 'Failed to load'}));
      }

    } catch (err) {
      // This catch block might not be reached with Promise.allSettled unless something else goes wrong
      console.error("Unexpected error loading connections data:", err);
      const errorMsg = err.toString();
      setError({ friends: errorMsg, requests: errorMsg, suggestions: errorMsg });
    } finally {
      if (showLoading) {
         setLoading({ friends: false, requests: false, suggestions: false });
      }
    }
  }, [fetchAndUpdateRequestCount]); // Added dependency

  useEffect(() => {
    loadConnections(true); // Initial load shows loading indicators
  }, [loadConnections]);


  // --- WebSocket Listener Effect ---
  useEffect(() => {
    if (!addWsMessageListener || !user) return;

    console.log("Friendspage: Adding WS listener");
    const removeListener = addWsMessageListener((message) => {
      console.log("Friendspage received WS message:", message.type, message.payload);
      const payload = message.payload;

      switch (message.type) {
        case 'newFriendRequest':
          // Add to requests list if not already present
          setRequests((prev) => {
            if (!prev.some(req => req.id === payload.id)) {
               // The payload structure matches FriendshipResponse when sender is 'friend'
               const newRequest = {
                  id: payload.id,
                  status: 'pending',
                  friend: payload.sender, // The sender is the 'friend' in the request view
                  createdAt: payload.createdAt,
               };
              console.log("Adding new friend request via WS:", newRequest);
              return [newRequest, ...prev];
            }
            return prev;
          });
          // AuthContext handles the count increment
          break;

        case 'friendRequestUpdate':
          // If request was accepted by *us* (shouldn't happen via WS, but safety)
          // OR if request was accepted by *them*
          if (payload.status === 'accepted') {
             // Remove from pending requests (if we received it)
             setRequests((prev) => prev.filter(req => req.id !== payload.id));
             // Add to friends list (if not already there)
             setFriends((prev) => {
                const friendData = payload.userId === user.id ? payload.accepter : null; // Get accepter data if we sent request
                 if (friendData && !prev.some(f => f.id === friendData.id)) {
                    console.log("Adding new friend via WS (accepted request):", friendData);
                    return [friendData, ...prev];
                 }
                 return prev;
             });
          }
          // If request was rejected by *us* (shouldn't happen via WS)
          // OR if request was rejected by *them*
          else if (payload.status === 'rejected') {
            // Remove from pending requests (if we received it)
            setRequests((prev) => prev.filter(req => req.id !== payload.id));
            // Update search result status if applicable (tricky without full context)
             setSearchResults(prev => prev.map(res =>
                 (res.id === payload.friendId && payload.userId === user.id) // If we sent it and they rejected
                 ? { ...res, friendshipStatus: 'rejected' }
                 : res
             ));
             setFriendActionState(prev => { // Reset action state for the user we tried to add
                 const newState = {...prev};
                 if (payload.userId === user.id && newState[payload.friendId]) {
                     delete newState[payload.friendId];
                 }
                 return newState;
             });
          }
          break;

        case 'friendRemoved':
          // If we were the one removed
          if (payload.removedUser === user.id) {
            setFriends((prev) => prev.filter(f => f.id !== payload.removedById));
            console.log(`Friend removed via WS: UserID ${payload.removedById}`);
          }
          // If we initiated the removal (this WS message is for the other person)
          // No state update needed here as our API call already updated optimistically.
          break;

        default:
          // Ignore other message types like 'newMessage', 'newAnnouncement'
          break;
      }
    });

    return () => {
      console.log("Friendspage: Removing WS listener");
      removeListener();
    };
  }, [addWsMessageListener, user]); // Added user dependency

  // Search effect (remains the same)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(null);
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchUsers(searchQuery);
         // Filter out the current user from search results
         const filteredResults = results.filter(u => u.id !== user?.id);
        setSearchResults(filteredResults);
        setFriendActionState({}); // Reset action states on new search
      } catch (err) {
        setSearchError(err.toString());
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [searchQuery, user?.id]); // Added user?.id dependency

  // Action Handlers (Accept, Reject, Remove, Add) - Simplified to use loadConnections(false)

  const handleAccept = async (requestId, senderName) => {
    setActionLoading((prev) => ({ ...prev, [`accept-${requestId}`]: true }));
    try {
      await acceptFriendRequest(requestId);
      // Optimistic UI update: Remove from requests, add to friends
      const acceptedRequest = requests.find(req => req.id === requestId);
      if (acceptedRequest) {
          setRequests(prev => prev.filter(req => req.id !== requestId));
          setFriends(prev => [acceptedRequest.friend, ...prev]); // Add sender to friends
      }
      // Optionally trigger a non-loading refresh for consistency
      loadConnections(false);
    } catch (err) {
      alert(`Error accepting request from ${senderName}: ${err}`);
      setActionLoading((prev) => ({ ...prev, [`accept-${requestId}`]: false })); // Reset loading only on error
    }
    // No finally needed if we update optimistically/refresh non-loading
  };

  const handleReject = async (requestId, senderName) => {
    setActionLoading((prev) => ({ ...prev, [`reject-${requestId}`]: true }));
    try {
      await rejectFriendRequest(requestId);
      // Optimistic UI update: Remove from requests
      setRequests(prev => prev.filter(req => req.id !== requestId));
      // Optionally trigger a non-loading refresh
      loadConnections(false);
    } catch (err) {
      alert(`Error rejecting request from ${senderName}: ${err}`);
      setActionLoading((prev) => ({ ...prev, [`reject-${requestId}`]: false }));
    }
  };

  const handleRemove = async (friendId, friendName) => {
    if (!window.confirm(`Are you sure you want to remove ${friendName} as a friend?`)) return;
    setActionLoading((prev) => ({ ...prev, [`remove-${friendId}`]: true }));
    try {
      await removeFriend(friendId);
      // Optimistic UI update: Remove from friends
      setFriends(prev => prev.filter(f => f.id !== friendId));
      // Optionally trigger a non-loading refresh
      loadConnections(false);
    } catch (err) {
      alert(`Error removing ${friendName}: ${err}`);
       setActionLoading((prev) => ({ ...prev, [`remove-${friendId}`]: false }));
    }
  };

  const handleAddFriend = async (userId) => {
    const isInSearchResults = searchResults.some(r => r.id === userId);
    const stateSetter = isInSearchResults ? setFriendActionState : setActionLoading;
    const stateKey = isInSearchResults ? userId : `add-${userId}`;

    stateSetter(prev => ({ ...prev, [stateKey]: { loading: true, sent: false } }));

    try {
      await sendFriendRequest(userId);
      // Update state to 'sent'
      stateSetter(prev => ({ ...prev, [stateKey]: { loading: false, sent: true } }));
      // Optimistic UI: Remove from suggestions immediately
      if (!isInSearchResults) {
        setSuggestions(prev => prev.filter(s => s.id !== userId));
      } else {
        // Update search result status to 'pending_sent'
         setSearchResults(prev => prev.map(res =>
             res.id === userId ? { ...res, friendshipStatus: 'pending_sent' } : res
         ));
      }
      // Optionally trigger a non-loading refresh for consistency later
      // loadConnections(false);
    } catch (err) {
      alert(`Error sending request: ${err}`);
      stateSetter(prev => ({ ...prev, [stateKey]: { loading: false, sent: false } })); // Reset on error
    }
  };


  // Render Section Helper (remains the same)
  const renderSection = (title, data, isLoading, errorMsg, renderItem, sectionKey, emptyMessage = "Nothing to show here.", icon) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h2>
          {!isLoading && !errorMsg && data.length > 0 && (
            <span className="ml-auto px-2.5 py-0.5 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-full">
              {data.length}
            </span>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4">
        {isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <LoadingSkeleton key={`${sectionKey}-skel-${i}`} />)}
          </div>
        )}

        {errorMsg && !isLoading && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-3">
              <XMarkIcon className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-sm text-red-600 font-medium">Error loading {title.toLowerCase()}</p>
            {/* <p className="text-xs text-gray-500 mt-1">{errorMsg}</p> */}
             <button
                 onClick={() => loadConnections(true)} // Allow manual refresh on error
                 className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100"
             >
                 <ArrowPathIcon className="w-3.5 h-3.5"/> Retry
             </button>
          </div>
        )}

        {!isLoading && !errorMsg && data.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <UsersIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">No {title.toLowerCase()} yet</p>
            <p className="text-xs text-gray-500">{emptyMessage}</p>
          </div>
        )}

        {!isLoading && !errorMsg && data.length > 0 && (
          <div className="space-y-3">
            {data.map(renderItem)}
          </div>
        )}
      </div>
    </div>
  );

  const isAnyLoading = loading.requests || loading.friends || loading.suggestions;
  const hasAnyError = error.requests || error.friends || error.suggestions;

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 p-2 bg-indigo-100 rounded-lg">
                <UserGroupIcon className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  Friends & Connections
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  Connect with students across campus
                </p>
              </div>
            </div>
            {/* Manual Refresh Button */}
             <button
                onClick={() => loadConnections(true)}
                disabled={isAnyLoading}
                className="p-2 text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-wait transition-colors"
                title="Refresh connections"
             >
                <ArrowPathIcon className={`w-5 h-5 ${isAnyLoading ? 'animate-spin' : ''}`} />
             </button>
        </div>

        {/* Search Section (remains the same) */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-indigo-50 to-white border-b border-gray-100">
            <div className="flex items-center gap-2">
              <MagnifyingGlassIcon className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Find Students</h2>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or student ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base placeholder-gray-400 transition-shadow shadow-sm"
              />
            </div>

            {searchQuery.trim() && (
              <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Search Results
                  </h3>
                  {!searchLoading && !searchError && searchResults.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {searchResults.length} found
                    </span>
                  )}
                </div>

                {searchLoading && <LoadingSkeleton />}

                {searchError && (
                  <div className="text-center py-8">
                    <p className="text-sm text-red-600">Error: {searchError}</p>
                  </div>
                )}

                {!searchLoading && !searchError && searchResults.length === 0 && (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                      <MagnifyingGlassIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 font-medium">No students found</p>
                    <p className="text-xs text-gray-500 mt-1">Try a different search term</p>
                  </div>
                )}

                {!searchLoading && !searchError && searchResults.length > 0 && (
                  searchResults.map((result) => (
                    <SearchResultCard
                      key={`search-${result.id}`}
                      userResult={result}
                      onAddFriend={handleAddFriend}
                      actionState={friendActionState[result.id] || { loading: false, sent: false }}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Friend Requests Section */}
        {renderSection(
          "Pending Requests",
          requests,
          loading.requests, // Use specific loading state
          error.requests,   // Use specific error state
          (request) => (
            <UserCard key={`req-${request.id}`} user={request.friend}>
              <button
                onClick={() => handleAccept(request.id, request.friend.name)}
                disabled={actionLoading[`accept-${request.id}`]}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 min-w-[80px]"
                title="Accept Request"
              >
                <CheckIcon className="w-4 h-4"/>
                <span>{actionLoading[`accept-${request.id}`] ? "..." : "Accept"}</span>
              </button>
              <button
                onClick={() => handleReject(request.id, request.friend.name)}
                disabled={actionLoading[`reject-${request.id}`]}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 min-w-[80px]"
                title="Reject Request"
              >
                <XMarkIcon className="w-4 h-4"/>
                <span>{actionLoading[`reject-${request.id}`] ? "..." : "Reject"}</span>
              </button>
            </UserCard>
          ),
          "requests",
          "No pending requests at the moment.",
          <InboxIcon className="w-5 h-5 text-amber-600" />
        )}

        {/* My Friends Section */}
        {renderSection(
          "My Friends",
          friends,
          loading.friends, // Use specific loading state
          error.friends,   // Use specific error state
          (friend) => (
            <UserCard key={`friend-${friend.id}`} user={friend}>
              <Link
                to={`/chat/dm_${Math.min(user.id, friend.id)}_${Math.max(user.id, friend.id)}`}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 min-w-[80px]"
                title={`Send message to ${friend.name}`}
              >
                <ChatBubbleLeftEllipsisIcon className="w-4 h-4"/>
                <span className="hidden sm:inline">Message</span>
              </Link>
              <button
                onClick={() => handleRemove(friend.id, friend.name)}
                disabled={actionLoading[`remove-${friend.id}`]}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 min-w-[80px]"
                title={`Remove ${friend.name}`}
              >
                <UserMinusIcon className="w-4 h-4"/>
                <span className="hidden sm:inline">{actionLoading[`remove-${friend.id}`] ? "..." : "Remove"}</span>
              </button>
            </UserCard>
          ),
          "friends",
          "Start building your network by adding friends!",
          <UserGroupIcon className="w-5 h-5 text-indigo-600" />
        )}

        {/* Friend Suggestions Section */}
        {renderSection(
          "Suggested Connections",
          suggestions,
          loading.suggestions, // Use specific loading state
          error.suggestions,   // Use specific error state
          (suggestion) => {
            // Determine action state specifically for suggestions section
            const actionStateForSuggestion = actionLoading[`add-${suggestion.id}`] || { loading: false, sent: false };
            const isLoadingAction = actionStateForSuggestion.loading;
            const hasSentRequest = actionStateForSuggestion.sent;

            return (
              <UserCard key={`sug-${suggestion.id}`} user={suggestion}>
                <button
                  onClick={() => handleAddFriend(suggestion.id)}
                  disabled={isLoadingAction || hasSentRequest}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-white rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[90px] ${
                    hasSentRequest
                      ? "bg-gray-400 focus:ring-gray-300"
                      : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-md focus:ring-indigo-500"
                  }`}
                  title={hasSentRequest ? "Request Pending" : `Send friend request to ${suggestion.name}`}
                >
                  {isLoadingAction ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : hasSentRequest ? (
                    <>
                      <ClockIcon className="w-4 h-4"/>
                      <span className="hidden sm:inline">Pending</span>
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="w-4 h-4"/>
                      <span className="hidden sm:inline">Add</span>
                    </>
                  )}
                </button>
              </UserCard>
            );
          },
          "suggestions",
          "We'll suggest people from your department and semester.",
          <SparklesIcon className="w-5 h-5 text-purple-600" />
        )}
      </div>
    </div>
  );
}

export default FriendsPage;