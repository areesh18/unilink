// frontend/src/pages/ListingDetailPage.jsx - ADDED Link state
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getListingById,
  deleteListing,
  reserveListing,
  cancelReservation,
  markListingSold,
} from "../api/listings";
import { useAuth } from "../hooks/useAuth";
import {
  ArrowLeftIcon,
  PhotoIcon,
  TrashIcon,
  ShoppingCartIcon,
  XCircleIcon,
  CheckBadgeIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { deleteCollegeListing } from "../api/admin";

function ListingDetailPage() {
  const [listing, setListing] = useState(null);
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdminDeleting, setIsAdminDeleting] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isMarkingSold, setIsMarkingSold] = useState(false);

  const [showChatPrompt, setShowChatPrompt] = useState(false);
  const [chatConversationId, setChatConversationId] = useState(null);

  const isAdmin =
    user && (user.role === "college_admin" || user.role === "platform_admin");
  const isOwner = user && listing && user.id === listing.seller.id;
  const isBuyerReserved =
    user && listing && listing.buyer && user.id === listing.buyer.id;

  const loadListing = useCallback(async () => {
    if (!id || isNaN(parseInt(id))) {
      setError("Invalid listing ID.");
      setIsLoading(false);
      setListing(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    setIsReserving(false);
    setIsCancelling(false);
    setIsMarkingSold(false);
    setShowChatPrompt(false);
    setChatConversationId(null);
    try {
      const data = await getListingById(id);
      setListing(data);
    } catch (err) {
      setError(err.toString());
      setListing(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadListing();
  }, [loadListing]);

  // --- Action Handlers ---

  const handleReserve = async () => {
    if (
      !window.confirm(
        "Confirm you want to reserve this item? This indicates your intent to meet the seller.\n\nA chat will be opened for you to coordinate."
      )
    ) {
      return;
    }
    setIsReserving(true);
    setError(null);
    try {
      const result = await reserveListing(id);
      setListing(result.listing);
      setChatConversationId(result.conversationId);
      setShowChatPrompt(true);
    } catch (err) {
      setError(`Failed to reserve listing: ${err.toString()}`);
    } finally {
      setIsReserving(false);
    }
  };

  const handleCancel = async () => {
    const confirmMsg = isOwner
      ? "Are you sure you want to cancel this reservation and make the item available again?"
      : "Are you sure you want to cancel your reservation for this item?";
    if (!window.confirm(confirmMsg)) {
      return;
    }
    setIsCancelling(true);
    setError(null);
    try {
      const result = await cancelReservation(id);
      setListing(result.listing);
      setShowChatPrompt(false);
    } catch (err) {
      setError(`Failed to cancel reservation: ${err.toString()}`);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleMarkSold = async () => {
    if (
      !window.confirm(
        "Confirm that the transaction is complete and mark this item as sold?"
      )
    ) {
      return;
    }
    setIsMarkingSold(true);
    setError(null);
    try {
      const result = await markListingSold(id);
      setListing(result.listing);
      setShowChatPrompt(false);
    } catch (err) {
      setError(`Failed to mark as sold: ${err.toString()}`);
    } finally {
      setIsMarkingSold(false);
    }
  };

  const handleDelete = async () => {
    // ... (handler remains the same)
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

  const handleAdminDelete = async () => {
    // ... (handler remains the same)
    if (
      !window.confirm(
        "ADMIN ACTION: Are you sure you want to permanently delete this listing?"
      )
    ) {
      return;
    }
    setIsAdminDeleting(true);
    setError(null);
    try {
      await deleteCollegeListing(id);
      console.log("Listing deleted successfully by admin");
      navigate(isAdmin ? "/admin/listings" : "/market");
    } catch (err) {
      setError(`Admin failed to delete listing: ${err.toString()}`);
      setIsAdminDeleting(false);
    }
  };

  const handleImageError = (e) => {
    // ... (handler remains the same)
    e.target.onerror = null;
    e.target.style.display = "none";
    const placeholder = e.target.nextElementSibling;
    if (placeholder) {
      placeholder.style.display = "flex";
    }
  };

  // --- Render Logic ---

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <p className="mt-3 text-sm text-gray-500">Loading listing details...</p>
      </div>
    );
  }

  const actionError =
    error &&
    (isReserving ||
      isCancelling ||
      isMarkingSold ||
      isDeleting ||
      isAdminDeleting);
  const loadError = error && !actionError;

  if (loadError && !listing) {
    return (
      <div
        className="max-w-4xl mx-auto bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded text-sm"
        role="alert"
      >
        <strong className="font-semibold">Error: </strong> {error}
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-20 max-w-4xl mx-auto">
        {/* ... (Not Found JSX) ... */}
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
          The listing you are looking for does not exist, may have been removed,
          or is not in your college.
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

  const status = listing.status;
  const buyer = listing.buyer;

  const getChatLink = (otherUserId) => {
    if (!user || !otherUserId) return "#";
    const userId1 = Math.min(user.id, otherUserId);
    const userId2 = Math.max(user.id, otherUserId);
    return `/chat/dm_${userId1}_${userId2}`;
  };

  // *** NEW: Create a minimal listing object to pass in state ***
  const listingContext = {
    id: listing.id,
    title: listing.title,
    imageUrl: listing.imageUrl,
    price: listing.price,
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden max-w-4xl mx-auto">
      {/* Image Section */}
      <div className="h-64 md:h-80 bg-gray-100 flex items-center justify-center overflow-hidden relative">
        {/* ... (Image/Placeholder JSX) ... */}
        {listing.imageUrl ? (
          <>
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
            <div className="absolute inset-0 hidden items-center justify-center flex-col bg-gray-100 text-gray-400">
              <PhotoIcon className="w-16 h-16 mb-1" />
              <span className="text-sm">Image unavailable</span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center flex-col text-gray-400">
            <PhotoIcon className="w-16 h-16 mb-1" />
            <span className="text-sm">No Image Provided</span>
          </div>
        )}
        {/* ... (Status Badge JSX) ... */}
        {status !== "available" && (
          <div
            className={`absolute top-4 right-4 px-3 py-1 text-xs font-bold uppercase rounded-full shadow ${
              status === "sold"
                ? "bg-red-600 text-white"
                : status === "reserved"
                ? "bg-amber-500 text-white"
                : "bg-gray-500 text-white"
            }`}
          >
            {status}
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
            ₹{listing.price.toFixed(2)}
          </p>
        </div>

        {/* --- Post-Reservation Chat Prompt --- */}
        {showChatPrompt && chatConversationId && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2 font-semibold text-green-800">
              <CheckBadgeIcon className="w-5 h-5" />
              <span>Item Reserved!</span>
            </div>
            <p className="text-sm text-green-700 mb-3">
              A chat with the seller has been enabled. Please coordinate a time
              and place to meet on campus.
            </p>
            {/* *** UPDATED Link: Added state prop *** */}
            <Link
              to={`/chat/${chatConversationId}`}
              state={{ listingContext: listingContext }} // Pass context
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              Go to Chat
            </Link>
          </div>
        )}

        {/* --- Reservation Info (Conditional) --- */}
        {status === "reserved" && buyer && !showChatPrompt && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
            <div className="flex items-center gap-2 mb-2 font-semibold text-amber-800">
              <ClockIcon className="w-5 h-5" />
              <span>
                {isBuyerReserved
                  ? "You have reserved this item"
                  : `Item Reserved by ${buyer.name}`}
              </span>
            </div>
            <p className="text-amber-700">
              {isBuyerReserved
                ? `Reserved by you (${buyer.studentId}).`
                : `Reserved by: ${buyer.name} (${buyer.studentId}).`}
            </p>
            <p className="mt-2 text-amber-700">
              Please use chat to coordinate meetup and payment.
            </p>
            {(isOwner || isBuyerReserved) && (
              <div className="mt-3">
                {/* *** UPDATED Link: Added state prop *** */}
                <Link
                  to={getChatLink(isOwner ? buyer.id : listing.seller.id)}
                  state={{ listingContext: listingContext }} // Pass context
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                >
                  <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  Chat with {isOwner ? "Buyer" : "Seller"}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* --- Sold Info (Conditional) --- */}
        {status === "sold" && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm">
            {/* ... (Sold JSX) ... */}
            <div className="flex items-center gap-2 font-semibold text-red-800">
              <CheckBadgeIcon className="w-5 h-5" />
              <span>Item Sold</span>
            </div>
            {buyer && (
              <p className="mt-1 text-red-700">
                Sold to:{" "}
                <Link
                  to={`/profile/${buyer.id}`}
                  className="font-medium underline hover:text-red-900"
                >
                  {buyer.name}
                </Link>{" "}
                ({buyer.studentId})
              </p>
            )}
          </div>
        )}

        {/* Description */}
        <div className="border-t border-gray-100 pt-4">
          {/* ... (Description JSX) ... */}
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
        <div className="border-t border-gray-100 pt-4">
          {/* ... (Seller Info JSX, removed the 'available' chat button) ... */}
          <h2 className="text-sm font-medium text-gray-500 mb-2">
            Seller Information
          </h2>
          <div className="flex items-center space-x-3">
            <div>
              <Link
                to={`/profile/${listing.seller.id}`}
                className="text-sm font-semibold text-gray-800 hover:underline"
              >
                {listing.seller.name}
              </Link>
              <p className="text-xs text-gray-500">
                Student ID: {listing.seller.studentId}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Listed on: {new Date(listing.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* --- Action Buttons Section --- */}
        <div className="border-t border-gray-100 pt-5">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Actions</h2>

          {actionError && (
            <div
              className="p-3 mb-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {/* Reserve Button (Visible if available, not owner, not admin) */}
            {status === "available" && !isOwner && !isAdmin && (
              <button
                onClick={handleReserve}
                disabled={isReserving || isLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <ShoppingCartIcon className="w-4 h-4" />
                {isReserving ? "Reserving..." : "Reserve (Meet on Campus)"}
              </button>
            )}

            {/* Cancel Reservation Button (Visible if reserved, buyer or seller, not admin) */}
            {status === "reserved" &&
              (isOwner || isBuyerReserved) &&
              !isAdmin && (
                <button
                  onClick={handleCancel}
                  disabled={isCancelling || isLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gray-500 rounded-md hover:bg-gray-600 disabled:opacity-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                >
                  <XCircleIcon className="w-4 h-4" />
                  {isCancelling ? "Cancelling..." : "Cancel Reservation"}
                </button>
              )}

            {/* *** CORRECTED CONDITION HERE *** */}
            {/* Mark Sold Button (Visible if RESERVED, owner, not admin) */}
            {status === "reserved" && isOwner && !isAdmin && (
              <button
                onClick={handleMarkSold}
                disabled={isMarkingSold || isLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <CheckBadgeIcon className="w-4 h-4" />
                {isMarkingSold ? "Marking Sold..." : "Mark as Sold"}
              </button>
            )}
            {/* *** END CORRECTION *** */}

            {/* Delete Button (Owner Only, if available or cancelled) */}
            {isOwner &&
              (status === "available" || status === "cancelled") &&
              !isAdmin && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || isLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <TrashIcon className="w-4 h-4" />
                  {isDeleting ? "Deleting..." : "Delete Listing"}
                </button>
              )}

            {/* Admin Delete Button (Admin Only, any status) */}
            {isAdmin && (
              <button
                onClick={handleAdminDelete}
                disabled={isAdminDeleting || isLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-800 rounded-md hover:bg-red-900 disabled:opacity-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-700"
              >
                <TrashIcon className="w-4 h-4" />
                {isAdminDeleting
                  ? "Deleting (Admin)..."
                  : "Admin Delete Listing"}
              </button>
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6">
          <Link
            to={isAdmin ? "/admin/listings" : "/market"}
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            &larr; Back to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ListingDetailPage;
