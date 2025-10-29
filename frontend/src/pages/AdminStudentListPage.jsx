// frontend/src/pages/AdminStudentListPage.jsx - Fully Optimized & Responsive
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchCollegeStudents } from '../api/admin';
import { ArrowTopRightOnSquareIcon, UsersIcon, MagnifyingGlassIcon, EnvelopeIcon, IdentificationIcon, CalendarIcon } from '@heroicons/react/24/outline';

// Helper to format date/time
const formatDate = (dateString) => {
    try {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
};

// Mobile Card Component for better mobile UX
const StudentCard = ({ student }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex justify-between items-start gap-3 mb-3">
            <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 mb-1 break-words">
                    {student.name}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <IdentificationIcon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="font-medium">{student.studentId}</span>
                </div>
            </div>
            <Link
                to={`/profile/${student.id}`}
                className="flex-shrink-0 p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-150"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View profile"
            >
                <ArrowTopRightOnSquareIcon className="w-5 h-5" />
            </Link>
        </div>
        
        <div className="space-y-2">
            <div className="flex items-start gap-1.5 text-sm text-gray-600">
                <EnvelopeIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="break-all" title={student.email}>{student.email}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <CalendarIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Joined {formatDate(student.createdAt)}</span>
            </div>
        </div>
    </div>
);

// Loading Skeleton for Mobile Cards
const SkeletonCard = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm animate-pulse">
        <div className="flex justify-between items-start gap-3 mb-3">
            <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
    </div>
);

// Loading Skeleton Row Component for Table
const SkeletonRow = () => (
    <tr className="animate-pulse">
        <td className="px-3 sm:px-4 lg:px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </td>
        <td className="px-3 sm:px-4 lg:px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
        </td>
        <td className="hidden sm:table-cell px-3 sm:px-4 lg:px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
        </td>
        <td className="hidden lg:table-cell px-3 sm:px-4 lg:px-6 py-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
        </td>
        <td className="px-3 sm:px-4 lg:px-6 py-4 text-right">
            <div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div>
        </td>
    </tr>
);

function AdminStudentListPage() {
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'

    useEffect(() => {
        const loadStudents = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchCollegeStudents();
                setStudents(data || []);
            } catch (err) {
                setError(err.toString());
            } finally {
                setIsLoading(false);
            }
        };
        loadStudents();
    }, []);

    // Auto-switch view mode based on screen size
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setViewMode('cards');
            } else {
                setViewMode('table');
            }
        };
        
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Filter students based on search term
    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                            Student Directory
                        </h1>
                        <p className="mt-1 text-xs sm:text-sm text-gray-600">
                            <span className="font-medium text-gray-900">{students.length}</span> active student{students.length !== 1 ? 's' : ''}
                            {searchTerm && filteredStudents.length !== students.length && (
                                <span className="text-gray-500"> · <span className="font-medium text-gray-900">{filteredStudents.length}</span> match{filteredStudents.length !== 1 ? 'es' : ''}</span>
                            )}
                        </p>
                    </div>
                    
                    {/* Search Input */}
                    <div className="w-full sm:w-72 lg:w-80">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search name, ID, or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white placeholder-gray-400 transition-shadow"
                            />
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && !isLoading && (
                    <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-r shadow-sm" role="alert">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium">Error loading students</p>
                                <p className="text-sm mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile Card View (Auto-shown on small screens) */}
                <div className="block sm:hidden">
                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => <SkeletonCard key={`skel-card-${i}`} />)}
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
                            <UsersIcon className="mx-auto h-12 w-12 text-gray-300" />
                            <p className="mt-3 text-sm font-medium text-gray-900">
                                {searchTerm ? 'No matches found' : 'No students yet'}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                {searchTerm ? 'Try adjusting your search terms' : 'Students will appear here once enrolled'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredStudents.map((student) => (
                                <StudentCard key={student.id} student={student} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            {/* Table Header */}
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th scope="col" className="px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Student ID
                                    </th>
                                    <th scope="col" className="hidden sm:table-cell px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th scope="col" className="hidden lg:table-cell px-3 sm:px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Joined
                                    </th>
                                    <th scope="col" className="relative px-3 sm:px-4 lg:px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            
                            {/* Table Body */}
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => <SkeletonRow key={`skel-${i}`} />)
                                ) : filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-16 text-center">
                                            <UsersIcon className="mx-auto h-12 w-12 text-gray-300" />
                                            <p className="mt-3 text-sm font-medium text-gray-900">
                                                {searchTerm ? 'No matches found' : 'No students yet'}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {searchTerm ? 'Try adjusting your search terms' : 'Students will appear here once enrolled'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-3 sm:px-4 lg:px-6 py-4 text-sm font-medium text-gray-900">
                                                <div className="line-clamp-2 break-words">{student.name}</div>
                                            </td>
                                            <td className="px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-600 font-mono">
                                                {student.studentId}
                                            </td>
                                            <td className="hidden sm:table-cell px-3 sm:px-4 lg:px-6 py-4 text-sm text-gray-600">
                                                <div className="max-w-[200px] lg:max-w-xs truncate" title={student.email}>
                                                    {student.email}
                                                </div>
                                            </td>
                                            <td className="hidden lg:table-cell px-3 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(student.createdAt)}
                                            </td>
                                            <td className="px-3 sm:px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link
                                                    to={`/profile/${student.id}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-all duration-150 group"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <span className="hidden sm:inline">View</span>
                                                    <ArrowTopRightOnSquareIcon className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Results Summary (Mobile) */}
                {!isLoading && filteredStudents.length > 0 && (
                    <div className="block sm:hidden text-center text-xs text-gray-500 py-2">
                        Showing {filteredStudents.length} of {students.length} student{students.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminStudentListPage;