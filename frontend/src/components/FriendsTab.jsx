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
    <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Friends & Invites</h2>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          ["myfriends", `My Friends (${myFriendsList.length})`],
          ["pending", <>Pending {pendingCount > 0 && <span className="inline-flex items-center justify-center w-5 h-5 ml-1 text-xs text-white bg-red-500 rounded-full">{pendingCount}</span>}</>],
          ["sent", `Sent (${sentRequestsList.length})`],
          ["groupinvites", <>Group Invites {groupInvitesList.length > 0 && <span className="inline-flex items-center justify-center w-5 h-5 ml-1 text-xs text-white bg-red-500 rounded-full">{groupInvitesList.length}</span>}</>],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setFriendsTab(k)}
            className={`px-4 py-2 rounded-lg font-medium transition text-sm flex items-center ${friendsTab === k ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{l}</button>
        ))}
      </div>

      {friendsError && <div className="p-3 mb-4 text-red-700 border border-red-200 rounded-lg bg-red-50">{friendsError}</div>}

      {friendsLoading ? <div className="py-8 text-center text-gray-500">Loading...</div> : (
        <>
          {/* My Friends */}
          {friendsTab === "myfriends" && (
            myFriendsList.length > 0 ? (
              <div className="space-y-3">
                {myFriendsList.map((f, idx) => (
                  <div key={f._id} className="flex items-center justify-between p-4 transition border border-gray-200 rounded-xl hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-11 h-11 rounded-xl text-white font-bold text-sm ${buddyColors[idx % buddyColors.length]}`}>{getInitials(f.name)}</div>
                      <div>
                        <p className="font-semibold text-gray-900">{f.name}</p>
                        <p className="text-sm text-gray-500">{f.email}</p>
                        {f.subjects?.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{f.subjects.slice(0, 3).map((s, i) => <span key={i} className="px-2 py-0.5 text-xs text-indigo-700 bg-indigo-100 rounded-full">{s}</span>)}</div>}
                      </div>
                    </div>
                    <button onClick={() => handleRemoveFriend(f.friendRequestId, f.name)} disabled={friendActionLoading === f.friendRequestId}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:bg-gray-100 transition">
                      {friendActionLoading === f.friendRequestId ? "..." : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <HeartIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No friends yet.</p>
                <button onClick={() => setActiveTab("findbuddies")} className="mt-2 text-sm font-medium text-indigo-600 hover:underline">Find study buddies to add as friends</button>
              </div>
            )
          )}

          {/* Pending requests (received) */}
          {friendsTab === "pending" && (
            pendingRequests.length > 0 ? (
              <div className="space-y-3">
                {pendingRequests.map((r) => (
                  <div key={r._id} className="flex items-center justify-between p-4 border border-amber-200 bg-amber-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center text-sm font-bold text-white w-11 h-11 rounded-xl bg-amber-500">{getInitials(r.from?.name)}</div>
                      <div>
                        <p className="font-semibold text-gray-900">{r.from?.name}</p>
                        <p className="text-sm text-gray-500">{r.from?.email}</p>
                        {r.from?.subjects?.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{r.from.subjects.slice(0, 3).map((s, i) => <span key={i} className="px-2 py-0.5 text-xs text-indigo-700 bg-indigo-100 rounded-full">{s}</span>)}</div>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAcceptFriend(r._id)} disabled={friendActionLoading === r._id}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition">
                        <CheckIcon className="w-4 h-4" />Accept
                      </button>
                      <button onClick={() => handleRejectFriend(r._id)} disabled={friendActionLoading === r._id}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition">
                        <XMarkIcon className="w-4 h-4" />Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center"><BellIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p className="text-gray-500">No pending friend requests.</p></div>
            )
          )}

          {/* Sent requests */}
          {friendsTab === "sent" && (
            sentRequestsList.length > 0 ? (
              <div className="space-y-3">
                {sentRequestsList.map((r) => (
                  <div key={r._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center text-sm font-bold text-white bg-indigo-500 w-11 h-11 rounded-xl">{getInitials(r.to?.name)}</div>
                      <div>
                        <p className="font-semibold text-gray-900">{r.to?.name}</p>
                        <p className="text-sm text-gray-500">{r.to?.email}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-100 rounded-lg">
                      <PaperAirplaneIcon className="w-4 h-4" />Pending
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center"><PaperAirplaneIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p className="text-gray-500">No sent requests.</p></div>
            )
          )}

          {/* Group Invites */}
          {friendsTab === "groupinvites" && (
            groupInvitesList.length > 0 ? (
              <div className="space-y-3">
                {groupInvitesList.map((inv) => (
                  <div key={inv._id} className="p-4 border border-teal-200 bg-teal-50 rounded-xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{inv.group?.name || "Unknown Group"}</p>
                        <p className="text-sm text-gray-600">📚 {inv.group?.subject}</p>
                        <p className="mt-1 text-xs text-gray-500">Invited by {inv.from?.name} ({inv.from?.email})</p>
                        {inv.group?.members && <p className="text-xs text-gray-500">👥 {inv.group.members.length}/{inv.group.maxMembers} members</p>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleAcceptGroupInvite(inv._id)} disabled={friendActionLoading === inv._id}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition">
                          <CheckIcon className="w-4 h-4" />Join
                        </button>
                        <button onClick={() => handleRejectGroupInvite(inv._id)} disabled={friendActionLoading === inv._id}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition">
                          <XMarkIcon className="w-4 h-4" />Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center"><EnvelopeIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p className="text-gray-500">No group invites.</p></div>
            )
          )}
        </>
      )}
    </div>
  );
};

export default FriendsTab;
