// frontend/src/pages/FeedPage.jsx - Refactored for Light Mode
import React, { useState, useEffect, useCallback } from "react";
import { fetchFeed } from "../api/announcements"; // Import the API function
import { useAuth } from "../hooks/useAuth";
import { MegaphoneIcon } from '@heroicons/react/24/outline'; // Icon for empty state

// Helper function to format date/time (remains the same)
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

// AnnouncementCard component - Refactored for Light Mode
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

  // Define light mode badge colors
  let priorityBadgeClasses = "bg-gray-100 text-gray-700"; // Default (shouldn't happen with low/medium/high)
  if (priority === "high") {
    priorityBadgeClasses = "bg-red-100 text-red-700";
  } else if (priority === "medium") {
    priorityBadgeClasses = "bg-yellow-100 text-yellow-700";
  } else if (priority === "low") {
    priorityBadgeClasses = "bg-green-100 text-green-700";
  }

  // Determine target audience string (remains the same logic)
  let audience = "College-Wide";
  if (department && semester) {
    audience = `${department} - Sem ${semester}`;
  } else if (department) {
    audience = `All ${department}`;
  } else if (semester) {
    audience = `All Semester ${semester}`;
  }

  return (
    // Card styling: white bg, border, rounded, shadow
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-5">
        {/* Header with Title and Priority Badge */}
        <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-gray-800">
            {title}
          </h2>
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${priorityBadgeClasses} capitalize`}
          >
            {priority} Priority
          </span>
        </div>
        {/* Content */}
        <p className="text-sm text-gray-700 mb-4 whitespace-pre-wrap leading-relaxed">
          {content}
        </p>
        {/* Footer with Metadata */}
        <div className="text-xs text-gray-500 border-t border-gray-100 pt-3 space-y-0.5">
          <p><span className="font-medium text-gray-600">Posted by:</span> {authorName}</p>
          <p><span className="font-medium text-gray-600">Posted on:</span> {formatDate(createdAt)}</p>
          <p><span className="font-medium text-gray-600">Audience:</span> {audience}</p>
        </div>
      </div>
    </div>
  );
};

// FeedPage component - Refactored for Light Mode
function FeedPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addWsMessageListener } = useAuth();

  // Load feed data (logic remains the same)
  const loadFeed = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchFeed();
      // Sort by createdAt descending to ensure newest are first
      const sortedData = (data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAnnouncements(sortedData);
    } catch (err) {
      setError(err.toString());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // WebSocket listener (logic remains the same)
  useEffect(() => {
    if (!addWsMessageListener) return;

    const removeListener = addWsMessageListener((message) => {
      if (message.type === "newAnnouncement") {
        console.log("FeedPage received WS announcement:", message.payload);
        setAnnouncements((prevAnnouncements) => {
          if (prevAnnouncements.some((a) => a.id === message.payload.id)) {
            return prevAnnouncements;
          }
          // Add new announcement and re-sort
          const updatedAnnouncements = [message.payload, ...prevAnnouncements];
          updatedAnnouncements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          return updatedAnnouncements;
        });
      }
    });

    return () => {
      console.log("FeedPage removing WS listener");
      removeListener();
    };
  }, [addWsMessageListener]);

  // Loading Spinner Component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      <p className="ml-3 text-gray-500">Loading feed...</p>
    </div>
  );

  return (
    // Main container with spacing
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <h1 className="text-2xl font-bold text-gray-900">
        Announcements Feed
      </h1>

      {/* Loading State */}
      {isLoading && <LoadingSpinner />}

      {/* Error State */}
      {error && !isLoading && (
        <div
          className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded relative text-sm"
          role="alert"
        >
          <strong className="font-semibold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Success State - Display Announcements or Empty State */}
      {!isLoading && !error && (
        <>
          {announcements.length === 0 ? (
            // Empty state message
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg">
              <MegaphoneIcon className="mx-auto h-12 w-12 text-gray-300" strokeWidth={1}/>
              <h3 className="mt-2 text-sm font-semibold text-gray-700">No Announcements Yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Check back later for updates from your college.
              </p>
            </div>
          ) : (
            // List layout for announcements
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