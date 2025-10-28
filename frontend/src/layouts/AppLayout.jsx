import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import AdminSidebar from '../components/AdminSidebar';
import { useAuth } from '../hooks/useAuth';

function AppLayout() {
  const { user } = useAuth(); // Get user info
  const isAdmin = user && (user.role === 'college_admin' || user.role === 'platform_admin');
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {isAdmin ? <AdminSidebar /> : <Sidebar />}

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;