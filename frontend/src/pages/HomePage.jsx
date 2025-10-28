// frontend/src/pages/HomePage.jsx - Refactored Landing Page with Custom College Dropdown
import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowRightIcon,
    AcademicCapIcon,
    BuildingStorefrontIcon,
    ChatBubbleLeftRightIcon,
    UsersIcon,
    MegaphoneIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    XCircleIcon,
    BuildingOfficeIcon,
    ChevronUpDownIcon, // Icon for dropdown indicator
    XMarkIcon as XMarkSmallIcon // Icon for clearing input
} from '@heroicons/react/24/outline'; // Changed XMarkIcon import name

// --- Mock College Data (Replace with API call in useEffect) ---
const MOCK_COLLEGES = [
    { collegeCode: "VIT", name: "Vellore Institute of Technology" },
    { collegeCode: "MIT", name: "Massachusetts Institute of Technology" },
    { collegeCode: "STANFORD", name: "Stanford University" },
    { collegeCode: "TMSL", name: "Techno Main Salt Lake" },
    // Add other colleges here as needed
];
// --- End Mock College Data ---

// API call function for checking college (remains the same)
const checkCollegeApi = async (collegeCode) => {
    const response = await axios.post('/api/check-college', {
        collegeCode,
    });
    return response.data;
};

// Simple Header component (remains the same)
const LandingHeader = () => (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
             <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">U</span>
                </div>
                <span className="text-xl font-bold text-indigo-600">UniLink</span>
            </Link>
            <div className="flex items-center space-x-2 sm:space-x-4">
                <Link to="/login" className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 rounded-md transition-colors duration-150">Student Login</Link>
                <Link to="/register" className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150">Register</Link>
            </div>
        </nav>
    </header>
);

// Simple Footer component (remains the same)
const LandingFooter = () => (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} UniLink. All rights reserved. |
            <Link to="/admin/login" className="ml-1 text-gray-500 hover:text-indigo-600 underline transition-colors duration-150">Admin Login</Link>
        </div>
    </footer>
);

// Feature Card Component (remains the same)
const FeatureCard = ({ icon: Icon, title, description }) => (
    <div className="text-center p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto mb-4">
            <Icon className="w-6 h-6"/>
        </div>
        <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
    </div>
);

