import { useEffect, useMemo, useState } from "react";
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
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
import CreateGroupModal from "./CreateGroupModal";
import StaticTimePickerLandscape from "./StaticTimePickerLandscape";

const HERO_IMAGES = ["/Students-Interactive-Society.jpg", "/Students-Interactive-Society.jpg"];

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
  const [openTimePicker, setOpenTimePicker] = useState({ type: null });
  const [pendingTime, setPendingTime] = useState("");
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [selectedGroupForMeeting, setSelectedGroupForMeeting] = useState(null);
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  useEffect(() => {
    if (HERO_IMAGES.length <= 1) return;
    const id = window.setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (openTimePicker.type === "start") {
      setPendingTime(sgMeetingTime?.startTime || "09:00");
    } else if (openTimePicker.type === "end") {
      setPendingTime(sgMeetingTime?.endTime || "17:00");
    } else {
      setPendingTime("");
    }
  }, [openTimePicker.type, sgMeetingTime?.startTime, sgMeetingTime?.endTime]);

  const formatTime = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
  };

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

  const getGroupImage = (group, index) => {
    if (group.image) {
      const backendUrl = 'http://localhost:5000';
      if (group.image.startsWith('/')) {
        return `${backendUrl}${group.image}`;
      }
      return group.image;
    }
    const subject = group.subject?.toLowerCase() || "";
    const name = group.name?.toLowerCase() || "";
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
    const defaultImages = [
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    ];
    return defaultImages[index % defaultImages.length];
  };

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

  const isMeetingNow = (meetingTimes, filterDay, filterStartTime, filterEndTime) => {
    if (!meetingTimes || meetingTimes.length === 0) return false;
    if (!filterDay || !filterStartTime || !filterEndTime) return false;
    return meetingTimes.some((slot) => {
      if (slot.day !== filterDay) return false;
      const [slotStartHour, slotStartMin] = slot.startTime.split(":").map(Number);
      const [filterStartHour, filterStartMin] = filterStartTime.split(":").map(Number);
      const [filterEndHour, filterEndMin] = filterEndTime.split(":").map(Number);
      const slotStartInMinutes = slotStartHour * 60 + slotStartMin;
      const filterStartInMinutes = filterStartHour * 60 + filterStartMin;
      const filterEndInMinutes = filterEndHour * 60 + filterEndMin;
      return slotStartInMinutes >= filterStartInMinutes && slotStartInMinutes < filterEndInMinutes;
    });
  };

  const openMeetingModal = (group) => {
    setSelectedGroupForMeeting(group);
    setShowMeetingModal(true);
  };

  const applyPendingTime = () => {
    if (!openTimePicker.type) return;

    if (openTimePicker.type === "start") {
      setSgMeetingTime((prev) => ({ ...prev, startTime: pendingTime }));
    }

    if (openTimePicker.type === "end") {
      setSgMeetingTime((prev) => ({ ...prev, endTime: pendingTime }));
    }

    setOpenTimePicker({ type: null });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section - Full width (no outer padding/margin/radius) */}
      <div className="relative w-full overflow-hidden bg-indigo-900 rounded-none shadow-xl">
        {/* Background slideshow */}
        <div className="absolute inset-0">
          {HERO_IMAGES.map((src, idx) => (
            <img
              key={src}
              src={src}
              alt=""
              aria-hidden="true"
              className={`absolute inset-0 h-full w-full object-cover blur-[2px] scale-110 transition-opacity duration-1000 ${
                idx === heroImageIndex ? "opacity-100" : "opacity-0"
              }`}
              loading="lazy"
              draggable={false}
            />
          ))}
        </div>

        {/* Tint overlays for readability */}
        <div className="absolute inset-0 bg-indigo-900/35" />
        <div className="absolute inset-0 bg-black/20 mix-blend-multiply" />

        <div className="relative px-8 py-12 sm:px-12 lg:py-16">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Study Groups
              </h1>
              <p className="mt-2 text-lg text-indigo-100">
                Collaborate, learn, and grow together
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
              >
                <PlusIcon className="w-4 h-4" />
                New Group
              </button>
              <button
                onClick={sgLoadAll}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Browse All
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          {!sgLoading && sgGroups.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mt-8 sm:grid-cols-4">
              {[
                { label: "Total Groups", value: stats.total, icon: UserGroupIcon },
                { label: "Your Groups", value: stats.joined, icon: CheckCircleIcon },
                { label: "Available", value: stats.available, icon: FireIcon },
                { label: "Popular", value: stats.popular, icon: StarIcon },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={idx}
                    className="p-4 transition rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20"
                  >
                    <div className="flex items-center gap-2 text-white">
                      <Icon className="w-5 h-5" />
                      <span className="text-2xl font-bold">{stat.value}</span>
                    </div>
                    <p className="mt-1 text-xs text-indigo-100">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pt-8 pb-8 mx-auto max-w-7xl sm:px-6 lg:px-8">

        {/* Search Section - Card Style */}
        <div className="p-6 mb-12 bg-white shadow-sm rounded-2xl ring-1 ring-gray-200">
          <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-200">
            {[
              { value: "all", label: "All Groups", icon: UserGroupIcon },
              { value: "subject", label: "By Subject", icon: BookOpenIcon },
              { value: "advanced", label: "Advanced", icon: FunnelIcon },
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
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            {sgSearchType === "subject" && (
              <form onSubmit={sgSearchBySubject} className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                  <input
                    type="text"
                    placeholder="Search by subject..."
                    value={sgSubject}
                    onChange={(e) => setSgSubject(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    disabled={sgLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={sgLoading || !sgSubject.trim()}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  {sgLoading ? "Searching..." : "Search"}
                </button>
              </form>
            )}

            {sgSearchType === "advanced" && (
              <form onSubmit={sgAdvancedSearch} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <input
                      type="text"
                      placeholder="Any subject..."
                      value={sgSubject}
                      onChange={(e) => setSgSubject(e.target.value)}
                      className="w-full px-4 py-2 mt-1 text-sm border border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Day</label>
                    <select
                      value={sgMeetingTime?.day || ""}
                      onChange={(e) => setSgMeetingTime(prev => ({ ...prev, day: e.target.value }))}
                      className="w-full px-4 py-2 mt-1 text-sm border border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="">Any day</option>
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                        <option key={day}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                    <button
                      type="button"
                      onClick={() => setOpenTimePicker({ type: "start" })}
                      className="w-full px-4 py-2 mt-1 text-sm text-left text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                    >
                      {sgMeetingTime?.startTime || "Select start time"}
                    </button>
                    {openTimePicker.type === "start" && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                        <div className="relative w-full max-w-lg p-6 bg-white shadow-xl rounded-2xl sm:max-w-xl">
                          <button
                            onClick={() => setOpenTimePicker({ type: null })}
                            className="absolute text-gray-400 right-4 top-4 hover:text-gray-600"
                          >
                            ✕
                          </button>
                          <div className="pr-10">
                            <p className="text-sm font-medium text-gray-900">Selected</p>
                            <p className="text-sm text-gray-600">{pendingTime ? formatTime(pendingTime) : "—"}</p>
                          </div>
                          <StaticTimePickerLandscape
                            value={pendingTime || "09:00"}
                            onChange={(newTime) => setPendingTime(newTime)}
                            label="Select Start Time"
                          />
                          <div className="flex gap-3 mt-4">
                            <button
                              type="button"
                              onClick={() => setOpenTimePicker({ type: null })}
                              className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={applyPendingTime}
                              className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Time</label>
                    <button
                      type="button"
                      onClick={() => setOpenTimePicker({ type: "end" })}
                      className="w-full px-4 py-2 mt-1 text-sm text-left text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                    >
                      {sgMeetingTime?.endTime || "Select end time"}
                    </button>
                    {openTimePicker.type === "end" && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                        <div className="relative w-full max-w-lg p-6 bg-white shadow-xl rounded-2xl sm:max-w-xl">
                          <button
                            onClick={() => setOpenTimePicker({ type: null })}
                            className="absolute text-gray-400 right-4 top-4 hover:text-gray-600"
                          >
                            ✕
                          </button>
                          <div className="pr-10">
                            <p className="text-sm font-medium text-gray-900">Selected</p>
                            <p className="text-sm text-gray-600">{pendingTime ? formatTime(pendingTime) : "—"}</p>
                          </div>
                          <StaticTimePickerLandscape
                            value={pendingTime || "17:00"}
                            onChange={(newTime) => setPendingTime(newTime)}
                            label="Select End Time"
                          />
                          <div className="flex gap-3 mt-4">
                            <button
                              type="button"
                              onClick={() => setOpenTimePicker({ type: null })}
                              className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={applyPendingTime}
                              className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={sgLoading}
                  className="w-full rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  {sgLoading ? "Applying..." : "Apply Filters"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Error State */}
        {sgError && (
          <div className="p-4 mb-8 text-red-700 rounded-2xl bg-red-50 ring-1 ring-red-200">
            <div className="flex items-center gap-2">
              <XCircleIcon className="w-5 h-5" />
              <p>{sgError}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {sgLoading && (
          <div className="space-y-6">
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin border-t-indigo-600" />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-2xl" />
              ))}
            </div>
          </div>
        )}

        {/* Groups Grid */}
        {!sgLoading && sgGroups.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {sgGroups.length} {sgGroups.length === 1 ? "Group" : "Groups"} Available
              </h2>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                {stats.available} spots open
              </span>
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
                const SubjectIcon = getSubjectIcon(group.subject);
                const imageUrl = getGroupImage(group, index);

                return (
                  <div
                    key={group._id}
                    className="relative flex flex-col overflow-hidden transition-all bg-white shadow-sm group rounded-2xl hover:shadow-md"
                  >
                    <div className="relative w-full h-40 overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={group.name}
                        className="object-cover w-full h-full transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-lg font-bold text-white">{group.name}</h3>
                        <p className="text-xs text-white/80">by {group.creator?.name || "Unknown"}</p>
                      </div>
                      <div className="absolute flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 rounded-full left-3 top-3 bg-white/90 backdrop-blur-sm">
                        <SubjectIcon className="w-3 h-3" />
                        {group.subject}
                      </div>
                      <div className="absolute px-2 py-1 text-xs font-medium text-gray-700 rounded-full right-3 top-3 bg-white/90 backdrop-blur-sm">
                        {memberCount}/{maxMembers}
                      </div>
                    </div>

                    <div className="flex flex-col flex-1 p-4">
                      {group.description && (
                        <p className="mb-3 text-sm text-gray-600 line-clamp-2">{group.description}</p>
                      )}

                      {group.hallAllocation && (
                        <div className="flex items-center gap-1 px-2 py-1 mb-3 text-xs text-purple-700 rounded-lg bg-purple-50">
                          <BuildingLibraryIcon className="w-3 h-3" />
                          {group.hallAllocation.building} • Floor {group.hallAllocation.floor} • Lab {group.hallAllocation.lab}
                        </div>
                      )}

                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Capacity</span>
                          <span>{memberCount}/{maxMembers}</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
                          <div
                            className={`h-1.5 rounded-full ${
                              isFull ? "bg-red-500" : percentage >= 75 ? "bg-orange-500" : "bg-indigo-500"
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      {group.meetingTimes?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {group.meetingTimes.slice(0, 2).map((slot, idx) => (
                            <button
                              key={idx}
                              onClick={() => openMeetingModal(group)}
                              className="px-2 py-1 text-xs text-gray-700 transition bg-gray-100 rounded-full hover:bg-gray-200"
                            >
                              {slot.day} {formatTime(slot.startTime)}
                            </button>
                          ))}
                          {group.meetingTimes.length > 2 && (
                            <span className="text-xs text-gray-500">+{group.meetingTimes.length - 2}</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-auto">
                        {!isMember ? (
                          <button
                            onClick={() => handleJoinGroup(group._id)}
                            disabled={joinLoading === group._id || isFull}
                            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                              isFull
                                ? "cursor-not-allowed bg-gray-200 text-gray-500"
                                : "bg-indigo-600 text-white hover:bg-indigo-700"
                            }`}
                          >
                            {joinLoading === group._id ? (
                              <span className="flex items-center justify-center gap-1">
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                Joining...
                              </span>
                            ) : isFull ? (
                              "Full"
                            ) : (
                              "Join Group"
                            )}
                          </button>
                        ) : (
                          <div className="flex items-center justify-center flex-1 gap-1 py-2 text-sm font-semibold rounded-xl bg-emerald-50 text-emerald-700">
                            <CheckCircleSolid className="w-4 h-4" />
                            Joined
                          </div>
                        )}
                        <button
                          onClick={() => openMeetingModal(group)}
                          className="p-2 text-gray-600 transition bg-gray-100 rounded-xl hover:bg-gray-200"
                          title="View schedule"
                        >
                          <ClockIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {!isFull && !isMember && availableSpots > 0 && (
                      <div className="absolute right-3 top-3">
                        <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                          +{availableSpots}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!sgLoading && sgGroups.length === 0 && !sgError && (
          <div className="p-12 text-center bg-white border border-gray-300 border-dashed rounded-2xl">
            <UserGroupIcon className="w-12 h-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No study groups found</h3>
            <p className="mt-2 text-gray-500">Be the first to create one and start learning together.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2 mt-4 text-sm font-semibold text-white bg-indigo-600 rounded-full shadow-sm hover:bg-indigo-700"
            >
              <PlusIcon className="w-4 h-4" />
              Create Group
            </button>
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

      {/* Meeting Status Modal */}
      {showMeetingModal && selectedGroupForMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="relative w-full max-w-md p-6 bg-white shadow-xl rounded-2xl">
            <button
              onClick={() => setShowMeetingModal(false)}
              className="absolute text-gray-400 right-4 top-4 hover:text-gray-600"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-gray-900">{selectedGroupForMeeting.name}</h2>
            <p className="text-sm text-gray-500">{selectedGroupForMeeting.subject}</p>

            <div className={`mt-4 rounded-xl p-4 ${
              isMeetingNow(selectedGroupForMeeting.meetingTimes, sgMeetingTime?.day, sgMeetingTime?.startTime, sgMeetingTime?.endTime)
                ? "bg-green-50"
                : "bg-gray-50"
            }`}>
              <div className="flex items-center gap-3">
                {isMeetingNow(selectedGroupForMeeting.meetingTimes, sgMeetingTime?.day, sgMeetingTime?.startTime, sgMeetingTime?.endTime) ? (
                  <>
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Meeting now!</p>
                      <p className="text-xs text-green-700">Matches your selected time</p>
                    </div>
                  </>
                ) : (
                  <>
                    <ClockIcon className="w-6 h-6 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-800">Not meeting now</p>
                      <p className="text-xs text-gray-600">Check schedule below</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {selectedGroupForMeeting.meetingTimes?.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-medium text-gray-700">Schedule</h3>
                <div className="space-y-2">
                  {selectedGroupForMeeting.meetingTimes.map((slot, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 text-sm rounded-lg bg-gray-50">
                      <CalendarIcon className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{slot.day}</span>
                      <span className="text-gray-600">
                        {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedGroupForMeeting.hallAllocation && (
              <div className="p-3 mt-4 rounded-lg bg-purple-50">
                <div className="flex items-center gap-2 text-purple-700">
                  <BuildingLibraryIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Hall Allocation</span>
                </div>
                <p className="mt-1 text-sm text-purple-800">
                  {selectedGroupForMeeting.hallAllocation.building} • Floor {selectedGroupForMeeting.hallAllocation.floor} • Lab {selectedGroupForMeeting.hallAllocation.lab}
                </p>
              </div>
            )}

            <button
              onClick={() => setShowMeetingModal(false)}
              className="w-full py-2 mt-6 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyGroupsTab;