// frontend/src/pages/AdminMarketplacePage.jsx - Fully Optimized & Responsive
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchCollegeListings, deleteCollegeListing } from '../api/admin';
import { ArrowTopRightOnSquareIcon, TrashIcon, ShoppingCartIcon, MagnifyingGlassIcon, TagIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline';

// Helper to format currency
const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
        return '$--.--';
    }
    return `$${numericAmount.toFixed(2)}`;
};

// Helper to format date
const formatDate = (dateString) => {
    try {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
};

// Mobile Card Component for better mobile UX
const ListingCard = ({ listing, isDeleting, onDelete }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex justify-between items-start gap-3 mb-3">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-gray-500">#{listing.id}</span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        listing.status === 'available'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                    }`}>
                        {listing.status}
                    </span>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2 break-words">
                    {listing.title}
                </h3>
                <div className="flex items-center gap-1.5 text-lg font-bold text-indigo-600">
                    <TagIcon className="w-4 h-4" />
                    {formatCurrency(listing.price)}
                </div>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
                <Link
                    to={`/market/${listing.id}`}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-150"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View listing"
                >
                    <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                </Link>
                <button
                    onClick={() => onDelete(listing.id)}
                    disabled={isDeleting}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Delete listing"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
        
        <div className="space-y-2 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                <UserIcon className="w-4 h-4 flex-shrink-0 text-gray-400" />
                <span className="font-medium">{listing.seller.name}</span>
                <span className="text-gray-500">({listing.seller.studentId})</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Listed {formatDate(listing.createdAt)}</span>
            </div>
        </div>
    </div>
);

// Loading Skeleton for Mobile Cards
const SkeletonCard = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-pulse">
        <div className="flex justify-between items-start gap-3 mb-3">
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                    <div className="h-5 bg-gray-200 rounded-full w-20"></div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="flex flex-col gap-2">
                <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
                <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
            </div>
        </div>
        <div className="space-y-2 pt-3 border-t border-gray-100">
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
    </div>
);

// Loading Skeleton Row Component for Table
const SkeletonRow = () => (
    <tr className="animate-pulse">
        <td className="px-3 sm:px-4 lg:px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-12 mb-2"></div>
            <div className="h-5 bg-gray-200 rounded-full w-20"></div>
        </td>
        <td className="px-3 sm:px-4 lg:px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
        </td>
        <td className="hidden md:table-cell px-3 sm:px-4 lg:px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
        </td>
        <td className="hidden lg:table-cell px-3 sm:px-4 lg:px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
        </td>
        <td className="px-3 sm:px-4 lg:px-6 py-4 text-right">
            <div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div>
        </td>
    </tr>
);

