// frontend/src/pages/ListingDetailPage.jsx - Refactored for Light Mode
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getListingById, deleteListing } from "../api/listings"; // Import API functions
import { useAuth } from "../hooks/useAuth"; // To check if current user is the seller
import {
  ArrowLeftIcon,
  PhotoIcon,
  TrashIcon,
} from "@heroicons/react/24/outline"; // Import icons
import { deleteCollegeListing } from "../api/admin";
function ListingDetailPage() {
  const [listing, setListing] = useState(null);
  const { user } = useAuth();
  // Add role check
  const isAdmin =
    user && (user.role === "college_admin" || user.role === "platform_admin");
  const isOwner = user && listing && user.id === listing.seller.id;
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdminDeleting, setIsAdminDeleting] = useState(false);
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
  }, [id]);

  // Handle admin delete action
  const handleAdminDelete = async () => {
    if (
      !window.confirm(
        "ADMIN ACTION: Are you sure you want to permanently delete this listing?"
      )
    ) {
      return;
    }
    setIsAdminDeleting(true);
    setError(null); // Clear previous errors
    try {
      await deleteCollegeListing(id); // Use the admin API call
      console.log("Listing deleted successfully by admin");
      navigate("/admin/listings"); // Navigate back to admin marketplace view
    } catch (err) {
      setError(`Admin failed to delete listing: ${err.toString()}`);
      setIsAdminDeleting(false);
    }
    // No finally block needed if navigating on success
  };

  // Handle delete action
  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this listing? This action cannot be undone."
      )
    ) {
      return;
    }
    setIsDeleting(true);
    setError(null);
    try {
      await deleteListing(id);
      console.log("Listing deleted successfully");
      navigate("/market");
    } catch (err) {
      setError(`Failed to delete listing: ${err.toString()}`);
      setIsDeleting(false);
    }
  };

  // Fallback for image errors
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.style.display = "none";
    const placeholder = e.target.nextElementSibling;
    if (placeholder) {
      placeholder.style.display = "flex";
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <p className="mt-3 text-sm text-gray-500">Loading listing details...</p>
      </div>
    );
  }

  // Error State
  if (error && !isDeleting) {
    return (
      <div
        className="max-w-4xl mx-auto bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded text-sm"
        role="alert"
      >
        <strong className="font-semibold">Error: </strong> {error}
      </div>
    );
  }

  // Not Found State
  if (!listing) {
    return (
      <div className="text-center py-20 max-w-4xl mx-auto">
        <svg
          className="mx-auto h-12 w-12 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-700">
          Listing Not Found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          The listing you are looking for does not exist or may have been
          removed.
        </p>
        <div className="mt-6">
          <Link
            to="/market"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
          >
            <ArrowLeftIcon className="w-3 h-3" />
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  // Check if the current user is the seller

  // Success State - Display Listing Details
  return (
    // Main container styling
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden max-w-4xl mx-auto">
      {/* Image Section */}
      <div className="h-64 md:h-80 bg-gray-100 flex items-center justify-center overflow-hidden relative">
        {listing.imageUrl ? (
          <>
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
            {/* Hidden placeholder for error case */}
            <div className="absolute inset-0 hidden items-center justify-center flex-col bg-gray-100 text-gray-400">
              <PhotoIcon className="w-16 h-16 mb-1" />
              <span className="text-sm">Image unavailable</span>
            </div>
          </>
        ) : (
          // Visible placeholder when no image URL
          <div className="flex items-center justify-center flex-col text-gray-400">
            <PhotoIcon className="w-16 h-16 mb-1" />
            <span className="text-sm">No Image Provided</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6 md:p-8 space-y-5">
        {/* Title and Price */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            {listing.title}
          </h1>
          <p className="text-indigo-600 font-bold text-xl md:text-2xl">
            ${listing.price.toFixed(2)}
          </p>
        </div>

        {/* Description */}
        <div className="border-t border-gray-200 pt-4">
          <h2 className="text-sm font-medium text-gray-500 mb-1">
            Description
          </h2>
          <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
            {listing.description || (
              <span className="italic text-gray-400">
                No description provided.
              </span>
            )}
          </p>
        </div>

        {/* Seller Info */}
        <div className="border-t border-gray-200 pt-4">
          <h2 className="text-sm font-medium text-gray-500 mb-2">
            Seller Information
          </h2>
          <div className="flex items-center space-x-3">
            {/* Add Seller Avatar Later if available */}
            {/* <img src={sellerAvatarUrl} alt={listing.seller.name} className="h-10 w-10 rounded-full object-cover border border-gray-200"/> */}
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {listing.seller.name}
              </p>
              <p className="text-xs text-gray-500">
                Student ID: {listing.seller.studentId}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Listed on: {new Date(listing.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          {/* TODO: Add a "Contact Seller" button later */}
          {/* Example:
                        <button className="mt-3 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 ...">
                            Contact Seller
                        </button>
                     */}
        </div>

        {/* Delete Button (Owner Only) */}
        {isOwner && (
          <div className="border-t border-gray-200 pt-4">
            <h2 className="text-sm font-medium text-gray-500 mb-2">
              Manage Listing
            </h2>
            {error &&
              isDeleting && ( // Show delete-specific error
                <p className="text-sm text-red-600 mb-3">{error}</p>
              )}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="w-4 h-4" />
              {isDeleting ? "Deleting..." : "Delete Listing"}
            </button>
          </div>
        )}
        {/* Admin Delete Button */}
        {isAdmin && (
          <>
            {error &&
              isAdminDeleting && ( // Show admin delete error
                <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                  {error}
                </p>
              )}
            <button
              onClick={handleAdminDelete} // Admin delete function
              disabled={isAdminDeleting}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-800 rounded-md hover:bg-red-900 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-800 mt-2 sm:mt-0 sm:ml-2" // Slightly different style/margin
            >
              {isAdminDeleting ? "Deleting (Admin)..." : "Admin Delete Listing"}
            </button>
          </>
        )}

        {/* --- Back Link (Conditional Path) --- */}
        <div className="mt-6">
          <Link
            to={isAdmin ? "/admin/listings" : "/market"} // <--- DYNAMIC PATH
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            &larr; Back to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ListingDetailPage;
