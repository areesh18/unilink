// src/layouts/AppLayout.jsx - MODIFIED for Unified Layout
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar'; // Student Sidebar
import AdminSidebar from '../components/AdminSidebar'; // Admin Sidebar
import BottomNavbar from '../components/BottomNavbar'; // Student Bottom Nav
import AdminBottomNavbar from '../components/AdminBottomNavbar'; // Admin Bottom Nav
import { useAuth } from '../hooks/useAuth';
import NotificationToast from '../components/NotificationToast'; // Keep notifications

function AppLayout() {
  const { user, notifications, removeNotification } = useAuth();
  const isAdmin = user && (user.role === 'college_admin' || user.role === 'platform_admin');
  const isStudent = user && user.role === 'student';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* --- Conditional Sidebar --- */}
        {/* Render correct sidebar based on role */}
        {/* Each sidebar component now handles its own md:flex display */}
        {isAdmin ? <AdminSidebar /> : <Sidebar />}

        {/* --- Main content area --- */}
        {/* Added padding bottom for mobile to avoid overlap with BottomNavbar */}
        {/* Ensure padding is sufficient for the 16 height (h-16) of bottom navs */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-6 lg:pb-8"> {/* Adjusted pb-20 */}
          <Outlet />
        </main>
      </div>

      {/* --- Conditional Bottom Navbar --- */}
      {/* Render correct bottom navbar based on role */}
      {/* Each bottom navbar component now handles its own md:hidden display */}
      {isStudent && <BottomNavbar />}
      {isAdmin && <AdminBottomNavbar />}

      {/* --- Notification Container --- */}
      <div
        aria-live="assertive"
        className="fixed inset-0 flex flex-col items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-end sm:justify-start z-[60] space-y-4" // Increased z-index
      >
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onDismiss={removeNotification}
          />
        ))}
      </div>
      {/* --- End Notification Container --- */}

    </div>
  );
}

export default AppLayout;