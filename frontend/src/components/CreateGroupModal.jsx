import { useState } from "react";
import { createStudyGroup } from "../services/studyGroupService";
import StaticTimePickerLandscape from "./StaticTimePickerLandscape";
import {
  UserGroupIcon,
  XMarkIcon,
  AcademicCapIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

const INITIAL_FORM_DATA = {
  name: "",
  description: "",
  subject: "",
  maxMembers: 10,
  meetingTimes: [], // Start empty - user must add meeting times
  hallAllocation: {
    building: "",
    floor: "",
    lab: "",
  },
  image: "",
};

const CreateGroupModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [meetingTimeSlots, setMeetingTimeSlots] = useState(
    INITIAL_FORM_DATA.meetingTimes
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [hallAllocation, setHallAllocation] = useState(INITIAL_FORM_DATA.hallAllocation);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // Step tracker
  const [openTimePicker, setOpenTimePicker] = useState({ index: null, type: null }); // Track which time picker is open
  const [pendingSlotTime, setPendingSlotTime] = useState("");

  // Don't render if modal is closed
  if (!isOpen) {
    return null;
  }

  // Generate floor options based on building
  const getFloorOptions = () => {
    if (hallAllocation.building === "Main Building") {
      return [3, 4, 5, 6];
    } else if (hallAllocation.building === "New Building") {
      return Array.from({ length: 12 }, (_, i) => i + 3); // Floors 3 to 14
    }
    return [];
  };

  // Generate lab options based on building and floor
  const getLabOptions = () => {
    if (!hallAllocation.building || !hallAllocation.floor) return [];
    
    const floor = hallAllocation.floor;
    const prefix = hallAllocation.building === "Main Building" ? "A" : "F";
    
    return Array.from({ length: 6 }, (_, i) => `${prefix}${floor}0${i + 1}`);
  };

  // Handle building change
  const handleBuildingChange = (value) => {
    setHallAllocation({
      building: value,
      floor: "",
      lab: "",
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next.hallAllocation;
      return next;
    });
  };

  // Handle floor change
  const handleFloorChange = (value) => {
    setHallAllocation((prev) => ({
      ...prev,
      floor: value,
      lab: "",
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.hallAllocation;
      return next;
    });
  };

  // Handle lab change
  const handleLabChange = (value) => {
    setHallAllocation((prev) => ({
      ...prev,
      lab: value,
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.hallAllocation;
      return next;
    });
  };

  const validate = (data) => {
    const nextErrors = {};

    if (!data.name.trim()) {
      nextErrors.name = "Please provide a group name";
    }

    if (!data.subject.trim()) {
      nextErrors.subject = "Please provide a subject";
    }

    const max = Number(data.maxMembers);
    if (!Number.isFinite(max) || max < 2 || max > 50) {
      nextErrors.maxMembers = "Maximum members must be between 2 and 50";
    }

    if (!meetingTimeSlots || meetingTimeSlots.length === 0) {
      nextErrors.meetingTimes = "Please add at least one meeting time";
    } else {
      // Validate each time slot
      for (const slot of meetingTimeSlots) {
        if (!slot.startTime || !slot.endTime || !slot.day) {
          nextErrors.meetingTimes = "Each meeting time must have day, start time, and end time";
          break;
        }

        const [startHour, startMin] = slot.startTime.split(":").map(Number);
        const [endHour, endMin] = slot.endTime.split(":").map(Number);
        const startTotalMin = startHour * 60 + startMin;
        const endTotalMin = endHour * 60 + endMin;

        if (startTotalMin >= endTotalMin) {
          nextErrors.meetingTimes = "Start time must be before end time";
          break;
        }

        if (endTotalMin - startTotalMin < 30) {
          nextErrors.meetingTimes = "Meeting must be at least 30 minutes long";
          break;
        }
      }
    }

    // Validate hall allocation
    if (!hallAllocation.building) {
      nextErrors.hallAllocation = "Please select a building";
    } else if (!hallAllocation.floor) {
      nextErrors.hallAllocation = "Please select a floor";
    } else if (!hallAllocation.lab) {
      nextErrors.hallAllocation = "Please select a lab";
    }

    return nextErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "maxMembers" ? (value === "" ? "" : Number(value)) : value,
    }));

    setFormError("");
    setErrors((prev) => {
      if (!prev?.[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleTimeSlotChange = (index, field, value) => {
    const updated = [...meetingTimeSlots];
    updated[index][field] = value;
    setMeetingTimeSlots(updated);

    setFormError("");
    setErrors((prev) => {
      if (!prev?.meetingTimes) return prev;
      const next = { ...prev };
      delete next.meetingTimes;
      return next;
    });
  };

  const handleAddTimeSlot = () => {
    setMeetingTimeSlots([
      ...meetingTimeSlots,
      {
        startTime: "09:00",
        endTime: "11:00",
        day: "Monday",
      },
    ]);
  };

  const handleRemoveTimeSlot = (index) => {
    if (meetingTimeSlots.length > 1) {
      setMeetingTimeSlots(
        meetingTimeSlots.filter((_, i) => i !== index)
      );
    }
  };

  // Step validation functions
  const validateStep1 = () => {
    const nextErrors = {};
    if (!formData.name.trim()) {
      nextErrors.name = "Please provide a group name";
    }
    if (!formData.subject.trim()) {
      nextErrors.subject = "Please provide a subject";
    }
    const max = Number(formData.maxMembers);
    if (!Number.isFinite(max) || max < 2 || max > 50) {
      nextErrors.maxMembers = "Maximum members must be between 2 and 50";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep2 = () => {
    const nextErrors = {};
    if (!hallAllocation.building) {
      nextErrors.hallAllocation = "Please select a building";
    } else if (!hallAllocation.floor) {
      nextErrors.hallAllocation = "Please select a floor";
    } else if (!hallAllocation.lab) {
      nextErrors.hallAllocation = "Please select a lab";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep3 = () => {
    const nextErrors = {};
    if (!meetingTimeSlots || meetingTimeSlots.length === 0) {
      nextErrors.meetingTimes = "Please add at least one meeting time";
    } else {
      for (const slot of meetingTimeSlots) {
        if (!slot.startTime || !slot.endTime || !slot.day) {
          nextErrors.meetingTimes = "Each meeting time must have day, start time, and end time";
          break;
        }
        const [startHour, startMin] = slot.startTime.split(":").map(Number);
        const [endHour, endMin] = slot.endTime.split(":").map(Number);
        const startTotalMin = startHour * 60 + startMin;
        const endTotalMin = endHour * 60 + endMin;
        if (startTotalMin >= endTotalMin) {
          nextErrors.meetingTimes = "Start time must be before end time";
          break;
        }
        if (endTotalMin - startTotalMin < 30) {
          nextErrors.meetingTimes = "Meeting must be at least 30 minutes long";
          break;
        }
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateAllSteps = () => {
    const nextErrors = validate(formData);
    setErrors(nextErrors);
    return nextErrors;
  };

  // Navigation functions
  const handleNext = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    let isValid = false;
    setFormError("");
    
    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    } else if (currentStep === 3) {
      isValid = validateStep3();
    }
    
    if (isValid) {
      setCurrentStep(prev => prev + 1);
      setErrors({});
    } else {
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Only allow submission on Summary step (Step 4)
    if (currentStep !== 4) {
      handleNext();
      return;
    }

    const nextErrors = validateAllSteps();
    if (Object.keys(nextErrors).length > 0) {
      setFormError("Please enter all required data before creating the group.");
      if (!formData.name?.trim() || !formData.subject?.trim() || nextErrors?.maxMembers) {
        setCurrentStep(1);
      } else if (!hallAllocation.building || !hallAllocation.floor || !hallAllocation.lab) {
        setCurrentStep(2);
      } else {
        setCurrentStep(3);
      }
      return;
    }

    // Prevent submission if no meeting times added
    if (!meetingTimeSlots || meetingTimeSlots.length === 0) {
      setFormError("Please add at least one meeting time before creating the group.");
      return;
    }

    // Validate step 3 before submitting
    if (!validateStep3()) {
      return;
    }

    setLoading(true);
    try {
      let payload;
      if (imageFile) {
        // Send as FormData so multer stores the file on disk
        const fd = new FormData();
        fd.append('name', formData.name.trim());
        fd.append('description', formData.description || '');
        fd.append('subject', formData.subject.trim());
        fd.append('maxMembers', String(formData.maxMembers));
        fd.append('meetingTimes', JSON.stringify(meetingTimeSlots));
        fd.append('hallAllocation', JSON.stringify({
          building: hallAllocation.building,
          floor: Number(hallAllocation.floor),
          lab: hallAllocation.lab,
        }));
        fd.append('image', imageFile);
        payload = fd;
      } else {
        payload = {
          ...formData,
          meetingTimes: meetingTimeSlots,
          hallAllocation: {
            building: hallAllocation.building,
            floor: Number(hallAllocation.floor),
            lab: hallAllocation.lab,
          },
          image: imageUrl || undefined,
        };
      }

      await createStudyGroup(payload);
      
      setFormData(INITIAL_FORM_DATA);
      setMeetingTimeSlots(INITIAL_FORM_DATA.meetingTimes);
      setHallAllocation(INITIAL_FORM_DATA.hallAllocation);
      setImageUrl("");
      setImageFile(null);
      setImagePreview(null);
      setCurrentStep(1);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating study group:", error);
      let errorMessage = "Failed to create study group. Please try again.";

      if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.message && typeof error.message === "string") {
        errorMessage = error.message;
      } else if (
        error?.response?.data?.message &&
        typeof error.response.data.message === "string"
      ) {
        errorMessage = error.response.data.message;
      }

      setFormError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(INITIAL_FORM_DATA);
    setMeetingTimeSlots(INITIAL_FORM_DATA.meetingTimes);
    setHallAllocation(INITIAL_FORM_DATA.hallAllocation);
    setImageUrl("");
    setImagePreview(null);
    setErrors({});
    setFormError("");
    setCurrentStep(1); // Reset to step 1
    onClose();
  };

  const applyPendingSlotTime = () => {
    if (openTimePicker.index === null || !openTimePicker.type) return;
    const field = openTimePicker.type === "start" ? "startTime" : "endTime";
    handleTimeSlotChange(openTimePicker.index, field, pendingSlotTime);
    setOpenTimePicker({ index: null, type: null });
  };

  // Handle image file upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setFormError('Please upload a valid image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Image size must be less than 5MB');
        return;
      }
      setImageFile(file);
      setImageUrl(''); // clear any typed URL
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle image URL input
  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setImageFile(null); // clear any selected file
    setImageUrl(url);
    setImagePreview(url || null);
  };

  const inputBase =
    "w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200";

  const days = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];

  // Helper function to format time for display
  const formatTimeForDisplay = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Helper function to get time of day icon
  const getTimeOfDayIcon = (time) => {
    if (!time) return <ClockIcon className="w-3 h-3" />;
    const hour = parseInt(time.split(":")[0]);
    if (hour < 12) return <SunIcon className="w-3 h-3 text-yellow-500" />;
    if (hour < 17) return <SunIcon className="w-3 h-3 text-orange-500" />;
    return <MoonIcon className="w-3 h-3 text-indigo-500" />;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto flex items-start sm:items-center justify-center transition-all duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-group-title"
      onClick={(e) => e.target === e.currentTarget && !loading && handleClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all duration-300 scale-100 animate-in fade-in slide-in-from-bottom-4">
        {/* Header with gradient and image */}
        <div className="relative overflow-hidden rounded-t-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
          <div className="absolute inset-0 opacity-10">
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80"
              alt=""
              className="object-cover w-full h-full"
            />
          </div>
          <div className="relative px-6 py-4 flex justify-between items-center">
            <div>
              <h3
                id="create-group-title"
                className="text-xl font-bold text-white flex items-center gap-2"
              >
                <UserGroupIcon className="w-6 h-6" />
                Create New Study Group
              </h3>
              <p className="text-sm text-indigo-100 mt-1">
                Start your learning journey by creating a study group
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="text-white/80 hover:text-white bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

          <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); }} className="p-6 overflow-y-auto flex-1">
            {/* Step Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                {/* Step 1 */}
                <div className="flex items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    currentStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    1
                  </div>
                  <div className="ml-2">
                    <div className="text-xs font-semibold text-gray-700">Step 1</div>
                    <div className="text-xs text-gray-500">Basic Info</div>
                  </div>
                </div>

                {/* Connector */}
                <div className={`flex-1 h-1 mx-2 ${
                  currentStep > 1 ? 'bg-indigo-600' : 'bg-gray-200'
                }`}></div>

                {/* Step 2 */}
                <div className="flex items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    currentStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    2
                  </div>
                  <div className="ml-2">
                    <div className="text-xs font-semibold text-gray-700">Step 2</div>
                    <div className="text-xs text-gray-500">Hall & Image</div>
                  </div>
                </div>

                {/* Connector */}
                <div className={`flex-1 h-1 mx-2 ${
                  currentStep > 2 ? 'bg-indigo-600' : 'bg-gray-200'
                }`}></div>

                {/* Step 3 */}
                <div className="flex items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    currentStep >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    3
                  </div>
                  <div className="ml-2">
                    <div className="text-xs font-semibold text-gray-700">Step 3</div>
                    <div className="text-xs text-gray-500">Meeting Times</div>
                  </div>
                </div>

                {/* Connector */}
                <div className={`flex-1 h-1 mx-2 ${
                  currentStep > 3 ? 'bg-indigo-600' : 'bg-gray-200'
                }`}></div>

                {/* Step 4 */}
                <div className="flex items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    currentStep >= 4 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    4
                  </div>
                  <div className="ml-2">
                    <div className="text-xs font-semibold text-gray-700">Step 4</div>
                    <div className="text-xs text-gray-500">Summary</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {/* Group Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name <span className="text-red-500">*</span>
                  </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="e.g., Advanced Calculus Study Group"
                  aria-invalid={Boolean(errors?.name)}
                  aria-describedby={errors?.name ? "group-name-error" : undefined}
                  className={`${inputBase} ${
                    errors?.name ? "border-red-300 focus:ring-red-500" : "border-gray-300"
                  }`}
                />
                {errors?.name && (
                  <p id="group-name-error" className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <XMarkIcon className="w-3 h-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-2">
                    <AcademicCapIcon className="w-4 h-4 text-gray-500" />
                    Subject <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="e.g., Mathematics, Physics, Computer Science"
                  aria-invalid={Boolean(errors?.subject)}
                  aria-describedby={errors?.subject ? "subject-error" : undefined}
                  className={`${inputBase} ${
                    errors?.subject ? "border-red-300 focus:ring-red-500" : "border-gray-300"
                  }`}
                />
                {errors?.subject && (
                  <p id="subject-error" className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <XMarkIcon className="w-3 h-3" />
                    {errors.subject}
                  </p>
                )}
              </div>

                {/* Max Members */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Members
                  </label>
                  <input
                    type="number"
                    name="maxMembers"
                    value={formData.maxMembers}
                    onChange={handleChange}
                    disabled={loading}
                    min="2"
                    max="50"
                    aria-invalid={Boolean(errors?.maxMembers)}
                    aria-describedby={
                      errors?.maxMembers
                        ? "max-members-error"
                        : "max-members-hint"
                    }
                    className={`${inputBase} pl-10 ${
                      errors?.maxMembers ? "border-red-300 focus:ring-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors?.maxMembers ? (
                    <p id="max-members-error" className="text-xs text-red-700 mt-1">
                      {errors.maxMembers}
                    </p>
                  ) : (
                    <p id="max-members-hint" className="text-xs text-gray-500 mt-1">
                      Between 2 and 50 members
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Brief description of your study group..."
                    rows="4"
                    className={`${inputBase} resize-none border-gray-300`}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Hall Allocation & Image */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Hall Allocation Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hall Allocation <span className="text-red-500">*</span>
                  </label>
                  
                  {/* Building Selection */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Building
                      </label>
                      <select
                        value={hallAllocation.building}
                        onChange={(e) => handleBuildingChange(e.target.value)}
                        disabled={loading}
                        className={`${inputBase} ${
                          errors?.hallAllocation ? "border-red-300" : "border-gray-300"
                        }`}
                      >
                        <option value="">Select Building</option>
                        <option value="Main Building">Main Building</option>
                        <option value="New Building">New Building</option>
                      </select>
                    </div>

                    {/* Floor Selection */}
                    {hallAllocation.building && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Floor
                        </label>
                        <select
                          value={hallAllocation.floor}
                          onChange={(e) => handleFloorChange(e.target.value)}
                          disabled={loading}
                          className={`${inputBase} ${
                            errors?.hallAllocation ? "border-red-300" : "border-gray-300"
                          }`}
                        >
                          <option value="">Select Floor</option>
                          {getFloorOptions().map((floor) => (
                            <option key={floor} value={floor}>
                              Floor {floor}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Lab Selection */}
                    {hallAllocation.building && hallAllocation.floor && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Lab
                        </label>
                        <select
                          value={hallAllocation.lab}
                          onChange={(e) => handleLabChange(e.target.value)}
                          disabled={loading}
                          className={`${inputBase} ${
                            errors?.hallAllocation ? "border-red-300" : "border-gray-300"
                          }`}
                        >
                          <option value="">Select Lab</option>
                          {getLabOptions().map((lab) => (
                            <option key={lab} value={lab}>
                              {lab}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {errors?.hallAllocation && (
                      <p className="text-xs text-red-700 mt-1">
                        {errors.hallAllocation}
                      </p>
                    )}
                  </div>
                </div>

                {/* Group Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Image (Optional)
                  </label>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mb-3">
                      <img
                        src={imagePreview}
                        alt="Group preview"
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                    </div>
                  )}
                  
                  {/* File Upload */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={loading}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  
                  {/* Or URL Input */}
                  <div className="mt-2">
                    <label className="block text-xs text-gray-600 mb-1">Or enter image URL</label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={handleImageUrlChange}
                      disabled={loading}
                      placeholder="https://example.com/image.jpg"
                      className={`${inputBase} border-gray-300 text-sm`}
                    />
                  </div>
                  
                  <p className="mt-1 text-xs text-gray-500">
                    Upload an image or provide a URL. Default image will be used if not provided.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Meeting Times */}
            {currentStep === 3 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Meeting Times <span className="text-red-500">*</span>
                </label>

                {meetingTimeSlots.length === 0 && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Click "Add Time Slot" below to add your group's meeting schedule.
                    </p>
                  </div>
                )}

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {meetingTimeSlots.map((slot, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                    >
                      {/* Day Selection */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Day
                        </label>
                        <select
                          value={slot.day}
                          onChange={(e) =>
                            handleTimeSlotChange(index, "day", e.target.value)
                          }
                          disabled={loading}
                          className={`${inputBase} border-gray-300`}
                        >
                          <option value="Monday">Monday</option>
                          <option value="Tuesday">Tuesday</option>
                          <option value="Wednesday">Wednesday</option>
                          <option value="Thursday">Thursday</option>
                          <option value="Friday">Friday</option>
                          <option value="Saturday">Saturday</option>
                          <option value="Sunday">Sunday</option>
                        </select>
                      </div>

                      {/* Start Time with Material-UI Clock */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Time
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setPendingSlotTime(slot.startTime || "09:00");
                            setOpenTimePicker({ index, type: 'start' });
                          }}
                          disabled={loading}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base font-medium text-gray-700 hover:border-indigo-400 disabled:bg-gray-100 disabled:cursor-not-allowed text-left bg-white"
                        >
                          {slot.startTime || "Select Start Time"}
                        </button>
                        {openTimePicker.index === index && openTimePicker.type === 'start' && (
                          <div className="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-lg shadow-2xl relative max-w-[600px] w-full">
                              <button
                                type="button"
                                onClick={() => setOpenTimePicker({ index: null, type: null })}
                                className="absolute top-2 right-2 z-10 text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md"
                              >
                                ×
                              </button>
                              <div className="px-4 pt-4">
                                <p className="text-sm font-medium text-gray-900">Selected</p>
                                <p className="text-sm text-gray-600">{pendingSlotTime ? formatTimeForDisplay(pendingSlotTime) : "—"}</p>
                              </div>
                              <StaticTimePickerLandscape
                                value={pendingSlotTime || slot.startTime || "09:00"}
                                onChange={(newTime) => setPendingSlotTime(newTime)}
                                disabled={loading}
                                label="Select Start Time"
                              />
                              <div className="px-4 pb-4 flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => setOpenTimePicker({ index: null, type: null })}
                                  className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={applyPendingSlotTime}
                                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* End Time with Material-UI Clock */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Time
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setPendingSlotTime(slot.endTime || "11:00");
                            setOpenTimePicker({ index, type: 'end' });
                          }}
                          disabled={loading}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-base font-medium text-gray-700 hover:border-indigo-400 disabled:bg-gray-100 disabled:cursor-not-allowed text-left bg-white"
                        >
                          {slot.endTime || "Select End Time"}
                        </button>
                        {openTimePicker.index === index && openTimePicker.type === 'end' && (
                          <div className="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-lg shadow-2xl relative max-w-[600px] w-full">
                              <button
                                type="button"
                                onClick={() => setOpenTimePicker({ index: null, type: null })}
                                className="absolute top-2 right-2 z-10 text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md"
                              >
                                ×
                              </button>
                              <div className="px-4 pt-4">
                                <p className="text-sm font-medium text-gray-900">Selected</p>
                                <p className="text-sm text-gray-600">{pendingSlotTime ? formatTimeForDisplay(pendingSlotTime) : "—"}</p>
                              </div>
                              <StaticTimePickerLandscape
                                value={pendingSlotTime || slot.endTime || "11:00"}
                                onChange={(newTime) => setPendingSlotTime(newTime)}
                                disabled={loading}
                                label="Select End Time"
                              />
                              <div className="px-4 pb-4 flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => setOpenTimePicker({ index: null, type: null })}
                                  className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={applyPendingSlotTime}
                                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Remove Button */}
                      {meetingTimeSlots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTimeSlot(index)}
                          disabled={loading}
                          className="w-full text-sm bg-red-100 text-red-700 py-2 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Remove Time Slot
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Time Slot Button */}
                <button
                  type="button"
                  onClick={handleAddTimeSlot}
                  disabled={loading}
                  className="w-full mt-3 text-sm bg-indigo-100 text-indigo-700 py-2 rounded hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add Another Time Slot
                </button>

                {errors?.meetingTimes && (
                  <p className="text-xs text-red-700 mt-2">
                    {errors.meetingTimes}
                  </p>
                )}
              </div>
            )}

            {/* Step 4: Summary */}
            {currentStep === 4 && (
              <div className="space-y-5">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">Review & Confirm</p>
                  <p className="text-sm text-gray-600">Please check your details. If something is missing, go back and enter all data.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm font-semibold text-gray-900">Basic Info</p>
                    <div className="mt-2 space-y-1 text-sm text-gray-700">
                      <p><span className="font-medium">Group Name:</span> {formData.name || "—"}</p>
                      <p><span className="font-medium">Subject:</span> {formData.subject || "—"}</p>
                      <p><span className="font-medium">Max Members:</span> {formData.maxMembers || "—"}</p>
                      <p className="text-gray-600"><span className="font-medium text-gray-700">Description:</span> {formData.description?.trim() ? formData.description : "—"}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm font-semibold text-gray-900">Hall & Image</p>
                    <div className="mt-2 space-y-1 text-sm text-gray-700">
                      <p><span className="font-medium">Building:</span> {hallAllocation.building || "—"}</p>
                      <p><span className="font-medium">Floor:</span> {hallAllocation.floor || "—"}</p>
                      <p><span className="font-medium">Lab:</span> {hallAllocation.lab || "—"}</p>
                      <p><span className="font-medium">Image:</span> {imageFile ? "Uploaded file" : imageUrl ? "URL" : "Default"}</p>
                    </div>
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Group preview"
                        className="mt-3 h-24 w-full rounded-lg border border-gray-200 object-cover"
                      />
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-900">Meeting Times</p>
                  {meetingTimeSlots?.length ? (
                    <div className="mt-2 space-y-2">
                      {meetingTimeSlots.map((slot, idx) => (
                        <div key={idx} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                          <span className="font-medium">{slot.day || "—"}</span>
                          <span className="text-gray-600">
                            {slot.startTime ? formatTimeForDisplay(slot.startTime) : "—"} – {slot.endTime ? formatTimeForDisplay(slot.endTime) : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-600">—</p>
                  )}
                </div>
              </div>
            )}

          {/* Form Error */}
          {formError && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
              <InformationCircleIcon className="w-5 h-5 flex-shrink-0" />
              {formError}
            </div>
          )}

            {/* Buttons */}
            <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
              )}
              
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (currentStep === 4) return handleSubmit(e);
                  return handleNext(e);
                }}
                disabled={loading || (currentStep === 4 && meetingTimeSlots.length === 0)}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {loading ? "Creating..." : (currentStep === 4 ? "Create Group" : "Next")}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;