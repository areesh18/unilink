// frontend/src/pages/Register.jsx - Updated with Custom College Dropdown
import React, { useState, useEffect, useRef } from 'react'; // Added useEffect, useRef
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
    ChevronUpDownIcon, // Icon for dropdown indicator
    XMarkIcon as XMarkSmallIcon // Icon for clearing input
} from '@heroicons/react/24/outline'; // Icons for dropdown

// --- Mock College Data (Replace with API call in useEffect) ---
// In a real app, fetch this from a public endpoint like /api/colleges/public
const MOCK_COLLEGES = [
    { collegeCode: "VIT", name: "Vellore Institute of Technology" },
    { collegeCode: "MIT", name: "Massachusetts Institute of Technology" },
    { collegeCode: "STANFORD", name: "Stanford University" },
    { collegeCode: "TMSL", name: "Techno Main Salt Lake" },
    // Add other colleges here as needed
];
// --- End Mock College Data ---

// API call function (remains the same)
const registerUser = async (collegeCode, studentId, password) => {
  const response = await axios.post('/api/register', {
    collegeCode,
    studentId,
    password,
  });
  return response.data;
};

// --- Custom College Dropdown Component (Copied from HomePage) ---
const CollegeDropdown = ({ colleges, value, onChange, placeholder, disabled, required }) => {
    const [inputValue, setInputValue] = useState(''); // What's typed/displayed
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Update internal input value if the external value prop changes
    useEffect(() => {
        const selectedCollege = colleges.find(c => c.collegeCode === value);
        setInputValue(selectedCollege ? `${selectedCollege.collegeCode} - ${selectedCollege.name}` : value || ''); // Ensure empty string if value is null/undefined
    }, [value, colleges]);


    // Handle clicks outside the dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                // Reset input to selected value display text if closed without selecting
                const selectedCollege = colleges.find(c => c.collegeCode === value);
                 // Only reset if a valid college code was previously selected
                setInputValue(selectedCollege ? `${selectedCollege.collegeCode} - ${selectedCollege.name}` : '');
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef, value, colleges]); // Removed inputValue dependency

    const filteredColleges = colleges.filter(college =>
        !inputValue || // Show all if input is empty
        college.collegeCode.toLowerCase().includes(inputValue.toLowerCase()) ||
        college.name.toLowerCase().includes(inputValue.toLowerCase()) ||
        `${college.collegeCode} - ${college.name}`.toLowerCase().includes(inputValue.toLowerCase()) // Allow filtering by combined text
    );

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
        setIsOpen(true);
        // Important: Do NOT call onChange here, only when selecting or clearing
        if (e.target.value === '') {
             onChange(''); // Clear the selected code externally if input is cleared
        }
    };

    const handleSelect = (college) => {
        setInputValue(`${college.collegeCode} - ${college.name}`);
        onChange(college.collegeCode); // Pass only the code up
        setIsOpen(false);
    };

    const clearInput = (e) => {
        e.stopPropagation();
        setInputValue('');
        onChange('');
        setIsOpen(true); // Keep dropdown open or open it
        // Optionally focus the input again
        dropdownRef.current?.querySelector('input')?.focus();
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="relative">
                <input
                    type="text"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                    disabled={disabled}
                    aria-label="College Selection Input"
                    autoComplete="off"
                    required={required && !value} // Make input required only if no value is selected yet (for form validation)
                />
                 {/* Clear button */}
                 {inputValue && !disabled && (
                     <button type="button" onClick={clearInput} className="absolute inset-y-0 right-7 flex items-center pr-2 text-gray-400 hover:text-gray-600 focus:outline-none" aria-label="Clear input">
                         <XMarkSmallIcon className="h-4 w-4" />
                     </button>
                 )}
                {/* Dropdown indicator */}
                <button type="button" onClick={() => setIsOpen(!isOpen)} className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600 focus:outline-none" aria-haspopup="listbox" aria-expanded={isOpen} disabled={disabled}>
                    <ChevronUpDownIcon className="h-5 w-5" />
                </button>
            </div>
            {/* Dropdown List */}
            {isOpen && !disabled && (
                <ul
                    className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                    role="listbox"
                >
                    {filteredColleges.length > 0 ? (
                        filteredColleges.map((college) => (
                            <li
                                key={college.collegeCode}
                                onClick={() => handleSelect(college)}
                                className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-gray-900 hover:bg-indigo-50 data-[selected]:bg-indigo-100 data-[selected]:font-semibold" // Added data attribute styling possibility
                                role="option"
                                aria-selected={value === college.collegeCode}
                                data-selected={value === college.collegeCode} // Added data attribute
                            >
                                <span className="block truncate">{`${college.collegeCode} - ${college.name}`}</span>
                            </li>
                        ))
                    ) : (
                        <li className="relative cursor-default select-none py-2 px-4 text-gray-500 text-sm italic">
                            No matching colleges found.
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
};
// --- End Custom College Dropdown Component ---


// Main Register Component
function Register() {
  const [collegeCode, setCollegeCode] = useState(''); // Now holds only the code
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [allColleges, setAllColleges] = useState([]); // State for college list

   // --- Fetch College List (Using Mock Data for now) ---
    useEffect(() => {
        // Simulate fetching college list
        const fetchColleges = async () => {
             console.log("Fetching colleges for register page (mock)...");
             await new Promise(resolve => setTimeout(resolve, 50));
             setAllColleges(MOCK_COLLEGES);
        };
        fetchColleges();
    }, []);
    // --- End Fetch College List ---

  // handleRegister logic remains mostly the same, uses collegeCode state
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Frontend validation
    if (!collegeCode) { // Check if a college code is selected
        setError('Please select your college.');
        return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }

    setIsLoading(true);

    try {
      const data = await registerUser(collegeCode, studentId, password); // collegeCode is already uppercase from dropdown value
      setSuccessMessage(data.message || 'Registration successful! Redirecting to login...');
      console.log('Registration successful:', data);

      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      let errorMessage = 'An error occurred during registration.';
       if (axios.isAxiosError(err)) {
         errorMessage = err.response?.data?.error || err.message || errorMessage;
       } else if (err instanceof Error) {
          errorMessage = err.message;
       }
      setError(errorMessage);
      console.error('Registration error:', err);
      setIsLoading(false);
    }
  };

  // Handler for the custom dropdown's onChange
  const handleDropdownChange = (selectedCode) => {
      setCollegeCode(selectedCode); // Update state with the selected CODE
      setError(null); // Clear error when college changes
  };


  // Base input class
  const inputBaseClass = "w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white placeholder-gray-400 disabled:opacity-50";


  return (
    // Main container styling: light gray bg, center content
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 py-12">
      {/* Form Card Styling: white bg, rounded, shadow */}
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md border border-gray-200">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-1 text-sm text-gray-600">Join the UniLink community</p>
        </div>

        {/* Success Message */}
        {successMessage && !error && (
            <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200">
                {successMessage}
            </div>
        )}

        {/* Error Message */}
         {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
                {error}
            </div>
        )}

        {/* Form - hidden on success */}
        {!successMessage && (
          <form onSubmit={handleRegister} className="space-y-4">
            {/* College Dropdown */}
            <div>
              <label htmlFor="collegeCode" className="block text-sm font-medium text-gray-700">
                College <span className="text-red-500">*</span>
              </label>
               <div className="mt-1">
                 <CollegeDropdown
                    colleges={allColleges}
                    value={collegeCode}
                    onChange={handleDropdownChange}
                    placeholder="Type or select your College"
                    disabled={isLoading}
                    required={true} // Add required attribute
                 />
               </div>
            </div>

            {/* Student ID Input */}
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                Student ID <span className="text-red-500">*</span>
              </label>
              <input
                id="studentId"
                name="studentId"
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className={inputBaseClass}
                placeholder="Enter your official student ID"
                disabled={isLoading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength="6"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputBaseClass}
                placeholder="Min. 6 characters"
                disabled={isLoading}
              />
            </div>

            {/* Confirm Password Input */}
             <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputBaseClass}
                placeholder="Re-enter your password"
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-150"
              >
                 {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                {isLoading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
        )}

        {/* Link to Login */}
        <p className="text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;