// --- Custom College Dropdown Component ---
const CollegeDropdown = ({ colleges, value, onChange, placeholder, disabled }) => {
    const [inputValue, setInputValue] = useState(''); // What's typed in the input
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null); // Ref for detecting outside clicks

    // Update internal input value if the external value prop changes
    useEffect(() => {
        // Find the full display text for the current value (college code)
        const selectedCollege = colleges.find(c => c.collegeCode === value);
        setInputValue(selectedCollege ? `${selectedCollege.collegeCode} - ${selectedCollege.name}` : value);
    }, [value, colleges]);

    // Handle clicks outside the dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                // Reset input to selected value display text if closed without selecting
                const selectedCollege = colleges.find(c => c.collegeCode === value);
                setInputValue(selectedCollege ? `${selectedCollege.collegeCode} - ${selectedCollege.name}` : value || '');
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef, value, colleges]);

    const filteredColleges = colleges.filter(college =>
        college.collegeCode.toLowerCase().includes(inputValue.toLowerCase()) ||
        college.name.toLowerCase().includes(inputValue.toLowerCase())
    );

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
        setIsOpen(true); // Open dropdown when typing
        // If typing clears input, maybe clear external state? Depends on desired UX
        if (e.target.value === '') {
             onChange(''); // Clear the selected code externally
        }
    };

    const handleSelect = (college) => {
        setInputValue(`${college.collegeCode} - ${college.name}`); // Display code and name in input
        onChange(college.collegeCode); // Pass only the code up
        setIsOpen(false);
    };

    const clearInput = (e) => {
        e.stopPropagation(); // Prevent dropdown from opening/closing unexpectedly
        setInputValue('');
        onChange(''); // Clear the external value
        setIsOpen(true); // Keep dropdown open or open it
    }

    return (
        <div className="relative flex-grow" ref={dropdownRef}>
            <div className="relative">
                <input
                    type="text"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)} // Open on focus
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={disabled}
                    aria-label="College Code Input"
                    autoComplete="off"
                />
                 {/* Clear button */}
                 {inputValue && !disabled && (
                     <button
                         type="button"
                         onClick={clearInput}
                         className="absolute inset-y-0 right-7 flex items-center pr-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                         aria-label="Clear input"
                     >
                         <XMarkSmallIcon className="h-4 w-4" />
                     </button>
                 )}
                {/* Dropdown indicator */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)} // Toggle on click
                    className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    disabled={disabled}
                >
                    <ChevronUpDownIcon className="h-5 w-5" />
                </button>

            </div>
            {/* Dropdown List */}
            {isOpen && !disabled && (
                <ul
                    className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                    role="listbox"
                >
                    {filteredColleges.length > 0 ? (
                        filteredColleges.map((college) => (
                            <li
                                key={college.collegeCode}
                                onClick={() => handleSelect(college)}
                                className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-indigo-50"
                                role="option"
                                aria-selected={value === college.collegeCode} // Indicate selection visually if needed
                            >
                                <span className="block truncate">{`${college.collegeCode} - ${college.name}`}</span>
                                {/* Optional: Add checkmark for selected item */}
                                {/* {value === college.collegeCode && (
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                )} */}
                            </li>
                        ))
                    ) : (
                        <li className="relative cursor-default select-none py-2 px-4 text-gray-500">
                            No colleges found.
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
};
// --- End Custom College Dropdown Component ---


// Main HomePage Component - Using Custom Dropdown
function HomePage() {
    // State remains mostly the same, collegeCodeInput now holds the CODE
    const [collegeCodeInput, setCollegeCodeInput] = useState('');
    const [checkLoading, setCheckLoading] = useState(false);
    const [checkResult, setCheckResult] = useState(null);
    const [checkError, setCheckError] = useState(null);
    const [allColleges, setAllColleges] = useState([]);

    // Fetch College List (remains the same)
    useEffect(() => {
        const fetchColleges = async () => {
             console.log("Fetching colleges (mock)...");
             await new Promise(resolve => setTimeout(resolve, 50));
             setAllColleges(MOCK_COLLEGES);
        };
        fetchColleges();
    }, []);

    // handleCheckCollege remains the same (uses collegeCodeInput which now holds the code)
    const handleCheckCollege = async (e) => {
        e.preventDefault();
        const codeToCheck = collegeCodeInput.trim().toUpperCase();
        if (!codeToCheck) {
            setCheckError("Please select a college."); // Updated message
            setCheckResult(null);
            return;
        }
        setCheckLoading(true);
        setCheckError(null);
        setCheckResult(null);
        try {
            const foundCollege = allColleges.find(c => c.collegeCode === codeToCheck);
            const data = await checkCollegeApi(codeToCheck);
            setCheckResult({
                ...data,
                collegeName: foundCollege ? foundCollege.name : data.collegeName
            });
        } catch (err) {
            let errorMessage = "College not found or an error occurred.";
            if (axios.isAxiosError(err) && err.response?.data?.error) {
                errorMessage = err.response.data.error;
            }
            setCheckError(errorMessage);
            console.error('College check error:', err);
        } finally {
            setCheckLoading(false);
        }
    };

    // Handler for the custom dropdown's onChange
    const handleDropdownChange = (selectedCode) => {
        setCollegeCodeInput(selectedCode); // Update state with the selected CODE
        setCheckResult(null); // Clear previous results
        setCheckError(null);
    };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <LandingHeader />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-white py-16 sm:py-24 border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
             <div className="mx-auto w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
               <AcademicCapIcon className="w-8 h-8 text-white"/>
             </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              Connect Your Campus Life with <span className="text-indigo-600">UniLink</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              The exclusive platform for students. Buy & sell, get announcements, chat with friends, and stay connected with your college community.
            </p>

            {/* --- College Check Form using Custom Dropdown --- */}
            <div className="mt-10 max-w-md mx-auto">
                 <p className="text-sm font-medium text-gray-700 mb-2">Check if your college is supported:</p>
                 <form onSubmit={handleCheckCollege} className="flex items-stretch gap-2">
                    {/* Use the Custom Dropdown Component */}
                    <CollegeDropdown
                        colleges={allColleges}
                        value={collegeCodeInput} // Pass the code state
                        onChange={handleDropdownChange} // Pass the handler
                        placeholder="Type or select College Code"
                        disabled={checkLoading}
                    />

                    <button
                        type="submit"
                        disabled={checkLoading || !collegeCodeInput.trim()}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                        {checkLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <MagnifyingGlassIcon className="w-4 h-4"/>
                        )}
                        Check
                    </button>
                 </form>
                 {/* Feedback Area (remains the same) */}
                 <div className="mt-3 text-sm min-h-[40px] text-left">
                    {checkResult && (
                        <div className="flex items-center gap-2 p-2 bg-green-50 text-green-700 border border-green-200 rounded-md">
                            <CheckCircleIcon className="w-5 h-5 flex-shrink-0 text-green-500" />
                            <span>
                                College found: <span className="font-semibold">{checkResult.collegeName}</span> ({collegeCodeInput.toUpperCase()}). Ready to register!
                            </span>
                        </div>
                    )}
                    {checkError && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 text-red-700 border border-red-200 rounded-md">
                            <XCircleIcon className="w-5 h-5 flex-shrink-0 text-red-500" />
                            <span>{checkError}</span>
                        </div>
                    )}
                </div>
            </div>
            {/* --- End College Check Form --- */}


            {/* Call to Action Buttons (remains the same) */}
            <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
              <Link to="/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 text-base font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150">
                Student Login
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </Link>
              <Link to="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 text-base font-medium text-indigo-700 bg-indigo-100 border border-transparent rounded-md hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150">
                Register Now
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section (remains the same) */}
        <section className="py-16 sm:py-20 bg-white border-t border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-semibold text-center text-gray-800 mb-10">Platform Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 <FeatureCard icon={BuildingStorefrontIcon} title="Marketplace" description="Buy and sell textbooks, notes, electronics, and more within your college."/>
                 <FeatureCard icon={MegaphoneIcon} title="Announcements" description="Receive important updates and news directly from your college administration."/>
                 <FeatureCard icon={ChatBubbleLeftRightIcon} title="Chat & Groups" description="Connect with friends through direct messages and join department or club groups."/>
                 <FeatureCard icon={UsersIcon} title="Friends & Profile" description="Find classmates, build your network, and manage your public profile."/>
            </div>
          </div>
        </section>

      </main>

      <LandingFooter />
    </div>
  );
}

export default HomePage;