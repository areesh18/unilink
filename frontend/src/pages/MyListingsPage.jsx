// frontend/src/pages/MyListingsPage.jsx (New File)
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyListings } from '../api/listings';
import { ShoppingBagIcon, ArchiveBoxIcon, ClockIcon, CheckCircleIcon, PhotoIcon, PlusIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

// Helper to format currency
const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return '$--.--';
    return `₹${numericAmount.toFixed(2)}`;
};

// Status Badge Component
const StatusBadge = ({ status }) => {
    let classes = 'bg-gray-100 text-gray-700';
    let Icon = ClockIcon;

    switch (status) {
        case 'available':
            classes = 'bg-green-100 text-green-700';
            Icon = CheckCircleIcon;
            break;
        case 'reserved':
            classes = 'bg-amber-100 text-amber-700';
            Icon = ClockIcon;
            break;
        case 'sold':
            classes = 'bg-red-100 text-red-700';
            Icon = ArchiveBoxIcon;
            break;
        default:
            Icon = PhotoIcon; // Or some default
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${classes}`}>
            <Icon className="w-3.5 h-3.5" />
            {status}
        </span>
    );
};


// Listing Card for "My Listings" page
const MyListingCard = ({ listing }) => {
    const { id, title, price, status, buyer, imageUrl } = listing;

    // Fallback for image errors
    const handleImageError = (e) => {
        e.target.onerror = null; // prevent loop
        e.target.style.display = 'none'; // Hide broken img
        e.target.nextElementSibling.style.display = 'flex'; // Show placeholder
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col sm:flex-row items-start">
            {/* Image */}
            <div className="h-32 w-full sm:h-full sm:w-36 bg-gray-100 relative flex-shrink-0">
                {imageUrl ? (
                    <>
                        <img
                            src={imageUrl}
                            alt={title}
                            className="h-full w-full object-cover"
                            onError={handleImageError}
                        />
                        <div className="absolute inset-0 hidden items-center justify-center flex-col text-gray-400 bg-gray-100">
                            <PhotoIcon className="w-8 h-8"/>
                        </div>
                    </>
                ) : (
                    <div className="h-full w-full flex items-center justify-center flex-col text-gray-400">
                        <PhotoIcon className="w-8 h-8"/>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex-grow w-full">
                <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="text-base font-semibold text-gray-800 line-clamp-2" title={title}>
                        {title}
                    </h3>
                    <StatusBadge status={status} />
                </div>
                <p className="text-indigo-600 font-bold text-lg mb-2">
                    {formatCurrency(price)}
                </p>
                
                {/* Conditional Info based on status */}
                {status === 'reserved' && buyer && (
                    <div className="p-2 bg-amber-50 text-amber-700 rounded-md text-xs mb-3 border border-amber-100">
                        Reserved by: <Link to={`/profile/${buyer.id}`} className="font-medium underline hover:text-amber-900">{buyer.name}</Link>
                    </div>
                )}
                {status === 'sold' && buyer && (
                     <div className="p-2 bg-red-50 text-red-700 rounded-md text-xs mb-3 border border-red-100">
                        Sold to: <Link to={`/profile/${buyer.id}`} className="font-medium underline hover:text-red-900">{buyer.name}</Link>
                    </div>
                )}
                {status === 'sold' && !buyer && (
                     <div className="p-2 bg-red-50 text-red-700 rounded-md text-xs mb-3 border border-red-100">
                        Marked as Sold
                    </div>
                )}

                {/* Manage Link */}
                <Link
                    to={`/market/${id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                >
                    Manage Listing
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
};


// Main Page Component
function MyListingsPage() {
    const [listings, setListings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadMyListings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchMyListings();
            // Sort by status (available/reserved first) then date
            const sortedData = (data || []).sort((a, b) => {
                if (a.status === 'sold' && b.status !== 'sold') return 1;
                if (a.status !== 'sold' && b.status === 'sold') return -1;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            setListings(sortedData);
        } catch (err) {
            setError(err.toString());
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMyListings();
    }, [loadMyListings]);

    // Separate listings by status
    const availableListings = listings.filter(l => l.status === 'available');
    const reservedListings = listings.filter(l => l.status === 'reserved');
    const soldListings = listings.filter(l => l.status === 'sold');

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">My Marketplace Listings</h1>
                <Link
                    to="/market/new"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                >
                    <PlusIcon className="w-4 h-4" strokeWidth={3}/>
                    Create New Listing
                </Link>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    <p className="mt-3 text-sm text-gray-500">Loading your listings...</p>
                </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded text-sm" role="alert">
                    <strong className="font-semibold">Error:</strong> {error}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && listings.length === 0 && (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg bg-white">
                    <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-300" strokeWidth={1}/>
                    <h3 className="mt-2 text-sm font-semibold text-gray-700">You haven't listed any items yet.</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Click "Create New Listing" to get started!
                    </p>
                </div>
            )}

            {/* Content: Tabs or Sections */}
            {!isLoading && !error && listings.length > 0 && (
                <div className="space-y-8">
                    {/* Reserved Listings */}
                    {reservedListings.length > 0 && (
                        <section>
                            <h2 className="text-lg font-semibold text-gray-800 mb-3">Reserved Items ({reservedListings.length})</h2>
                            <div className="space-y-4">
                                {reservedListings.map(listing => (
                                    <MyListingCard key={listing.id} listing={listing} />
                                ))}
                            </div>
                        </section>
                    )}

                     {/* Available Listings */}
                     {availableListings.length > 0 && (
                        <section>
                            <h2 className="text-lg font-semibold text-gray-800 mb-3">Available Items ({availableListings.length})</h2>
                            <div className="space-y-4">
                                {availableListings.map(listing => (
                                    <MyListingCard key={listing.id} listing={listing} />
                                ))}
                            </div>
                        </section>
                    )}

                     {/* Sold Listings */}
                     {soldListings.length > 0 && (
                        <section>
                            <h2 className="text-lg font-semibold text-gray-800 mb-3">Sold Items ({soldListings.length})</h2>
                            <div className="space-y-4">
                                {soldListings.map(listing => (
                                    <MyListingCard key={listing.id} listing={listing} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}

export default MyListingsPage;