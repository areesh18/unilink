// frontend/src/pages/AdminGroupManagementPage.jsx (New File)
import React, { useState, useEffect, useCallback } from 'react';
import { fetchCollegeGroups, createPublicGroup, deleteCollegeGroup } from '../api/admin';

// Reusable form component for creating a group
const CreateGroupForm = ({ onSave, onCancel, isSubmitting }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [avatar, setAvatar] = useState('');
    const [formError, setFormError] = useState(null);

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

        await onSave(payload, setFormError);
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg shadow space-y-4 max-w-lg">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Public Group (Club)</h3>
            {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Group Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"></textarea>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Avatar URL (Optional)</label>
                <input type="url" value={avatar} onChange={(e) => setAvatar(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-500">
                    Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600">
                    {isSubmitting ? 'Creating...' : 'Create Group'}
                </button>
            </div>
        </form>
    );
};


function AdminGroupManagementPage() {
    const [groups, setGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState({});

    const loadGroups = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchCollegeGroups();
            setGroups(data);
        } catch (err) {
            setError(err.toString());
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadGroups();
    }, [loadGroups]);

    const handleCreateGroup = async (payload, setFormError) => {
        setIsSubmitting(true);
        try {
            await createPublicGroup(payload);
            setIsCreating(false); // Close form
            await loadGroups(); // Refresh list
        } catch (err) {
            setFormError(err.toString());
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteGroup = async (id, name) => {
        if (!window.confirm(`Are you sure you want to permanently delete the public group "${name}"? This will remove all members.`)) {
            return;
        }

        setIsDeleting(prev => ({ ...prev, [id]: true }));
        setError(null);
        try {
            await deleteCollegeGroup(id);
            // Remove locally for a quick UI update
            setGroups(prev => prev.filter(g => g.id !== id));
        } catch (err) {
            setError(err.toString());
        } finally {
            setIsDeleting(prev => ({ ...prev, [id]: false }));
        }
    };

    const autoGroups = groups.filter(g => g.type === 'auto');
    const publicGroups = groups.filter(g => g.type === 'public');

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Group Management
                </h1>
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                    + Create New Club
                </button>
            </div>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded dark:bg-red-900 dark:border-red-700 dark:text-red-300">{error}</div>}

            {isCreating && (
                <div className="my-6">
                    <CreateGroupForm
                        onSave={handleCreateGroup}
                        onCancel={() => setIsCreating(false)}
                        isSubmitting={isSubmitting}
                    />
                </div>
            )}
            
            {isLoading ? (
                <div className="text-center py-10 dark:text-gray-400">Loading groups...</div>
            ) : (
                <div className="space-y-6">
                    
                    {/* Public Groups (Clubs) Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                            Public Groups (Clubs) ({publicGroups.length})
                        </h2>
                        {publicGroups.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400">No public clubs created yet.</p>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {publicGroups.map((group) => (
                                    <div key={group.id} className="py-3 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{group.name}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{group.description}</p>
                                            <p className="text-xs text-indigo-600 dark:text-indigo-400">{group.memberCount} Members</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteGroup(group.id, group.name)}
                                            disabled={isDeleting[group.id]}
                                            className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
                                        >
                                            {isDeleting[group.id] ? 'Deleting...' : 'Delete Club'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Auto-Generated Groups Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                            Auto-Generated Groups (Department/Semester) ({autoGroups.length})
                        </h2>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4">
                            These groups are automatically managed and cannot be manually deleted.
                        </p>
                        {autoGroups.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400">No auto-groups found (Check if students are registered).</p>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {autoGroups.map((group) => (
                                    <div key={group.id} className="py-3 flex justify-between items-center opacity-75">
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{group.name}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{group.description}</p>
                                            <p className="text-xs text-indigo-600 dark:text-indigo-400">{group.memberCount} Members</p>
                                        </div>
                                        {/* Cannot delete auto groups */}
                                        <span className="text-xs text-gray-400 dark:text-gray-500">System Managed</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminGroupManagementPage;