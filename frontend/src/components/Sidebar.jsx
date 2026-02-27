import {
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  UserIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
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
}) => {
  const notificationCount = pendingRequests.length + groupInvitesList.length;

  return (
    <>
      {/* ─── Desktop Sidebar ─── */}
      <div className="fixed top-0 left-0 hidden h-full border-r shadow-xl bg-gradient-to-b from-slate-900 to-slate-800 border-slate-700 w-72 lg:block">
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="flex items-center mb-8 space-x-3">
            <div className="p-2.5 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/30">
              <AcademicCapIcon className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">StudyBuddy</h1>
              <p className="text-xs text-slate-400">Learn together</p>
            </div>
          </div>

          {/* User Card */}
          <div className="p-4 mb-6 transition-all duration-300 border bg-slate-800/50 border-slate-700 backdrop-blur-sm rounded-2xl hover:bg-slate-800">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 text-sm font-bold text-white shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-indigo-500/30">
                {getInitials(user?.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">
                  {user?.name || "Student"}
                </p>
                <p className="text-xs truncate text-slate-400">
                  {user?.degree || "Student"}{" "}
                  {user?.year ? `• Year ${user.year}` : ""}
                </p>
                {user?.subjects?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.subjects.slice(0, 2).map((s, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-300 rounded-full"
                      >
                        {s}
                      </span>
                    ))}
                    {user.subjects.length > 2 && (
                      <span className="text-[10px] text-slate-500">
                        +{user.subjects.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex-1 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <tab.icon className={`w-5 h-5 ${
                  activeTab === tab.id ? "text-white" : "text-slate-400 group-hover:text-white"
                }`} />
                <span className="text-sm font-medium">{tab.name}</span>
                {tab.id === "friends" && notificationCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 ml-auto text-xs font-bold text-white bg-red-500 rounded-full shadow-lg shadow-red-500/30">
                    {notificationCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Bottom stats */}
          <div className="p-4 border bg-slate-800/50 border-slate-700 backdrop-blur-sm rounded-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="mb-1 text-xs text-slate-400">My Groups</p>
                <p className="text-2xl font-bold text-white">
                  {myGroupsList.length}
                </p>
                <div className="w-8 h-0.5 bg-indigo-500/50 mx-auto mt-1 rounded-full"></div>
              </div>
              <div className="text-center">
                <p className="mb-1 text-xs text-slate-400">Friends</p>
                <p className="text-2xl font-bold text-white">
                  {myFriendsList.length}
                </p>
                <div className="w-8 h-0.5 bg-indigo-500/50 mx-auto mt-1 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile Bottom Nav ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t shadow-lg bg-gradient-to-t from-slate-900 to-slate-800 border-slate-700 lg:hidden">
        <div className="flex justify-around px-1 py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center px-2 py-1.5 relative rounded-lg transition-all duration-200 ${
                activeTab === tab.id 
                  ? "text-indigo-400 bg-indigo-500/10" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-medium">
                {tab.name}
              </span>
              {tab.id === "friends" && notificationCount > 0 && (
                <span className="absolute w-4 h-4 text-[8px] font-bold text-white bg-red-500 rounded-full -top-1 -right-1 flex items-center justify-center shadow-lg shadow-red-500/30">
                  {notificationCount}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center px-2 py-1.5 text-slate-400 hover:text-slate-200 rounded-lg transition-all duration-200"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;