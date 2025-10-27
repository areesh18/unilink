import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar'; // <-- Import Sidebar

function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Navbar /> {/* Navbar remains at the top */}

      <div className="flex flex-1 overflow-hidden"> {/* Use flex for sidebar + content */}
        {/* Sidebar (visible on medium screens and up) */}
        <Sidebar />

        {/* Main content area */}
        {/* Adjusted padding, added overflow-y-auto */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {/* Removed container/mx-auto, let pages decide or use full width */}
             <Outlet />
        </main>
      </div>
       {/* Footer can go here if needed, outside the flex div */}
    </div>
  );
}

export default AppLayout;