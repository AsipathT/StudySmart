import { useState } from "react";
import {
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  UserIcon,
  BookOpenIcon,
  HomeIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

const Sidebar = ({
  user,
  activeTab,
  setActiveTab,
  tabs,
  pendingRequests,
  groupInvitesList,
  myGroupsList,
  myFriendsList,
  getInitials,
  handleLogout,
  collapsed,
  setCollapsed,
  onProfileEdit,
}) => {
  const notificationCount =
    (pendingRequests?.length || 0) +
    (groupInvitesList?.length || 0);
  const API_BASE = "http://localhost:5000";

  // Divider index — items after this are in the "secondary" section
  const mainTabs = tabs;

  return (
    <>
      {/* ─── Desktop Sidebar ─── */}
      <div
        className={`fixed top-0 left-0 hidden h-full lg:flex flex-col border-r border-gray-200 bg-white z-50 transition-all duration-300 ease-in-out ${collapsed ? "w-20" : "w-72"
          }`}
      >
        {/* ─── Gradient Header ─── */}
        <div
          className={`relative overflow-hidden ${collapsed ? "px-2 pt-5 pb-4" : "px-6 pt-8 pb-6"
            }`}
          style={{
            background:
              "linear-gradient(135deg, #7c3aed 0%, #6366f1 40%, #818cf8 100%)",
          }}
        >
          {/* Decorative circles */}
          <div className="absolute rounded-full -top-6 -right-6 w-28 h-28 bg-white/10"></div>
          <div className="absolute w-16 h-16 rounded-full -bottom-4 -left-4 bg-white/10"></div>

          {collapsed ? (
            <div className="flex items-center justify-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
                <AcademicCapIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          ) : (
            <div className="relative z-10">
              <h1 className="text-xl font-bold tracking-wide text-white">
                StudyBuddy
              </h1>
              <p className="mt-0.5 text-xs font-medium text-purple-200">
                Learn together, grow together
              </p>
            </div>
          )}
        </div>

        {/* ─── User Profile Section ─── */}
        <div
          className={`flex flex-col items-center ${collapsed ? "px-2 py-4" : "px-6 py-5"
            } border-b border-gray-100`}
        >
          {/* Avatar */}
          <div
            className={`relative flex items-center justify-center rounded-full shadow-lg ring-4 ring-purple-100 ${collapsed ? "w-10 h-10 text-xs" : "w-16 h-16 text-lg"
              } font-bold text-white`}
            style={{
              background:
                "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
            }}
          >
            {user?.profileImage ? (
              <img
                src={`${API_BASE}${user.profileImage}`}
                alt={user?.name || "User"}
                className="object-cover w-full h-full rounded-full"
              />
            ) : (
              getInitials(user?.name)
            )}
            {/* Online indicator */}
            <span
              className={`absolute bottom-0 right-0 border-2 border-white rounded-full bg-emerald-400 ${collapsed ? "w-2.5 h-2.5" : "w-3.5 h-3.5"
                }`}
            ></span>
          </div>

          {!collapsed && (
            <div className="mt-3 text-center">
              <p className="text-sm font-semibold text-gray-900">
                {user?.name || "Student"}
              </p>
              <p className="text-xs text-gray-500">
                {user?.degree || "student"}
              </p>
            </div>
          )}
        </div>

        {/* ─── Main Navigation ─── */}
        <nav
          className={`flex-1 overflow-y-auto ${collapsed ? "px-2" : "px-3"
            } py-4 space-y-1`}
        >
          {mainTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group relative w-full flex items-center ${collapsed
                  ? "justify-center px-2 py-2.5"
                  : "px-4 py-2.5"
                } rounded-xl transition-all duration-200 ${activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md shadow-purple-200"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              title={collapsed ? tab.name : undefined}
            >
              <tab.icon
                className={`flex-shrink-0 ${collapsed ? "w-5 h-5" : "w-5 h-5"
                  } ${activeTab === tab.id
                    ? "text-white"
                    : "text-gray-400 group-hover:text-gray-600"
                  }`}
              />
              {!collapsed && (
                <span className="ml-3 text-sm font-medium">{tab.name}</span>
              )}
              {tab.id === "friends" && notificationCount > 0 && (
                <span
                  className={`flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full ${collapsed
                      ? "absolute -top-1 -right-1 w-4 h-4 text-[10px]"
                      : "ml-auto w-5 h-5"
                    }`}
                >
                  {notificationCount}
                </span>
              )}

              {/* Tooltip for collapsed mode */}
              {collapsed && (
                <div className="absolute z-50 invisible px-3 py-1.5 text-xs font-medium text-white rounded-lg opacity-0 left-full ml-3 bg-gray-900 whitespace-nowrap group-hover:visible group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                  {tab.name}
                  <div className="absolute w-2 h-2 rotate-45 -left-1 top-1/2 -translate-y-1/2 bg-gray-900"></div>
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* ─── Divider ─── */}
        <div className={`${collapsed ? "px-3" : "px-5"}`}>
          <div className="border-t border-gray-200"></div>
        </div>

        {/* ─── Secondary Actions ─── */}
        <div
          className={`${collapsed ? "px-2" : "px-3"} py-3 space-y-1`}
        >
          {/* Profile */}
          <button
            onClick={onProfileEdit}
            className={`group relative w-full flex items-center ${collapsed
                ? "justify-center px-2 py-2.5"
                : "px-4 py-2.5"
              } rounded-xl transition-all duration-200 ${activeTab === "profile"
                ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md shadow-purple-200"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            title={collapsed ? "Profile" : undefined}
          >
            <UserIcon className={`flex-shrink-0 w-5 h-5 ${activeTab === "profile" ? "text-white" : "text-gray-400 group-hover:text-gray-600"
              }`} />
            {!collapsed && (
              <span className="ml-3 text-sm font-medium">Profile</span>
            )}
            {collapsed && (
              <div className="absolute z-50 invisible px-3 py-1.5 text-xs font-medium text-white rounded-lg opacity-0 left-full ml-3 bg-gray-900 whitespace-nowrap group-hover:visible group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                Profile
                <div className="absolute w-2 h-2 rotate-45 -left-1 top-1/2 -translate-y-1/2 bg-gray-900"></div>
              </div>
            )}
          </button>

          {/* Settings */}
          <button
            onClick={() => setActiveTab("settings")}
            className={`group relative w-full flex items-center ${collapsed
                ? "justify-center px-2 py-2.5"
                : "px-4 py-2.5"
              } rounded-xl transition-all duration-200 ${activeTab === "settings"
                ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md shadow-purple-200"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            title={collapsed ? "Settings" : undefined}
          >
            <Cog6ToothIcon className={`flex-shrink-0 w-5 h-5 ${activeTab === "settings" ? "text-white" : "text-gray-400 group-hover:text-gray-600"
              }`} />
            {!collapsed && (
              <span className="ml-3 text-sm font-medium">Settings</span>
            )}
            {collapsed && (
              <div className="absolute z-50 invisible px-3 py-1.5 text-xs font-medium text-white rounded-lg opacity-0 left-full ml-3 bg-gray-900 whitespace-nowrap group-hover:visible group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                Settings
                <div className="absolute w-2 h-2 rotate-45 -left-1 top-1/2 -translate-y-1/2 bg-gray-900"></div>
              </div>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`group relative w-full flex items-center ${collapsed
                ? "justify-center px-2 py-2.5"
                : "px-4 py-2.5"
              } rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200`}
            title={collapsed ? "Logout" : undefined}
          >
            <ArrowRightOnRectangleIcon className="flex-shrink-0 w-5 h-5" />
            {!collapsed && (
              <span className="ml-3 text-sm font-medium">Logout</span>
            )}
            {collapsed && (
              <div className="absolute z-50 invisible px-3 py-1.5 text-xs font-medium text-white rounded-lg opacity-0 left-full ml-3 bg-gray-900 whitespace-nowrap group-hover:visible group-hover:opacity-100 transition-all duration-200 pointer-events-none">
                Logout
                <div className="absolute w-2 h-2 rotate-45 -left-1 top-1/2 -translate-y-1/2 bg-gray-900"></div>
              </div>
            )}
          </button>
        </div>

        {/* ─── Collapse Toggle ─── */}
        <div className="border-t border-gray-200">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full py-3 text-gray-400 transition-all duration-200 hover:text-gray-600 hover:bg-gray-50"
          >
            {collapsed ? (
              <ChevronRightIcon className="w-5 h-5" />
            ) : (
              <ChevronLeftIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* ─── Mobile Bottom Navigation ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden">
        <div className="flex justify-around px-2 py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-1.5 px-2 rounded-xl transition-all duration-200 relative ${activeTab === tab.id
                  ? "text-purple-600"
                  : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="mt-1 text-[10px] font-medium">
                {tab.name}
              </span>
              {tab.id === "friends" && notificationCount > 0 && (
                <span className="absolute w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full -top-1 -right-1 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center py-1.5 px-2 text-gray-500 hover:text-gray-700 rounded-xl transition-all duration-200"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span className="mt-1 text-[10px] font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;