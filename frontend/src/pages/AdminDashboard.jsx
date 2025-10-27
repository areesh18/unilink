// frontend/src/pages/AdminDashboard.jsx (New File)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
// You would import the API calls for admin stats here (not yet created)

function AdminDashboard() {
  const { user } = useAuth();
  const isPlatformAdmin = user?.role === 'platform_admin';
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // TODO: Fetch stats based on role:
    // - If College Admin: GET /api/college-admin/stats
    // - If Platform Admin: GET /api/platform-admin/stats
    const fetchStats = async () => {
        setIsLoading(false); // For now, just stop loading immediately
        // In reality, API call would happen here
        // setStats(await fetchAdminStats(isPlatformAdmin));
    };

    fetchStats();
  }, [isPlatformAdmin]);

  const roleTitle = isPlatformAdmin ? "Platform Administrator" : "College Administrator";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        {roleTitle} Panel 👋
      </h1>
      <p className="text-xl text-gray-700 dark:text-gray-300">
        Managing {isPlatformAdmin ? "the entire UniLink network" : `the ${user?.collegeName || 'College'} community`}.
      </p>

       {/* Grid for Stats/Widgets */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

         {/* Example Widget 1: Total Students */}
         <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Total Students</h2>
            {isLoading ? <p>Loading...</p> : <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">--</p>}
            <p className="text-gray-600 dark:text-gray-400">Currently registered users.</p>
         </div>

          {/* Example Widget 2: Listings/Marketplace */}
         <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Active Listings</h2>
             {isLoading ? <p>Loading...</p> : <p className="text-4xl font-bold text-red-600 dark:text-red-400">--</p>}
             <p className="text-gray-600 dark:text-gray-400">Items available for sale.</p>
         </div>

         {/* Example Widget 3: New Announcements */}
         <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Groups Managed</h2>
             {isLoading ? <p>Loading...</p> : <p className="text-4xl font-bold text-green-600 dark:text-green-400">--</p>}
             <p className="text-gray-600 dark:text-gray-400">Total department and public groups.</p>
         </div>

       </div>
       {error && <div className="text-red-500">{error}</div>}
    </div>
  );
}

export default AdminDashboard;