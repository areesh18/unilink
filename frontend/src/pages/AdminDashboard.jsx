// frontend/src/pages/AdminDashboard.jsx (Updated)
import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
import { useAuth } from '../hooks/useAuth';
import { fetchCollegeStats } from '../api/admin'; // <-- Import the new function

function AdminDashboard() {
  const { user } = useAuth();
  // We assume this page is only for College Admins now based on sidebar logic
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Use useCallback for fetch function ---
  const loadStats = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
          // --- Call the correct API ---
          const data = await fetchCollegeStats();
          setStats(data);
      } catch (err) {
          setError(err.toString());
      } finally {
          setIsLoading(false);
      }
  }, []); // No dependencies needed if only fetching college stats

  useEffect(() => {
    loadStats();
  }, [loadStats]); // Depend on loadStats
  // --- End Updated useEffect ---

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        College Administrator Panel 👋
      </h1>
      <p className="text-xl text-gray-700 dark:text-gray-300">
        Managing the {stats?.collegeName || user?.collegeName || 'College'} community.
      </p>

       {/* Grid for Stats/Widgets */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

         {/* Widget 1: Total Students */}
         <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Total Students</h2>
            {isLoading ? (
                <p className="text-gray-500 dark:text-gray-400">Loading...</p>
            ) : error ? (
                <p className="text-red-500 dark:text-red-400">Error</p>
            ) : (
                <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                    {stats?.totalStudents ?? '--'}
                </p>
            )}
            <p className="text-gray-600 dark:text-gray-400">Currently registered users.</p>
         </div>

          {/* Widget 2: Active Listings */}
         <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Active Listings</h2>
             {isLoading ? (
                <p className="text-gray-500 dark:text-gray-400">Loading...</p>
             ) : error ? (
                <p className="text-red-500 dark:text-red-400">Error</p>
             ) : (
                <p className="text-4xl font-bold text-red-600 dark:text-red-400">
                    {stats?.activeListings ?? '--'}
                </p>
             )}
             <p className="text-gray-600 dark:text-gray-400">Items available for sale.</p>
         </div>

         {/* Widget 3: Total Listings */}
         <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Total Listings</h2>
             {isLoading ? (
                 <p className="text-gray-500 dark:text-gray-400">Loading...</p>
             ) : error ? (
                 <p className="text-red-500 dark:text-red-400">Error</p>
             ) : (
                <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                    {stats?.totalListings ?? '--'}
                </p>
             )}
             <p className="text-gray-600 dark:text-gray-400">All items ever listed.</p>
         </div>

       </div>
       {error && !isLoading && ( // Show general error if loading finished but error exists
            <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded dark:bg-red-900 dark:border-red-700 dark:text-red-300">
                Failed to load dashboard statistics: {error}
            </div>
       )}
    </div>
  );
}

export default AdminDashboard;