// frontend/src/pages/AdminGroupManagementPage.jsx - Refactored for Light Mode
import React, { useState, useEffect, useCallback } from 'react';
import { fetchCollegeGroups, createPublicGroup, deleteCollegeGroup } from '../api/admin';
import { PlusIcon, TrashIcon, XMarkIcon, UserGroupIcon, LockClosedIcon } from '@heroicons/react/24/outline'; // Icons

// CreateGroupForm Component - Refactored for Light Mode
const CreateGroupForm = ({ onSave, onCancel, isSubmitting }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [avatar, setAvatar] = useState('');
    const [formError, setFormError] = useState(null);

    // handleSubmit logic remains the same
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        if (!name.trim()) {
            setFormError("Group name is required.");
            return;
        }
        const payload = {
            name: name.trim(),
            description: description.trim(),
            avatar: avatar.trim() || null,
        };

        try {
           await onSave(payload, setFormError);
           // Clear form on successful save (handled by parent calling loadGroups)
           setName('');
           setDescription('');
           setAvatar('');
        } catch(err) {
            // Error is set within onSave via setFormError callback
            console.error("Group creation failed:", err);
        }
    };

    // Input/Select/Textarea base classes
    const inputBaseClass = "w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white placeholder-gray-400";

    return (
        // Form container styling: light gray bg, border, rounded, padding, spacing
        <form onSubmit={handleSubmit} className="p-6 bg-gray-50 border border-gray-200 rounded-lg space-y-4 shadow-sm mb-6 max-w-xl">
            <h3 className="text-lg font-semibold text-gray-800">Create New Public Group (Club)</h3>
            {formError && <p className="text-sm text-red-600">{formError}</p>}

            {/* Group Name Input */}
            <div>
                <label htmlFor="group-name" className="block text-sm font-medium text-gray-700">Group Name <span className="text-red-500">*</span></label>
                <input id="group-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputBaseClass} />
            </div>
            {/* Description Textarea */}
            <div>
                <label htmlFor="group-description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea id="group-description" value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className={inputBaseClass}></textarea>
            </div>
            {/* Avatar URL Input */}
            <div>
                <label htmlFor="group-avatar" className="block text-sm font-medium text-gray-700">Avatar URL (Optional)</label>
                <input id="group-avatar" type="url" value={avatar} onChange={(e) => setAvatar(e.target.value)} className={inputBaseClass} placeholder="https://..." />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                >
                    <XMarkIcon className="w-4 h-4" />
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 disabled:opacity-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                    {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                    {isSubmitting ? 'Creating...' : 'Create Group'}
                </button>
            </div>
        </form>
    );
};

// Loading Skeleton for Group Item
const GroupSkeleton = () => (
    <div className="py-3 flex justify-between items-center animate-pulse">
        <div className="space-y-1.5">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-48"></div>
            <div className="h-2 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-6 w-20 bg-gray-200 rounded"></div>
    </div>
);


