import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getAllStudyGroups,
         getStudyGroupById,
         updateStudyGroup,
         deleteStudyGroup,
         leaveStudyGroup,
 } from "../services/studyGroupService";

const MyGroups = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [myCreatedGroups, setMyCreatedGroups] = useState([]);
    const [myJoinedGroups, setMyJoinedGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    // Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [editFormData, setEditFormData] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadMyGroups();
    }, []);

    const loadMyGroups = async () => {
        setLoading(true);
        try {
            const data = await getAllStudyGroups();
            const allGroups = data.studyGroups;

            // user from AuthContext has "id", backend returns "_id"
            const userId = user._id || user.id;

            // Filter groups created by me
            const created = allGroups.filter(
              (group) => group.creator?._id === userId || group.creator?.id === userId
            );

            // Filter groups I joined (but didnt create)
            const joined = allGroups.filter(
                (group) => 
                    group.members?.some((member) => (member._id === userId || member.id === userId)) &&
                    group.creator?._id !== userId && group.creator?.id !== userId
            );

            setMyCreatedGroups(created);
            setMyJoinedGroups(joined);
        } catch (error) {
            setError(error.message || "Failed to load study groups");
        } finally {
            setLoading(false);
        }
    };

    // View details
    const handleViewDetails = async (groupId) => {
        setActionLoading(groupId);
        try {
            const data = await getStudyGroupById(groupId);
            setSelectedGroup(data.studyGroup || data);
            setShowDetailsModal(true);
        } catch (error) {
            setError(error.message || "Failed to load group details");
        } finally {
            setActionLoading(false);
        }
    };
   
    // Open edit modal
    const handleOpenEdit = (group) => {
        setSelectedGroup(group);
        setEditFormData({
            name: group.name,
            description: group.description || '',
            subject: group.subject,
            maxMembers: group.maxMembers,
            meetingTime: {...group.meetingTime},
            isActive: group.isActive ?? true,
        });
        setShowEditModal(true);
    };

    // Update Group
    const handleUpdateGroup = async (e) => {
        e.preventDefault();

        if (!editFormData.name.trim() || !editFormData.subject.trim()) {
            setError('Name and subject are required');
            return;
        }

        const { weekdays, weekend, morning, evening } = editFormData.meetingTime;
        if (!weekdays && !weekend && !morning && !evening) {
            setError('Please select at least one meeting time');
            return;
        }

        setActionLoading(selectedGroup._id);
        setError('');

        try {
            await updateStudyGroup(selectedGroup._id, editFormData);
            setShowEditModal(false);
            loadMyGroups();
        } catch (error) {
            setError(error.message || 'Failed to update group. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    // Delete group
    const handleDeleteGroup = async (groupId, groupName) => {
        const confirmed = window.confirm(`Are you sure you want to delete "${groupName}"? This action cannot be undone.`);
        if (!confirmed) return;

        setActionLoading(groupId);
        setError('');

        try {
            await deleteStudyGroup(groupId);
            loadMyGroups();
        } catch (error) {
            setError(error.message || 'Failed to delete group. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    // Leave Group
    const handleLeaveGroup = async (groupId, groupName) => {
        const confirmed = window.confirm(`Are you sure you want to leave "${groupName}"?`);
        if (!confirmed) return;

        setActionLoading(groupId);
        setError('');

        try {
            await leaveStudyGroup(groupId);
            loadMyGroups();
        } catch (error) {
            setError(error.message || 'Failed to leave group. Please try again.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEditCheckbox = (field) => {
        setEditFormData((prev) => ({
            ...prev,
            meetingTime: {
                ...prev.meetingTime,
                [field]: !prev.meetingTime[field],
            },
        }));
    };

    // Filter groups based on active tab
    const getFilteredGroups = () => {
        if (activeTab === 'created') return myCreatedGroups;
        if (activeTab === 'joined') return myJoinedGroups;
        return [...myCreatedGroups, ...myJoinedGroups];
    };

    const filteredGroups = getFilteredGroups();

    if (loading) {
        return (
            <div className="min-h-screen py-8 bg-gray-50">
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="p-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-indigo-200 rounded-full border-t-indigo-600 animate-spin"></div>
                            </div>
                            <p className="mt-4 font-medium text-gray-600">Loading your groups...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8 bg-gradient-to-br from-gray-50 to-indigo-50/30">
            <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">My Study Groups</h1>
                            <p className="mt-2 text-gray-600">Manage and track all your study groups in one place</p>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="inline-flex items-center px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow group"
                        >
                            <svg className="w-5 h-5 mr-2 text-gray-500 transition-colors group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Dashboard
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 gap-4 mt-6 sm:grid-cols-3">
                        <div className="p-4 bg-white border border-gray-200 shadow-sm rounded-xl">
                            <div className="flex items-center">
                                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg">
                                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Groups</p>
                                    <p className="text-2xl font-semibold text-gray-900">{myCreatedGroups.length + myJoinedGroups.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-white border border-gray-200 shadow-sm rounded-xl">
                            <div className="flex items-center">
                                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Created</p>
                                    <p className="text-2xl font-semibold text-gray-900">{myCreatedGroups.length}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-white border border-gray-200 shadow-sm rounded-xl">
                            <div className="flex items-center">
                                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Joined</p>
                                    <p className="text-2xl font-semibold text-gray-900">{myJoinedGroups.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-4 mb-6 border border-red-200 rounded-xl bg-red-50">
                        <div className="flex">
                            <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="ml-3 text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="mb-6 border-b border-gray-200">
                    <nav className="flex space-x-8">
                        {[
                            { id: 'all', label: 'All Groups', count: myCreatedGroups.length + myJoinedGroups.length },
                            { id: 'created', label: 'Created by Me', count: myCreatedGroups.length },
                            { id: 'joined', label: 'Joined', count: myJoinedGroups.length }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors relative ${
                                    activeTab === tab.id
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                                        activeTab === tab.id
                                            ? 'bg-indigo-100 text-indigo-600'
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Groups Grid */}
                {filteredGroups.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {filteredGroups.map((group) => {
                            const isCreator = myCreatedGroups.some(g => g._id === group._id);
                            return (
                                <div
                                    key={group._id}
                                    className="overflow-hidden transition-all duration-300 bg-white border border-gray-200 group rounded-2xl hover:border-indigo-200 hover:shadow-xl"
                                >
                                    {/* Card Header */}
                                    <div className={`px-6 py-4 border-b border-gray-100 ${
                                        isCreator ? 'bg-gradient-to-r from-indigo-50 to-white' : 'bg-gradient-to-r from-purple-50 to-white'
                                    }`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-10 h-10 rounded-xl ${
                                                    isCreator ? 'bg-indigo-100' : 'bg-purple-100'
                                                } flex items-center justify-center`}>
                                                    {isCreator ? (
                                                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                                                    <p className="text-sm text-gray-500">
                                                        {isCreator ? 'Created by you' : `Created by ${group.creator?.name || 'Unknown'}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                group.isActive !== false
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {group.isActive !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-6">
                                        {group.description && (
                                            <p className="mb-4 text-sm text-gray-600 line-clamp-2">{group.description}</p>
                                        )}

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-lg">
                                                📚 {group.subject}
                                            </span>
                                            <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg">
                                                👥 {group.members?.length || 0}/{group.maxMembers} members
                                            </span>
                                            {group.meetingTime && (
                                                <>
                                                    {group.meetingTime.weekdays && (
                                                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-lg bg-amber-100 text-amber-700">
                                                            📅 Weekdays
                                                        </span>
                                                    )}
                                                    {group.meetingTime.weekend && (
                                                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-lg bg-amber-100 text-amber-700">
                                                            📅 Weekend
                                                        </span>
                                                    )}
                                                    {group.meetingTime.morning && (
                                                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-lg bg-amber-100 text-amber-700">
                                                            🌅 Morning
                                                        </span>
                                                    )}
                                                    {group.meetingTime.evening && (
                                                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-lg bg-amber-100 text-amber-700">
                                                            🌆 Evening
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <div className="flex justify-between mb-1 text-xs text-gray-600">
                                                <span>Members</span>
                                                <span>{group.members?.length || 0}/{group.maxMembers}</span>
                                            </div>
                                            <div className="w-full h-2 overflow-hidden bg-gray-100 rounded-full">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-300 ${
                                                        isCreator ? 'bg-indigo-600' : 'bg-purple-600'
                                                    }`}
                                                    style={{ width: `${((group.members?.length || 0) / group.maxMembers) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleViewDetails(group._id)}
                                                disabled={actionLoading === group._id}
                                                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                                            >
                                                View Details
                                            </button>
                                            
                                            {isCreator ? (
                                                <>
                                                    <button
                                                        onClick={() => handleOpenEdit(group)}
                                                        disabled={actionLoading === group._id}
                                                        className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all duration-200 disabled:bg-indigo-400 shadow-sm hover:shadow"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteGroup(group._id, group.name)}
                                                        disabled={actionLoading === group._id}
                                                        className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-all duration-200 disabled:bg-red-400 shadow-sm hover:shadow"
                                                    >
                                                        {actionLoading === group._id ? (
                                                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                        ) : 'Delete'}
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => handleLeaveGroup(group._id, group.name)}
                                                    disabled={actionLoading === group._id}
                                                    className="px-4 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition-all duration-200 disabled:bg-orange-400 shadow-sm hover:shadow"
                                                >
                                                    {actionLoading === group._id ? (
                                                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    ) : 'Leave'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-12 text-center bg-white border border-gray-200 rounded-2xl">
                        <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <h3 className="mb-2 text-lg font-medium text-gray-900">No groups found</h3>
                        <p className="mb-6 text-gray-600">
                            {activeTab === 'created' 
                                ? "You haven't created any groups yet. Start by creating your first study group!"
                                : activeTab === 'joined'
                                ? "You haven't joined any groups yet. Explore and join study groups that interest you!"
                                : "You're not part of any study groups yet. Create one or join existing groups to get started!"}
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => navigate('/create-group')}
                                className="px-6 py-3 font-medium text-white transition-all duration-200 bg-indigo-600 shadow-sm rounded-xl hover:bg-indigo-700 hover:shadow"
                            >
                                Create a Group
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-6 py-3 font-medium text-gray-700 transition-all duration-200 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                            >
                                Explore Groups
                            </button>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {showEditModal && editFormData && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 px-6 py-4 bg-white border-b border-gray-200 rounded-t-2xl">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-gray-900">Edit Study Group</h3>
                                    <button
                                        onClick={() => setShowEditModal(false)}
                                        className="flex items-center justify-center w-8 h-8 text-gray-500 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200 hover:text-gray-700"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateGroup} className="p-6 space-y-6">
                                {/* Group Name */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700">
                                        Group Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={editFormData.name}
                                        onChange={handleEditChange}
                                        className="w-full px-4 py-3 transition-all border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Enter group name"
                                    />
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700">
                                        Subject <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={editFormData.subject}
                                        onChange={handleEditChange}
                                        className="w-full px-4 py-3 transition-all border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="e.g., Mathematics, Physics"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={editFormData.description}
                                        onChange={handleEditChange}
                                        rows="4"
                                        className="w-full px-4 py-3 transition-all border border-gray-300 resize-none rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Describe your study group..."
                                    />
                                </div>

                                {/* Max Members */}
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700">
                                        Maximum Members
                                    </label>
                                    <input
                                        type="number"
                                        name="maxMembers"
                                        value={editFormData.maxMembers}
                                        onChange={handleEditChange}
                                        min="2"
                                        max="50"
                                        className="w-full px-4 py-3 transition-all border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Meeting Time */}
                                <div>
                                    <label className="block mb-3 text-sm font-medium text-gray-700">
                                        Meeting Time <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'weekdays', label: 'Weekdays', icon: '📅' },
                                            { id: 'weekend', label: 'Weekend', icon: '📅' },
                                            { id: 'morning', label: 'Morning', icon: '🌅' },
                                            { id: 'evening', label: 'Evening', icon: '🌆' }
                                        ].map((item) => (
                                            <label
                                                key={item.id}
                                                className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                                    editFormData.meetingTime[item.id]
                                                        ? 'border-indigo-600 bg-indigo-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={editFormData.meetingTime[item.id]}
                                                    onChange={() => handleEditCheckbox(item.id)}
                                                    className="sr-only"
                                                />
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-xl">{item.icon}</span>
                                                    <span className={`text-sm font-medium ${
                                                        editFormData.meetingTime[item.id] ? 'text-indigo-700' : 'text-gray-700'
                                                    }`}>
                                                        {item.label}
                                                    </span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Active Status */}
                                <div className="flex items-center">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editFormData.isActive}
                                            onChange={(e) => setEditFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        <span className="ml-3 text-sm font-medium text-gray-700">Group is Active</span>
                                    </label>
                                </div>

                                {error && (
                                    <div className="p-4 border border-red-200 bg-red-50 rounded-xl">
                                        <p className="text-sm text-red-600">{error}</p>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="flex-1 px-6 py-3 font-medium text-gray-700 transition-all border-2 border-gray-300 rounded-xl hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="flex-1 px-6 py-3 font-medium text-white transition-all bg-indigo-600 shadow-sm rounded-xl hover:bg-indigo-700 disabled:bg-indigo-400 hover:shadow"
                                    >
                                        {actionLoading ? (
                                            <div className="flex items-center justify-center">
                                                <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Updating...
                                            </div>
                                        ) : 'Update Group'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Details Modal */}
                {showDetailsModal && selectedGroup && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 px-6 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-white">Group Details</h3>
                                    <button
                                        onClick={() => setShowDetailsModal(false)}
                                        className="flex items-center justify-center w-8 h-8 text-white transition-colors rounded-lg bg-white/20 hover:bg-white/30"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <h4 className="mb-2 text-2xl font-bold text-gray-900">{selectedGroup.name}</h4>
                                    {selectedGroup.description && (
                                        <p className="text-gray-600">{selectedGroup.description}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-purple-50 rounded-xl">
                                        <p className="mb-1 text-xs font-medium text-purple-600">Subject</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedGroup.subject}</p>
                                    </div>
                                    <div className="p-4 bg-blue-50 rounded-xl">
                                        <p className="mb-1 text-xs font-medium text-blue-600">Members</p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {selectedGroup.members?.length || 0}/{selectedGroup.maxMembers}
                                        </p>
                                    </div>
                                </div>

                                {selectedGroup.creator && (
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <p className="mb-2 text-xs font-medium text-gray-600">Created by</p>
                                        <div className="flex items-center">
                                            <div className="flex items-center justify-center w-10 h-10 font-bold text-white rounded-full bg-gradient-to-r from-indigo-600 to-purple-600">
                                                {selectedGroup.creator.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-semibold text-gray-900">{selectedGroup.creator.name}</p>
                                                <p className="text-xs text-gray-500">{selectedGroup.creator.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedGroup.meetingTime && (
                                    <div>
                                        <p className="mb-3 text-xs font-medium text-gray-600">Meeting Times</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedGroup.meetingTime.weekdays && (
                                                <span className="flex items-center px-4 py-2 text-sm font-medium bg-amber-100 text-amber-700 rounded-xl">
                                                    <span className="mr-2">📅</span> Weekdays
                                                </span>
                                            )}
                                            {selectedGroup.meetingTime.weekend && (
                                                <span className="flex items-center px-4 py-2 text-sm font-medium bg-amber-100 text-amber-700 rounded-xl">
                                                    <span className="mr-2">📅</span> Weekend
                                                </span>
                                            )}
                                            {selectedGroup.meetingTime.morning && (
                                                <span className="flex items-center px-4 py-2 text-sm font-medium bg-amber-100 text-amber-700 rounded-xl">
                                                    <span className="mr-2">🌅</span> Morning
                                                </span>
                                            )}
                                            {selectedGroup.meetingTime.evening && (
                                                <span className="flex items-center px-4 py-2 text-sm font-medium bg-amber-100 text-amber-700 rounded-xl">
                                                    <span className="mr-2">🌆</span> Evening
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {selectedGroup.members && selectedGroup.members.length > 0 && (
                                    <div>
                                        <p className="mb-3 text-xs font-medium text-gray-600">Member List</p>
                                        <div className="pr-2 space-y-2 overflow-y-auto max-h-48">
                                            {selectedGroup.members.map((member, idx) => (
                                                <div
                                                    key={member._id || idx}
                                                    className="flex items-center justify-between p-3 transition-colors bg-gray-50 rounded-xl hover:bg-gray-100"
                                                >
                                                    <div className="flex items-center">
                                                        <div className="flex items-center justify-center w-8 h-8 text-xs font-bold text-white rounded-full bg-gradient-to-r from-gray-600 to-gray-700">
                                                            {member.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="ml-3">
                                                            <p className="text-sm font-medium text-gray-900">{member.name}</p>
                                                            <p className="text-xs text-gray-500">{member.email}</p>
                                                        </div>
                                                    </div>
                                                    {member._id === selectedGroup.creator?._id && (
                                                        <span className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-lg">
                                                            Creator
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                    <span className="text-sm text-gray-600">Status</span>
                                    <span className={`px-4 py-2 rounded-xl text-sm font-medium ${
                                        selectedGroup.isActive !== false
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {selectedGroup.isActive !== false ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="w-full px-6 py-3 font-medium text-white transition-all bg-gray-600 shadow-sm rounded-xl hover:bg-gray-700 hover:shadow"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyGroups;