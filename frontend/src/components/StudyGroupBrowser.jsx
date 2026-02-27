import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    getAllStudyGroups,
    searchStudyGroupsBySubject,
    searchStudyGroupsByAvailability,
    joinStudyGroup
} from '../services/studyGroupService';
import CreateGroupModal from "./CreateGroupModal";
import { 
    MagnifyingGlassIcon,
    UserGroupIcon,
    AcademicCapIcon,
    ClockIcon,
    CalendarIcon,
    ChevronRightIcon,
    PlusIcon,
    XMarkIcon,
    FunnelIcon,
    ArrowPathIcon,
    UsersIcon,
    BookOpenIcon,
    SparklesIcon,
    FireIcon,
    ChatBubbleLeftRightIcon,
    VideoCameraIcon,
    MapPinIcon,
    GlobeAltIcon,
    StarIcon,
    EllipsisHorizontalIcon,
    CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

// Import images (replace with your actual image URLs)
const groupImages = [
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
];

const backgroundPattern = "https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80";

const StudyGroupBrowser = () => {
    const navigate = useNavigate();
    const [searchType, setSearchType] = useState("all");
    const [subject, setSubject] = useState('');
    const [meetingTime, setMeetingTime] = useState({
        weekdays: false,
        weekend: false,
        morning: false,
        evening: false,
    });
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [joinLoading, setJoinLoading] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [hoveredGroup, setHoveredGroup] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [viewMode, setViewMode] = useState("grid"); // grid or list
    const [sortBy, setSortBy] = useState("popular"); // popular, newest, members

    useEffect(() => {
        loadAllGroups();
    }, []);

    const loadAllGroups = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getAllStudyGroups();
            setGroups(data.studyGroups);
        } catch (error) {
            setError(error.message || "Failed to load study groups");
        } finally {
            setLoading(false);
        }
    };

    const handleSubjectSearch = async (e) => {
        e.preventDefault();
        if (!subject.trim()) {
            setError("Please enter a subject to search");
            return;
        }
        setLoading(true);
        setError('');
        try {
            const data = await searchStudyGroupsBySubject(subject);
            setGroups(data.studyGroups);
        } catch (error) {
            setError(error.message || "Failed to search study groups");
        } finally {
            setLoading(false);
        }
    };

    const handleAdvancedSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await searchStudyGroupsByAvailability({
                subject: subject || undefined,
                meetingTime,
            });
            setGroups(data.studyGroups);
        } catch (error) {
            setError(error.message || "Failed to search study groups");
        } finally {
            setLoading(false);
        }
    };

    const handleJoinGroup = async (groupId) => {
        setJoinLoading(groupId);
        setError('');
        try {
            await joinStudyGroup(groupId);
            // Show success toast
            const toast = document.createElement('div');
            toast.className = 'fixed z-50 flex items-center px-6 py-3 space-x-2 text-white bg-green-500 shadow-lg top-4 right-4 rounded-xl animate-slideDown';
            toast.innerHTML = `
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Successfully joined the study group!</span>
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);

            if (searchType === "all") {
                loadAllGroups();
            } else if (searchType === "subject") {
                handleSubjectSearch({ preventDefault: () => {} });
            } else {
                handleAdvancedSearch({ preventDefault: () => {} });
            }
        } catch (error) {
            setError(error.message || "Failed to join the study group");
        } finally {
            setJoinLoading(null);
        }
    };

    const handleCheckboxChange = (field) => {
        setMeetingTime((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const clearFilters = () => {
        setSubject('');
        setMeetingTime({
            weekdays: false,
            weekend: false,
            morning: false,
            evening: false,
        });
        loadAllGroups();
    };

    // Get random image for group (in real app, this would come from backend)
    const getGroupImage = (index) => {
        return groupImages[index % groupImages.length];
    };

    // Get gradient based on subject
    const getSubjectGradient = (subject) => {
        const gradients = {
            'Math': 'from-blue-500 to-cyan-500',
            'Physics': 'from-purple-500 to-pink-500',
            'Chemistry': 'from-green-500 to-emerald-500',
            'Biology': 'from-teal-500 to-green-500',
            'Computer Science': 'from-indigo-500 to-purple-500',
            'History': 'from-amber-500 to-orange-500',
            'English': 'from-pink-500 to-rose-500',
            'default': 'from-indigo-500 to-purple-500'
        };
        return gradients[subject] || gradients.default;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Animated Background */}
            <div 
                className="fixed inset-0 opacity-5"
                style={{
                    backgroundImage: `url(${backgroundPattern})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(8px)'
                }}
            />
            
            {/* Floating Particles */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute w-64 h-64 rounded-full top-20 left-20 bg-purple-500/10 blur-3xl animate-pulse"></div>
                <div className="absolute delay-1000 rounded-full bottom-20 right-20 w-96 h-96 bg-blue-500/10 blur-3xl animate-pulse"></div>
                <div className="absolute w-48 h-48 rounded-full top-1/3 right-1/3 bg-pink-500/10 blur-3xl animate-pulse delay-2000"></div>
            </div>

            <div className="relative px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="relative p-3 transition-all border group bg-white/10 backdrop-blur-xl rounded-2xl hover:bg-white/20 border-white/20"
                        >
                            <ChevronRightIcon className="w-5 h-5 text-white rotate-180" />
                            <div className="absolute inset-0 transition-transform scale-0 bg-white/20 rounded-2xl group-hover:scale-100"></div>
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Study Groups</h1>
                            <p className="mt-1 text-white/60">Connect with peers and learn together</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        {/* View Toggle */}
                        <div className="flex p-1 border bg-white/10 backdrop-blur-xl rounded-2xl border-white/20">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`px-4 py-2 rounded-xl transition-all ${
                                    viewMode === "grid" 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'text-white/60 hover:text-white'
                                }`}
                            >
                                Grid
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`px-4 py-2 rounded-xl transition-all ${
                                    viewMode === "list" 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'text-white/60 hover:text-white'
                                }`}
                            >
                                List
                            </button>
                        </div>

                        {/* Create Group Button */}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="relative flex items-center px-6 py-3 space-x-2 overflow-hidden font-semibold text-white transition-all group bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl hover:shadow-xl hover:scale-105"
                        >
                            <div className="absolute inset-0 transition-transform translate-y-full bg-white/20 group-hover:translate-y-0"></div>
                            <PlusIcon className="relative z-10 w-5 h-5" />
                            <span className="relative z-10">Create Group</span>
                        </button>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="p-6 mb-8 border bg-white/10 backdrop-blur-2xl rounded-3xl border-white/20">
                    {/* Search Type Tabs */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        {[
                            { id: "all", label: "All Groups", icon: GlobeAltIcon },
                            { id: "subject", label: "By Subject", icon: BookOpenIcon },
                            { id: "advanced", label: "Advanced", icon: FunnelIcon }
                        ].map((type) => (
                            <button
                                key={type.id}
                                onClick={() => {
                                    setSearchType(type.id);
                                    if (type.id === "all") loadAllGroups();
                                }}
                                className={`group relative px-6 py-3 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                                    searchType === type.id
                                        ? 'bg-indigo-600 text-white shadow-lg'
                                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <type.icon className="w-5 h-5" />
                                <span>{type.label}</span>
                                {searchType === type.id && (
                                    <div className="absolute w-1 h-1 transform -translate-x-1/2 bg-white rounded-full -bottom-1 left-1/2"></div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Search Forms */}
                    <div className="space-y-6">
                        {searchType === "subject" && (
                            <form onSubmit={handleSubjectSearch} className="animate-slideDown">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder="Enter subject (e.g. Mathematics, Physics, Computer Science)"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full py-4 text-white transition-all border pl-14 pr-36 bg-white/5 border-white/20 rounded-2xl placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                    <MagnifyingGlassIcon className="absolute w-5 h-5 transition-colors left-5 top-4 text-white/40 group-focus-within:text-indigo-400" />
                                    <div className="absolute flex space-x-2 right-3 top-3">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-6 py-2 font-medium text-white transition-all bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            {loading ? "Searching..." : "Search"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}

                        {searchType === "advanced" && (
                            <form onSubmit={handleAdvancedSearch} className="space-y-6 animate-slideDown">
                                {/* Subject Input */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-white/80">
                                        Subject (optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Any subject"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full px-5 py-3 text-white border bg-white/5 border-white/20 rounded-xl placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* Meeting Time */}
                                <div>
                                    <label className="block mb-3 text-sm font-medium text-white/80">
                                        Meeting Time Preferences
                                    </label>
                                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                        {[
                                            { id: 'weekdays', label: 'Weekdays', icon: CalendarIcon },
                                            { id: 'weekend', label: 'Weekend', icon: CalendarIcon },
                                            { id: 'morning', label: 'Morning', icon: ClockIcon },
                                            { id: 'evening', label: 'Evening', icon: ClockIcon }
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => handleCheckboxChange(item.id)}
                                                className={`group p-4 rounded-xl border transition-all flex flex-col items-center space-y-2 ${
                                                    meetingTime[item.id]
                                                        ? 'bg-indigo-600 border-indigo-400 text-white'
                                                        : 'bg-white/5 border-white/20 text-white/60 hover:bg-white/10 hover:text-white'
                                                }`}
                                            >
                                                <item.icon className="w-5 h-5" />
                                                <span className="text-sm font-medium">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-3">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 px-6 py-3 font-semibold text-white transition-all bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:shadow-lg disabled:opacity-50"
                                    >
                                        {loading ? "Searching..." : "Apply Filters"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="flex items-center px-6 py-3 space-x-2 font-semibold text-white transition-all bg-white/10 rounded-xl hover:bg-white/20"
                                    >
                                        <ArrowPathIcon className="w-5 h-5" />
                                        <span>Clear</span>
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Results Header */}
                {!loading && groups.length > 0 && (
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <span className="font-semibold text-white">
                                {groups.length} group{groups.length !== 1 ? 's' : ''} found
                            </span>
                            <span className="w-1 h-1 rounded-full bg-white/20"></span>
                            <span className="text-sm text-white/60">
                                {searchType !== 'all' ? 'Filtered results' : 'All groups'}
                            </span>
                        </div>
                        
                        {/* Sort Dropdown */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2 text-sm text-white border bg-white/10 border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="popular">Most Popular</option>
                            <option value="newest">Newest First</option>
                            <option value="members">Most Members</option>
                        </select>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="flex items-center p-4 mb-6 space-x-3 text-white border bg-red-500/20 backdrop-blur-xl border-red-500/30 rounded-2xl animate-slideDown">
                        <XMarkIcon className="flex-shrink-0 w-5 h-5 text-red-400" />
                        <p>{error}</p>
                    </div>
                )}

                {/* Groups Grid/List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 rounded-full border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse"></div>
                            </div>
                        </div>
                        <p className="mt-4 text-white/60">Loading study groups...</p>
                    </div>
                ) : groups.length > 0 ? (
                    <div className={viewMode === "grid" 
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                        : "space-y-4"
                    }>
                        {groups.map((group, index) => (
                            <div
                                key={group._id}
                                className={`group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-300 ${
                                    viewMode === "grid" ? "h-96" : ""
                                }`}
                                onMouseEnter={() => setHoveredGroup(group._id)}
                                onMouseLeave={() => setHoveredGroup(null)}
                                onClick={() => setSelectedGroup(group)}
                            >
                                {/* Background Image with Overlay */}
                                <div className="absolute inset-0">
                                    <img 
                                        src={getGroupImage(index)} 
                                        alt={group.name}
                                        className={`w-full h-full object-cover transition-transform duration-700 ${
                                            hoveredGroup === group._id ? 'scale-110' : 'scale-100'
                                        }`}
                                    />
                                    <div className={`absolute inset-0 bg-gradient-to-t ${
                                        hoveredGroup === group._id 
                                            ? 'from-black/95 via-black/70 to-black/30' 
                                            : 'from-black/90 via-black/50 to-black/20'
                                    } transition-all duration-300`}></div>
                                </div>

                                {/* Content */}
                                <div className={`relative h-full p-6 flex flex-col ${
                                    viewMode === "list" ? "md:flex-row md:items-center" : ""
                                }`}>
                                    {/* Group Info */}
                                    <div className={`flex-1 ${viewMode === "list" ? "md:pr-6" : ""}`}>
                                        {/* Subject Badge */}
                                        <div className={`inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r ${
                                            getSubjectGradient(group.subject)
                                        } text-white text-xs font-medium mb-3`}>
                                            <AcademicCapIcon className="w-3 h-3 mr-1" />
                                            {group.subject}
                                        </div>

                                        <h3 className="mb-2 text-xl font-bold text-white line-clamp-2">
                                            {group.name}
                                        </h3>
                                        
                                        {group.description && (
                                            <p className="mb-4 text-sm text-white/70 line-clamp-2">
                                                {group.description}
                                            </p>
                                        )}

                                        {/* Stats */}
                                        <div className="flex flex-wrap gap-4 mb-4">
                                            <div className="flex items-center space-x-1">
                                                <UsersIcon className="w-4 h-4 text-white/40" />
                                                <span className="text-sm text-white/80">
                                                    {group.members?.length || 0}/{group.maxMembers} members
                                                </span>
                                            </div>
                                            {group.creator?.name && (
                                                <div className="flex items-center space-x-1">
                                                    <UserGroupIcon className="w-4 h-4 text-white/40" />
                                                    <span className="text-xs text-white/60">
                                                        by {group.creator.name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Meeting Times */}
                                        {group.meetingTime && (
                                            <div className="flex flex-wrap gap-2">
                                                {group.meetingTime.weekdays && (
                                                    <span className="flex items-center px-2 py-1 text-xs rounded-lg bg-white/10 text-white/80">
                                                        <CalendarIcon className="w-3 h-3 mr-1" />
                                                        Weekdays
                                                    </span>
                                                )}
                                                {group.meetingTime.weekend && (
                                                    <span className="flex items-center px-2 py-1 text-xs rounded-lg bg-white/10 text-white/80">
                                                        <CalendarIcon className="w-3 h-3 mr-1" />
                                                        Weekend
                                                    </span>
                                                )}
                                                {group.meetingTime.morning && (
                                                    <span className="flex items-center px-2 py-1 text-xs rounded-lg bg-white/10 text-white/80">
                                                        <ClockIcon className="w-3 h-3 mr-1" />
                                                        Morning
                                                    </span>
                                                )}
                                                {group.meetingTime.evening && (
                                                    <span className="flex items-center px-2 py-1 text-xs rounded-lg bg-white/10 text-white/80">
                                                        <ClockIcon className="w-3 h-3 mr-1" />
                                                        Evening
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Join Button */}
                                    <div className={`mt-4 ${viewMode === "list" ? "md:mt-0 md:ml-4" : ""}`}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleJoinGroup(group._id);
                                            }}
                                            disabled={joinLoading === group._id}
                                            className={`w-full px-6 py-3 bg-gradient-to-r ${
                                                getSubjectGradient(group.subject)
                                            } text-white rounded-xl font-semibold hover:shadow-xl transition-all flex items-center justify-center space-x-2 group/btn ${
                                                joinLoading === group._id ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                        >
                                            {joinLoading === group._id ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 rounded-full border-white/30 border-t-white animate-spin"></div>
                                                    <span>Joining...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <PlusIcon className="w-4 h-4 transition-transform group-hover/btn:rotate-90" />
                                                    <span>Join Group</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Hover Effect Border */}
                                <div className={`absolute inset-0 border-2 border-indigo-500/0 rounded-3xl transition-all duration-300 ${
                                    hoveredGroup === group._id ? 'border-indigo-500/50' : ''
                                }`}></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center border bg-white/10 backdrop-blur-xl rounded-3xl border-white/20">
                        <div className="max-w-md mx-auto">
                            <div className="flex items-center justify-center w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl">
                                <UserGroupIcon className="w-12 h-12 text-white" />
                            </div>
                            <h3 className="mb-3 text-2xl font-bold text-white">No Groups Found</h3>
                            <p className="mb-8 text-white/60">
                                {searchType !== 'all' 
                                    ? "No study groups match your search criteria. Try different filters or create a new group."
                                    : "Be the first to create a study group in your subject!"}
                            </p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="inline-flex items-center px-8 py-4 space-x-2 font-semibold text-white transition-all bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:shadow-xl"
                            >
                                <PlusIcon className="w-5 h-5" />
                                <span>Create Your Group</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Group Modal */}
            <CreateGroupModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={loadAllGroups}
            />

            {/* Group Details Modal */}
            {selectedGroup && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setSelectedGroup(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="sg-details-title"
                >
                    <div
                        className="relative w-full max-w-3xl border bg-white/10 backdrop-blur-2xl rounded-3xl border-white/20 animate-slideDown max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 z-10 px-6 py-5 border-b bg-black/20 backdrop-blur-2xl border-white/10 rounded-t-3xl">
                            <button
                                onClick={() => setSelectedGroup(null)}
                                className="absolute p-2 transition-all top-4 right-4 bg-white/10 rounded-xl hover:bg-white/20"
                                aria-label="Close"
                            >
                                <XMarkIcon className="w-5 h-5 text-white" />
                            </button>

                            <div className={`inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r ${
                                getSubjectGradient(selectedGroup.subject)
                            } text-white text-xs font-medium`}> 
                                <AcademicCapIcon className="w-3 h-3 mr-1" />
                                {selectedGroup.subject}
                            </div>

                            <h2 id="sg-details-title" className="mt-3 text-2xl font-bold text-white">
                                {selectedGroup.name}
                            </h2>

                            {selectedGroup.description ? (
                                <p className="mt-2 text-white/70">{selectedGroup.description}</p>
                            ) : (
                                <p className="mt-2 text-white/50">No description provided.</p>
                            )}
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <UsersIcon className="w-5 h-5 mb-2 text-indigo-400" />
                                    <p className="text-sm text-white/60">Members</p>
                                    <p className="text-lg font-bold text-white">
                                        {selectedGroup.members?.length || 0}/{selectedGroup.maxMembers}
                                    </p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <UserGroupIcon className="w-5 h-5 mb-2 text-purple-400" />
                                    <p className="text-sm text-white/60">Created by</p>
                                    <p className="text-lg font-bold text-white">{selectedGroup.creator?.name || "Unknown"}</p>
                                    {selectedGroup.creator?.email && (
                                        <p className="text-xs text-white/50 mt-1 break-words">{selectedGroup.creator.email}</p>
                                    )}
                                </div>
                            </div>

                            {selectedGroup.meetingTime && (
                                <div className="mb-6">
                                    <h3 className="mb-3 font-semibold text-white">Meeting Schedule</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedGroup.meetingTime.weekdays && (
                                            <span className="flex items-center px-3 py-2 text-sm bg-white/10 rounded-xl text-white/80 border border-white/10">
                                                <CalendarIcon className="w-4 h-4 mr-2" />
                                                Weekdays
                                            </span>
                                        )}
                                        {selectedGroup.meetingTime.weekend && (
                                            <span className="flex items-center px-3 py-2 text-sm bg-white/10 rounded-xl text-white/80 border border-white/10">
                                                <CalendarIcon className="w-4 h-4 mr-2" />
                                                Weekend
                                            </span>
                                        )}
                                        {selectedGroup.meetingTime.morning && (
                                            <span className="flex items-center px-3 py-2 text-sm bg-white/10 rounded-xl text-white/80 border border-white/10">
                                                <ClockIcon className="w-4 h-4 mr-2" />
                                                Morning
                                            </span>
                                        )}
                                        {selectedGroup.meetingTime.evening && (
                                            <span className="flex items-center px-3 py-2 text-sm bg-white/10 rounded-xl text-white/80 border border-white/10">
                                                <ClockIcon className="w-4 h-4 mr-2" />
                                                Evening
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setSelectedGroup(null)}
                                    className="w-full sm:w-1/3 px-6 py-4 font-semibold text-white/80 transition-all bg-white/10 rounded-xl hover:bg-white/15 border border-white/10"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        handleJoinGroup(selectedGroup._id);
                                        setSelectedGroup(null);
                                    }}
                                    disabled={joinLoading === selectedGroup._id}
                                    className="w-full sm:flex-1 px-6 py-4 font-semibold text-white transition-all bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {joinLoading === selectedGroup._id ? "Joining..." : "Join This Group"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slideDown {
                    animation: slideDown 0.3s ease-out;
                }
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
};

export default StudyGroupBrowser;