// Main AdminGroupManagementPage Component - Refactored for Light Mode
function AdminGroupManagementPage() {
    const [groups, setGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState({});

    // loadGroups logic remains the same
    const loadGroups = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchCollegeGroups();
            // Sort groups: Public first, then Auto, then by name
            const sortedData = (data || []).sort((a, b) => {
                 if (a.type === 'public' && b.type === 'auto') return -1;
                 if (a.type === 'auto' && b.type === 'public') return 1;
                 return a.name.localeCompare(b.name);
            });
            setGroups(sortedData);
        } catch (err) {
            setError(err.toString());
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadGroups();
    }, [loadGroups]);

    // handleCreateGroup logic remains the same
    const handleCreateGroup = async (payload, setFormError) => {
        setIsSubmitting(true);
        try {
            await createPublicGroup(payload);
            setIsCreating(false);
            await loadGroups();
        } catch (err) {
            setFormError(err.toString()); // Pass error back to form
            throw err; // Re-throw if needed elsewhere
        } finally {
            setIsSubmitting(false);
        }
    };

    // handleDeleteGroup logic remains the same
    const handleDeleteGroup = async (id, name) => {
        if (!window.confirm(`Are you sure you want to permanently delete the public group "${name}"? This will remove all members.`)) {
            return;
        }
        setIsDeleting(prev => ({ ...prev, [id]: true }));
        setError(null); // Clear page error before trying delete
        try {
            await deleteCollegeGroup(id);
            setGroups(prev => prev.filter(g => g.id !== id)); // Optimistic UI update
        } catch (err) {
             setError(`Failed to delete group "${name}": ${err.toString()}`); // Set specific error on failure
        } finally {
             // Ensure loading state is always cleared
             setIsDeleting(prev => ({ ...prev, [id]: false }));
        }
    };

    // Separate groups by type
    const autoGroups = groups.filter(g => g.type === 'auto');
    const publicGroups = groups.filter(g => g.type === 'public');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">
                    Group Management
                </h1>
                {/* Create Club Button */}
                 {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                    >
                         <PlusIcon className="w-4 h-4" strokeWidth={3}/>
                        Create New Club
                    </button>
                 )}
            </div>

            {/* Global Error Display */}
            {error && <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded text-sm">{error}</div>}

            {/* Create Form (Conditionally Rendered) */}
            {isCreating && (
                <CreateGroupForm
                    onSave={handleCreateGroup}
                    onCancel={() => setIsCreating(false)}
                    isSubmitting={isSubmitting}
                />
            )}

            {/* Groups List Sections */}
            <div className="space-y-6">
                {/* Public Groups (Clubs) Section */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 border-b border-gray-100">
                        <h2 className="text-base font-semibold text-gray-800">
                            Public Groups (Clubs) ({publicGroups.length})
                        </h2>
                    </div>
                    <div className="p-4">
                        {isLoading ? (
                            <div className="space-y-3">
                                {[...Array(2)].map((_, i) => <GroupSkeleton key={`pub-skel-${i}`} />)}
                            </div>
                        ) : publicGroups.length === 0 ? (
                            <p className="text-center text-sm text-gray-500 py-6">No public clubs created yet.</p>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {publicGroups.map((group) => (
                                    <div key={group.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-semibold text-gray-800 truncate" title={group.name}>{group.name}</h3>
                                            <p className="text-xs text-gray-500 truncate" title={group.description}>{group.description || <span className="italic">No description</span>}</p>
                                            <p className="text-xs text-indigo-600 font-medium mt-0.5">{group.memberCount} Members</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteGroup(group.id, group.name)}
                                            disabled={isDeleting[group.id]}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 flex-shrink-0"
                                            title="Delete Club"
                                        >
                                            <TrashIcon className="w-3.5 h-3.5" />
                                            {isDeleting[group.id] ? 'Deleting...' : 'Delete Club'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Auto-Generated Groups Section */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 border-b border-gray-100">
                         <h2 className="text-base font-semibold text-gray-800">
                            Auto-Generated Groups ({autoGroups.length})
                        </h2>
                    </div>
                    <div className="p-4 space-y-3">
                         <p className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200 flex items-start gap-1.5">
                            <LockClosedIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            <span>These groups are managed automatically based on student department and semester. They cannot be manually deleted.</span>
                         </p>
                         {isLoading ? (
                            <div className="space-y-3">
                                {[...Array(2)].map((_, i) => <GroupSkeleton key={`auto-skel-${i}`} />)}
                            </div>
                         ) : autoGroups.length === 0 ? (
                            <p className="text-center text-sm text-gray-500 py-6">No auto-groups found.</p>
                         ) : (
                             <div className="divide-y divide-gray-100">
                                {autoGroups.map((group) => (
                                    <div key={group.id} className="py-3 flex justify-between items-center opacity-80"> {/* Slightly faded */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-semibold text-gray-700 truncate" title={group.name}>{group.name}</h3>
                                            <p className="text-xs text-gray-500 truncate" title={group.description}>{group.description || <span className="italic">No description</span>}</p>
                                            <p className="text-xs text-indigo-600 font-medium mt-0.5">{group.memberCount} Members</p>
                                        </div>
                                        <span className="text-xs text-gray-400 font-medium ml-4 flex-shrink-0">System Managed</span>
                                    </div>
                                ))}
                            </div>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminGroupManagementPage;