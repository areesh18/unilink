// src/layouts/AppLayout.jsx - MODIFIED
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import BottomNavbar from '../components/BottomNavbar'; // Import BottomNavbar
import AdminSidebar from '../components/AdminSidebar';
import { useAuth } from '../hooks/useAuth';
import NotificationToast from '../components/NotificationToast'; // <-- NEW IMPORT

function AppLayout() {
  const { user, notifications, removeNotification } = useAuth(); // <-- Get notifications state and remover function
  const isAdmin = user && (user.role === 'college_admin' || user.role === 'platform_admin');
  const isStudent = user && user.role === 'student';

  return (
    // Main container remains the same
    <div className="min-h-screen flex flex-col bg-gray-50 relative"> {/* Added relative positioning */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Conditional Sidebar for Admin or Desktop Student */}
        {isAdmin ? <AdminSidebar /> : <Sidebar />} {/* Sidebar still hidden on mobile via its own classes */}

        {/* Main content area */}
        {/* ADDED: Padding bottom for mobile to avoid overlap with BottomNavbar */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-8"> {/* Increased pb for mobile */}
          <Outlet />
        </main>
      </div>

      {/* Conditionally render BottomNavbar for students on mobile */}
      {isStudent && <BottomNavbar />}

      {/* --- Notification Container --- */} {/* <-- NEW SECTION */}
      <div
        aria-live="assertive"
        className="fixed inset-0 flex flex-col items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-end sm:justify-start z-50 space-y-4" // Position top-right
      >
        {/* Map over notifications and render toasts */}
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onDismiss={removeNotification}
          />
        ))}
      </div>
      {/* --- End Notification Container --- */} {/* <-- NEW SECTION */}

    </div>
  );
}

export default AppLayout;