import {useState} from "react";
import { useNavigate } from "react-router-dom";
import {searchStudentsBySubject, searchStudentsByAvailability } from "../services/userService";

const StudentSearch = () => {
 const navigate = useNavigate();
 const [searchType, setSearchType] = useState('simple'); //Simple search by subject or advanced search by subject + availability
 const [subject, setSubject] = useState('');
 const [availableTime, setAvailableTime] = useState({
    weekdays: false,
    weekend: false,
    morning: false,
    evening: false,
 });

 const [students, setStudents] = useState([]);
 const[loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const [hasSearched, setHasSearched] = useState(false);


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
        setStudents(data.users);
        setHasSearched(true);
        
    } catch (error) {
        setError(error.message || "Failed to search students");
    } finally {
        setLoading(false);
    }

 };

 //Adavanced search by subject + availability
   const handleAdvancedSearch = async (e) => {
    e.preventDefault();
    if(!subject.trim()){
        setError("Please enter a subject to search");
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

        setStudents(data.users);
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
                        {/* Available Time Checkboxes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2" >
                                Availability
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={availableTime.weekdays}
                                    onChange={() => handleCheckboxChange('weekdays')}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-700">Weekdays</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={availableTime.weekend}
                                    onChange={() => handleCheckboxChange('weekend')}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-700">Weekend</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={availableTime.morning}
                                    onChange={() => handleCheckboxChange('morning')}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-700">Morning</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={availableTime.evening}
                                    onChange={() => handleCheckboxChange('evening')}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-700">Evening</span>
                                </label>

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
                                    <div className="text-xs text-gray-500">
                                        {student.availableTime.weekdays && <span className="block">📅 Weekdays</span>}
                                        {student.availableTime.weekend && <span className="block">📅 Weekend</span>}
                                        {student.availableTime.morning && <span className="block">🌅 Morning</span>}
                                        {student.availableTime.evening && <span className="block">🌆 Evening</span>}
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