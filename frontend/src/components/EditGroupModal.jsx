import { useState, useEffect } from "react";
import StaticTimePickerLandscape from "./StaticTimePickerLandscape";

const EditGroupModal = ({ isOpen, group, onClose, onUpdateGroup, loading }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    subject: "",
    maxMembers: 10,
  });

  const [meetingTimeSlots, setMeetingTimeSlots] = useState([]);
  const [imageData, setImageData] = useState({ file: null, preview: null });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [openTimePicker, setOpenTimePicker] = useState({ index: null, type: null });

  // Initialize when group changes
  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || "",
        description: group.description || "",
        subject: group.subject || "",
        maxMembers: group.maxMembers || 10,
      });
      setMeetingTimeSlots(
        group.meetingTimes && group.meetingTimes.length > 0
          ? group.meetingTimes
          : [
              {
                startTime: "10:00",
                endTime: "12:00",
                day: "Monday",
              },
            ]
      );
      // Set existing image if available
      const backendUrl = 'http://localhost:5000';
      if (group.image) {
        setImageData({ file: null, preview: `${backendUrl}${group.image}` });
      } else {
        setImageData({ file: null, preview: null });
      }
      setErrors({});
      setFormError("");
    }
  }, [group, isOpen]);

  if (!isOpen || !group) return null;

  const validate = () => {
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

    return nextErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "maxMembers" ? (value === "" ? "" : Number(value)) : value,
    }));

    setFormError("");
    setErrors((prev) => {
      if (!prev?.[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'Please select an image file' }));
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Image size must be less than 5MB' }));
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageData({ file, preview: e.target.result });
        setErrors(prev => ({ ...prev, image: null }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageData({ file: null, preview: null });
    setErrors(prev => ({ ...prev, image: null }));
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
        startTime: "10:00",
        endTime: "12:00",
        day: "Monday",
      },
    ]);
  };

  const handleRemoveTimeSlot = (index) => {
    if (meetingTimeSlots.length > 1) {
      setMeetingTimeSlots(meetingTimeSlots.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    setFormError("");

    if (Object.keys(nextErrors).length > 0) return;

    // Create FormData for file upload
    const formDataWithFile = new FormData();
    formDataWithFile.append('name', formData.name);
    formDataWithFile.append('description', formData.description);
    formDataWithFile.append('subject', formData.subject);
    formDataWithFile.append('maxMembers', formData.maxMembers.toString());
    formDataWithFile.append('meetingTimes', JSON.stringify(meetingTimeSlots));
    
    if (imageData.file) {
      formDataWithFile.append('image', imageData.file);
    }

    await onUpdateGroup(formDataWithFile);
  };

  const inputBase =
    "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed";

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50 p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-group-title"
    >
      <div className="min-h-full flex items-start sm:items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 shrink-0">
            <h3
              id="edit-group-title"
              className="text-xl font-bold text-gray-900"
            >
              Edit Study Group
            </h3>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="text-gray-500 hover:text-gray-700 text-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LEFT COLUMN */}
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
                    placeholder="e.g., Math Study Group"
                    aria-invalid={Boolean(errors?.name)}
                    aria-describedby={errors?.name ? "group-name-error" : undefined}
                    className={`${inputBase} ${
                      errors?.name ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {errors?.name && (
                    <p id="group-name-error" className="text-xs text-red-700 mt-1">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="e.g., Mathematics, Physics"
                    aria-invalid={Boolean(errors?.subject)}
                    aria-describedby={errors?.subject ? "subject-error" : undefined}
                    className={`${inputBase} ${
                      errors?.subject ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                  {errors?.subject && (
                    <p id="subject-error" className="text-xs text-red-700 mt-1">
                      {errors.subject}
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

                {/* Group Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Image (Optional)
                  </label>
                  
                  {imageData.preview ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <img
                          src={imageData.preview}
                          alt="Group preview"
                          className="w-full h-32 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          disabled={loading}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 disabled:opacity-50"
                        >
                          ×
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => document.getElementById('edit-group-image-upload').click()}
                        disabled={loading}
                        className="w-full text-sm bg-indigo-100 text-indigo-700 py-2 rounded hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Change Image
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label
                        htmlFor="edit-group-image-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg
                            className="w-8 h-8 mb-2 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                          <p className="mb-1 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</p>
                        </div>
                      </label>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={loading}
                    className="hidden"
                    id="edit-group-image-upload"
                  />
                  
                  {errors?.image && (
                    <p className="text-xs text-red-700 mt-1">{errors.image}</p>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-4">
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
                    className={`${inputBase} ${
                      errors?.maxMembers ? "border-red-300" : "border-gray-300"
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
              </div>
            </div>

            {/* MEETING TIMES WITH CLOCK PICKER */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Meeting Times <span className="text-red-500">*</span>
              </label>

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

                    {/* Start Time & End Time with MUI Picker */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Time
                        </label>
                        <button
                          type="button"
                          onClick={() => setOpenTimePicker({ index, type: 'start' })}
                          disabled={loading}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-indigo-400 disabled:bg-gray-50 disabled:cursor-not-allowed text-left bg-white"
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
                                &times;
                              </button>
                              <StaticTimePickerLandscape
                                value={slot.startTime || "09:00"}
                                onChange={(newTime) => {
                                  handleTimeSlotChange(index, "startTime", newTime);
                                  setOpenTimePicker({ index: null, type: null });
                                }}
                                label="Select Start Time"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* End Time with MUI Picker */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Time
                        </label>
                        <button
                          type="button"
                          onClick={() => setOpenTimePicker({ index, type: 'end' })}
                          disabled={loading}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-indigo-400 disabled:bg-gray-50 disabled:cursor-not-allowed text-left bg-white"
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
                                &times;
                              </button>
                              <StaticTimePickerLandscape
                                value={slot.endTime || "11:00"}
                                onChange={(newTime) => {
                                  handleTimeSlotChange(index, "endTime", newTime);
                                  setOpenTimePicker({ index: null, type: null });
                                }}
                                label="Select End Time"
                              />
                            </div>
                          </div>
                        )}
                      </div>
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

            {/* Form Error */}
            {formError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {formError}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {loading ? "Updating..." : "Update Group"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditGroupModal;
