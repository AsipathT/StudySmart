import { useState } from "react";
import {
    LockClosedIcon,
    BellIcon,
    PaintBrushIcon,
    ShieldCheckIcon,
    CheckIcon,
    EyeIcon,
    EyeSlashIcon,
} from "@heroicons/react/24/outline";

const SettingsTab = ({ onChangePassword }) => {
    // ─── Password Change ───
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pwLoading, setPwLoading] = useState(false);
    const [pwError, setPwError] = useState("");
    const [pwSuccess, setPwSuccess] = useState("");

    // ─── Notification Preferences ───
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [friendRequests, setFriendRequests] = useState(true);
    const [groupInvites, setGroupInvites] = useState(true);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPwError("");
        setPwSuccess("");

        if (!currentPassword) {
            setPwError("Current password is required");
            return;
        }
        if (newPassword.length < 6) {
            setPwError("New password must be at least 6 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPwError("New passwords do not match");
            return;
        }

        setPwLoading(true);
        try {
            await onChangePassword({
                currentPassword,
                newPassword,
            });
            setPwSuccess("Password changed successfully!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => setPwSuccess(""), 3000);
        } catch (err) {
            setPwError(err.message || "Failed to change password");
        } finally {
            setPwLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Manage your account settings and preferences
                </p>
            </div>

            {/* Password Section */}
            <div className="p-6 mb-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500">
                        <LockClosedIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Change Password
                        </h2>
                        <p className="text-xs text-gray-500">
                            Update your password to keep your account secure
                        </p>
                    </div>
                </div>

                {pwSuccess && (
                    <div className="flex items-center gap-2 p-3 mb-4 text-sm font-medium text-green-700 border border-green-200 bg-green-50 rounded-xl">
                        <CheckIcon className="w-4 h-4" />
                        {pwSuccess}
                    </div>
                )}
                {pwError && (
                    <div className="p-3 mb-4 text-sm font-medium text-red-700 border border-red-200 bg-red-50 rounded-xl">
                        {pwError}
                    </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4">
                    {/* Current Password */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">
                            Current Password
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrent ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                className="w-full px-4 py-2.5 pr-10 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute text-gray-400 right-3 top-2.5 hover:text-gray-600"
                            >
                                {showCurrent ? (
                                    <EyeSlashIcon className="w-5 h-5" />
                                ) : (
                                    <EyeIcon className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showNew ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password (min 6 characters)"
                                className="w-full px-4 py-2.5 pr-10 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute text-gray-400 right-3 top-2.5 hover:text-gray-600"
                            >
                                {showNew ? (
                                    <EyeSlashIcon className="w-5 h-5" />
                                ) : (
                                    <EyeIcon className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirm ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className="w-full px-4 py-2.5 pr-10 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute text-gray-400 right-3 top-2.5 hover:text-gray-600"
                            >
                                {showConfirm ? (
                                    <EyeSlashIcon className="w-5 h-5" />
                                ) : (
                                    <EyeIcon className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={pwLoading}
                        className="w-full px-4 py-2.5 text-sm font-medium text-white transition-all rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 shadow-md"
                    >
                        {pwLoading ? "Changing Password..." : "Update Password"}
                    </button>
                </form>
            </div>

            {/* Notification Preferences */}
            <div className="p-6 mb-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                        <BellIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Notifications
                        </h2>
                        <p className="text-xs text-gray-500">
                            Choose what notifications you receive
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {[
                        {
                            label: "Email Notifications",
                            desc: "Receive email updates about your account",
                            value: emailNotifs,
                            setter: setEmailNotifs,
                        },
                        {
                            label: "Friend Requests",
                            desc: "Get notified when someone sends you a friend request",
                            value: friendRequests,
                            setter: setFriendRequests,
                        },
                        {
                            label: "Group Invites",
                            desc: "Get notified when you're invited to a study group",
                            value: groupInvites,
                            setter: setGroupInvites,
                        },
                    ].map(({ label, desc, value, setter }) => (
                        <div
                            key={label}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                        >
                            <div>
                                <p className="text-sm font-medium text-gray-900">{label}</p>
                                <p className="text-xs text-gray-500">{desc}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setter(!value)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? "bg-purple-600" : "bg-gray-300"
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? "translate-x-6" : "translate-x-1"
                                        }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Security Info */}
            <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
                        <ShieldCheckIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Account Security
                        </h2>
                        <p className="text-xs text-gray-500">
                            Your account security information
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs font-medium text-gray-500">
                            Account Status
                        </p>
                        <p className="mt-1 text-sm font-semibold text-emerald-600">
                            ● Active
                        </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs font-medium text-gray-500">
                            Two-Factor Auth
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-400">
                            Not enabled
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsTab;
