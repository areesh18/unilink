// frontend/src/pages/AdminStudentListPage.jsx (New File)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchCollegeStudents } from '../api/admin';

// Helper to format date/time
const formatDate = (dateString) => {
    try {
        return new Date(dateString).toLocaleDateString();
    } catch (e) {
        return dateString;
    }
};

function AdminStudentListPage() {
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadStudents = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchCollegeStudents();
                setStudents(data);
            } catch (err) {
                setError(err.toString());
            } finally {
                setIsLoading(false);
            }
        };

        loadStudents();
    }, []);

    if (isLoading) {
        return <div className="text-center py-10 dark:text-gray-400">Loading student list...</div>;
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded dark:bg-red-900 dark:border-red-700 dark:text-red-300" role="alert">
                <strong className="font-bold">Error:</strong>
                <span className="block sm:inline"> {error}</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                College Student Directory
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
                Total active students: {students.length}
            </p>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
                {students.length === 0 ? (
                    <p className="p-6 text-gray-500 dark:text-gray-400">No students found for this college.</p>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Student ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Joined
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {students.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        {student.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {student.studentId}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {student.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {formatDate(student.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {/* Link to view student's public profile */}
                                        <Link
                                            to={`/profile/${student.id}`}
                                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                            target="_blank"
                                        >
                                            View Profile
                                        </Link>
                                        {/* TODO: Add Disable/Suspend button later */}
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

export default AdminStudentListPage;