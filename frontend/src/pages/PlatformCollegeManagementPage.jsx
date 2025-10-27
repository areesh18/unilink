// frontend/src/pages/PlatformCollegeManagementPage.jsx (New File)
import React, { useState, useEffect, useCallback } from 'react';
import { fetchAllColleges, addCollege } from '../api/admin';

// Reusable form component for adding a college
const AddCollegeForm = ({ onSave, isSubmitting }) => {
    const [collegeCode, setCollegeCode] = useState('');
    const [name, setName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [formError, setFormError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        
        const code = collegeCode.toUpperCase().trim();
        const collegeName = name.trim();

        if (!code || !collegeName) {
            setFormError("College Code and Name are required.");
            return;
        }

        const payload = {
            collegeCode: code,
            name: collegeName,
            logoUrl: logoUrl.trim() || null,
        };

        try {
            await onSave(payload);
            // Clear form on success
            setCollegeCode('');
            setName('');
            setLogoUrl('');
        } catch (err) {
            setFormError(err.toString());
        }
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow space-y-4 max-w-2xl">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add New College to Platform</h3>
            
            {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">College Code (e.g., VIT)</label>
                        <input 
                            type="text" 
                            value={collegeCode} 
                            onChange={(e) => setCollegeCode(e.target.value.toUpperCase())} 
                            required 
                            className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            required 
                            className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Logo URL (Optional)</label>
                    <input 
                        type="url" 
                        value={logoUrl} 
                        onChange={(e) => setLogoUrl(e.target.value)} 
                        className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                        placeholder="https://..."
                    />
                </div>
                
                <div className="flex justify-end pt-2">
                    <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
                    >
                        {isSubmitting ? 'Adding...' : 'Add College'}
                    </button>
                </div>
            </form>
        </div>
    );
};


function PlatformCollegeManagementPage() {
    const [colleges, setColleges] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadColleges = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // fetchAllColleges uses the /platform-admin/stats endpoint which returns comprehensive college info
            const data = await fetchAllColleges();
            setColleges(data);
        } catch (err) {
            setError(err.toString());
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadColleges();
    }, [loadColleges]);

    const handleAddCollege = async (payload) => {
        setIsSubmitting(true);
        try {
            const result = await addCollege(payload);
            alert(`College ${result.college.name} added successfully!`); // Simple success feedback
            await loadColleges(); // Refresh list to include the new college
        } catch (err) {
            throw err; // Let the form handle the error display
        } finally {
            setIsSubmitting(false);
        }
    };

    const sortColleges = (c) => c.sort((a, b) => b.studentCount - a.studentCount);
    const hasStudents = colleges.some(c => c.studentCount > 0);
    
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Platform College Management
            </h1>
            
            {/* Add College Section */}
            <AddCollegeForm onSave={handleAddCollege} isSubmitting={isSubmitting} />

            {/* College List Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                    Registered Colleges ({colleges.length})
                </h2>
                {isLoading ? (
                    <p className="text-gray-500 dark:text-gray-400">Loading college list...</p>
                ) : error ? (
                     <p className="text-red-500 dark:text-red-400">Error loading colleges: {error}</p>
                ) : colleges.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No colleges registered on the platform.</p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Code / Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Students
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Active Listings
                                </th>
                                {/* Add column for admin management link later */}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {sortColleges([...colleges]).map((c) => (
                                <tr key={c.collegeCode} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{c.collegeCode}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{c.collegeName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                        {c.studentCount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                                        {c.activeListings}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default PlatformCollegeManagementPage;