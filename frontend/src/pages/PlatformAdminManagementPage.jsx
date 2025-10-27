// frontend/src/pages/PlatformAdminManagementPage.jsx (Corrected)
import React, { useState, useEffect, useCallback } from 'react';
import { createCollegeAdmin, fetchAllColleges } from '../api/admin';

// Form sub-component
const CreateAdminForm = ({ colleges, onSave, isSubmitting }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [collegeCode, setCollegeCode] = useState('');
    const [formError, setFormError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        // Set default college code if list is available
        if (colleges && colleges.length > 0) {
            setCollegeCode(colleges[0].collegeCode);
        }
    }, [colleges]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        setSuccessMessage(null);

        if (!name.trim() || !email.trim() || !password.trim() || !collegeCode) {
            setFormError("All fields are required.");
            return;
        }

        const payload = {
            name: name.trim(),
            email: email.trim(),
            password: password.trim(),
            collegeCode,
        };

        try {
            const result = await onSave(payload);
            setSuccessMessage(`Successfully created admin: ${result.user.name} (${result.user.email})`);
            // Clear form
            setName('');
            setEmail('');
            setPassword('');
        } catch (err) {
            setFormError(err.toString());
        }
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow space-y-4 max-w-2xl">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Create New College Admin</h3>
            
            {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}
            {successMessage && <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        {/* --- THIS IS THE CORRECTED LINE --- */}
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assign to College</label>
                        <select value={collegeCode} onChange={(e) => setCollegeCode(e.target.value)} required className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            {colleges.length === 0 ? (
                                <option value="" disabled>Loading colleges...</option>
                            ) : (
                                colleges.map(college => (
                                    <option key={college.collegeCode} value={college.collegeCode}>
                                        {college.collegeName} ({college.collegeCode})
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                </div>
                
                <div className="flex justify-end pt-2">
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600">
                        {isSubmitting ? 'Creating...' : 'Create Admin Account'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Main Page Component
function PlatformAdminManagementPage() {
    const [colleges, setColleges] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadColleges = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
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

    const handleCreateAdmin = async (payload) => {
        setIsSubmitting(true);
        try {
            // Pass the call to the API function
            return await createCollegeAdmin(payload);
        } catch (err) {
            throw err; // Let the form component handle displaying the error
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Platform Admin Management
            </h1>
            
            {/* Form Section */}
            {isLoading ? (
                 <p className="dark:text-gray-400">Loading college list for form...</p>
            ) : error ? (
                 <p className="text-red-500 dark:text-red-400">Error loading college list: {error}</p>
            ) : (
                <CreateAdminForm 
                    colleges={colleges} 
                    onSave={handleCreateAdmin} 
                    isSubmitting={isSubmitting} 
                />
            )}

            {/* TODO: List existing admins here */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow space-y-4 max-w-2xl">
                 <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Existing College Admins</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400">
                    (Feature to list and manage existing admins can be added here when the backend API endpoint is available.)
                 </p>
            </div>
        </div>
    );
}

export default PlatformAdminManagementPage;