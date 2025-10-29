// frontend/src/pages/MyReservationsPage.jsx (New File)
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyReservations } from '../api/listings'; // The new API function
import { ClockIcon, PhotoIcon, ArrowRightIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

// Helper to format currency
const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return '$--.--';
    return `$${numericAmount.toFixed(2)}`;
};

// Card for a reserved item
const ReservationCard = ({ listing }) => {
    const { id, title, price, seller, imageUrl } = listing;

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
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-amber-100 text-amber-700">
                        <ClockIcon className="w-3.5 h-3.5" />
                        Reserved
                    </span>
                </div>
                <p className="text-indigo-600 font-bold text-lg mb-2">
                    {formatCurrency(price)}
                </p>
                
                {/* Seller Info */}
                {seller && (
                    <div className="p-2 bg-gray-50 text-gray-700 rounded-md text-xs mb-3 border border-gray-100">
                        Seller: <Link to={`/profile/${seller.id}`} className="font-medium underline hover:text-indigo-600">{seller.name}</Link>
                    </div>
                )}

                {/* Manage Link */}
                <Link
                    to={`/market/${id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                >
                    View / Manage Reservation
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
};


// Main Page Component
function MyReservationsPage() {
    const [reservations, setReservations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadReservations = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchMyReservations();
            // Sort by most recently reserved
            const sortedData = (data || []).sort((a, b) => new Date(b.updatedAt) - new Date(a.createdAt));
            setReservations(sortedData);
        } catch (err) {
            setError(err.toString());
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadReservations();
    }, [loadReservations]);

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">My Reservations</h1>
                <Link
                    to="/market"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                >
                    <ShoppingBagIcon className="w-4 h-4" />
                    Back to Marketplace
                </Link>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    <p className="mt-3 text-sm text-gray-500">Loading your reservations...</p>
                </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded text-sm" role="alert">
                    <strong className="font-semibold">Error:</strong> {error}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && reservations.length === 0 && (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg bg-white">
                    <ClockIcon className="mx-auto h-12 w-12 text-gray-300" strokeWidth={1}/>
                    <h3 className="mt-2 text-sm font-semibold text-gray-700">You have no active reservations.</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Items you reserve from the marketplace will appear here.
                    </p>
                </div>
            )}

            {/* Content */}
            {!isLoading && !error && reservations.length > 0 && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        You have {reservations.length} item(s) reserved. Please contact the seller to coordinate a meetup.
                    </p>
                    {reservations.map(listing => (
                        <ReservationCard key={listing.id} listing={listing} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyReservationsPage;