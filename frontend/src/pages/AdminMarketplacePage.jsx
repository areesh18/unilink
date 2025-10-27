// frontend/src/pages/AdminMarketplacePage.jsx (New File)
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchCollegeListings, deleteCollegeListing } from '../api/admin';

// Helper to format currency
const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
};

// Helper to format date
const formatDate = (dateString) => {
    try {
        return new Date(dateString).toLocaleDateString();
    } catch (e) {
        return dateString;
    }
};

function AdminMarketplacePage() {
    const [listings, setListings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDeleting, setIsDeleting] = useState({}); // To track delete loading state by ID

    const loadListings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchCollegeListings();
            setListings(data);
        } catch (err) {
            setError(err.toString());
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadListings();
    }, [loadListings]);

    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to permanently delete listing #${id}?`)) {
            return;
        }

        setIsDeleting(prev => ({ ...prev, [id]: true }));
        setError(null);
        try {
            await deleteCollegeListing(id);
            // Remove locally for a quick UI update
            setListings(prev => prev.filter(l => l.id !== id));
        } catch (err) {
            setError(err.toString());
        } finally {
            setIsDeleting(prev => ({ ...prev, [id]: false }));
        }
    };

    if (isLoading) {
        return <div className="text-center py-10 dark:text-gray-400">Loading marketplace listings...</div>;
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded dark:bg-red-900 dark:border-red-700 dark:text-red-300" role="alert">
                <strong className="font-bold">Error:</strong>
                <span className="block sm:inline"> {error}</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Marketplace Moderation
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
                Total listings in your college: {listings.length}
            </p>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
                {listings.length === 0 ? (
                    <p className="p-6 text-gray-500 dark:text-gray-400">No listings found in your college.</p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    ID / Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Item / Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Seller
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Listed Date
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {listings.map((listing) => (
                                <tr key={listing.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">#{listing.id}</div>
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${listing.status === 'available' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                                            {listing.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">{listing.title}</div>
                                        <div className="text-sm text-indigo-600 dark:text-indigo-400 font-bold">{formatCurrency(listing.price)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {listing.seller.name} <br/> ({listing.seller.studentId})
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {formatDate(listing.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <Link
                                            to={`/market/${listing.id}`}
                                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                            target="_blank"
                                        >
                                            View
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(listing.id)}
                                            disabled={isDeleting[listing.id]}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                                        >
                                            {isDeleting[listing.id] ? 'Deleting...' : 'Delete'}
                                        </button>
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

export default AdminMarketplacePage;