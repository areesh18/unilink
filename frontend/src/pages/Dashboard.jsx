import React from 'react';
import { useAuth } from '../hooks/useAuth'; // Get user info

function Dashboard() {
  const { user } = useAuth(); // Get the logged-in user details

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Welcome, {user?.name}! 👋
      </h1>

       {/* Grid for Dashboard Widgets/Summaries */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

         {/* Example Widget 1: Recent Announcements */}
         <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Recent Announcements</h2>
            {/* TODO: Fetch and display data from GET /api/feed */}
            <p className="text-gray-600 dark:text-gray-400">Announcements will be shown here...</p>
            {/* Example link */}
            <a href="/feed" className="text-indigo-600 dark:text-indigo-400 hover:underline mt-4 block text-sm">View All</a>
         </div>

          {/* Example Widget 2: Marketplace Overview */}
         <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Marketplace</h2>
             {/* TODO: Fetch and display data from GET /api/listings?limit=3 */}
             <p className="text-gray-600 dark:text-gray-400">Recent items will be shown here...</p>
             <a href="/market" className="text-indigo-600 dark:text-indigo-400 hover:underline mt-4 block text-sm">Go to Marketplace</a>
         </div>

         {/* Example Widget 3: Friend Suggestions */}
         <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Connect</h2>
             {/* TODO: Fetch and display data from GET /api/friends/suggestions */}
             <p className="text-gray-600 dark:text-gray-400">Friend suggestions will be shown here...</p>
             <a href="/friends" className="text-indigo-600 dark:text-indigo-400 hover:underline mt-4 block text-sm">Find Friends</a>
         </div>

         {/* Add more widgets as needed */}

       </div>
    </div>
  );
}

export default Dashboard;