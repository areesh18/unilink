// frontend/src/pages/Friendspage.jsx
import React, { useState, useEffect, useCallback, useRef } from "react"; // Added useRef
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
import { searchUsers } from "../api/profile"; // <-- Import searchUsers
import { useAuth } from "../hooks/useAuth";
import {
    UserPlusIcon,
    UserMinusIcon,
    CheckIcon,
    XMarkIcon,
    ChatBubbleLeftEllipsisIcon,
    ClockIcon,
    MagnifyingGlassIcon, // <-- Import Search Icon
    LockClosedIcon,      // <-- Import Lock Icon
    UsersIcon,           // <-- For empty states
} from '@heroicons/react/20/solid'; // Using solid icons

// Helper for fallback avatar
const fallbackAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=random&color=fff&bold=true`;

// UserCard component (Used for Requests, Friends, and Suggestions)
const UserCard = ({ user, children }) => (
  <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors duration-150">
    <div className="flex items-center space-x-3 min-w-0">
      <img
        className="h-10 w-10 rounded-full object-cover border border-gray-200"
        src={user.profilePicture || fallbackAvatar(user.name)}
        alt={user.name || 'User'}
        onError={(e) => { e.target.onerror = null; e.target.src=fallbackAvatar(user.name)}}
      />
      <div className="min-w-0">
        <Link
          to={`/profile/${user.id}`}
          className="text-sm font-semibold text-gray-800 hover:text-indigo-600 truncate block"
          title={user.name}
        >
          {user.name}
        </Link>
        <p className="text-xs text-gray-500 truncate" title={user.studentId}>
          {user.studentId}
        </p>
         {(user.department || user.semester > 0) && (
            <p className="text-xs text-gray-400 truncate mt-0.5">
                {user.department}{user.department && user.semester > 0 && ' • '}{user.semester > 0 && `Sem ${user.semester}`}
            </p>
         )}
      </div>
    </div>
    <div className="flex space-x-2 flex-shrink-0">{children}</div>
  </div>
);

// SearchResultCard component (Displays search results with Add Friend logic)
const SearchResultCard = ({ userResult, onAddFriend, actionState }) => {
    const { id, name, studentId, profilePicture, department, semester, isPublic, friendshipStatus } = userResult;
    const isLoading = actionState?.loading;
    const isSent = actionState?.sent;

    let actionButton;

    // Determine action based on friendshipStatus
    if (friendshipStatus === 'none' || friendshipStatus === 'rejected') {
        actionButton = (
             <button
                onClick={() => onAddFriend(id)}
                disabled={isLoading || isSent}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 ${
                  isSent
                    ? "bg-gray-400 cursor-not-allowed focus:ring-gray-300"
                    : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
                }`}
                title={isSent ? "Request Pending" : `Send friend request to ${name}`}
              >
                {isLoading ? ( <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> )
                 : isSent ? ( <ClockIcon className="w-3.5 h-3.5"/> )
                 : ( <UserPlusIcon className="w-3.5 h-3.5"/> )}
                {isLoading ? "..." : isSent ? "Pending" : "Add Friend"}
              </button>
        );
    } else if (friendshipStatus === 'pending_sent') {
         actionButton = ( <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-md cursor-not-allowed"> <ClockIcon className="w-3.5 h-3.5"/> Pending </span> );
    } else if (friendshipStatus === 'pending_received') {
         actionButton = ( <Link to="/friends" className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 transition-colors duration-150" title="Respond to request"> Respond </Link> );
    } else if (friendshipStatus === 'accepted') {
         actionButton = ( <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md cursor-default"> <CheckIcon className="w-3.5 h-3.5"/> Friends </span> );
    }
     // No button for 'blocked'

    return (
        // Reusing UserCard structure and styling
        <UserCard user={userResult}>
             {actionButton && <div className="ml-2">{actionButton}</div>}
        </UserCard>
    );
};


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
        </div>
    </div>
);


// Main FriendsPage Component
function FriendsPage() {
  // State for connections
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState({ friends: true, requests: true, suggestions: true });
  const [error, setError] = useState({ friends: null, requests: null, suggestions: null });
  const [actionLoading, setActionLoading] = useState({}); // For accept/reject/remove buttons
  const { user } = useAuth(); // GET CURRENT USER

  // State for search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [friendActionState, setFriendActionState] = useState({}); // For Add Friend/Pending state in search
  const debounceTimeoutRef = useRef(null);

  // Function to load friends, requests, and suggestions
  const loadConnections = useCallback(async () => {
    // Only set loading for non-search sections initially
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
      setError({ friends: null, requests: null, suggestions: null });
    } catch (err) {
      console.error("Failed to load connections data:", err);
      const errorMsg = err.toString();
      setError({ friends: errorMsg, requests: errorMsg, suggestions: errorMsg });
    } finally {
      setLoading({ friends: false, requests: false, suggestions: false });
    }
  }, []);

  // Load connections on component mount
  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // Search Effect with Debouncing
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
                const results = await searchUsers(searchQuery); // Use the profile API search
                setSearchResults(results);
                setFriendActionState({}); // Reset button states on new search
            } catch (err) {
                setSearchError(err.toString());
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 300); // 300ms debounce

        return () => {
            if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        };
   }, [searchQuery]); // Re-run effect when searchQuery changes

  // Action Handlers for accepting/rejecting requests and removing friends
  const handleAccept = async (requestId) => {
    setActionLoading((prev) => ({ ...prev, [`accept-${requestId}`]: true }));
    try { await acceptFriendRequest(requestId); await loadConnections(); } // Reload all connections
    catch (err) { alert(`Error accepting request: ${err}`); }
    finally { setActionLoading((prev) => ({ ...prev, [`accept-${requestId}`]: false })); }
  };
  const handleReject = async (requestId) => {
    setActionLoading((prev) => ({ ...prev, [`reject-${requestId}`]: true }));
    try { await rejectFriendRequest(requestId); await loadConnections(); } // Reload all connections
    catch (err) { alert(`Error rejecting request: ${err}`); }
    finally { setActionLoading((prev) => ({ ...prev, [`reject-${requestId}`]: false })); }
  };
  const handleRemove = async (friendId, friendName) => {
    if (!window.confirm(`Are you sure you want to remove ${friendName} as a friend?`)) return;
    setActionLoading((prev) => ({ ...prev, [`remove-${friendId}`]: true }));
    try { await removeFriend(friendId); await loadConnections(); } // Reload all connections
    catch (err) { alert(`Error removing friend: ${err}`); }
    finally { setActionLoading((prev) => ({ ...prev, [`remove-${friendId}`]: false })); }
  };

  // Handler for sending friend request (used by Search Results and Suggestions)
  const handleAddFriend = async (userId) => {
    // Determine which state to update based on where the user might be found
    const isInSearchResults = searchResults.some(r => r.id === userId);
    const stateSetter = isInSearchResults ? setFriendActionState : setActionLoading;
    const stateKey = isInSearchResults ? userId : `add-${userId}`;

    stateSetter(prev => ({ ...prev, [stateKey]: { loading: true, sent: false } }));

    try {
      await sendFriendRequest(userId);
      stateSetter(prev => ({ ...prev, [stateKey]: { loading: false, sent: true } }));
      // Remove from suggestions if the action originated there
      if (!isInSearchResults) {
        setSuggestions(prev => prev.filter(s => s.id !== userId));
      }
      // Note: No need to reload all connections here, just update button state
    } catch (err) {
      alert(`Error sending request: ${err}`);
      stateSetter(prev => ({ ...prev, [stateKey]: { loading: false, sent: false } })); // Reset on error
    }
  };

  // Render Section Helper
  const renderSection = (title, data, isLoading, errorMsg, renderItem, sectionKey, emptyMessage = "Nothing to show here.") => (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="p-4">
        {isLoading && ( <div className="space-y-3"> {[...Array(3)].map((_, i) => <LoadingSkeleton key={`${sectionKey}-skel-${i}`} />)} </div> )}
        {errorMsg && !isLoading && ( <p className="text-center text-sm text-red-600 py-4">Error loading data: {errorMsg}</p> )}
        {!isLoading && !errorMsg && data.length === 0 && (
            <div className="text-center py-6 text-gray-500">
                <UsersIcon className="mx-auto h-10 w-10 text-gray-300 mb-2"/>
                <p className="text-sm">{emptyMessage}</p>
            </div>
        )}
        {!isLoading && !errorMsg && data.length > 0 && ( <div className="space-y-3">{data.map(renderItem)}</div> )}
      </div>
    </div>
  );

  // Loading state check for core connections sections
  const isConnectionsLoading = loading.requests || loading.friends || loading.suggestions;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">
        Friends & Connections
      </h1>

      {/* --- Search Section --- */}
       <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
           <h2 className="text-base font-semibold text-gray-800 mb-3">
               Find Students
           </h2>
           <div className="relative mb-3">
               <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
               <input
                   type="text"
                   placeholder="Search by name or student ID..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm placeholder-gray-400"
               />
           </div>

           {/* Search Results Area - Conditionally Rendered */}
           {searchQuery.trim() && ( // Only show results container if query exists
                <div className="mt-3 space-y-3 max-h-60 overflow-y-auto pr-1 border-t border-gray-100 pt-3">
                    <h3 className="text-xs font-medium text-gray-500 uppercase px-3 mb-1">Search Results</h3>
                    {searchLoading && <LoadingSkeleton />}
                    {searchError && <p className="text-center text-sm text-red-600 py-4">Error searching: {searchError}</p>}
                    {!searchLoading && !searchError && searchResults.length === 0 && (
                        <p className="text-center text-sm text-gray-500 py-4">No students found matching "{searchQuery}".</p>
                    )}
                    {!searchLoading && !searchError && searchResults.length > 0 && (
                        searchResults.map((result) => (
                            <SearchResultCard
                                key={`search-${result.id}`}
                                userResult={result}
                                onAddFriend={handleAddFriend} // Pass the handler
                                actionState={friendActionState[result.id] || { loading: false, sent: false }}
                            />
                        ))
                    )}
                </div>
           )}
       </div>
      {/* --- End Search Section --- */}


      {/* Friend Requests Section */}
      {renderSection(
        "Pending Friend Requests",
        requests,
        isConnectionsLoading,
        error.requests,
        (request) => (
          <UserCard key={`req-${request.id}`} user={request.friend}>
            <button
              onClick={() => handleAccept(request.id)}
              disabled={actionLoading[`accept-${request.id}`]}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500"
              title="Accept Request"
            > <CheckIcon className="w-3.5 h-3.5"/> {actionLoading[`accept-${request.id}`] ? "..." : "Accept"} </button>
            <button
              onClick={() => handleReject(request.id)}
              disabled={actionLoading[`reject-${request.id}`]}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300"
              title="Reject Request"
            > <XMarkIcon className="w-3.5 h-3.5"/> {actionLoading[`reject-${request.id}`] ? "..." : "Reject"} </button>
          </UserCard>
        ),
        "requests",
        "No pending friend requests."
      )}

      {/* My Friends Section */}
      {renderSection(
        "My Friends",
        friends,
        isConnectionsLoading,
        error.friends,
        (friend) => (
          <UserCard key={`friend-${friend.id}`} user={friend}>
             <Link
               to={`/chat/dm_${Math.min(user.id, friend.id)}_${Math.max(user.id, friend.id)}`}
               className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
               title={`Send message to ${friend.name}`}
             > <ChatBubbleLeftEllipsisIcon className="w-3.5 h-3.5"/> Message </Link>
             <button
               onClick={() => handleRemove(friend.id, friend.name)}
               disabled={actionLoading[`remove-${friend.id}`]}
               className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
               title={`Remove ${friend.name}`}
             > <UserMinusIcon className="w-3.5 h-3.5"/> {actionLoading[`remove-${friend.id}`] ? "..." : "Remove"} </button>
          </UserCard>
        ),
        "friends",
        "You haven't added any friends yet."
      )}

      {/* Friend Suggestions Section */}
       {renderSection(
        "Suggestions (Same Department & Semester)",
        suggestions,
        isConnectionsLoading,
        error.suggestions,
        (suggestion) => {
          // Use actionLoading for suggestions
          const isLoadingAction = actionLoading[`add-${suggestion.id}`]?.loading;
          const hasSentRequest = actionLoading[`add-${suggestion.id}`]?.sent;

          return (
            <UserCard key={`sug-${suggestion.id}`} user={suggestion}>
              <button
                onClick={() => handleAddFriend(suggestion.id)} // Use unified handler
                disabled={isLoadingAction || hasSentRequest}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 ${
                  hasSentRequest
                    ? "bg-gray-400 cursor-not-allowed focus:ring-gray-300"
                    : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
                }`}
                title={hasSentRequest ? "Request Pending" : `Send friend request to ${suggestion.name}`}
              >
                {isLoadingAction ? ( <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div> )
                 : hasSentRequest ? ( <ClockIcon className="w-3.5 h-3.5"/> )
                 : ( <UserPlusIcon className="w-3.5 h-3.5"/> )}
                {isLoadingAction ? "..." : hasSentRequest ? "Pending" : "Add Friend"}
              </button>
            </UserCard>
          );
        },
        "suggestions",
        "No new suggestions found." // Custom empty message
      )}
    </div>
  );
}

export default FriendsPage;