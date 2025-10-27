// frontend/src/pages/AdminAnnouncementsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchAdminAnnouncements, createAnnouncement, deleteAnnouncement } from '../api/admin';
import { fetchCollegeDepartments } from '../api/general'; // <-- NEW IMPORT

// Helper to format date/time
const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
    try {
        return new Date(dateString).toLocaleString(undefined, options);
    } catch (e) {
        return dateString;
    }
};

// Component for the Announcement Creation Form/Modal
const CreateAnnouncementForm = ({ collegeDepartments, onSave, onCancel, isSubmitting }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [priority, setPriority] = useState('medium');
    const [department, setDepartment] = useState(''); // Empty string means null (College-Wide)
    const [semester, setSemester] = useState('');     // Empty string means null (College-Wide)
    const [formError, setFormError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        // Basic validation
        if (!title.trim() || !content.trim()) {
            setFormError("Title and Content are required.");
            return;
        }

        const payload = {
            title: title.trim(),
            content: content.trim(),
            priority,
            // Convert empty string/zero to null for optional targeting fields
            department: department || null,
            semester: semester ? parseInt(semester, 10) : null,
        };

        if (payload.semester === null && semester) { // Handle case where semester input is not a number
            setFormError("Semester must be a valid number or left blank.");
            return;
        }

        await onSave(payload, setFormError);
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Announcement</h3>
            {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} rows="4" required className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"></textarea>
            </div>

            <div className="flex space-x-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>

                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Department (Optional)</label>
                    <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                        <option value="">College-Wide (All Depts)</option>
                        {/* Dynamically populated from the fetched list */}
                        {collegeDepartments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>
                
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Semester (Optional)</label>
                    <select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                        <option value="">All Semesters</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-500">
                    Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600">
                    {isSubmitting ? 'Posting...' : 'Post Announcement'}
                </button>
            </div>
        </form>
    );
};


function AdminAnnouncementsPage() {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState({});
    
    // --- STATE FOR DEPARTMENTS ---
    const [departments, setDepartments] = useState([]); 
    // --- END STATE FOR DEPARTMENTS ---
    
    // --- NEW LOADING LOGIC (COMBINED) ---
    const loadAllData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Fetch announcements
            const announcementsData = await fetchAdminAnnouncements();
            // 2. Fetch college departments
            const departmentsData = await fetchCollegeDepartments(); 
            
            setAnnouncements(announcementsData);
            setDepartments(departmentsData); 
            
        } catch (err) {
            setError(err.toString());
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);
    // --- END NEW LOADING LOGIC ---


    const handleCreateAnnouncement = async (payload, setFormError) => {
        setIsSubmitting(true);
        try {
            await createAnnouncement(payload);
            setIsCreating(false); 
            await loadAllData(); // Refresh list and departments
        } catch (err) {
            setFormError(err.toString());
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAnnouncement = async (id) => {
        if (!window.confirm("Are you sure you want to delete this announcement?")) return;

        setIsDeleting(prev => ({ ...prev, [id]: true }));
        setError(null);
        try {
            await deleteAnnouncement(id);
            // Remove locally for a quick UI update
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            setError(err.toString());
        } finally {
            setIsDeleting(prev => ({ ...prev, [id]: false }));
        }
    };

    // Render logic
    const priorityClasses = {
        high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Announcements Management
                </h1>
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                    + New Announcement
                </button>
            </div>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded dark:bg-red-900 dark:border-red-700 dark:text-red-300">{error}</div>}

            {isCreating && (
                <CreateAnnouncementForm
                    // --- PASS ACTUAL DEPARTMENTS ---
                    collegeDepartments={departments} 
                    // --- END PASS ACTUAL DEPARTMENTS ---
                    onSave={handleCreateAnnouncement}
                    onCancel={() => setIsCreating(false)}
                    isSubmitting={isSubmitting}
                />
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">All College Announcements ({announcements.length})</h2>
                {isLoading ? (
                    <p className="text-gray-500 dark:text-gray-400">Loading announcements...</p>
                ) : announcements.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No announcements posted yet.</p>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {announcements.map((a) => (
                            <div key={a.id} className="py-4">
                                <div className="flex justify-between items-start flex-wrap gap-2">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{a.title}</h3>
                                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded capitalize ${priorityClasses[a.priority] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                                        {a.priority}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 my-2 whitespace-pre-wrap">{a.content}</p>
                                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                    <p>
                                        Target:
                                        <span className="font-medium ml-1">
                                            {a.department || 'All Departments'}
                                            {a.semester && ` / Sem ${a.semester}`}
                                        </span>
                                    </p>
                                    <p>Posted by: {a.authorName} on {formatDate(a.createdAt)}</p>
                                </div>
                                <div className="mt-2 text-right">
                                    <button
                                        onClick={() => handleDeleteAnnouncement(a.id)}
                                        disabled={isDeleting[a.id]}
                                        className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
                                    >
                                        {isDeleting[a.id] ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminAnnouncementsPage;