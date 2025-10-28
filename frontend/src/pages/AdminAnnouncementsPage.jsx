// frontend/src/pages/AdminAnnouncementsPage.jsx - Refactored for Light Mode
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchAdminAnnouncements, createAnnouncement, deleteAnnouncement } from '../api/admin';
import { fetchCollegeDepartments } from '../api/general';
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'; // Icons

// Helper to format date/time (remains the same)
const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
    try {
        return new Date(dateString).toLocaleString(undefined, options);
    } catch (e) {
        return dateString;
    }
};

// CreateAnnouncementForm Component - Refactored for Light Mode
const CreateAnnouncementForm = ({ collegeDepartments, onSave, onCancel, isSubmitting }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [priority, setPriority] = useState('medium');
    const [department, setDepartment] = useState('');
    const [semester, setSemester] = useState('');
    const [formError, setFormError] = useState(null);

    // handleSubmit logic remains the same
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        if (!title.trim() || !content.trim()) {
            setFormError("Title and Content are required.");
            return;
        }
        const payload = {
            title: title.trim(),
            content: content.trim(),
            priority,
            department: department || null,
            semester: semester ? parseInt(semester, 10) : null,
        };
        if (payload.semester === null && semester) {
            setFormError("Semester must be a valid number or left blank.");
            return;
        }
        await onSave(payload, setFormError);
    };

    // Input/Select/Textarea base classes
    const inputBaseClass = "w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white placeholder-gray-400";

    return (
        // Form container styling: light gray bg, border, rounded, padding, spacing
        <form onSubmit={handleSubmit} className="p-6 bg-gray-50 border border-gray-200 rounded-lg space-y-4 shadow-sm mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Create New Announcement</h3>
            {formError && <p className="text-sm text-red-600">{formError}</p>}

            {/* Title Input */}
            <div>
                <label htmlFor="announcement-title" className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                <input id="announcement-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className={inputBaseClass} />
            </div>

            {/* Content Textarea */}
            <div>
                <label htmlFor="announcement-content" className="block text-sm font-medium text-gray-700">Content <span className="text-red-500">*</span></label>
                <textarea id="announcement-content" value={content} onChange={(e) => setContent(e.target.value)} rows="4" required className={inputBaseClass}></textarea>
            </div>

            {/* Targeting Options Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Priority Select */}
                <div>
                    <label htmlFor="announcement-priority" className="block text-sm font-medium text-gray-700">Priority</label>
                    <select id="announcement-priority" value={priority} onChange={(e) => setPriority(e.target.value)} className={inputBaseClass}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
                {/* Department Select */}
                <div>
                    <label htmlFor="announcement-department" className="block text-sm font-medium text-gray-700">Target Department</label>
                    <select id="announcement-department" value={department} onChange={(e) => setDepartment(e.target.value)} className={inputBaseClass}>
                        <option value="">College-Wide</option>
                        {collegeDepartments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">Optional: Leave blank for all departments.</p>
                </div>
                {/* Semester Select */}
                <div>
                    <label htmlFor="announcement-semester" className="block text-sm font-medium text-gray-700">Target Semester</label>
                    <select id="announcement-semester" value={semester} onChange={(e) => setSemester(e.target.value)} className={inputBaseClass}>
                        <option value="">All Semesters</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                     <p className="mt-1 text-xs text-gray-500">Optional: Leave blank for all semesters.</p>
                </div>
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
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                    {isSubmitting ? 'Posting...' : 'Post Announcement'}
                </button>
            </div>
        </form>
    );
};

// Main AdminAnnouncementsPage Component - Refactored for Light Mode
function AdminAnnouncementsPage() {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState({});
    const [departments, setDepartments] = useState([]);

    // loadAllData logic remains the same
    const loadAllData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [announcementsData, departmentsData] = await Promise.all([
                fetchAdminAnnouncements(),
                fetchCollegeDepartments()
            ]);
            // Sort announcements by date descending
            const sortedAnnouncements = (announcementsData || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setAnnouncements(sortedAnnouncements);
            setDepartments(departmentsData || []);
        } catch (err) {
            setError(err.toString());
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAllData();
    }, [loadAllData]);

    // handleCreateAnnouncement logic remains the same
    const handleCreateAnnouncement = async (payload, setFormError) => {
        setIsSubmitting(true);
        try {
            await createAnnouncement(payload);
            setIsCreating(false);
            await loadAllData(); // Refresh list after creation
        } catch (err) {
            setFormError(err.toString()); // Pass error back to form
            throw err; // Re-throw if needed elsewhere
        } finally {
            setIsSubmitting(false);
        }
    };

    // handleDeleteAnnouncement logic remains the same
    const handleDeleteAnnouncement = async (id) => {
        if (!window.confirm("Are you sure you want to delete this announcement?")) return;
        setIsDeleting(prev => ({ ...prev, [id]: true }));
        setError(null); // Clear page-level error
        try {
            await deleteAnnouncement(id);
            // Optimistic UI update: Remove locally immediately
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        } catch (err) {
             setError(`Failed to delete announcement: ${err.toString()}`); // Set page-level error on failure
        } finally {
             // Ensure loading state is cleared even if deletion fails
             setIsDeleting(prev => ({ ...prev, [id]: false }));
        }
    };

    // Define light mode priority badge classes
    const priorityClasses = {
        high: 'bg-red-100 text-red-700',
        medium: 'bg-yellow-100 text-yellow-700',
        low: 'bg-green-100 text-green-700',
        default: 'bg-gray-100 text-gray-700', // Fallback
    };

    // Loading Spinner Component
    const LoadingSpinner = () => (
        <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <p className="ml-3 text-gray-500">Loading announcements...</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">
                    Announcements Management
                </h1>
                {/* New Announcement Button */}
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                    >
                        <PlusIcon className="w-4 h-4" strokeWidth={3}/>
                        New Announcement
                    </button>
                )}
            </div>

            {/* Global Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded text-sm" role="alert">
                <strong className="font-semibold">Error:</strong> {error}
              </div>
            )}

            {/* Create Form (Conditionally Rendered) */}
            {isCreating && (
                <CreateAnnouncementForm
                    collegeDepartments={departments}
                    onSave={handleCreateAnnouncement}
                    onCancel={() => setIsCreating(false)}
                    isSubmitting={isSubmitting}
                />
            )}

            {/* Announcements List Container */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <h2 className="text-base font-semibold text-gray-800">
                        All College Announcements ({announcements.length})
                    </h2>
                </div>
                 {/* Content Area for List or States */}
                <div className="p-4">
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : announcements.length === 0 ? (
                        <p className="text-center text-sm text-gray-500 py-8">
                            No announcements posted yet.
                        </p>
                    ) : (
                        // List with dividers
                        <div className="divide-y divide-gray-100">
                            {announcements.map((a) => (
                                <div key={a.id} className="py-4">
                                    {/* Announcement Header */}
                                    <div className="flex justify-between items-start flex-wrap gap-2 mb-1.5">
                                        <h3 className="text-base font-semibold text-gray-800">{a.title}</h3>
                                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${priorityClasses[a.priority] || priorityClasses.default}`}>
                                            {a.priority}
                                        </span>
                                    </div>
                                    {/* Content */}
                                    <p className="text-sm text-gray-700 my-2 whitespace-pre-wrap leading-relaxed">{a.content}</p>
                                    {/* Metadata */}
                                    <div className="text-xs text-gray-500 space-y-0.5 mt-3">
                                        <p>
                                            <span className="font-medium text-gray-600">Target: </span>
                                            {a.department || 'All Departments'}
                                            {a.semester && ` / Sem ${a.semester}`}
                                        </p>
                                        <p>
                                            <span className="font-medium text-gray-600">Posted by: </span>
                                            {a.authorName} on {formatDate(a.createdAt)}
                                        </p>
                                    </div>
                                    {/* Delete Button */}
                                    <div className="mt-3 text-right">
                                        <button
                                            onClick={() => handleDeleteAnnouncement(a.id)}
                                            disabled={isDeleting[a.id]}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
                                            title="Delete Announcement"
                                        >
                                            <TrashIcon className="w-3.5 h-3.5" />
                                            {isDeleting[a.id] ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminAnnouncementsPage;