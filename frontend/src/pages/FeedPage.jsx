import React, { useState, useEffect, useCallback } from "react";
import { fetchFeed } from "../api/announcements"; // Import the API function
import { useAuth } from "../hooks/useAuth";
// Helper function to format date/time
const formatDate = (dateString) => {
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  try {
    return new Date(dateString).toLocaleString(undefined, options);
  } catch (e) {
    return dateString; // Fallback
  }
};

// Component for a single announcement card
const AnnouncementCard = ({ announcement }) => {
  const {
    title,
    content,
    priority,
    authorName,
    createdAt,
    department,
    semester,
  } = announcement;

  // Determine badge color based on priority
  let priorityBadgeColor =
    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
  if (priority === "high") {
    priorityBadgeColor =
      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
  } else if (priority === "medium") {
    priorityBadgeColor =
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
  }

  // Determine target audience string
  let audience = "College-Wide";
  if (department && semester) {
    audience = `${department} - Sem ${semester}`;
  } else if (department) {
    audience = `All ${department}`;
  } else if (semester) {
    audience = `All Semester ${semester}`;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded ${priorityBadgeColor} capitalize`}
          >
            {priority} Priority
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap">
          {content}
        </p>
        <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3">
          <p>Posted by: {authorName}</p>
          <p>Posted on: {formatDate(createdAt)}</p>
          <p>Audience: {audience}</p>
        </div>
      </div>
    </div>
  );
};

function FeedPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // --- Get addWsMessageListener ---
  const { addWsMessageListener } = useAuth();
  // --- End Get addWsMessageListener ---
  // --- Use useCallback for loadFeed ---
  const loadFeed = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchFeed();
      setAnnouncements(data);
    } catch (err) {
      setError(err.toString());
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    loadFeed();
  }, [loadFeed]); // Empty dependency array for initial load

  // --- NEW: WebSocket Announcement Listener ---
  useEffect(() => {
    if (!addWsMessageListener) return;

    const removeListener = addWsMessageListener((message) => {
      if (message.type === "newAnnouncement") {
        console.log("FeedPage received WS announcement:", message.payload);
        setAnnouncements((prevAnnouncements) => {
          // Avoid adding duplicate if announcement already exists
          if (prevAnnouncements.some((a) => a.id === message.payload.id)) {
            return prevAnnouncements;
          }
          // Prepend the new announcement to the list
          return [message.payload, ...prevAnnouncements];
        });
      }
    });

    // Cleanup function
    return () => {
      console.log("FeedPage removing WS listener");
      removeListener();
    };
  }, [addWsMessageListener]); // Depend only on the listener function from context
  // --- End WebSocket Announcement Listener ---
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Announcements Feed
      </h1>

      {isLoading && (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">Loading feed...</p>
        </div>
      )}

      {error && !isLoading && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded dark:bg-red-900 dark:border-red-700 dark:text-red-300"
          role="alert"
        >
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {announcements.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">
                No announcements found.
              </p>
            </div>
          ) : (
            // Simple list layout
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default FeedPage;
