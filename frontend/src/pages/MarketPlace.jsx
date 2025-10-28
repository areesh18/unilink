// frontend/src/pages/MarketPlace.jsx - Refactored for Light Mode
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchListings } from "../api/listings"; // Import the API function
import { PlusIcon, PhotoIcon } from '@heroicons/react/24/outline'; // Import icons

// ListingCard component - Refactored for Light Mode
const ListingCard = ({ listing }) => {
  // Fallback for image errors
  const handleImageError = (e) => {
    e.target.onerror = null; // Prevent infinite loop
    e.target.style.display = 'none'; // Hide broken image
    // Find the placeholder sibling and display it
    const placeholder = e.target.nextElementSibling;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  };

  return (
    // Card styling: white bg, border, rounded corners, subtle shadow, hover effect
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm transition duration-200 ease-in-out hover:shadow-md group">
      {/* Image container */}
      <div className="h-48 bg-gray-100 relative">
        {listing.imageUrl ? (
          <>
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              onError={handleImageError} // Handle broken image links
            />
            {/* Hidden placeholder for error case */}
            <div className="absolute inset-0 hidden items-center justify-center flex-col text-gray-400">
                <PhotoIcon className="w-12 h-12 mb-1"/>
                <span className="text-xs">Image unavailable</span>
            </div>
          </>
        ) : (
          // Visible placeholder when no image URL
          <div className="h-full w-full flex items-center justify-center flex-col text-gray-400">
            <PhotoIcon className="w-12 h-12 mb-1"/>
            <span className="text-xs">No Image Provided</span>
          </div>
        )}
      </div>
      {/* Content area */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-base font-semibold text-gray-800 mb-1 truncate group-hover:text-indigo-600 transition-colors duration-150" title={listing.title}>
          {listing.title}
        </h3>
        {/* Price */}
        <p className="text-indigo-600 font-bold text-lg mb-2">
          ${listing.price.toFixed(2)}
        </p>
        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2 h-10" title={listing.description}>
          {listing.description || <span className="italic text-gray-400">No description provided.</span>}
        </p>
        {/* Seller Info */}
        <div className="text-xs text-gray-500">
          Sold by: {listing.seller.name}
        </div>
        {/* View Details Link */}
        <Link
          to={`/market/${listing.id}`}
          className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors duration-150"
        >
          View Details &rarr;
        </Link>
      </div>
    </div>
  );
};

// MarketplacePage component - Refactored for Light Mode
function MarketplacePage() {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadListings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchListings();
        setListings(data || []);
      } catch (err) {
        setError(err.toString());
      } finally {
        setIsLoading(false);
      }
    };

    loadListings();
  }, []);

  // Loading Spinner Component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-10">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      <p className="ml-3 text-gray-500">Loading listings...</p>
    </div>
  );

  return (
    // Main container with spacing
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Marketplace
        </h1>
        {/* Create Listing Button */}
        <Link
          to="/market/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
        >
          <PlusIcon className="w-4 h-4" strokeWidth={3}/>
          Create Listing
        </Link>
      </div>

      {/* Loading State */}
      {isLoading && <LoadingSpinner />}

      {/* Error State */}
      {error && !isLoading && (
        <div
          className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded relative text-sm"
          role="alert"
        >
          <strong className="font-semibold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Success State - Display Listings or Empty State */}
      {!isLoading && !error && (
        <>
          {listings.length === 0 ? (
            // Empty state message
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-gray-700">No listings found</h3>
              <p className="mt-1 text-sm text-gray-500">
                There are currently no items listed for sale in your college.
              </p>
              <div className="mt-6">
                 <Link
                    to="/market/new"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                  >
                    <PlusIcon className="w-3 h-3" strokeWidth={3}/>
                    List an Item
                  </Link>
              </div>
            </div>
          ) : (
            // Grid for listing cards
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MarketplacePage;