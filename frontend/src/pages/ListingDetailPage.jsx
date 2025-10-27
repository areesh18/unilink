import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getListingById, deleteListing } from '../api/listings'; // Import API functions
import { useAuth } from '../hooks/useAuth'; // To check if current user is the seller

function ListingDetailPage() {
    const { id } = useParams(); // Get the listing ID from the URL parameter
    const navigate = useNavigate();
    const { user } = useAuth(); // Get the logged-in user

    const [listing, setListing] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false); // Loading state for delete

    // Fetch listing details when component mounts or ID changes
    useEffect(() => {
        const loadListing = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getListingById(id);
                setListing(data);
            } catch (err) {
                setError(err.toString());
            } finally {
                setIsLoading(false);
            }
        };
        loadListing();
    }, [id]); // Re-run effect if the id parameter changes

    // Handle delete action
    const handleDelete = async () => {
        // Confirmation dialog
        if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
            return;
        }

        setIsDeleting(true);
        setError(null);
        try {
            await deleteListing(id);
            console.log('Listing deleted successfully');
            navigate('/market'); // Redirect to marketplace list after deletion
        } catch (err) {
            setError(`Failed to delete listing: ${err.toString()}`);
            setIsDeleting(false); // Only stop deleting loader on error
        }
    };

    // Loading State
    if (isLoading) {
        return <div className="text-center py-10 dark:text-gray-400">Loading listing details...</div>;
    }

    // Error State
    if (error && !isDeleting) { // Don't show fetch error if delete error occurs
         return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded dark:bg-red-900 dark:border-red-700 dark:text-red-300" role="alert">Error: {error}</div>;
    }

    // Not Found State (check after loading and no error)
     if (!listing) {
         return <div className="text-center py-10 dark:text-gray-400">Listing not found.</div>;
     }

    // Check if the current user is the seller
    const isOwner = user && listing && user.id === listing.seller.id;

    // Success State - Display Listing Details
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden max-w-4xl mx-auto">
             {/* Image */}
            <div className="h-64 md:h-96 bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                {listing.imageUrl ? (
                     <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-gray-500 dark:text-gray-400 text-xl">No Image Available</span>
                )}
            </div>

            {/* Content */}
            <div className="p-6 md:p-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{listing.title}</h1>
                <p className="text-indigo-600 dark:text-indigo-400 font-bold text-2xl mb-4">
                   ${listing.price.toFixed(2)}
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-6 whitespace-pre-wrap"> {/* Preserve line breaks */}
                    {listing.description || 'No description provided.'}
                </p>

                {/* Seller Info */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                    <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Seller Information</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Name: {listing.seller.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Student ID: {listing.seller.studentId}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Listed on: {new Date(listing.createdAt).toLocaleDateString()}
                    </p>
                     {/* TODO: Add a "Contact Seller" button later, linking to chat */}
                </div>

                 {/* Delete Button (only if owner) */}
                {isOwner && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        {error && isDeleting && ( // Show delete-specific error here
                            <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
                        )}
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Listing'}
                        </button>
                    </div>
                )}

                 {/* Back Link */}
                 <div className="mt-6">
                     <Link to="/market" className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
                         &larr; Back to Marketplace
                     </Link>
                 </div>

            </div>
        </div>
    );
}

export default ListingDetailPage;