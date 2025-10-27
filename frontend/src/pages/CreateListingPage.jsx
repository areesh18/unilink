import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createListing } from '../api/listings'; // Import API function
import { useAuth } from '../hooks/useAuth'; // Optional: Use context if needed

function CreateListingPage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    // const { user } = useAuth(); // If you need user info

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Basic validation
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
                imageUrl: imageUrl.trim() || null, // Send null if empty
            };
            const createdListing = await createListing(newListingData);
            console.log('Listing created:', createdListing);
            // Navigate to the marketplace page or the new listing's detail page
            navigate('/market'); // Redirect to marketplace list
            // Or navigate(`/market/${createdListing.id}`); // Redirect to detail page
        } catch (err) {
            setError(err.toString());
            setIsLoading(false); // Only stop loading on error
        }
        // No finally block needed if navigating on success
    };

    return (
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Create New Listing</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title <span className="text-red-500">*</span></label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>
                <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price ($) <span className="text-red-500">*</span></label>
                    <input
                        id="price"
                        type="number"
                        step="0.01" // Allow decimals
                        min="0.01" // Minimum price
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>
                 <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <textarea
                        id="description"
                        rows="4"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    ></textarea>
                </div>
                 <div>
                    <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Image URL (Optional)</label>
                    <input
                        id="imageUrl"
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="https://example.com/image.jpg"
                    />
                </div>

                {error && (
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                     <Link to="/market" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                    >
                        {isLoading ? 'Creating...' : 'Create Listing'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreateListingPage;