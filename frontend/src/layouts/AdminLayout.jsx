// frontend/src/layouts/AdminLayout.jsx (New File)
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar'; // We can reuse the Navbar (which has logout)
import AdminSidebar from '../components/AdminSidebar'; // We'll create this next

function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Navbar /> {/* Reused Student/Admin Navbar */}

      <div className="flex flex-1 overflow-hidden">
        {/* Admin Specific Sidebar */}
        <AdminSidebar />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
             <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;