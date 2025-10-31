// frontend/src/pages/CreateListingPage.jsx - Refactored for Light Mode
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createListing } from '../api/listings'; // Import API function
// Import icons if needed, e.g., for buttons
import { XMarkIcon } from '@heroicons/react/24/outline';

function CreateListingPage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // handleSubmit logic remains the same
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const priceValue = parseFloat(price);
        if (isNaN(priceValue) || priceValue <= 0) {
            setError('Please enter a valid positive price.');
            return;
        }
        if (!title.trim()) {
            setError('Title is required.');
            return;
        }

        setIsLoading(true);
        try {
            const newListingData = {
                title: title.trim(),
                description: description.trim(),
                price: priceValue,
                imageUrl: imageUrl.trim() || null,
            };
            await createListing(newListingData);
            // Navigate after successful creation
            navigate('/market');
        } catch (err) {
            setError(err.toString());
            setIsLoading(false); // Stop loading only on error
        }
    };

    // Base input class for consistency
    const inputBaseClass = "w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white placeholder-gray-400 disabled:opacity-50";

    return (
        // Main container: white background, border, shadow, rounded corners, padding
        <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-sm border border-gray-200">
            <h1 className="text-xl font-semibold mb-6 text-gray-800">Create New Marketplace Listing</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title Input */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className={inputBaseClass}
                        disabled={isLoading}
                        placeholder="e.g., Used Calculus Textbook"
                    />
                </div>

                {/* Price Input */}
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (INR) <span className="text-red-500">*</span></label>
                     <div className="relative mt-1 rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                         <span className="text-gray-500 sm:text-sm">₹</span>
                        </div>
                        <input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                            className={`${inputBaseClass} pl-7`} // Added padding left for '$' sign
                            disabled={isLoading}
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Description Textarea */}
                 <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        id="description"
                        rows="4"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={inputBaseClass}
                        disabled={isLoading}
                        placeholder="Optional: Provide details about the item's condition, edition, etc."
                    ></textarea>
                </div>

                {/* Image URL Input */}
                 <div>
                    <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">Image URL</label>
                    <input
                        id="imageUrl"
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className={inputBaseClass}
                        disabled={isLoading}
                        placeholder="Optional: https://example.com/image.jpg"
                    />
                     <p className="mt-1 text-xs text-gray-500">Provide a direct link to an image of your item.</p>
                </div>

                {/* Error Display */}
                {error && (
                     <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
                        {error}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
                     <Link
                        to="/market"
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                     >
                        <XMarkIcon className="w-4 h-4" />
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                         {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                        {isLoading ? 'Creating...' : 'Create Listing'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreateListingPage;