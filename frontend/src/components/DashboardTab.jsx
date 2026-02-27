import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  AcademicCapIcon,
  UserIcon,
  ChevronRightIcon,
  ExclamationCircleIcon,
  PencilSquareIcon,
  LightBulbIcon,
  BellIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const DashboardTab = ({
  user,
  dashLoading,
  dashError,
  greeting,
  myGroupsList,
  studyGroups,
  suggestedBuddies,
  pendingRequests,
  groupInvitesList,
  friendActionLoading,
  setActiveTab,
  setFriendsTab,
  openProfileEdit,
  handleAcceptFriend,
  handleRejectFriend,
  handleAcceptGroupInvite,
  handleRejectGroupInvite,
  getInitials,
  groupColors,
  buddyColors,
}) => {
  if (dashLoading) {
    return (
      <div className="py-12 text-center text-gray-500">
        <div className="w-10 h-10 mx-auto mb-3 border-4 border-indigo-200 rounded-full border-t-indigo-600 animate-spin" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <>
      {dashError && (
        <div className="flex items-center p-4 mb-6 space-x-3 text-red-700 border border-red-200 bg-red-50 rounded-xl">
          <ExclamationCircleIcon className="flex-shrink-0 w-5 h-5" />
          <p className="text-sm">{dashError}</p>
        </div>
      )}

     {/* Welcome Section with Realistic Image */}
      <div className="relative overflow-hidden rounded-3xl h-[280px] lg:h-[320px] group">
        {/* Background Image */}
        <img 
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2071&q=80" 
          alt="Students studying together"
          className="absolute inset-0 object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-800/90 to-transparent" />
        
        {/* Content */}
        <div className="absolute inset-0 flex items-center p-8 lg:p-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 text-xs font-semibold text-white border rounded-full bg-white/20 backdrop-blur-sm border-white/30">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <h1 className="mb-3 text-3xl font-bold text-white lg:text-4xl">
              {greeting}, {user?.name?.split(" ")[0] || "Student"}!
            </h1>
            <p className="mb-6 text-lg text-white/90">
              Ready for another productive day? You have {myGroupsList.length} active groups and {pendingRequests.length} pending requests.
            </p>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => setActiveTab("studygroups")}
                className="flex items-center gap-2 px-6 py-3 font-semibold text-white transition-all bg-indigo-600 rounded-xl hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/25"
              >
                <UserGroupIcon className="w-5 h-5" />
                Browse Groups
              </button>
              <button 
                onClick={() => setActiveTab("findbuddies")}
                className="flex items-center gap-2 px-6 py-3 font-semibold text-white transition-all border bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 border-white/30"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
                Find Buddies
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        {[
          { label: "Total Groups", value: studyGroups.length, icon: UserGroupIcon, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
          { label: "My Groups", value: myGroupsList.length, icon: BookOpenIcon, iconBg: "bg-green-100", iconColor: "text-green-600" },
          { label: "My Subjects", value: user?.subjects?.length || 0, icon: AcademicCapIcon, iconBg: "bg-purple-100", iconColor: "text-purple-600" },
          { label: "Buddies Found", value: suggestedBuddies.length, icon: UserIcon, iconBg: "bg-orange-100", iconColor: "text-orange-600" },
        ].map((s, i) => (
          <div key={i} className="p-5 transition-shadow bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-md">
            <div className={`p-2.5 ${s.iconBg} rounded-xl w-fit mb-3`}><s.icon className={`w-5 h-5 ${s.iconColor}`} /></div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {/* My Groups preview */}
          <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">My Study Groups</h3>
              <button onClick={() => setActiveTab("mygroups")} className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800">View all<ChevronRightIcon className="w-4 h-4 ml-1" /></button>
            </div>
            {myGroupsList.length === 0 ? (
              <div className="py-8 text-center">
                <UserGroupIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">You haven&apos;t joined any groups yet.</p>
                <button onClick={() => setActiveTab("studygroups")} className="mt-3 text-sm font-medium text-indigo-600 hover:underline">Browse study groups</button>
              </div>
            ) : (
              <div className="space-y-3">
                {myGroupsList.slice(0, 4).map((g, i) => (
                  <div key={g._id} onClick={() => setActiveTab("mygroups")} className="flex items-center p-4 transition-all cursor-pointer bg-gray-50 rounded-xl hover:bg-gray-100">
                    <div className={`flex items-center justify-center w-11 h-11 rounded-xl text-white font-bold text-sm ${groupColors[i % groupColors.length]}`}>{g.name?.charAt(0)?.toUpperCase()}</div>
                    <div className="flex-1 min-w-0 ml-3">
                      <p className="font-semibold text-gray-900 truncate">{g.name}</p>
                      <p className="text-xs text-gray-500">{g.subject}</p>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-gray-400">
                      <span className="flex items-center space-x-1"><UserGroupIcon className="w-4 h-4" /><span>{g.members?.length || 0}/{g.maxMembers || 10}</span></span>
                      <ChevronRightIcon className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All groups preview */}
          <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Active Study Groups</h3>
              <button onClick={() => setActiveTab("studygroups")} className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800">View all<ChevronRightIcon className="w-4 h-4 ml-1" /></button>
            </div>
            {studyGroups.length === 0 ? (
              <div className="py-8 text-center"><UserGroupIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p className="text-gray-500">No study groups yet.</p></div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {studyGroups.slice(0, 4).map((g, i) => {
                  const uid = user?._id || user?.id;
                  const isMember = g.members?.some((m) => (m._id || m).toString() === uid);
                  return (
                    <div key={g._id} className="p-4 transition-all border border-gray-100 rounded-xl hover:border-indigo-200 hover:shadow-md">
                      <div className="flex items-start space-x-3">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-lg text-white font-bold text-sm flex-shrink-0 ${groupColors[i % groupColors.length]}`}>{g.name?.charAt(0)?.toUpperCase()}</div>
                        <div className="flex-1 min-w-0"><h4 className="font-semibold text-gray-900 truncate">{g.name}</h4><p className="text-xs text-gray-500">{g.subject}</p></div>
                      </div>
                      {g.description && <p className="mt-2 text-xs text-gray-400 line-clamp-2">{g.description}</p>}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-1 text-xs text-gray-400"><UserGroupIcon className="w-3.5 h-3.5" /><span>{g.members?.length || 0}/{g.maxMembers || 10}</span></div>
                        {isMember ? <span className="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">Joined</span> : <span className="px-2 py-0.5 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-full">Open</span>}
                      </div>
                      <div className="mt-2 text-xs text-gray-400">Created by {g.creator?.name || "Unknown"}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Profile */}
          <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">My Profile</h3>
              <button onClick={openProfileEdit} className="flex items-center px-3 py-1.5 text-sm font-medium text-indigo-600 transition-all border border-indigo-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-700">
                <PencilSquareIcon className="w-4 h-4 mr-1" />Edit
              </button>
            </div>
            <div className="space-y-3">
              {[["Name", user?.name], ["Email", user?.email], ["Degree", user?.degree], ["Year", user?.year]].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm"><span className="text-gray-500">{l}</span><span className="ml-4 font-medium text-gray-900 truncate">{v || "-"}</span></div>
              ))}
              {user?.subjects?.length > 0 && <div><p className="mb-2 text-sm text-gray-500">Subjects</p><div className="flex flex-wrap gap-1.5">{user.subjects.map((s, i) => <span key={i} className="px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-full">{s}</span>)}</div></div>}
              {user?.availableTime && <div><p className="mb-2 text-sm text-gray-500">Availability</p><div className="flex flex-wrap gap-1.5">
                {user.availableTime.weekdays && <span className="px-2 py-1 text-xs font-medium rounded-full text-emerald-700 bg-emerald-50">Weekdays</span>}
                {user.availableTime.weekend && <span className="px-2 py-1 text-xs font-medium rounded-full text-emerald-700 bg-emerald-50">Weekend</span>}
                {user.availableTime.morning && <span className="px-2 py-1 text-xs font-medium rounded-full text-emerald-700 bg-emerald-50">Morning</span>}
                {user.availableTime.evening && <span className="px-2 py-1 text-xs font-medium rounded-full text-emerald-700 bg-emerald-50">Evening</span>}
              </div></div>}
            </div>
          </div>

          {/* Pending Friend Requests & Group Invites */}
          {(pendingRequests.length > 0 || groupInvitesList.length > 0) && (
            <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                  <BellIcon className="w-5 h-5 text-red-500" />
                  Notifications
                  <span className="flex items-center justify-center w-6 h-6 text-xs text-white bg-red-500 rounded-full">{pendingRequests.length + groupInvitesList.length}</span>
                </h3>
                <button onClick={() => setActiveTab("friends")} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">View all</button>
              </div>

              {pendingRequests.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Friend Requests</p>
                  <div className="space-y-2">
                    {pendingRequests.slice(0, 3).map((r) => (
                      <div key={r._id} className="flex items-center justify-between p-3 border border-amber-200 bg-amber-50 rounded-xl">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center text-xs font-bold text-white rounded-lg w-9 h-9 bg-amber-500">{getInitials(r.from?.name)}</div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{r.from?.name}</p>
                            <p className="text-xs text-gray-500">{r.from?.subjects?.slice(0, 2).join(", ") || r.from?.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => handleAcceptFriend(r._id)} disabled={friendActionLoading === r._id}
                            className="p-1.5 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition">
                            <CheckIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleRejectFriend(r._id)} disabled={friendActionLoading === r._id}
                            className="p-1.5 text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition">
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {pendingRequests.length > 3 && <button onClick={() => setActiveTab("friends")} className="w-full py-1.5 text-xs font-medium text-indigo-600 hover:underline">+{pendingRequests.length - 3} more requests</button>}
                  </div>
                </div>
              )}

              {groupInvitesList.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Group Invites</p>
                  <div className="space-y-2">
                    {groupInvitesList.slice(0, 3).map((inv) => (
                      <div key={inv._id} className="flex items-center justify-between p-3 border border-teal-200 bg-teal-50 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{inv.group?.name || "Unknown Group"}</p>
                          <p className="text-xs text-gray-500">From {inv.from?.name}</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => handleAcceptGroupInvite(inv._id)} disabled={friendActionLoading === inv._id}
                            className="p-1.5 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition">
                            <CheckIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleRejectGroupInvite(inv._id)} disabled={friendActionLoading === inv._id}
                            className="p-1.5 text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition">
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {groupInvitesList.length > 3 && <button onClick={() => { setActiveTab("friends"); setFriendsTab("groupinvites"); }} className="w-full py-1.5 text-xs font-medium text-indigo-600 hover:underline">+{groupInvitesList.length - 3} more invites</button>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Buddies */}
          <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-bold text-gray-900">Suggested Buddies</h3><button onClick={() => setActiveTab("findbuddies")} className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Find more</button></div>
            {suggestedBuddies.length === 0 ? (
              <div className="py-6 text-center"><UserIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" /><p className="text-sm text-gray-500">{user?.subjects?.length > 0 ? "No buddies found." : "Add subjects to find buddies."}</p></div>
            ) : (
              <div className="space-y-3">{suggestedBuddies.map((b, i) => (
                <div key={b._id} className="flex items-center p-3 transition-all rounded-xl hover:bg-gray-50">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl text-white font-bold text-sm ${buddyColors[i % buddyColors.length]}`}>{getInitials(b.name)}</div>
                  <div className="flex-1 min-w-0 ml-3"><p className="text-sm font-medium text-gray-900 truncate">{b.name}</p><p className="text-xs text-gray-400 truncate">{b.subjects?.join(", ") || "No subjects"}</p></div>
                </div>
              ))}</div>
            )}
          </div>

          {/* Tip */}
          <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl">
            <div className="flex items-center mb-3 space-x-2"><LightBulbIcon className="w-5 h-5 text-white" /><h4 className="font-bold text-white">Pro Tip</h4></div>
            <p className="text-sm text-indigo-100">Break your study sessions into 25-minute focused intervals with 5-minute breaks. The Pomodoro technique can improve retention by up to 40%.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardTab;
