// frontend/src/pages/AdminStudentListPage.jsx - Refactored for Light Mode
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchCollegeStudents } from '../api/admin';
import { ArrowTopRightOnSquareIcon, UsersIcon } from '@heroicons/react/24/outline'; // Icons

// Helper to format date/time - More detailed format
const formatDate = (dateString) => {
    try {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch (e) {
        return dateString; // Fallback
    }
};

// Loading Skeleton Row Component
const SkeletonRow = () => (
    <tr className="animate-pulse">
        <td className="px-6 py-4 whitespace-nowrap text-sm">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
             <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
            <div className="h-4 bg-gray-200 rounded w-1/4 ml-auto"></div>
        </td>
    </tr>
);

function AdminStudentListPage() {
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // State for search term

    useEffect(() => {
        const loadStudents = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchCollegeStudents();
                setStudents(data || []); // Ensure it's always an array
            } catch (err) {
                setError(err.toString());
            } finally {
                setIsLoading(false);
            }
        };
        loadStudents();
    }, []);

    // Filter students based on search term
    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Render Logic
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Student Directory
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Total active students: {students.length}
                    </p>
                </div>
                 {/* Search Input */}
                 <div className="w-full sm:w-64">
                    <input
                        type="text"
                        placeholder="Search name, ID, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white placeholder-gray-400"
                    />
                 </div>
            </div>

             {/* Error Message */}
            {error && !isLoading && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded text-sm" role="alert">
                    <strong className="font-semibold">Error:</strong> {error}
                </div>
            )}

            {/* Table Container */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        {/* Table Header */}
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Student ID
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Joined
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Actions</span>
                                </th>
                            </tr>
                        </thead>
                        {/* Table Body */}
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                // Show skeleton rows while loading
                                [...Array(5)].map((_, i) => <SkeletonRow key={`skel-${i}`} />)
                            ) : filteredStudents.length === 0 ? (
                                // Empty state row
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                         <UsersIcon className="mx-auto h-8 w-8 text-gray-300" />
                                         <p className="mt-1 text-sm text-gray-500">
                                            {searchTerm ? 'No students match your search.' : 'No students found for this college.'}
                                         </p>
                                    </td>
                                </tr>
                            ) : (
                                // Render student rows
                                filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {student.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.studentId}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(student.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {/* Link to view student's profile in new tab */}
                                            <Link
                                                to={`/profile/${student.id}`}
                                                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors duration-150"
                                                target="_blank" // Open in new tab
                                                rel="noopener noreferrer" // Security best practice
                                            >
                                                View Profile
                                                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                                            </Link>
                                            {/* TODO: Add Disable/Suspend button or menu later */}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default AdminStudentListPage;