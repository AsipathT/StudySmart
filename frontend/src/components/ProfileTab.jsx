import { useState, useRef } from "react";
import {
    CameraIcon,
    PencilIcon,
    CheckIcon,
    XMarkIcon,
    AcademicCapIcon,
    CalendarIcon,
    EnvelopeIcon,
    UserIcon,
    BookOpenIcon,
    ClockIcon,
} from "@heroicons/react/24/outline";

const API_BASE = "http://localhost:5000";

const ProfileTab = ({
    user,
    getInitials,
    onUpdateProfile,
    onUploadImage,
    profileLoading,
    profileError,
    profileSuccess,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || "",
        degree: user?.degree || "",
        year: user?.year || "",
        subjects: user?.subjects ? [...user.subjects] : [],
        availableTime: user?.availableTime || [],
    });
    const [newAvailability, setNewAvailability] = useState({
        day: "",
        startTime: "09:00",
        endTime: "17:00",
    });
    const [newSubjectInput, setNewSubjectInput] = useState("");
    const [imageUploading, setImageUploading] = useState(false);
    const [localError, setLocalError] = useState("");
    const [localSuccess, setLocalSuccess] = useState("");
    const fileInputRef = useRef(null);

    const timeToMinutes = (t) => {
        if (!t || typeof t !== "string" || !t.includes(":")) return null;
        const [hhRaw, mmRaw] = t.split(":");
        const hh = Number(hhRaw);
        const mm = Number(mmRaw);
        if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
        if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
        return hh * 60 + mm;
    };

    const normalizeSlot = (slot) => {
        if (!slot || typeof slot !== "object") return null;
        const day = typeof slot.day === "string" ? slot.day : "";
        const startTime = typeof slot.startTime === "string" ? slot.startTime : "";
        const endTime = typeof slot.endTime === "string" ? slot.endTime : "";
        if (!day || !startTime || !endTime) return null;
        return { day, startTime, endTime };
    };

    const formatSlot = (slot) => {
        const s = normalizeSlot(slot);
        if (!s) return "";
        return `${s.day}: ${s.startTime} - ${s.endTime}`;
    };

    const addAvailabilitySlot = () => {
        setLocalError("");
        const day = (newAvailability.day || "").trim();
        const startTime = (newAvailability.startTime || "").trim();
        const endTime = (newAvailability.endTime || "").trim();

        if (!day) {
            setLocalError("Please select a day");
            return;
        }

        const startMins = timeToMinutes(startTime);
        const endMins = timeToMinutes(endTime);
        if (startMins == null || endMins == null) {
            setLocalError("Please select valid start and end times");
            return;
        }
        if (endMins <= startMins) {
            setLocalError("End time must be after start time");
            return;
        }

        setFormData((p) => {
            const next = [...(p.availableTime || [])];
            const exists = next.some(
                (s) =>
                    s?.day === day &&
                    s?.startTime === startTime &&
                    s?.endTime === endTime
            );
            if (!exists) next.push({ day, startTime, endTime });
            return { ...p, availableTime: next };
        });
    };

    const removeAvailabilitySlot = (slotToRemove) => {
        const s = normalizeSlot(slotToRemove);
        if (!s) return;
        setFormData((p) => ({
            ...p,
            availableTime: (p.availableTime || []).filter(
                (x) =>
                    !(
                        x?.day === s.day &&
                        x?.startTime === s.startTime &&
                        x?.endTime === s.endTime
                    )
            ),
        }));
    };

    const profileImageUrl = user?.profileImage
        ? `${API_BASE}${user.profileImage}`
        : "";

    const startEditing = () => {
        setFormData({
            name: user?.name || "",
            degree: user?.degree || "",
            year: user?.year || "",
            subjects: user?.subjects ? [...user.subjects] : [],
            availableTime: user?.availableTime || [],
        });
        setNewAvailability({
            day: "",
            startTime: "09:00",
            endTime: "17:00",
        });
        setIsEditing(true);
        setLocalError("");
        setLocalSuccess("");
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setLocalError("");
        setLocalSuccess("");
    };

    const addSubject = () => {
        const s = newSubjectInput.trim();
        if (s && !formData.subjects.includes(s)) {
            setFormData((p) => ({ ...p, subjects: [...p.subjects, s] }));
            setNewSubjectInput("");
        }
    };

    const removeSubject = (idx) => {
        setFormData((p) => ({
            ...p,
            subjects: p.subjects.filter((_, i) => i !== idx),
        }));
    };

    const handleSave = async () => {
        setLocalError("");
        setLocalSuccess("");
        if (!formData.name.trim()) {
            setLocalError("Name is required");
            return;
        }
        try {
            await onUpdateProfile({
                name: formData.name.trim(),
                degree: formData.degree.trim(),
                year: formData.year.toString().trim(),
                subjects: formData.subjects,
                availableTime: formData.availableTime,
            });
            setLocalSuccess("Profile updated successfully!");
            setIsEditing(false);
            setTimeout(() => setLocalSuccess(""), 3000);
        } catch (err) {
            setLocalError(err.message || "Failed to update profile");
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith("image/")) {
            setLocalError("Please select an image file");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setLocalError("Image must be less than 5MB");
            return;
        }

        setImageUploading(true);
        setLocalError("");
        try {
            await onUploadImage(file);
            setLocalSuccess("Profile picture updated!");
            setTimeout(() => setLocalSuccess(""), 3000);
        } catch (err) {
            setLocalError(err.message || "Failed to upload image");
        } finally {
            setImageUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const displayError = localError || profileError;
    const displaySuccess = localSuccess || profileSuccess;

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Manage your personal information and preferences
                </p>
            </div>

            {/* Status Messages */}
            {displaySuccess && (
                <div className="p-3 mb-6 text-sm font-medium text-green-700 border border-green-200 bg-green-50 rounded-xl">
                    {displaySuccess}
                </div>
            )}
            {displayError && (
                <div className="p-3 mb-6 text-sm font-medium text-red-700 border border-red-200 bg-red-50 rounded-xl">
                    {displayError}
                </div>
            )}

            {/* Profile Card */}
            <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
                {/* Banner */}
                <div className="relative h-36 bg-gradient-to-r from-indigo-500 to-violet-600">
                    <div className="absolute rounded-full -top-8 -right-8 w-32 h-32 bg-white/10"></div>
                    <div className="absolute w-20 h-20 rounded-full -bottom-6 -left-6 bg-white/10"></div>
                </div>

                {/* Avatar Section */}
                <div className="relative px-6 pb-6">
                    <div className="flex flex-col items-center -mt-16 sm:flex-row sm:items-end sm:space-x-5">
                        {/* Avatar */}
                        <div className="relative group">
                            <div className="flex items-center justify-center w-28 h-28 text-3xl font-bold text-white rounded-full ring-4 ring-white shadow-lg overflow-hidden"
                                style={{
                                    background: profileImageUrl
                                        ? "transparent"
                                        : "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
                                }}
                            >
                                {profileImageUrl ? (
                                    <img
                                        src={profileImageUrl}
                                        alt={user?.name}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    getInitials(user?.name)
                                )}
                            </div>
                            {/* Upload overlay */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={imageUploading}
                                className="absolute inset-0 flex items-center justify-center transition-opacity bg-black/40 rounded-full opacity-0 group-hover:opacity-100"
                            >
                                {imageUploading ? (
                                    <div className="w-6 h-6 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                                ) : (
                                    <CameraIcon className="w-6 h-6 text-white" />
                                )}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>

                        {/* Name & Role */}
                        <div className="mt-4 text-center sm:mt-0 sm:text-left sm:pb-1">
                            <h2 className="text-xl font-bold text-gray-900">
                                {user?.name || "Student"}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {user?.degree || "Student"}{" "}
                                {user?.year ? `• Year ${user.year}` : ""}
                            </p>
                        </div>

                        {/* Edit Button */}
                        <div className="mt-4 sm:mt-0 sm:ml-auto sm:pb-1">
                            {!isEditing ? (
                                <button
                                    onClick={startEditing}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-all rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 shadow-md"
                                >
                                    <PencilIcon className="w-4 h-4" />
                                    Edit Profile
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={profileLoading}
                                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white transition-all rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50"
                                    >
                                        <CheckIcon className="w-4 h-4" />
                                        {profileLoading ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                        onClick={cancelEditing}
                                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 transition-all bg-gray-100 rounded-xl hover:bg-gray-200"
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="px-6 pb-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Name */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                                <UserIcon className="w-3.5 h-3.5" />
                                Full Name
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData((p) => ({ ...p, name: e.target.value }))
                                    }
                                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                />
                            ) : (
                                <p className="px-4 py-2.5 text-sm text-gray-900 bg-gray-50 rounded-xl">
                                    {user?.name || "—"}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                                <EnvelopeIcon className="w-3.5 h-3.5" />
                                Email
                            </label>
                            <p className="px-4 py-2.5 text-sm text-gray-500 bg-gray-50 rounded-xl">
                                {user?.email || "—"}
                            </p>
                        </div>

                        {/* Degree */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                                <AcademicCapIcon className="w-3.5 h-3.5" />
                                Degree
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.degree}
                                    onChange={(e) =>
                                        setFormData((p) => ({ ...p, degree: e.target.value }))
                                    }
                                    placeholder="e.g., Computer Science"
                                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                />
                            ) : (
                                <p className="px-4 py-2.5 text-sm text-gray-900 bg-gray-50 rounded-xl">
                                    {user?.degree || "—"}
                                </p>
                            )}
                        </div>

                        {/* Year */}
                        <div className="space-y-1.5">
                            <label className="flex items-center gap-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                                <CalendarIcon className="w-3.5 h-3.5" />
                                Year
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.year}
                                    onChange={(e) =>
                                        setFormData((p) => ({ ...p, year: e.target.value }))
                                    }
                                    placeholder="e.g., 2"
                                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                />
                            ) : (
                                <p className="px-4 py-2.5 text-sm text-gray-900 bg-gray-50 rounded-xl">
                                    {user?.year || "—"}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Subjects */}
                    <div className="mt-6 space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                            <BookOpenIcon className="w-3.5 h-3.5" />
                            Subjects
                        </label>
                        {isEditing && (
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={newSubjectInput}
                                    onChange={(e) => setNewSubjectInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            addSubject();
                                        }
                                    }}
                                    placeholder="Add a subject..."
                                    className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                />
                                <button
                                    type="button"
                                    onClick={addSubject}
                                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition"
                                >
                                    Add
                                </button>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                            {(isEditing ? formData.subjects : user?.subjects || []).length >
                                0 ? (
                                (isEditing ? formData.subjects : user?.subjects || []).map(
                                    (s, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 rounded-full"
                                        >
                                            {s}
                                            {isEditing && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeSubject(i)}
                                                    className="ml-1.5 text-purple-400 hover:text-red-500 transition"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </span>
                                    )
                                )
                            ) : (
                                <p className="text-sm text-gray-400">No subjects added yet</p>
                            )}
                        </div>
                    </div>

                    {/* Availability */}
                    <div className="mt-8 space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
                            <ClockIcon className="w-3.5 h-3.5" />
                            Availability
                        </label>

                        {isEditing && (
                            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div>
                                        <label className="block mb-1 text-xs font-medium text-gray-600">Day</label>
                                        <select
                                            value={newAvailability.day}
                                            onChange={(e) =>
                                                setNewAvailability((p) => ({ ...p, day: e.target.value }))
                                            }
                                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                        >
                                            <option value="">Select day</option>
                                            {[
                                                "Monday",
                                                "Tuesday",
                                                "Wednesday",
                                                "Thursday",
                                                "Friday",
                                                "Saturday",
                                                "Sunday",
                                            ].map((d) => (
                                                <option key={d} value={d}>
                                                    {d}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block mb-1 text-xs font-medium text-gray-600">Start</label>
                                        <input
                                            type="time"
                                            value={newAvailability.startTime || "09:00"}
                                            onChange={(e) =>
                                                setNewAvailability((p) => ({ ...p, startTime: e.target.value }))
                                            }
                                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-1 text-xs font-medium text-gray-600">End</label>
                                        <input
                                            type="time"
                                            value={newAvailability.endTime || "17:00"}
                                            onChange={(e) =>
                                                setNewAvailability((p) => ({ ...p, endTime: e.target.value }))
                                            }
                                            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end mt-3">
                                    <button
                                        type="button"
                                        onClick={addAvailabilitySlot}
                                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition"
                                    >
                                        Add slot
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                            {(
                                (isEditing ? formData.availableTime : user?.availableTime) || []
                            ).filter(Boolean).length > 0 ? (
                                (isEditing ? formData.availableTime : user?.availableTime || [])
                                    .map(normalizeSlot)
                                    .filter(Boolean)
                                    .map((slot, idx) => (
                                        <span
                                            key={`${slot.day}-${slot.startTime}-${slot.endTime}-${idx}`}
                                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-full"
                                            title={formatSlot(slot)}
                                        >
                                            {slot.day} • {slot.startTime}-{slot.endTime}
                                            {isEditing && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeAvailabilitySlot(slot)}
                                                    className="ml-1.5 text-indigo-400 hover:text-red-500 transition"
                                                    aria-label="Remove availability slot"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </span>
                                    ))
                            ) : (
                                <p className="text-sm text-gray-400">
                                    No availability added yet
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-8">
                        <div className="p-4 text-center bg-purple-50 rounded-xl">
                            <p className="text-2xl font-bold text-purple-600">
                                {user?.subjects?.length || 0}
                            </p>
                            <p className="mt-1 text-xs font-medium text-gray-500">
                                Subjects
                            </p>
                        </div>
                        <div className="p-4 text-center bg-indigo-50 rounded-xl">
                            <p className="text-2xl font-bold text-indigo-600">
                                {user?.studyGroups?.length || 0}
                            </p>
                            <p className="mt-1 text-xs font-medium text-gray-500">Groups</p>
                        </div>
                        <div className="p-4 text-center bg-blue-50 rounded-xl">
                            <p className="text-2xl font-bold text-blue-600">
                                {user?.year || "—"}
                            </p>
                            <p className="mt-1 text-xs font-medium text-gray-500">Year</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileTab;
