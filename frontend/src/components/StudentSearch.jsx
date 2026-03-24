import {useState} from "react";
import { useNavigate } from "react-router-dom";
import {searchStudentsBySubject, searchStudentsByAvailability } from "../services/userService";
import StaticTimePickerLandscape from "./StaticTimePickerLandscape";

const StudentSearch = () => {
 const navigate = useNavigate();
 const [searchType, setSearchType] = useState('simple');
 const [subject, setSubject] = useState('');
 const [availableTime, setAvailableTime] = useState({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
    startTime: '',
    endTime: '',
 });

 const [students, setStudents] = useState([]);
 const[loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const [hasSearched, setHasSearched] = useState(false);
 const [openTimePicker, setOpenTimePicker] = useState({ type: null }); // Track which time picker is open

 // Helper function to convert 24-hour time to 12-hour format with AM/PM
 const formatTime = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
 };

 //Handle simple search by subject only
 const handleSimpleSearch = async (e) => {
    e.preventDefault();
    if(!subject.trim()){
        setError("Please enter a subject to search");
        return;
    }
    setLoading(true);
    setError('');
    setHasSearched(false);
    try {
        const data = await searchStudentsBySubject(subject);
        setStudents(data.users || []);
        setHasSearched(true);
    } catch (error) {
        setError(error.message || "Failed to search students");
    } finally {
        setLoading(false);
    }
 };

 //Advanced search by subject + availability
   const handleAdvancedSearch = async (e) => {
    e.preventDefault();
    if(!subject.trim()){
        setError("Please enter a subject to search");
        return;
    }
    
    const daysSelected = Object.keys(availableTime).some(day => 
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(day) && availableTime[day]
    );
    
    if (!daysSelected) {
        setError("Please select at least one day");
        return;
    }
    
    setLoading(true);
    setError('');
    setHasSearched(false);
    try{
        const data = await searchStudentsByAvailability({
            subject,
            availableTime,
        });

        setStudents(data.users || []);
        setHasSearched(true);

    } catch (error) {
        setError(error.message || "Failed to search students");
    } finally {
        setLoading(false);
    }
   };

   const handleCheckboxChange = (field) => {
    setAvailableTime((prev) => ({
        ...prev,
        [field]: !prev[field],
    }));
   };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Find Study Buddies</h2>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium"
                >
                    ← Back to Dashboard
                </button>
            </div>

            {/* Search Type Toggle */}
            <div className="flex gap-4 mb-6">
                <button
                 onClick={() => setSearchType('simple')}
                 className={`px-4 py-2 rounded-lg font-medium transition ${
                 searchType === 'simple'
                 ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                 }`}
                >
                    Simple Search
                </button>
                <button
                    onClick={() => setSearchType('advanced')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                    searchType === 'advanced'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                
                >
                    Advanced Search

                </button>

            </div>
            {/* Simple Search Form */}
            {searchType === 'simple' && (
                <form onSubmit={handleSimpleSearch} className="mb-6">
                    <div className="flex gap-2">
                        <input
                         type="text"
                         placeholder="Enter subjects (e.g., Math, Physics)"
                         value={subject}
                         onChange={(e) => setSubject(e.target.value)}
                         className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        
                        />
                        <button
                         type="submit"
                         disabled={loading}
                         className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
                        
                        >
                            {loading ? "Searching..." : "Search"}

                        </button>
                    </div>

                </form>

            )}

            {/* Advanced Search Form */}
            {searchType === 'advanced' && (
                <form onSubmit={handleAdvancedSearch} className="mb-6">
                    <div className="space-y-4">
                        {/* Subject Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2" >
                                Subject
                            </label>
                            <input
                             type="text"
                             placeholder="Enter subject"
                             value={subject}
                             onChange={(e) => setSubject(e.target.value)}
                             className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        
                        {/* Available Time - Days & Times */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2" >
                                Availability
                            </label>
                            
                            <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                {/* Days Selection */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">Days</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                                            <label key={day} className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={availableTime[day.toLowerCase()]}
                                                    onChange={() => handleCheckboxChange(day.toLowerCase())}
                                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                />
                                                <span className="text-sm text-gray-700">{day}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Time Selection */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">Time Range</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-700 mb-1">Start Time</label>
                                            <button
                                                type="button"
                                                onClick={() => setOpenTimePicker({ type: 'start' })}
                                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-medium text-gray-700 hover:border-indigo-400 text-left bg-white"
                                            >
                                                {availableTime.startTime || "Select Start Time"}
                                            </button>
                                            {openTimePicker.type === 'start' && (
                                                <div className="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-center justify-center p-4">
                                                    <div className="bg-white rounded-lg shadow-2xl relative max-w-[600px] w-full">
                                                        <button
                                                            type="button"
                                                            onClick={() => setOpenTimePicker({ type: null })}
                                                            className="absolute top-2 right-2 z-10 text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md"
                                                        >
                                                            ×
                                                        </button>
                                                        <StaticTimePickerLandscape
                                                            value={availableTime.startTime || "09:00"}
                                                            onChange={(newTime) => {
                                                                setAvailableTime((prev) => ({ ...prev, startTime: newTime }));
                                                                setOpenTimePicker({ type: null });
                                                            }}
                                                            label="Select Start Time"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            {availableTime.startTime && (
                                                <p className="text-xs text-gray-500 mt-1">{formatTime(availableTime.startTime)}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-700 mb-1">End Time</label>
                                            <button
                                                type="button"
                                                onClick={() => setOpenTimePicker({ type: 'end' })}
                                                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-medium text-gray-700 hover:border-indigo-400 text-left bg-white"
                                            >
                                                {availableTime.endTime || "Select End Time"}
                                            </button>
                                            {openTimePicker.type === 'end' && (
                                                <div className="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-center justify-center p-4">
                                                    <div className="bg-white rounded-lg shadow-2xl relative max-w-[600px] w-full">
                                                        <button
                                                            type="button"
                                                            onClick={() => setOpenTimePicker({ type: null })}
                                                            className="absolute top-2 right-2 z-10 text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md"
                                                        >
                                                            ×
                                                        </button>
                                                        <StaticTimePickerLandscape
                                                            value={availableTime.endTime || "17:00"}
                                                            onChange={(newTime) => {
                                                                setAvailableTime((prev) => ({ ...prev, endTime: newTime }));
                                                                setOpenTimePicker({ type: null });
                                                            }}
                                                            label="Select End Time"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            {availableTime.endTime && (
                                                <p className="text-xs text-gray-500 mt-1">{formatTime(availableTime.endTime)}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                         type="submit"
                         disabled={loading}
                         className="w-full px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
                        >
                            {loading ? 'Searching...': 'Search with Filters'}
                        </button>
                    </div>
                </form>
            )}

           {/* Error message */}
           {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
            </div>
           )}
           {/* Results */}
           {students.length > 0 && (
             <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Found {students.length} student{students.length !== 1 ? 's' : ''}
                </h3>
                <div className="space-y-3">
                    {students.map((student) => (
                        <div
                         key={student._id}
                         className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold text-gray-900">{student.name}</h4>
                                    <p className="text-sm text-gray-600">{student.email}</p>
                                    {student.degree && (
                                        <p className="text-sm text-gray-600">
                                           {student.degree} {student.year && `-Year ${student.year}`} 
                                        </p>
                                    )}
                                    {student.subjects && student.subjects.length > 0 && (
                                     <div className="mt-2 flex flex-wrap gap-1">
                                        {student.subjects.map((sub, idx) => (
                                            <span
                                              key={idx}
                                              className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded"
                                              
                                            >

                                                {sub}
                                               
                                            </span>
                                        ))}
                                     </div>
                                    )}
                                </div>
                                {student.availableTime &&  (
                                    <div className="text-xs text-gray-600 space-y-1">
                                        <div className="font-semibold">Available:</div>
                                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                                            student.availableTime[day] && (
                                                <div key={day} className="capitalize">
                                                    {day} {student.availableTime.startTime && student.availableTime.endTime && (
                                                        <span>{formatTime(student.availableTime.startTime)}-{formatTime(student.availableTime.endTime)}</span>
                                                    )}
                                                </div>
                                            )
                                        ))}
                                    </div>   
                                )}
                            </div>
                        </div>    
                    ))}

                </div>

            </div>

           )}
           {/*  No Results*/}
           {!loading && hasSearched && students.length === 0 && (
             <div className="text-center py-8 text-gray-500">
                No Students found. Try different search criteria.

             </div>   

           )}

        </div>

    );
};

export default StudentSearch;