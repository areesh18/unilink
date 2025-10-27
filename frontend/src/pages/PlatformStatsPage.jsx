// frontend/src/pages/PlatformStatsPage.jsx (New File)
import React, { useState, useEffect, useCallback } from 'react';
import { fetchPlatformStats } from '../api/admin';

function PlatformStatsPage() {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadStats = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchPlatformStats();
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

    if (isLoading) {
        return <div className="text-center py-10 dark:text-gray-400">Loading platform statistics...</div>;
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded dark:bg-red-900 dark:border-red-700 dark:text-red-300" role="alert">
                <strong className="font-bold">Error:</strong>
                <span className="block sm:inline"> {error}</span>
            </div>
        );
    }
    
    if (!stats) {
        return <div className="text-center py-10 dark:text-gray-400">No platform data available.</div>;
    }

    const { totalColleges, totalStudents, totalListings, collegeStats = [] } = stats;

    // Helper for Stat Cards
    const StatCard = ({ title, value, colorClass }) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-indigo-500 dark:border-indigo-400">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className={`mt-1 text-3xl font-bold ${colorClass}`}>{value.toLocaleString()}</p>
        </div>
    );

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Global Platform Overview
            </h1>

            {/* Global Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Colleges" 
                    value={totalColleges} 
                    colorClass="text-indigo-600 dark:text-indigo-400" 
                />
                <StatCard 
                    title="Total Students" 
                    value={totalStudents} 
                    colorClass="text-green-600 dark:text-green-400" 
                />
                <StatCard 
                    title="Total Listings (All Time)" 
                    value={totalListings} 
                    colorClass="text-yellow-600 dark:text-yellow-400" 
                />
            </div>
            
            {/* Per-College Breakdown Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
                <h2 className="text-xl font-semibold p-6 text-gray-900 dark:text-white">College Breakdown</h2>
                {collegeStats.length === 0 ? (
                    <p className="p-6 text-gray-500 dark:text-gray-400">No colleges registered.</p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    College
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Students
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Total Listings
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Active Listings
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {collegeStats
                                .sort((a, b) => b.studentCount - a.studentCount)
                                .map((college) => (
                                <tr key={college.collegeCode} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        {college.collegeName} ({college.collegeCode})
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                        {college.studentCount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {college.listingCount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                                        {college.activeListings}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default PlatformStatsPage;