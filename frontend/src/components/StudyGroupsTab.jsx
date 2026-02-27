import { useState, useMemo, useCallback } from "react";
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  AcademicCapIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  ClockIcon,
  CalendarIcon,
  SparklesIcon,
  BookOpenIcon,
  FireIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  BellAlertIcon,
  MapPinIcon,
  GlobeAltIcon,
  VideoCameraIcon,
  BuildingLibraryIcon,
  BeakerIcon,
  CalculatorIcon,
  LanguageIcon,
  PaintBrushIcon,
  MusicalNoteIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import CreateGroupModal from "./CreateGroupModal";

const StudyGroupsTab = ({
  user,
  sgSearchType,
  setSgSearchType,
  sgSubject,
  setSgSubject,
  sgMeetingTime,
  setSgMeetingTime,
  sgGroups,
  sgLoading,
  sgError,
  showCreateModal,
  setShowCreateModal,
  joinLoading,
  sgLoadAll,
  sgSearchBySubject,
  sgAdvancedSearch,
  handleJoinGroup,
  fetchDashboardData,
}) => {
  const userId = user?._id || user?.id;

  // Stats calculation
  const stats = useMemo(() => {
    const total = sgGroups.length;
    const joined = sgGroups.filter((group) =>
      group.members?.some((member) => (member._id || member).toString() === userId)
    ).length;
    const available = sgGroups.filter(
      (group) => (group.members?.length || 0) < group.maxMembers
    ).length;
    const popular = sgGroups.filter((group) => 
      (group.members?.length || 0) >= Math.floor(group.maxMembers * 0.8)
    ).length;

    return { total, joined, available, popular };
  }, [sgGroups, userId]);

  // Get realistic image based on group subject/name
  const getGroupImage = (group, index) => {
    const subject = group.subject?.toLowerCase() || "";
    const name = group.name?.toLowerCase() || "";
    
    // Subject-based images
    if (subject.includes("math") || subject.includes("mathematics") || name.includes("math")) {
      return "https://images.unsplash.com/photo-1635079941377-5d3a0d2b5c5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
    }
    if (subject.includes("physics") || subject.includes("physical")) {
      return "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
    }
    if (subject.includes("chem") || subject.includes("chemistry")) {
      return "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
    }
    if (subject.includes("bio") || subject.includes("biology") || subject.includes("life")) {
      return "https://images.unsplash.com/photo-1530022804376-20b3d3b7c9b9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
    }
    if (subject.includes("cs") || subject.includes("computer") || subject.includes("programming") || subject.includes("code")) {
      return "https://images.unsplash.com/photo-1580894742593-6bc87daaec8e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
    }
    if (subject.includes("engineer") || subject.includes("engineering")) {
      return "https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
    }
    if (subject.includes("business") || subject.includes("market") || subject.includes("economics")) {
      return "https://images.unsplash.com/photo-1552664730-f3077d5b6d3a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
    }
    if (subject.includes("art") || subject.includes("design") || subject.includes("creative")) {
      return "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
    }
    if (subject.includes("music") || subject.includes("instrument")) {
      return "https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
    }
    if (subject.includes("language") || subject.includes("english") || subject.includes("spanish") || subject.includes("french")) {
      return "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
    }
    if (subject.includes("history") || subject.includes("geography") || subject.includes("social")) {
      return "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
    }
    if (subject.includes("psychology") || subject.includes("philosophy")) {
      return "https://images.unsplash.com/photo-1558021212-51b6ecfa0db9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
    }
    
    // Default rotating images
    const defaultImages = [
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    ];
    return defaultImages[index % defaultImages.length];
  };

  // Get icon based on subject
  const getSubjectIcon = (subject) => {
    const subj = subject?.toLowerCase() || "";
    if (subj.includes("math")) return CalculatorIcon;
    if (subj.includes("physics") || subj.includes("chem")) return BeakerIcon;
    if (subj.includes("bio")) return BeakerIcon;
    if (subj.includes("cs") || subj.includes("code")) return AcademicCapIcon;
    if (subj.includes("engineer")) return BuildingLibraryIcon;
    if (subj.includes("business") || subj.includes("market")) return ChartBarIcon;
    if (subj.includes("art") || subj.includes("design")) return PaintBrushIcon;
    if (subj.includes("music")) return MusicalNoteIcon;
    if (subj.includes("language")) return LanguageIcon;
    if (subj.includes("history") || subj.includes("geography")) return GlobeAltIcon;
    return BookOpenIcon;
  };

  // Get gradient based on group status
  const getGroupGradient = (isMember, isFull, memberCount, maxMembers) => {
    if (isMember) return "from-emerald-50 to-teal-50 border-emerald-200";
    if (isFull) return "from-gray-50 to-slate-50 border-gray-200";
    const percentage = (memberCount / maxMembers) * 100;
    if (percentage >= 75) return "from-orange-50 to-amber-50 border-orange-200";
    if (percentage >= 50) return "from-blue-50 to-indigo-50 border-blue-200";
    return "from-cyan-50 to-sky-50 border-cyan-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Hero Section with Realistic Image */}
        <div className="relative mb-8 overflow-hidden rounded-3xl h-[400px] group">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
            alt="Students studying together"
            className="absolute inset-0 object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-800/90 to-slate-900/80" />
          
          <div className="absolute inset-0 flex items-center px-8 lg:px-12">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 border bg-white/20 backdrop-blur-lg rounded-2xl border-white/30">
                  <UserGroupIcon className="w-8 h-8 text-white" />
                </div>
                <span className="px-4 py-1.5 bg-white/20 backdrop-blur-lg rounded-full text-sm font-semibold text-white border border-white/30">
                  {sgGroups.length} Active Groups
                </span>
              </div>
              
              <h1 className="mb-4 text-4xl font-bold text-white lg:text-5xl">
                Study Groups
              </h1>
              
              <p className="max-w-2xl mb-8 text-xl leading-relaxed text-white/90">
                Join vibrant learning communities, collaborate with peers, and master subjects together in our interactive study groups.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-8 py-4 font-semibold text-white transition-all duration-300 transform shadow-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl hover:from-indigo-700 hover:to-indigo-800 hover:-translate-y-1 hover:shadow-indigo-500/25"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create New Group
                </button>
                
                <button
                  onClick={sgLoadAll}
                  className="flex items-center gap-2 px-8 py-4 font-semibold text-white transition-all duration-300 transform border bg-white/10 backdrop-blur-lg rounded-2xl hover:bg-white/20 border-white/30 hover:-translate-y-1"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  Browse All
                </button>
              </div>
            </div>
          </div>

          {/* Stats Overlay */}
          {!sgLoading && sgGroups.length > 0 && (
            <div className="absolute bottom-8 right-8 left-8 lg:left-auto lg:w-96">
              <div className="p-6 border bg-white/10 backdrop-blur-lg rounded-2xl border-white/30">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Total Groups", value: stats.total, icon: UserGroupIcon },
                    { label: "Your Groups", value: stats.joined, icon: CheckCircleIcon },
                    { label: "Available", value: stats.available, icon: FireIcon },
                    { label: "Popular", value: stats.popular, icon: StarIcon },
                  ].map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                      <div key={idx} className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Icon className="w-4 h-4 text-white/80" />
                          <span className="text-2xl font-bold text-white">{stat.value}</span>
                        </div>
                        <p className="text-xs text-white/70">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Section with Glassmorphism */}
        <div className="p-6 mb-8 border shadow-xl bg-white/80 backdrop-blur-lg rounded-3xl border-slate-200">
          {/* Search Type Tabs */}
          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { value: "all", label: "All Groups", icon: UserGroupIcon },
              { value: "subject", label: "By Subject", icon: BookOpenIcon },
              { value: "advanced", label: "Advanced Search", icon: FunnelIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = sgSearchType === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => {
                    setSgSearchType(tab.value);
                    if (tab.value === "all") sgLoadAll();
                  }}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/25"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Subject Search */}
          {sgSearchType === "subject" && (
            <form onSubmit={sgSearchBySubject}>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute w-5 h-5 transform -translate-y-1/2 text-slate-400 left-4 top-1/2" />
                  <input
                    type="text"
                    placeholder="Search by subject (e.g., Mathematics, Physics, Biology)"
                    value={sgSubject}
                    onChange={(e) => setSgSubject(e.target.value)}
                    className="w-full py-4 pl-12 pr-4 transition-all duration-300 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    disabled={sgLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={sgLoading || !sgSubject.trim()}
                  className="px-8 py-4 font-semibold text-white transition-all duration-300 shadow-lg bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl hover:from-indigo-700 hover:to-indigo-800 disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed hover:shadow-indigo-500/25"
                >
                  {sgLoading ? "Searching..." : "Search"}
                </button>
              </div>
            </form>
          )}

          {/* Advanced Search */}
          {sgSearchType === "advanced" && (
            <form onSubmit={sgAdvancedSearch} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Subject</label>
                  <input
                    type="text"
                    placeholder="Any subject..."
                    value={sgSubject}
                    onChange={(e) => setSgSubject(e.target.value)}
                    className="w-full px-4 py-3 transition-all duration-300 bg-white border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Meeting Time</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "weekdays", label: "Weekdays", icon: CalendarIcon },
                      { id: "weekend", label: "Weekend", icon: SparklesIcon },
                      { id: "morning", label: "Morning", icon: ClockIcon },
                      { id: "evening", label: "Evening", icon: ClockIcon },
                    ].map((time) => {
                      const Icon = time.icon;
                      const isSelected = sgMeetingTime[time.id];
                      return (
                        <label
                          key={time.id}
                          className={`relative cursor-pointer group`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => setSgMeetingTime(prev => ({ ...prev, [time.id]: !prev[time.id] }))}
                            className="sr-only"
                          />
                          <div className={`p-3 border-2 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${
                            isSelected 
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700" 
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}>
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{time.label}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={sgLoading}
                className="w-full py-4 font-semibold text-white transition-all duration-300 transform shadow-lg bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl hover:from-indigo-700 hover:to-indigo-800 disabled:from-slate-400 disabled:to-slate-400 hover:-translate-y-1 hover:shadow-indigo-500/25"
              >
                {sgLoading ? "Applying Filters..." : "Apply Filters"}
              </button>
            </form>
          )}
        </div>

        {/* Error State */}
        {sgError && (
          <div className="p-6 mb-8 shadow-xl bg-gradient-to-r from-rose-500 to-rose-600 rounded-3xl">
            <div className="flex items-center text-white">
              <XCircleIcon className="flex-shrink-0 w-8 h-8 mr-4" />
              <p className="text-lg font-semibold">{sgError}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {sgLoading && (
          <div className="space-y-6">
            <div className="py-12 text-center">
              <div className="relative inline-block">
                <div className="w-20 h-20 border-4 border-indigo-200 rounded-full border-t-indigo-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpenIcon className="w-8 h-8 text-indigo-600 animate-pulse" />
                </div>
              </div>
              <p className="mt-4 text-xl font-medium text-slate-600">Loading amazing study groups...</p>
            </div>
            
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-6 bg-white shadow-lg rounded-3xl animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-24 bg-slate-200 rounded-2xl" />
                    <div className="flex-1">
                      <div className="w-3/4 h-6 mb-3 rounded-lg bg-slate-200" />
                      <div className="w-1/2 h-4 mb-2 rounded-lg bg-slate-200" />
                      <div className="w-2/3 h-4 rounded-lg bg-slate-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Groups Grid */}
        {!sgLoading && sgGroups.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                Discover {sgGroups.length} Study Group{sgGroups.length !== 1 ? "s" : ""}
              </h2>
              <div className="flex items-center gap-2">
                <span className="px-4 py-2 text-sm font-semibold bg-emerald-100 text-emerald-700 rounded-xl">
                  {stats.available} spots available
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {sgGroups.map((group, index) => {
                const isMember = group.members?.some(
                  (member) => (member._id || member).toString() === userId
                );
                const memberCount = group.members?.length || 0;
                const maxMembers = group.maxMembers || 10;
                const isFull = memberCount >= maxMembers;
                const availableSpots = maxMembers - memberCount;
                const percentage = (memberCount / maxMembers) * 100;
                const groupGradient = getGroupGradient(isMember, isFull, memberCount, maxMembers);
                const SubjectIcon = getSubjectIcon(group.subject);
                const imageUrl = getGroupImage(group, index);

                return (
                  <div
                    key={group._id}
                    className="relative overflow-hidden transition-all duration-500 transform bg-white shadow-lg group rounded-3xl hover:shadow-2xl hover:-translate-y-2"
                  >
                    {/* Image Section */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={group.name}
                        className="absolute inset-0 object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent`} />
                      
                      {/* Subject Badge */}
                      <div className="absolute top-4 left-4">
                        <div className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-xl text-white text-sm font-semibold flex items-center gap-2 border border-white/30">
                          <SubjectIcon className="w-4 h-4" />
                          {group.subject}
                        </div>
                      </div>

                      {/* Member Count Badge */}
                      <div className="absolute top-4 right-4">
                        <div className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-xl text-white text-sm font-semibold flex items-center gap-2 border border-white/30">
                          <UsersIcon className="w-4 h-4" />
                          {memberCount}/{maxMembers}
                        </div>
                      </div>

                      {/* Group Name Overlay */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="mb-1 text-xl font-bold text-white">{group.name}</h3>
                        {group.creator && (
                          <p className="flex items-center gap-1 text-sm text-white/80">
                            <span>Created by {group.creator.name || 'Unknown'}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6">
                      {/* Description */}
                      {group.description && (
                        <p className="mb-4 text-slate-600 line-clamp-2">
                          {group.description}
                        </p>
                      )}

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1 text-sm">
                          <span className="font-medium text-slate-600">Capacity</span>
                          <span className="font-bold text-slate-900">
                            {memberCount}/{maxMembers}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div 
                            className={`h-full bg-gradient-to-r ${
                              isFull ? 'from-rose-500 to-rose-600' : 
                              percentage >= 75 ? 'from-orange-500 to-rose-500' :
                              'from-indigo-500 to-indigo-600'
                            } rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Meeting Times */}
                      {group.meetingTime && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {group.meetingTime.weekdays && (
                            <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-medium flex items-center gap-1 border border-indigo-200">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              Weekdays
                            </span>
                          )}
                          {group.meetingTime.weekend && (
                            <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-xl text-xs font-medium flex items-center gap-1 border border-purple-200">
                              <SparklesIcon className="w-3.5 h-3.5" />
                              Weekend
                            </span>
                          )}
                          {group.meetingTime.morning && (
                            <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-xs font-medium flex items-center gap-1 border border-amber-200">
                              <ClockIcon className="w-3.5 h-3.5" />
                              Morning
                            </span>
                          )}
                          {group.meetingTime.evening && (
                            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-medium flex items-center gap-1 border border-blue-200">
                              <ClockIcon className="w-3.5 h-3.5" />
                              Evening
                            </span>
                          )}
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="flex items-center justify-between">
                        {!isMember ? (
                          <button
                            onClick={() => handleJoinGroup(group._id)}
                            disabled={joinLoading === group._id || isFull}
                            className={`flex-1 py-3 rounded-xl font-semibold text-white transition-all duration-300 transform hover:-translate-y-1 ${
                              isFull
                                ? 'bg-slate-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg hover:shadow-indigo-500/25'
                            }`}
                          >
                            {joinLoading === group._id ? (
                              <div className="flex items-center justify-center gap-2">
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                Joining...
                              </div>
                            ) : isFull ? (
                              <div className="flex items-center justify-center gap-2">
                                <XCircleIcon className="w-4 h-4" />
                                Group Full
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <PlusIcon className="w-4 h-4" />
                                Join Group
                              </div>
                            )}
                          </button>
                        ) : (
                          <div className="flex items-center justify-center flex-1 gap-2 py-3 font-semibold border bg-emerald-100 text-emerald-700 rounded-xl border-emerald-200">
                            <CheckCircleSolid className="w-5 h-5" />
                            Already Joined
                          </div>
                        )}
                      </div>

                      {/* Available Spots Badge */}
                      {!isFull && !isMember && availableSpots > 0 && (
                        <div className="absolute top-48 right-4">
                          <span className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg animate-pulse">
                            {availableSpots} {availableSpots === 1 ? 'spot' : 'spots'} left!
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!sgLoading && sgGroups.length === 0 && !sgError && (
          <div className="relative p-12 overflow-hidden text-center border-2 border-indigo-200 border-dashed bg-gradient-to-br from-indigo-50 via-white to-indigo-50 rounded-3xl">
            <div className="absolute inset-0 bg-grid-indigo-500/5 bg-[length:50px_50px]" />
            <div className="relative">
              <div className="inline-block p-6 mb-6 shadow-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-3xl">
                <UserGroupIcon className="w-16 h-16 text-white" />
              </div>
              <h3 className="mb-3 text-3xl font-bold text-slate-900">
                No Study Groups Found
              </h3>
              <p className="max-w-2xl mx-auto mb-8 text-xl text-slate-600">
                Be the first to create a study group and start collaborating with fellow learners!
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white transition-all duration-300 transform shadow-xl bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl hover:from-indigo-700 hover:to-indigo-800 hover:-translate-y-1 hover:shadow-indigo-500/25"
              >
                <PlusIcon className="w-6 h-6 mr-2" />
                Create Your First Group
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          sgLoadAll();
          fetchDashboardData();
        }}
      />
    </div>
  );
};

export default StudyGroupsTab;