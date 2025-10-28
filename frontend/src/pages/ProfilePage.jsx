// frontend/src/pages/ProfilePage.jsx - Refactored for Light Mode
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMyProfile, fetchUserProfile, updateMyProfile } from '../api/profile';
import { useAuth } from '../hooks/useAuth';
import { PencilSquareIcon, CheckIcon, XMarkIcon, EyeIcon, EyeSlashIcon, UserCircleIcon } from '@heroicons/react/24/outline'; // Icons

// Helper for fallback avatar (remains the same)
const fallbackAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=6366f1&color=fff&bold=true`;

// Loading State Component
const LoadingState = () => (
    <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <p className="mt-3 text-sm text-gray-500">Loading profile...</p>
    </div>
);

// Error State Component
const ErrorState = ({ error }) => (
    <div className="max-w-3xl mx-auto bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded text-sm" role="alert">
        <strong className="font-semibold">Error: </strong> {error}
    </div>
);

// Not Found State Component
const NotFoundState = () => (
     <div className="text-center py-20 max-w-3xl mx-auto">
         <UserCircleIcon className="mx-auto h-12 w-12 text-gray-300" strokeWidth={1}/>
         <h3 className="mt-2 text-sm font-semibold text-gray-700">Profile Not Found</h3>
         <p className="mt-1 text-sm text-gray-500">
            The profile you are looking for does not exist or is unavailable.
         </p>
    </div>
);

// Main ProfilePage Component
function ProfilePage() {
    const { id: profileUserId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, updateUserContext } = useAuth();

    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form state
    const [editBio, setEditBio] = useState('');
    const [editPicUrl, setEditPicUrl] = useState('');
    const [editIsPublic, setEditIsPublic] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editError, setEditError] = useState(null);

    const isOwnProfile = !profileUserId || (currentUser && profileUserId === 'me') || (currentUser && profileUserId === String(currentUser.id));


    // Fetch profile data
    const loadProfile = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            let data;
            if (isOwnProfile) {
                data = await fetchMyProfile();
            } else if (profileUserId) {
                data = await fetchUserProfile(profileUserId);
            } else {
                 throw new Error("Cannot load profile without an ID.");
            }
            setProfileData(data);
            if (isOwnProfile && data) {
                setEditBio(data.bio || '');
                setEditPicUrl(data.profilePicture || '');
                setEditIsPublic(data.isPublic);
            }
        } catch (err) {
            setError(err.toString());
            console.error("Profile fetch error:", err);
            // If fetching other user fails, maybe clear profileData?
             if (!isOwnProfile) setProfileData(null);
        } finally {
            setIsLoading(false);
        }
        // Added currentUser dependency to re-check ownership if context changes
    }, [profileUserId, isOwnProfile, currentUser?.id]);


    useEffect(() => {
        // Redirect 'me' to actual ID if available and not already there
         if (profileUserId === 'me' && currentUser?.id && window.location.pathname !== `/profile/${currentUser.id}`) {
             navigate(`/profile/${currentUser.id}`, { replace: true });
             return; // Prevent loading stale 'me' data
         }
        loadProfile();
    }, [loadProfile, profileUserId, currentUser?.id, navigate]);

    // Handle saving profile edits
    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setEditError(null);
        try {
            const updatedData = {
                // Only send non-empty URLs, otherwise keep backend default/logic
                profilePicture: editPicUrl.trim() || null,
                bio: editBio.trim(), // Send trimmed bio
                isPublic: editIsPublic
            };
            const result = await updateMyProfile(updatedData);
            setProfileData(result.profile);
            updateUserContext(result.profile); // Update global context
            setIsEditing(false);
        } catch (err) {
            setEditError(err.toString());
        } finally {
            setIsSaving(false);
        }
    };

     // Handle image loading error for profile picture
    const handleImageError = (e) => {
        e.target.onerror = null; // prevent looping
        e.target.src = fallbackAvatar(profileData?.name);
    };

    // --- Render Logic ---
    if (isLoading) return <LoadingState />;
    if (error && !isSaving) return <ErrorState error={error} />; // Show fetch error if not currently saving
    if (!profileData) return <NotFoundState />;


    // --- Profile Display ---
    return (
        // Main container: white bg, border, shadow, rounded, padding, spacing
        <div className="max-w-3xl mx-auto bg-white rounded-lg border border-gray-200 shadow-sm p-6 md:p-8 space-y-6">

            {/* Profile Header Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start sm:space-x-6">
                {/* Profile Picture */}
                <img
                    className="h-24 w-24 md:h-28 md:w-28 rounded-full object-cover mb-4 sm:mb-0 border-4 border-white shadow-md ring-1 ring-gray-200 flex-shrink-0"
                    src={profileData.profilePicture || fallbackAvatar(profileData.name)}
                    alt={`${profileData.name}'s profile`}
                    onError={handleImageError}
                />
                {/* Profile Info */}
                <div className="text-center sm:text-left flex-grow min-w-0"> {/* Added min-w-0 */}
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate" title={profileData.name}>{profileData.name}</h1>
                    <p className="text-sm text-gray-500">{profileData.studentId}</p>
                    <p className="text-base text-gray-700 mt-1">{profileData.department}</p>
                    <p className="text-sm text-gray-500">Semester {profileData.semester}</p>
                    {/* Bio */}
                    <p className="text-sm mt-3 text-gray-600 leading-relaxed">
                        {profileData.bio || <span className="italic text-gray-400">No bio provided.</span>}
                    </p>
                    {/* Meta Info */}
                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:gap-4 text-xs text-gray-400">
                        <span>Member since: {new Date(profileData.createdAt).toLocaleDateString()}</span>
                        <span className={`inline-flex items-center gap-1 ${profileData.isPublic ? 'text-green-600' : 'text-yellow-600'}`}>
                            {profileData.isPublic ? <EyeIcon className="w-3 h-3"/> : <EyeSlashIcon className="w-3 h-3"/>}
                            Profile is {profileData.isPublic ? 'Public' : 'Private'}
                        </span>
                    </div>
                </div>
                 {/* Edit Button */}
                {isOwnProfile && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="mt-4 sm:mt-0 flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150 self-center sm:self-start"
                    >
                        <PencilSquareIcon className="w-4 h-4" />
                        Edit Profile
                    </button>
                )}
            </div>

            {/* --- Edit Form (Conditional) --- */}
            {isOwnProfile && isEditing && (
                <div className="border-t border-gray-100 pt-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">Edit Profile</h2>
                    <form onSubmit={handleSave} className="space-y-4">
                         {/* Profile Picture URL Input */}
                         <div>
                            <label htmlFor="editPicUrl" className="block text-sm font-medium text-gray-700 mb-1">Profile Picture URL</label>
                            <input
                                id="editPicUrl"
                                type="url"
                                value={editPicUrl}
                                onChange={(e) => setEditPicUrl(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white placeholder-gray-400"
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>
                        {/* Bio Textarea */}
                        <div>
                            <label htmlFor="editBio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                            <textarea
                                id="editBio"
                                rows="4"
                                value={editBio}
                                onChange={(e) => setEditBio(e.target.value)}
                                maxLength="500"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white placeholder-gray-400"
                                placeholder="Tell us a little about yourself..."
                            ></textarea>
                            <p className="text-xs text-gray-400 mt-1">Maximum 500 characters.</p>
                        </div>
                        {/* Public Profile Checkbox */}
                         <div className="relative flex items-start">
                            <div className="flex h-6 items-center">
                                <input
                                    id="editIsPublic"
                                    type="checkbox"
                                    checked={editIsPublic}
                                    onChange={(e) => setEditIsPublic(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="ml-3 text-sm leading-6">
                                <label htmlFor="editIsPublic" className="font-medium text-gray-900">
                                    Public Profile
                                </label>
                                <p className="text-xs text-gray-500">Allow others in your college to find and view your profile.</p>
                            </div>
                        </div>

                         {/* Edit Error Message */}
                         {editError && (
                            <p className="text-sm text-red-600">{editError}</p>
                         )}

                        {/* Form Action Buttons */}
                        <div className="flex justify-end space-x-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 disabled:opacity-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                {isSaving
                                    ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    : <CheckIcon className="w-4 h-4"/>
                                }
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

             {/* Placeholder for future sections */}
             {/* <div className="border-t border-gray-100 pt-6">
                 <h2 className="text-lg font-semibold mb-4 text-gray-800">My Listings</h2>
                 <p className="text-sm text-gray-500">Your marketplace listings will appear here.</p>
             </div> */}

        </div>
    );
}

export default ProfilePage;