// frontend/src/pages/AdminDashboard.jsx - Refactored for Light Mode
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchCollegeStats } from '../api/admin';
import { UsersIcon, ShoppingCartIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline'; // Icons for stats

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, colorClass, isLoading }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex items-center space-x-4">
    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${colorClass.bg}`}>
      <Icon className={`w-6 h-6 ${colorClass.text}`} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
      {isLoading ? (
        <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
      ) : (
        <p className={`mt-1 text-2xl font-semibold ${colorClass.text}`}>
           {value?.toLocaleString() ?? '--'}
        </p>
      )}
    </div>
  </div>
);

// Loading State for the whole page
const LoadingState = () => (
    <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="animate-pulse space-y-2">
            <div className="h-8 w-3/4 bg-gray-200 rounded"></div>
            <div className="h-5 w-1/2 bg-gray-200 rounded"></div>
        </div>
         {/* Stat Cards Skeleton */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
           {[...Array(3)].map((_, i) => (
             <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex items-center space-x-4 animate-pulse">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-200"></div>
                <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                    <div className="h-6 w-16 bg-gray-200 rounded"></div>
                 </div>
             </div>
           ))}
       </div>
    </div>
);

// Main AdminDashboard Component
function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch stats logic (remains the same)
  const loadStats = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
          const data = await fetchCollegeStats();
          setStats(data);
      } catch (err) {
          setError(err.toString());
      } finally {
          setIsLoading(false);
      }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Handle loading state first
  if (isLoading) {
      return <LoadingState />;
  }

  return (
    // Main container styling
    <div className="space-y-6">
      {/* Page Header */}
      <h1 className="text-2xl font-bold text-gray-900">
        College Administrator Panel
      </h1>
      <p className="text-base text-gray-600">
        Managing the <span className="font-semibold">{stats?.collegeName || user?.collegeName || 'College'}</span> community.
      </p>

       {/* Error Message */}
       {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded text-sm" role="alert">
                <strong className="font-semibold">Error:</strong> Failed to load dashboard statistics: {error}
            </div>
       )}

       {/* Grid for Stat Cards */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

         {/* Stat Card 1: Total Students */}
         <StatCard
            title="Total Students"
            value={stats?.totalStudents}
            icon={UsersIcon}
            colorClass={{ bg: 'bg-indigo-100', text: 'text-indigo-600' }}
            isLoading={isLoading && !stats} // Pass loading state if stats are null
         />

          {/* Stat Card 2: Active Listings */}
          <StatCard
            title="Active Listings"
            value={stats?.activeListings}
            icon={ShoppingCartIcon}
            colorClass={{ bg: 'bg-green-100', text: 'text-green-600' }}
            isLoading={isLoading && !stats}
         />

         {/* Stat Card 3: Total Listings */}
         <StatCard
            title="Total Listings (All Time)"
            value={stats?.totalListings}
            icon={ArchiveBoxIcon}
            colorClass={{ bg: 'bg-blue-100', text: 'text-blue-600' }}
            isLoading={isLoading && !stats}
         />

       </div>

       {/* Placeholder for future charts or quick actions */}
       {/* <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
           <h2 className="text-base font-semibold text-gray-800 mb-4">Activity Overview</h2>
           <p className="text-sm text-gray-500">Charts and quick links can go here.</p>
       </div> */}
    </div>
  );
}

export default AdminDashboard;