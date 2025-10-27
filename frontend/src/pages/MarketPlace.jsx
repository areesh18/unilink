import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchListings } from "../api/listings"; // Import the API function

// Placeholder component for individual listing item
const ListingCard = ({ listing }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transform transition duration-300 hover:scale-105">
      {/* Basic image placeholder */}
      <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-gray-500 dark:text-gray-400">No Image</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
          {listing.title}
        </h3>
        <p className="text-indigo-600 dark:text-indigo-400 font-bold text-xl mb-2">
          ${listing.price.toFixed(2)} {/* Format price */}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {" "}
          {/* Limit description lines */}
          {listing.description || "No description provided."}
        </p>
        <div className="text-xs text-gray-500 dark:text-gray-500">
          Sold by: {listing.seller.name} ({listing.seller.studentId})
        </div>
        {/* Link to view details (route doesn't exist yet) */}
        <Link
          to={`/market/${listing.id}`} // Example detail route
          className="mt-4 inline-block text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

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
        setListings(data || []); // Ensure listings is always an array
      } catch (err) {
        setError(err.toString()); // Convert error object/string to string
      } finally {
        setIsLoading(false);
      }
    };

    loadListings();
  }, []); // Empty dependency array = run once on mount

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Marketplace
        </h1>
        <Link
          to="/market/new" // Route to the create page
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          + Create Listing
        </Link>
        {/* TODO: Add button to create new listing later */}
        {/* <Link to="/market/new" className="...">Create Listing</Link> */}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">
            Loading listings...
          </p>
          {/* Optional: Add a spinner component */}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:border-red-700 dark:text-red-300"
          role="alert"
        >
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Success State - Display Listings */}
      {!isLoading && !error && (
        <>
          {listings.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">
                No listings found in your college yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
