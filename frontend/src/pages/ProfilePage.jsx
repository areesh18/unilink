import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMyProfile, fetchUserProfile, updateMyProfile } from '../api/profile';
import { useAuth } from '../hooks/useAuth';

// Helper for fallback avatar
const fallbackAvatar = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random&color=fff`;

function ProfilePage() {
    const { id: profileUserId } = useParams(); // Get ID from URL, rename to avoid conflict
    const navigate = useNavigate();
    // 1. Get updateUserContext instead of setUser
    const { user: currentUser, updateUserContext } = useAuth();

    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form state for editing
    const [editBio, setEditBio] = useState('');
    const [editPicUrl, setEditPicUrl] = useState('');
    const [editIsPublic, setEditIsPublic] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editError, setEditError] = useState(null);

    // Determine if the profile being viewed belongs to the current user
    const isOwnProfile = !profileUserId || (currentUser && profileUserId === String(currentUser.id));

    // Fetch profile data
    const loadProfile = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            let data;
            if (isOwnProfile) {
                data = await fetchMyProfile();
            } else {
                data = await fetchUserProfile(profileUserId);
            }
            setProfileData(data);
            // Pre-fill edit form state if it's the owner's profile
            if (isOwnProfile && data) {
                setEditBio(data.bio || '');
                setEditPicUrl(data.profilePicture || '');
                setEditIsPublic(data.isPublic);
            }
        } catch (err) {
            setError(err.toString());
            console.error("Profile fetch error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [profileUserId, isOwnProfile]); // Depend on ID and ownership status

    useEffect(() => {
        loadProfile();
    }, [loadProfile]); // Run when loadProfile changes (effectively, when id changes)

    // Handle saving profile edits
    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setEditError(null);
        try {
            const updatedData = {
                bio: editBio,
                profilePicture: editPicUrl,
                isPublic: editIsPublic
            };
            const result = await updateMyProfile(updatedData);
            setProfileData(result.profile); // Update displayed profile locally
            // 2. Call the context function to update global state + localStorage
            updateUserContext(result.profile);

            setIsEditing(false); // Close edit form
        } catch (err) {
            setEditError(err.toString());
        } finally {
            setIsSaving(false);
        }
    };

    // --- Render Logic ---
    if (isLoading) return <div className="text-center py-10 dark:text-gray-400">Loading profile...</div>;
    if (error) return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded dark:bg-red-900 dark:border-red-700 dark:text-red-300" role="alert">Error: {error}</div>;
    if (!profileData) return <div className="text-center py-10 dark:text-gray-400">Profile not found.</div>;

    // --- Profile Display ---
    return (
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start sm:space-x-6">
                <img
                    className="h-24 w-24 md:h-32 md:w-32 rounded-full object-cover mb-4 sm:mb-0 border-4 border-gray-200 dark:border-gray-600"
                    src={profileData.profilePicture || fallbackAvatar(profileData.name)}
                    alt={`${profileData.name}'s profile`}
                    onError={(e) => { e.target.onerror = null; e.target.src=fallbackAvatar(profileData.name)}} // Handle broken image links
                />
                <div className="text-center sm:text-left flex-grow">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{profileData.name}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{profileData.studentId}</p>
                    <p className="text-md text-gray-700 dark:text-gray-300 mt-1">{profileData.department}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Semester {profileData.semester}</p>
                     <p className="text-sm mt-3 text-gray-600 dark:text-gray-300">
                        {profileData.bio || <span className="italic text-gray-400 dark:text-gray-500">No bio yet.</span>}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        Member since: {new Date(profileData.createdAt).toLocaleDateString()}
                    </p>
                     <p className={`text-xs mt-1 ${profileData.isPublic ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                        Profile is {profileData.isPublic ? 'Public' : 'Private'}
                    </p>
                </div>
                 {/* Edit Button for own profile */}
                {isOwnProfile && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="mt-4 sm:mt-0 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 self-center sm:self-start"
                    >
                        Edit Profile
                    </button>
                )}
            </div>

            {/* --- Edit Form (Conditional) --- */}
            {isOwnProfile && isEditing && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Edit Profile</h2>
                    <form onSubmit={handleSave} className="space-y-4">
                         <div>
                            <label htmlFor="editPicUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Picture URL</label>
                            <input
                                id="editPicUrl"
                                type="url"
                                value={editPicUrl}
                                onChange={(e) => setEditPicUrl(e.target.value)}
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="https://..."
                            />
                        </div>
                        <div>
                            <label htmlFor="editBio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                            <textarea
                                id="editBio"
                                rows="4"
                                value={editBio}
                                onChange={(e) => setEditBio(e.target.value)}
                                maxLength="500" // Match backend validation if any
                                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            ></textarea>
                        </div>
                         <div className="flex items-center">
                            <input
                                id="editIsPublic"
                                type="checkbox"
                                checked={editIsPublic}
                                onChange={(e) => setEditIsPublic(e.target.checked)}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <label htmlFor="editIsPublic" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                Make profile public (visible in directory)
                            </label>
                        </div>

                         {editError && (
                            <p className="text-sm text-red-600 dark:text-red-400">{editError}</p>
                         )}

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button" // Important: type="button" to prevent form submission
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

             {/* TODO: Add sections for user's listings, friends, etc. later */}

        </div>
    );
}

export default ProfilePage;