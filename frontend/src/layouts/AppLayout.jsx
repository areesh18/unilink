// src/layouts/AppLayout.jsx - MODIFIED
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import BottomNavbar from '../components/BottomNavbar'; // Import BottomNavbar
import AdminSidebar from '../components/AdminSidebar';
import { useAuth } from '../hooks/useAuth';

function AppLayout() {
  const { user } = useAuth();
  const isAdmin = user && (user.role === 'college_admin' || user.role === 'platform_admin');
  const isStudent = user && user.role === 'student';

  return (
    // Main container remains the same
    <div className="min-h-screen flex flex-col bg-gray-50">
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
    </div>
  );
}

export default AppLayout;