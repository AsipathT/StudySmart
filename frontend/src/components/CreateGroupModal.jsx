
import { useState } from "react";
import { createStudyGroup } from "../services/studyGroupService";

const INITIAL_FORM_DATA = {
  name: "",
  description: "",
  subject: "",
  maxMembers: 10,
  meetingTime: {
    weekdays: false,
    weekend: false,
    morning: false,
    evening: false,
  },
};

const CreateGroupModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");

  // Dont render if modal is closed
  if (!isOpen) {
    return null;
  }

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

    const { weekdays, weekend, morning, evening } = data.meetingTime;
    if (!weekdays && !weekend && !morning && !evening) {
      nextErrors.meetingTime = "Please select at least one meeting time";
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

  const handleCheckboxChange = (field) => {
    setFormData((prev) => ({
      ...prev,
      meetingTime: {
        ...prev.meetingTime,
        [field]: !prev.meetingTime[field],
      },
    }));

    setFormError("");
    setErrors((prev) => {
      if (!prev?.meetingTime) return prev;
      const next = { ...prev };
      delete next.meetingTime;
      return next;
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = validate(formData);
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      await createStudyGroup(formData);
      alert("Study group created successfully!");

      setFormData(INITIAL_FORM_DATA);
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
    setErrors({});
    setFormError("");
    onClose();
  };
  const inputBase =
    "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed";

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50 p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-group-title"
    >
      <div className="min-h-full flex items-start sm:items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 shrink-0">
            <h3 id="create-group-title" className="text-xl font-bold text-gray-900">
              Create Study Group
            </h3>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="text-gray-500 hover:text-gray-700 text-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className={`${inputBase} ${errors?.name ? "border-red-300" : "border-gray-300"}`}
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
                    className={`${inputBase} ${errors?.subject ? "border-red-300" : "border-gray-300"}`}
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
              </div>

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
                    aria-describedby={errors?.maxMembers ? "max-members-error" : "max-members-hint"}
                    className={`${inputBase} ${errors?.maxMembers ? "border-red-300" : "border-gray-300"}`}
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

                {/* Meeting Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Time <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.meetingTime.weekdays}
                        onChange={() => handleCheckboxChange("weekdays")}
                        disabled={loading}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-700">Weekdays</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.meetingTime.weekend}
                        onChange={() => handleCheckboxChange("weekend")}
                        disabled={loading}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-700">Weekend</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.meetingTime.morning}
                        onChange={() => handleCheckboxChange("morning")}
                        disabled={loading}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-700">Morning</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.meetingTime.evening}
                        onChange={() => handleCheckboxChange("evening")}
                        disabled={loading}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-700">Evening</span>
                    </label>
                  </div>
                  {errors?.meetingTime ? (
                    <p className="text-xs text-red-700 mt-1">{errors.meetingTime}</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">Select at least one</p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Error */}
            {formError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {formError}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={handleClose}
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
                {loading ? "Creating..." : "Create Group"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;