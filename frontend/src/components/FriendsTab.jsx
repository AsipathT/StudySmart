import {
  HeartIcon,
  EnvelopeIcon,
  CheckIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

const FriendsTab = ({
  friendsTab,
  setFriendsTab,
  myFriendsList,
  pendingRequests,
  sentRequestsList,
  groupInvitesList,
  friendsLoading,
  friendsError,
  friendActionLoading,
  setActiveTab,
  handleAcceptFriend,
  handleRejectFriend,
  handleRemoveFriend,
  handleAcceptGroupInvite,
  handleRejectGroupInvite,
  getInitials,
  buddyColors,
}) => {
  const pendingCount = pendingRequests.length + groupInvitesList.length;

  return (
    <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Friends & Invites</h2>
            <p className="mt-1 text-sm text-gray-600">Manage your friends, requests, and group invites.</p>
          </div>

          {pendingCount > 0 && (
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{pendingCount}</span> pending
            </div>
          )}
        </div>

        <div className="mt-5">
          <div className="p-1 bg-gray-100 border border-gray-200 rounded-2xl">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <button
                type="button"
                onClick={() => setFriendsTab("myfriends")}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  friendsTab === "myfriends"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-gray-700 hover:bg-white/70"
                }`}
              >
                My Friends
                <span className={`text-xs font-bold ${friendsTab === "myfriends" ? "text-indigo-700" : "text-gray-600"}`}>
                  ({myFriendsList.length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFriendsTab("pending")}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  friendsTab === "pending"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-gray-700 hover:bg-white/70"
                }`}
              >
                Pending
                {pendingCount > 0 && (
                  <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setFriendsTab("sent")}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  friendsTab === "sent" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-700 hover:bg-white/70"
                }`}
              >
                Sent
                <span className={`text-xs font-bold ${friendsTab === "sent" ? "text-indigo-700" : "text-gray-600"}`}>
                  ({sentRequestsList.length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFriendsTab("groupinvites")}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  friendsTab === "groupinvites"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-gray-700 hover:bg-white/70"
                }`}
              >
                Group Invites
                {groupInvitesList.length > 0 && (
                  <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
                    {groupInvitesList.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {friendsError && (
          <div className="p-4 mb-6 border border-red-200 bg-red-50 rounded-2xl">
            <p className="text-sm font-semibold text-red-800">Something went wrong</p>
            <p className="mt-1 text-sm text-red-700">{friendsError}</p>
          </div>
        )}

        {friendsLoading ? (
          <div className="p-8 text-center border border-gray-200 bg-gray-50 rounded-2xl">
            <div className="text-sm font-medium text-gray-700">Loading…</div>
            <div className="mt-1 text-xs text-gray-500">Fetching your friends and requests.</div>
          </div>
        ) : (
          <>
            {/* My Friends */}
            {friendsTab === "myfriends" &&
              (myFriendsList.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {myFriendsList.map((f, idx) => (
                    <div
                      key={f._id}
                      className="flex items-start justify-between gap-3 p-4 transition bg-white border border-gray-200 rounded-2xl hover:border-indigo-200 hover:shadow-sm"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`flex items-center justify-center w-12 h-12 rounded-2xl text-white font-bold text-sm overflow-hidden flex-shrink-0 ${
                            buddyColors[idx % buddyColors.length]
                          }`}
                        >
                          {f.profileImage ? (
                            <img
                              src={`http://localhost:5000${f.profileImage}`}
                              alt={f.name}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            getInitials(f.name)
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{f.name}</p>
                          <p className="text-sm text-gray-500 truncate">{f.email}</p>
                          {f.subjects?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {f.subjects.slice(0, 3).map((s, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-full"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFriend(f.friendRequestId, f.name)}
                        disabled={friendActionLoading === f.friendRequestId}
                        className="px-3 py-2 text-sm font-semibold text-red-600 transition border border-red-200 rounded-xl hover:bg-red-50 disabled:bg-gray-100"
                      >
                        {friendActionLoading === f.friendRequestId ? "…" : "Remove"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center border border-gray-200 bg-gray-50 rounded-2xl">
                  <HeartIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-semibold text-gray-800">No friends yet</p>
                  <p className="mt-1 text-sm text-gray-600">Find study buddies and send a friend request.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("findbuddies")}
                    className="inline-flex items-center justify-center px-4 py-2 mt-4 text-sm font-semibold text-white transition bg-indigo-600 rounded-xl hover:bg-indigo-700"
                  >
                    Go to Find Buddies
                  </button>
                </div>
              ))}

            {/* Pending requests (received) */}
            {friendsTab === "pending" &&
              (pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {pendingRequests.map((r) => (
                    <div key={r._id} className="p-4 border border-amber-200 bg-amber-50 rounded-2xl">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center justify-center overflow-hidden text-sm font-bold text-white w-12 h-12 rounded-2xl bg-amber-500 flex-shrink-0">
                            {r.from?.profileImage ? (
                              <img
                                src={`http://localhost:5000${r.from.profileImage}`}
                                alt={r.from?.name}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              getInitials(r.from?.name)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{r.from?.name}</p>
                            <p className="text-sm text-gray-600 truncate">{r.from?.email}</p>
                            {r.from?.subjects?.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {r.from.subjects.slice(0, 3).map((s, i) => (
                                  <span
                                    key={i}
                                    className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-full"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleAcceptFriend(r._id)}
                            disabled={friendActionLoading === r._id}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white transition bg-green-600 rounded-xl hover:bg-green-700 disabled:bg-gray-400"
                          >
                            <CheckIcon className="w-4 h-4" />
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectFriend(r._id)}
                            disabled={friendActionLoading === r._id}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white transition bg-red-500 rounded-xl hover:bg-red-600 disabled:bg-gray-400"
                          >
                            <XMarkIcon className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center border border-gray-200 bg-gray-50 rounded-2xl">
                  <BellIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-semibold text-gray-800">No pending friend requests</p>
                  <p className="mt-1 text-sm text-gray-600">New requests will show up here.</p>
                </div>
              ))}

            {/* Sent requests */}
            {friendsTab === "sent" &&
              (sentRequestsList.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {sentRequestsList.map((r) => (
                    <div key={r._id} className="flex items-center justify-between gap-3 p-4 bg-white border border-gray-200 rounded-2xl">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center justify-center overflow-hidden text-sm font-bold text-white bg-indigo-500 w-12 h-12 rounded-2xl flex-shrink-0">
                          {r.to?.profileImage ? (
                            <img
                              src={`http://localhost:5000${r.to.profileImage}`}
                              alt={r.to?.name}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            getInitials(r.to?.name)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{r.to?.name}</p>
                          <p className="text-sm text-gray-500 truncate">{r.to?.email}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-amber-800 bg-amber-100 rounded-xl">
                        <PaperAirplaneIcon className="w-4 h-4" />
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center border border-gray-200 bg-gray-50 rounded-2xl">
                  <PaperAirplaneIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-semibold text-gray-800">No sent requests</p>
                  <p className="mt-1 text-sm text-gray-600">Requests you send will appear here.</p>
                </div>
              ))}

            {/* Group Invites */}
            {friendsTab === "groupinvites" &&
              (groupInvitesList.length > 0 ? (
                <div className="space-y-4">
                  {groupInvitesList.map((inv) => (
                    <div key={inv._id} className="p-4 border border-teal-200 bg-teal-50 rounded-2xl">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{inv.group?.name || "Unknown Group"}</p>
                          <p className="mt-1 text-sm text-gray-700">Subject: {inv.group?.subject || "—"}</p>
                          <p className="mt-1 text-xs text-gray-600">
                            Invited by {inv.from?.name} ({inv.from?.email})
                          </p>
                          {inv.group?.members && (
                            <p className="mt-1 text-xs text-gray-600">
                              Members: {inv.group.members.length}/{inv.group.maxMembers}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleAcceptGroupInvite(inv._id)}
                            disabled={friendActionLoading === inv._id}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white transition bg-green-600 rounded-xl hover:bg-green-700 disabled:bg-gray-400"
                          >
                            <CheckIcon className="w-4 h-4" />
                            Join
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectGroupInvite(inv._id)}
                            disabled={friendActionLoading === inv._id}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white transition bg-red-500 rounded-xl hover:bg-red-600 disabled:bg-gray-400"
                          >
                            <XMarkIcon className="w-4 h-4" />
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center border border-gray-200 bg-gray-50 rounded-2xl">
                  <EnvelopeIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-semibold text-gray-800">No group invites</p>
                  <p className="mt-1 text-sm text-gray-600">Invites to join study groups will appear here.</p>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
};

export default FriendsTab;
