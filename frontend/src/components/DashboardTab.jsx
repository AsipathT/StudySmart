import React from 'react'
import { FlipWords } from '../ui/flip-words'
import { DirectionAwareHover } from '../ui/direction-aware-hover'
import {
  Users as UsersIcon,
  Search as SearchIcon,
  BookOpen as BookOpenIcon,
  GraduationCap as GraduationCapIcon,
  User as UserIcon,
  Mail as MailIcon,
  ChevronRight as ChevronRightIcon,
  AlertCircle as AlertCircleIcon,
  Bell as BellIcon,
  Check as CheckIcon,
  X as XIcon,
  SquarePen as PenSquareIcon,
  Loader2 as Loader2Icon,
} from 'lucide-react'

const API_BASE = "http://localhost:5000";
const DEFAULT_GROUP_IMAGE = "/image.png";

const getGroupImage = (img) => {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  return `${API_BASE}${img}`;
};

const getGroupImageSrc = (img) => getGroupImage(img) || DEFAULT_GROUP_IMAGE;


export const DashboardTab = ({
  user,
  dashLoading,
  dashError,
  greeting,
  myGroupsList,
  studyGroups,
  suggestedBuddies,
  friendStatusMap,
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
  myFriendsList,
  renderFriendButton,
}) => {
  if (dashLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Loader2Icon className="w-10 h-10 mb-4 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium">
          Loading your learning dashboard...
        </p>
      </div>
    )
  }
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
  const hasSharedGroupSuggestions = suggestedBuddies?.some((b) => b.sharedGroups && b.sharedGroups.length > 0)

  const availabilitySlots = (user?.availableTime ?? []).filter(
    (s) => s && typeof s === 'object' && s.day && s.startTime && s.endTime
  )

  const friendIdSet = new Set(
    (myFriendsList ?? []).map((f) => ((f?._id || f?.id || f?.userId || f?.user?._id || f?.user?.id) ?? "").toString())
  )
  const nonFriendSuggestions = (suggestedBuddies ?? []).filter((b) => {
    const buddyId = ((b?._id || b?.id) ?? "").toString()
    if (!buddyId) return false
    if (friendIdSet.has(buddyId)) return false
    const relStatus = friendStatusMap?.[buddyId]?.status
    if (relStatus === 'accepted' || relStatus === 'pending') return false
    return true
  })

  const flipWords = ['better', 'cute', 'beautiful', 'modern']
  return (
    <div className="space-y-8">
      {dashError && (
        <div className="flex items-center p-4 space-x-3 text-red-700 border border-red-200 bg-red-50 rounded-xl">
          <AlertCircleIcon className="flex-shrink-0 w-5 h-5" />
          <p className="text-sm font-medium">{dashError}</p>
        </div>
      )}

      {/* 1. Welcome Banner */}
      <div className="relative p-8 overflow-hidden bg-white border border-indigo-100 shadow-sm rounded-3xl lg:p-10">
        <img
          src="/SLIIT-malabe.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 z-0 w-full h-full object-cover blur-[1px] scale-105"
          loading="lazy"
          draggable={false}
        />
        {/* Softer background + stronger blur behind text area (linear fade) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-white/25" />
          <div
            className="absolute inset-y-0 left-0 w-full sm:w-2/3 lg:w-1/2 bg-white/55 backdrop-blur-xl"
            style={{
              WebkitMaskImage:
                'linear-gradient(to right, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
              maskImage:
                'linear-gradient(to right, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-indigo-700 rounded-full bg-indigo-100/80">
            {currentDate}
          </div>
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-gray-900 lg:text-4xl">
            {greeting}, {user?.name?.split(' ')[0] || 'Student'}!
          </h1>

          <div className="mb-4 text-xl leading-snug text-gray-700 group">
            Build
            <FlipWords
              words={flipWords}
              className="group-hover:text-indigo-800"
            />
            study sessions with Study Buddy
          </div>

          <p className="mb-8 text-lg leading-relaxed text-gray-600">
            Ready for another productive day? You have{' '}
            <span className="font-semibold text-indigo-600">
              {myGroupsList.length} active groups
            </span>{' '}
            and{' '}
            <span className="font-semibold text-indigo-600">
              {pendingRequests.length} pending requests
            </span>
            .
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('studygroups')}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white transition-colors bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm"
            >
              <UsersIcon className="w-4 h-4" />
              Browse Groups
            </button>
            <button
              onClick={() => setActiveTab('findbuddies')}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-indigo-700 transition-colors bg-white border border-indigo-200 rounded-xl hover:bg-indigo-50 shadow-sm"
            >
              <SearchIcon className="w-4 h-4" />
              Find Buddies
            </button>
          </div>
        </div>
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 z-0 w-64 h-64 -mt-20 -mr-20 rounded-full pointer-events-none bg-gradient-to-br from-indigo-200/40 to-violet-200/40 blur-3xl" />
        <div className="absolute bottom-0 z-0 w-48 h-48 -mb-20 rounded-full pointer-events-none right-40 bg-gradient-to-br from-sky-200/40 to-indigo-200/40 blur-3xl" />
      </div>

      {/*  */}

      {/* 2. Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: 'Total Groups',
            value: studyGroups.length,
            icon: UsersIcon,
            color: 'indigo',
          },
          {
            label: 'My Groups',
            value: myGroupsList.length,
            icon: BookOpenIcon,
            color: 'violet',
          },
          {
            label: 'My Subjects',
            value: user?.subjects?.length || 0,
            icon: GraduationCapIcon,
            color: 'sky',
          },
          {
            label: 'Buddies Found',
            value: suggestedBuddies.length,
            icon: UserIcon,
            color: 'emerald',
          },
        ].map((stat, i) => {
          const tintStyles = {
            indigo: 'from-indigo-900/70 via-indigo-600/25',
            violet: 'from-violet-900/70 via-violet-600/25',
            sky: 'from-sky-900/70 via-sky-600/25',
            emerald: 'from-emerald-900/70 via-emerald-600/25',
          }
          return (
            <DirectionAwareHover
              key={i}
              imageUrl="/SLIIT-malabe.jpg"
              tintClassName={tintStyles[stat.color]}
              className="h-28 sm:h-32"
              staticContent={
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold tracking-wide text-gray-600 uppercase truncate">
                      {stat.label}
                    </p>
                    <p className="mt-1.5 text-3xl font-extrabold text-gray-900 tabular-nums">
                      {stat.value}
                    </p>
                  </div>
                  <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-gray-900 border border-gray-200 rounded-xl bg-white/80">
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
              }
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-wide uppercase truncate text-white/90">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-3xl font-extrabold text-white tabular-nums">
                    {stat.value}
                  </p>
                </div>
                <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 border rounded-xl border-white/20 bg-white/10">
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </DirectionAwareHover>
          )
        })}
      </div>

      {/* 3. Two-column row: Profile Card + Suggested Buddies */}
      <div className="grid items-start w-full grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile Card */}
        <div className="w-full">
          <div className="flex flex-col overflow-hidden bg-white border shadow-sm border-gray-200/80 rounded-2xl">
          <div className="relative h-20 bg-gradient-to-r from-indigo-500 to-violet-600">
            <button
              onClick={openProfileEdit}
              className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm transition-colors"
              aria-label="Edit Profile"
            >
              <PenSquareIcon className="w-3 h-3" />
            </button>
          </div>
          <div className="relative z-10 flex flex-col items-center px-4 pb-4 -mt-10 text-center">
            <div className="w-20 h-20 p-1 mb-3 bg-white rounded-full shadow-sm">
              <div className="flex items-center justify-center w-full h-full overflow-hidden text-2xl font-bold text-indigo-600 border rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 border-indigo-200/50">
                {user?.profileImage ? (
                  <img src={`${API_BASE}${user.profileImage}`} alt={user?.name} className="object-cover w-full h-full" />
                ) : (
                  getInitials(user?.name)
                )}
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-0.5">
              {user?.name || 'Student'}
            </h3>
            <p className="mb-1 text-xs font-medium text-indigo-600">
              {user?.degree || 'Degree Program'}
            </p>
            <div className="flex items-center justify-center gap-4 mb-3 text-[10px] text-gray-500">
              <span className="inline-flex items-center">
                <MailIcon className="w-3 h-3 mr-1" />
                {user?.email || '—'}
              </span>
              <span className="inline-flex items-center">
                <span className="font-semibold text-gray-700">Year</span>
                <span className="ml-1">{user?.year || '—'}</span>
              </span>
            </div>

            <div className="w-full mb-4">
              <div className="flex flex-wrap justify-center gap-2">
                {(user?.subjects || []).slice(0, 3).map((s, idx) => (
                  <span
                    key={`sub-${idx}-${s}`}
                    className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 rounded-full"
                    title={s}
                  >
                    {s}
                  </span>
                ))}
                {availabilitySlots.slice(0, 2).map((slot, idx) => (
                  <span
                    key={`av-${idx}-${slot.day}-${slot.startTime}-${slot.endTime}`}
                    className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold text-violet-700 bg-violet-50 rounded-full"
                    title={`${slot.day}: ${slot.startTime} - ${slot.endTime}`}
                  >
                    {slot.day} • {slot.startTime}-{slot.endTime}
                  </span>
                ))}
              </div>

              {(user?.subjects?.length ?? 0) === 0 && availabilitySlots.length === 0 && (
                <p className="mt-3 text-[11px] text-gray-500">
                  Add subjects and availability in Profile to get better buddy and group suggestions.
                </p>
              )}
            </div>

            <div className="grid w-full grid-cols-3 gap-1 pt-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-base font-bold text-gray-900">
                  {myGroupsList.length}
                </p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                  Groups
                </p>
              </div>
              <div className="text-center border-gray-100 border-x">
                <p className="text-lg font-bold text-gray-900">
                  {myFriendsList?.length || 0}
                </p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                  Friends
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">
                  {suggestedBuddies.length}
                </p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                  Buddies
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Suggested Buddies */}
        <div className="w-full">
          <div className="relative flex flex-col overflow-hidden shadow-sm rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-400">
            {/* Dotted corner accents */}
            <div className="absolute top-6 left-6 grid grid-cols-4 gap-1.5 opacity-60 pointer-events-none">
              {Array.from({ length: 16 }).map((_, i) => (
                <span key={`tl-${i}`} className="w-1.5 h-1.5 bg-white/35 rounded-full" />
              ))}
            </div>
            <div className="absolute bottom-6 right-6 grid grid-cols-4 gap-1.5 opacity-60 pointer-events-none">
              {Array.from({ length: 16 }).map((_, i) => (
                <span key={`br-${i}`} className="w-1.5 h-1.5 bg-white/35 rounded-full" />
              ))}
            </div>

            <div className="relative z-10 p-4">
              <div className="w-full border shadow-xl bg-white/95 backdrop-blur-sm border-white/70 rounded-2xl">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        People you may know
                      </h3>
                      <p className="text-[11px] text-gray-500">
                        {hasSharedGroupSuggestions
                          ? 'Based on your study groups'
                          : 'Based on your interests'}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('findbuddies')}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Find more
                    </button>
                  </div>

                  {nonFriendSuggestions.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-sm font-medium text-gray-700">
                        No suggestions yet
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Join or create study groups to discover new buddies.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {nonFriendSuggestions.slice(0, 4).map((buddy) => (
                        <div
                          key={buddy._id || buddy.id}
                          className="flex items-center justify-between py-2.5"
                        >
                          <div className="flex items-center min-w-0 gap-3">
                            <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 overflow-hidden text-sm font-bold text-indigo-700 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100">
                              {buddy.profileImage ? (
                                <img
                                  src={`${API_BASE}${buddy.profileImage}`}
                                  alt={buddy.name}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                getInitials(buddy.name)
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {buddy.name}
                              </p>
                              {buddy.sharedGroups && buddy.sharedGroups.length > 0 ? (
                                <p className="text-xs text-gray-500 truncate">
                                  {buddy.sharedGroups.length} shared group{buddy.sharedGroups.length !== 1 ? 's' : ''}
                                </p>
                              ) : (
                                <p className="text-xs text-gray-500 truncate">
                                  {buddy.degree || buddy.subjects?.slice(0, 2).join(', ') || 'Student'}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex-shrink-0 ml-3">
                            {renderFriendButton
                              ? renderFriendButton(buddy._id || buddy.id)
                              : (
                                <button
                                  onClick={() => setActiveTab('findbuddies')}
                                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                  Add Friend
                                </button>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. My Study Groups */}
      <div className="flex flex-col overflow-hidden bg-white border shadow-sm border-gray-200/80 rounded-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50">
              <BookOpenIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                My Study Groups
              </h3>
              <p className="text-sm text-gray-500">
                {myGroupsList.length} active groups
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {myGroupsList.length === 0 ? (
            <div className="py-8 text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50">
                <UsersIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="mb-1 text-sm font-medium text-gray-900">
                You haven't joined any groups yet
              </p>
              <button
                onClick={() => setActiveTab('studygroups')}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Browse study groups
              </button>
            </div>
          ) : (
            <div className="flex gap-5 pb-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
              {myGroupsList.slice(0, 4).map((group) => {
                const memberCount = group.members?.length || 0
                const maxMembers = group.maxMembers || 10
                const fillPercentage = (memberCount / maxMembers) * 100
                const isFull = memberCount >= maxMembers
                return (
                  <div
                    key={group._id}
                    className="flex flex-col flex-shrink-0 w-64 overflow-hidden transition-all bg-white border cursor-pointer border-gray-200/80 rounded-xl hover:border-indigo-200 hover:shadow-md"
                    onClick={() => setActiveTab('studygroups')}
                  >
                    <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500" />
                    <div className="relative flex items-center justify-center h-24 overflow-hidden border-b border-gray-100 bg-gradient-to-br from-indigo-50 to-violet-50">
                      <img
                        src={getGroupImageSrc(group.image)}
                        onError={(e) => {
                          if (e.currentTarget.src.endsWith(DEFAULT_GROUP_IMAGE)) return;
                          e.currentTarget.src = DEFAULT_GROUP_IMAGE;
                        }}
                        alt={group.name}
                        className="object-cover w-full h-full"
                        loading="lazy"
                        draggable={false}
                      />
                      <span
                        className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full ${isFull ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}
                      >
                        {isFull ? 'Full' : 'Active'}
                      </span>
                    </div>
                    <div className="flex flex-col flex-1 p-4">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-semibold text-indigo-700 bg-indigo-50 rounded-md mb-2 w-fit">
                        {group.subject}
                      </span>
                      <h4 className="mb-1 text-sm font-bold text-gray-900 line-clamp-1">
                        {group.name}
                      </h4>
                      <p className="mb-4 text-xs text-gray-500 line-clamp-1">
                        {group.description || 'No description provided.'}
                      </p>
                      <div className="mt-auto">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                          <span className="font-medium">Members</span>
                          <span>
                            {memberCount} / {maxMembers}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                          <div
                            className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : 'bg-indigo-500'}`}
                            style={{
                              width: `${Math.min(fillPercentage, 100)}%`,
                            }}
                          />
                        </div>
                        <button className="w-full py-2 text-xs font-semibold text-indigo-600 transition-colors rounded-lg bg-indigo-50 hover:bg-indigo-100">
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
              {myGroupsList.length > 4 && (
                <div className="flex items-center justify-center flex-shrink-0 w-64">
                  <button
                    onClick={() => setActiveTab('studygroups')}
                    className="flex flex-col items-center justify-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50">
                      <ChevronRightIcon className="w-6 h-6" />
                    </div>
                    View all {myGroupsList.length}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. Active Study Groups */}
      <div className="flex flex-col overflow-hidden bg-white border shadow-sm border-gray-200/80 rounded-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-50">
              <SearchIcon className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Browse Study Groups
              </h3>
              <p className="text-sm text-gray-500">
                {studyGroups.length} groups available
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {studyGroups.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-gray-900">
                No study groups available yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {studyGroups.slice(0, 4).map((group) => {
                const uid = user?._id || user?.id
                const isMember = group.members?.some(
                  (m) => (m._id || m).toString() === uid,
                )
                const memberCount = group.members?.length || 0
                const capacity = group.maxMembers || 10
                const isFull = memberCount >= capacity
                return (
                  <div
                    key={group._id}
                    className="flex items-center justify-between p-4 transition-all border border-gray-100 rounded-xl hover:border-indigo-200 hover:shadow-sm"
                  >
                    <div className="flex items-center flex-1 min-w-0 gap-4 pr-4">
                      {/* Group Image Mini Thumbnail */}
                      <div className="flex-shrink-0 w-12 h-12 overflow-hidden border border-gray-100 rounded-lg bg-indigo-50">
                        <img
                          src={getGroupImageSrc(group.image)}
                          onError={(e) => {
                            if (e.currentTarget.src.endsWith(DEFAULT_GROUP_IMAGE)) return;
                            e.currentTarget.src = DEFAULT_GROUP_IMAGE;
                          }}
                          alt={group.name}
                          className="object-cover w-full h-full"
                          loading="lazy"
                          draggable={false}
                        />
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 text-[10px] font-semibold text-violet-700 bg-violet-50 rounded-md">
                          {group.subject}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full ${isMember ? 'bg-indigo-100 text-indigo-700' : isFull ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}
                        >
                          {isMember ? 'Joined' : isFull ? 'Full' : 'Open'}
                        </span>
                      </div>
                      <h4 className="mb-1 text-sm font-bold text-gray-900 truncate">
                        {group.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <UsersIcon className="w-3.5 h-3.5" />
                        <span>
                          {memberCount} / {capacity} members
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('studygroups')}
                      className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-gray-400 transition-colors rounded-full bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
          {studyGroups.length > 4 && (
            <button
              onClick={() => setActiveTab('studygroups')}
              className="w-full py-3 mt-4 text-sm font-medium text-indigo-600 transition-colors bg-indigo-50/50 rounded-xl hover:bg-indigo-50"
            >
              View all {studyGroups.length} groups
            </button>
          )}
        </div>
      </div>

      {/* 6. Notifications */}
      {(pendingRequests.length > 0 || groupInvitesList.length > 0) && (
        <div className="flex flex-col overflow-hidden bg-white border shadow-sm border-gray-200/80 rounded-2xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <BellIcon className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                  Notifications
                  <span className="px-2 py-0.5 text-xs font-bold text-white bg-amber-500 rounded-full">
                    {pendingRequests.length + groupInvitesList.length}
                  </span>
                </h3>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('findbuddies')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              View all
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
            {pendingRequests.length > 0 && (
              <div>
                <h4 className="mb-3 text-sm font-bold text-gray-900">
                  Friend Requests
                </h4>
                <div className="space-y-3">
                  {pendingRequests.slice(0, 3).map((req) => (
                    <div
                      key={req._id}
                      className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50/50"
                    >
                      <div className="flex items-center min-w-0 gap-3">
                        <div className="flex items-center justify-center flex-shrink-0 overflow-hidden text-xs font-bold text-indigo-700 bg-indigo-100 rounded-full w-9 h-9">
                          {req.from?.profileImage ? (
                            <img src={`${API_BASE}${req.from.profileImage}`} alt={req.from?.name} className="object-cover w-full h-full" />
                          ) : (
                            getInitials(req.from?.name)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {req.from?.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {req.from?.subjects?.slice(0, 2).join(', ') ||
                              req.from?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                        <button
                          onClick={() => handleAcceptFriend(req._id)}
                          disabled={friendActionLoading === req._id}
                          className="p-1.5 text-emerald-700 bg-emerald-100 rounded-lg hover:bg-emerald-200 disabled:opacity-50 transition-colors"
                          aria-label="Accept"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRejectFriend(req._id)}
                          disabled={friendActionLoading === req._id}
                          className="p-1.5 text-red-700 bg-red-100 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
                          aria-label="Reject"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {groupInvitesList.length > 0 && (
              <div>
                <h4 className="mb-3 text-sm font-bold text-gray-900">
                  Group Invites
                </h4>
                <div className="space-y-3">
                  {groupInvitesList.slice(0, 3).map((inv) => (
                    <div
                      key={inv._id}
                      className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50/50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {inv.group?.name || 'Unknown Group'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          Invited by {inv.from?.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                        <button
                          onClick={() => handleAcceptGroupInvite(inv._id)}
                          disabled={friendActionLoading === inv._id}
                          className="p-1.5 text-emerald-700 bg-emerald-100 rounded-lg hover:bg-emerald-200 disabled:opacity-50 transition-colors"
                          aria-label="Accept"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRejectGroupInvite(inv._id)}
                          disabled={friendActionLoading === inv._id}
                          className="p-1.5 text-red-700 bg-red-100 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
                          aria-label="Reject"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardTab;