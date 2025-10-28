// frontend/src/pages/AdminMarketplacePage.jsx - Refactored for Light Mode
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchCollegeListings, deleteCollegeListing } from '../api/admin';
import { ArrowTopRightOnSquareIcon, TrashIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'; // Icons

// Helper to format currency (remains the same)
const formatCurrency = (amount) => {
    // Ensure amount is a number before formatting
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
        return '$--.--'; // Or some other placeholder for invalid data
    }
    return `$${numericAmount.toFixed(2)}`;
};


// Helper to format date (remains the same, using short month format)
const formatDate = (dateString) => {
    try {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch (e) {
        return dateString; // Fallback
    }
};

// Loading Skeleton Row Component
const SkeletonRow = () => (
    <tr className="animate-pulse">
        <td className="px-6 py-4 whitespace-nowrap text-sm">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4 mt-1"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3 mt-1"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
             <div className="h-4 bg-gray-200 rounded w-1/2"></div>
             <div className="h-3 bg-gray-200 rounded w-1/3 mt-1"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
             <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
            <div className="h-4 bg-gray-200 rounded w-1/4 ml-auto"></div>
        </td>
    </tr>
);


function AdminMarketplacePage() {
    const [listings, setListings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDeleting, setIsDeleting] = useState({});
    const [searchTerm, setSearchTerm] = useState(''); // State for search

    // loadListings logic remains the same
    const loadListings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchCollegeListings();
            // Sort by creation date descending
            const sortedData = (data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setListings(sortedData);
        } catch (err) {
            setError(err.toString());
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadListings();
    }, [loadListings]);

    // handleDelete logic remains the same
    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to permanently delete listing #${id}?`)) {
            return;
        }
        setIsDeleting(prev => ({ ...prev, [id]: true }));
        setError(null); // Clear page error before trying delete
        try {
            await deleteCollegeListing(id);
            setListings(prev => prev.filter(l => l.id !== id)); // Optimistic UI update
        } catch (err) {
             setError(`Failed to delete listing #${id}: ${err.toString()}`); // Set specific error on failure
        } finally {
             // Ensure loading state is always cleared
             setIsDeleting(prev => ({ ...prev, [id]: false }));
        }
    };

    // Filter listings based on search term (title, seller name, seller studentId)
    const filteredListings = listings.filter(listing =>
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.seller.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    );


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Marketplace Moderation
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Total listings in your college: {listings.length}
                    </p>
                 </div>
                 {/* Search Input */}
                 <div className="w-full sm:w-64">
                    <input
                        type="text"
                        placeholder="Search title or seller..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white placeholder-gray-400"
                    />
                 </div>
            </div>

            {/* Global Error Display */}
            {error && !isLoading && ( // Show error only if not loading
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded text-sm" role="alert">
                    <strong className="font-semibold">Error:</strong> {error}
                </div>
            )}

            {/* Table Container */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        {/* Table Header */}
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID / Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Item / Price
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Seller
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Listed Date
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        {/* Table Body */}
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                // Show skeleton rows while loading
                                [...Array(5)].map((_, i) => <SkeletonRow key={`skel-${i}`} />)
                            ) : filteredListings.length === 0 ? (
                                // Empty state row
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                         <ShoppingCartIcon className="mx-auto h-8 w-8 text-gray-300" />
                                         <p className="mt-1 text-sm text-gray-500">
                                            {searchTerm ? 'No listings match your search.' : 'No listings found in your college.'}
                                         </p>
                                    </td>
                                </tr>
                            ) : (
                                // Render listing rows
                                filteredListings.map((listing) => (
                                    <tr key={listing.id} className="hover:bg-gray-50 transition-colors duration-150">
                                        {/* ID and Status Cell */}
                                        <td className="px-6 py-4 whitespace-nowrap align-top">
                                            <div className="text-sm font-medium text-gray-900">#{listing.id}</div>
                                            <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                listing.status === 'available'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800' // Assuming other statuses like 'sold' are red
                                            }`}>
                                                {listing.status}
                                            </span>
                                        </td>
                                        {/* Item and Price Cell */}
                                        <td className="px-6 py-4 whitespace-nowrap align-top">
                                            <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={listing.title}>{listing.title}</div>
                                            <div className="text-sm text-indigo-600 font-semibold">{formatCurrency(listing.price)}</div>
                                        </td>
                                        {/* Seller Cell */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-top">
                                            <div className="font-medium text-gray-700">{listing.seller.name}</div>
                                            <div>({listing.seller.studentId})</div>
                                        </td>
                                        {/* Date Cell */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-top">
                                            {formatDate(listing.createdAt)}
                                        </td>
                                        {/* Actions Cell */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3 align-top">
                                            {/* View Link */}
                                            <Link
                                                to={`/market/${listing.id}`}
                                                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors duration-150"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="View Listing Details"
                                            >
                                                View
                                                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                                            </Link>
                                            {/* Delete Button */}
                                            <button
                                                onClick={() => handleDelete(listing.id)}
                                                disabled={isDeleting[listing.id]}
                                                className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                                                title="Delete Listing"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                                {isDeleting[listing.id] ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default AdminMarketplacePage;