function AdminMarketplacePage() {
    const [listings, setListings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDeleting, setIsDeleting] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    const loadListings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchCollegeListings();
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

    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to permanently delete listing #${id}?`)) {
            return;
        }
        setIsDeleting(prev => ({ ...prev, [id]: true }));
        setError(null);
        try {
            await deleteCollegeListing(id);
            setListings(prev => prev.filter(l => l.id !== id));
        } catch (err) {
            setError(`Failed to delete listing #${id}: ${err.toString()}`);
        } finally {
            setIsDeleting(prev => ({ ...prev, [id]: false }));
        }
    };

    const filteredListings = listings.filter(listing =>
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.seller.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                            Marketplace Moderation
                        </h1>
                        <p className="mt-1 text-xs sm:text-sm text-gray-600">
                            <span className="font-medium text-gray-900">{listings.length}</span> active listing{listings.length !== 1 ? 's' : ''}
                            {searchTerm && filteredListings.length !== listings.length && (
                                <span className="text-gray-500"> · <span className="font-medium text-gray-900">{filteredListings.length}</span> match{filteredListings.length !== 1 ? 'es' : ''}</span>
                            )}
                        </p>
                    </div>
                    
                    {/* Search Input */}
                    <div className="w-full sm:w-72 lg:w-80">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search title or seller..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white placeholder-gray-400 transition-shadow"
                            />
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && !isLoading && (
                    <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-r shadow-sm" role="alert">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium">Error</p>
                                <p className="text-sm mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile Card View */}
                <div className="block sm:hidden">
                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => <SkeletonCard key={`skel-card-${i}`} />)}
                        </div>
                    ) : filteredListings.length === 0 ? (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
                            <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-300" />
                            <p className="mt-3 text-sm font-medium text-gray-900">
                                {searchTerm ? 'No matches found' : 'No listings yet'}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                {searchTerm ? 'Try adjusting your search terms' : 'Listings will appear here once created'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredListings.map((listing) => (
                                <ListingCard
                                    key={listing.id}
                                    listing={listing}
                                    isDeleting={isDeleting[listing.id]}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            {/* Table Header */}
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        ID / Status
                                    </th>
                                    <th scope="col" className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Item / Price
                                    </th>
                                    <th scope="col" className="hidden md:table-cell px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Seller
                                    </th>
                                    <th scope="col" className="hidden lg:table-cell px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Listed Date
                                    </th>
                                    <th scope="col" className="relative px-3 sm:px-4 lg:px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            
                            {/* Table Body */}
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => <SkeletonRow key={`skel-${i}`} />)
                                ) : filteredListings.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-16 text-center">
                                            <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-300" />
                                            <p className="mt-3 text-sm font-medium text-gray-900">
                                                {searchTerm ? 'No matches found' : 'No listings yet'}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {searchTerm ? 'Try adjusting your search terms' : 'Listings will appear here once created'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredListings.map((listing) => (
                                        <tr key={listing.id} className="hover:bg-gray-50 transition-colors duration-150">
                                            {/* ID and Status Cell */}
                                            <td className="px-3 sm:px-4 lg:px-6 py-4 align-top">
                                                <div className="text-sm font-semibold text-gray-900">#{listing.id}</div>
                                                <span className={`mt-1.5 px-2 py-0.5 inline-flex text-xs font-semibold rounded-full ${
                                                    listing.status === 'available'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {listing.status}
                                                </span>
                                            </td>
                                            
                                            {/* Item and Price Cell */}
                                            <td className="px-3 sm:px-4 lg:px-6 py-4 align-top">
                                                <div className="text-sm font-medium text-gray-900 line-clamp-2 break-words max-w-[200px] lg:max-w-sm" title={listing.title}>
                                                    {listing.title}
                                                </div>
                                                <div className="text-sm font-bold text-indigo-600 mt-1">
                                                    {formatCurrency(listing.price)}
                                                </div>
                                            </td>
                                            
                                            {/* Seller Cell */}
                                            <td className="hidden md:table-cell px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-600 align-top">
                                                <div className="font-medium text-gray-900">{listing.seller.name}</div>
                                                <div className="text-gray-500 font-mono text-xs">({listing.seller.studentId})</div>
                                            </td>
                                            
                                            {/* Date Cell */}
                                            <td className="hidden lg:table-cell px-3 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-top">
                                                {formatDate(listing.createdAt)}
                                            </td>
                                            
                                            {/* Actions Cell */}
                                            <td className="px-3 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-top">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        to={`/market/${listing.id}`}
                                                        className="inline-flex items-center gap-1 px-2 py-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-all duration-150 group"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="View Listing"
                                                    >
                                                        <span className="hidden lg:inline">View</span>
                                                        <ArrowTopRightOnSquareIcon className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(listing.id)}
                                                        disabled={isDeleting[listing.id]}
                                                        className="inline-flex items-center gap-1 px-2 py-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                                                        title="Delete Listing"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                        <span className="hidden lg:inline">
                                                            {isDeleting[listing.id] ? 'Deleting...' : 'Delete'}
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Results Summary (Mobile) */}
                {!isLoading && filteredListings.length > 0 && (
                    <div className="block sm:hidden text-center text-xs text-gray-500 py-2">
                        Showing {filteredListings.length} of {listings.length} listing{listings.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminMarketplacePage;