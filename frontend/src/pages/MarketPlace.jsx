// frontend/src/pages/MarketPlace.jsx - Refactored for Light Mode & Responsiveness
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchListings } from "../api/listings"; // Import the API function
import { PlusIcon, PhotoIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'; // Import icons

// ListingCard component - Refactored for Light Mode & Responsiveness
// ListingCard component - Adjusted for compactness
const ListingCard = ({ listing }) => {
  // Fallback for image errors
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.style.display = 'none';
    const placeholder = e.target.nextElementSibling;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  };

  return (
    // Card styling remains largely the same
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm transition duration-200 ease-in-out hover:shadow-md group flex flex-col">
      {/* Image container - Reduced height, especially on mobile */}
      <div className="h-32 sm:h-40 bg-gray-100 relative"> {/* Reduced height: h-32 base, sm:h-40 */}
        {listing.imageUrl ? (
          <>
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              onError={handleImageError}
            />
            {/* Hidden placeholder */}
            <div className="absolute inset-0 hidden items-center justify-center flex-col text-gray-400 bg-gray-100">
                <PhotoIcon className="w-8 h-8 mb-1"/> {/* Smaller icon */}
                <span className="text-xs">Image unavailable</span>
            </div>
          </>
        ) : (
          // Visible placeholder
          <div className="h-full w-full flex items-center justify-center flex-col text-gray-400">
            <PhotoIcon className="w-8 h-8 mb-1"/> {/* Smaller icon */}
            <span className="text-xs">No Image Provided</span>
          </div>
        )}
      </div>
      {/* Content area - Reduced padding and margins */}
      <div className="p-3 flex flex-col flex-grow"> {/* Reduced base padding to p-3 */}
        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-800 mb-0.5 truncate group-hover:text-indigo-600 transition-colors duration-150" title={listing.title}> {/* Reduced mb */}
          {listing.title}
        </h3>
        {/* Price */}
        <p className="text-indigo-600 font-bold text-base mb-1"> {/* Reduced mb */}
          ₹{listing.price.toFixed(2)}
        </p>
        {/* Description - Reduced line-clamp and height */}
        <p className="text-xs text-gray-600 mb-2 line-clamp-2 h-8 flex-grow" title={listing.description}> {/* Reduced text size, mb, line-clamp, height */}
          {listing.description || <span className="italic text-gray-400">No description provided.</span>}
        </p>
        {/* Seller Info */}
        <div className="text-xs text-gray-500 mt-auto pt-1.5 border-t border-gray-100"> {/* Reduced pt */}
          Sold by: <span className="font-medium text-gray-600">{listing.seller.name}</span>
        </div>
        {/* View Details Link */}
        <Link
          to={`/market/${listing.id}`}
          className="mt-1.5 inline-block text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors duration-150 self-start" // Reduced mt
        >
          View Details &rarr;
        </Link>
      </div>
    </div>
  );
};

// MarketplacePage component - Refactored for Light Mode & Responsiveness
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
        // Sort listings by creation date, newest first
        const sortedData = (data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setListings(sortedData);
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
    <div className="flex justify-center items-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      <p className="ml-3 text-sm text-gray-500">Loading listings...</p>
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
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
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
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg bg-white">
              <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-300" strokeWidth={1}/>
              <h3 className="mt-2 text-sm font-semibold text-gray-700">Marketplace is Empty</h3>
              <p className="mt-1 text-sm text-gray-500">
                Be the first to list an item for sale in your college!
              </p>
              <div className="mt-6">
                 <Link
                    to="/market/new"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                  >
                    <PlusIcon className="w-3 h-3" strokeWidth={3}/>
                    List an Item
                  </Link>
              </div>
            </div>
          ) : (
            // Grid for listing cards - Updated responsive columns and gap
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"> {/* Start with 2 cols, increase */}
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