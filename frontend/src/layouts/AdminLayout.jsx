// frontend/src/layouts/AdminLayout.jsx - Refactored for Light Mode
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AdminSidebar from '../components/AdminSidebar';

function AdminLayout() {
  return (
    // Set main background to a light gray
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar component remains */}
      <Navbar />

      {/* Flex container for sidebar and main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* AdminSidebar component remains */}
        <AdminSidebar />

        {/* Main content area styling */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
             {/* Outlet renders the specific admin page */}
             <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;