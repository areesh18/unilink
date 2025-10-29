// frontend/src/components/NotificationToast.jsx (New File)
import React, { useEffect } from 'react';
import {
  BellAlertIcon, // General notification
  ChatBubbleLeftEllipsisIcon, // Message notification
  MegaphoneIcon, // Announcement notification
  XMarkIcon,
} from '@heroicons/react/24/outline';

const NotificationToast = ({ notification, onDismiss }) => {
  const { id, type, message } = notification;

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  // Choose icon based on type
  let IconComponent;
  let iconColorClass;
  switch (type) {
    case 'message':
      IconComponent = ChatBubbleLeftEllipsisIcon;
      iconColorClass = 'text-blue-500';
      break;
    case 'announcement':
      IconComponent = MegaphoneIcon;
      iconColorClass = 'text-indigo-500';
      break;
    default:
      IconComponent = BellAlertIcon;
      iconColorClass = 'text-gray-500';
  }

  return (
    <div
      role="alert"
      className="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border border-gray-100"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            <IconComponent className={`h-6 w-6 ${iconColorClass}`} aria-hidden="true" />
          </div>
          <div className="ml-3 w-0 flex-1">
            {/* Optional: Add a title based on type */}
            {/* <p className="text-sm font-medium text-gray-900 capitalize">{type}</p> */}
            <p className="mt-0.5 text-sm text-gray-700">
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={() => onDismiss(id)}
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label="Close notification"
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;