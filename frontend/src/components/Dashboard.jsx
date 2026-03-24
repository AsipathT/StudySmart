import { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import {
  getAllStudyGroups,
  searchStudyGroupsBySubject,
  searchStudyGroupsByAvailability,
  joinStudyGroup,
  getStudyGroupById,
  updateStudyGroup,
  deleteStudyGroup,
  leaveStudyGroup,
} from "../services/studyGroupService";
import {
  getAllStudents,
  searchStudentsBySubject,
  searchStudentsByAvailability,
  updateProfile,
  uploadProfileImage,
} from "../services/userService";
import {
  sendFriendRequest as sendFriendReq,
  acceptFriendRequest as acceptFriendReq,
  rejectFriendRequest as rejectFriendReq,
  getMyFriends,
  getPendingRequests,
  getSentRequests,
  removeFriend,
  getFriendStatuses,
} from "../services/friendService";
import {
  sendGroupInvite,
  acceptGroupInvite,
  rejectGroupInvite,
  getMyGroupInvites,
} from "../services/groupInviteService";
import Sidebar from "./Sidebar";
import DashboardTab from "./DashboardTab";
import StudyGroupsTab from "./StudyGroupsTab";
import MyGroupsTab from "./MyGroupsTab";
import FindBuddiesTab from "./FindBuddiesTab";
import FriendsTab from "./FriendsTab";
import ProfileTab from "./ProfileTab";
import SettingsTab from "./SettingsTab";
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  BookOpenIcon,
  HomeIcon,
  HeartIcon,
  CheckIcon,
  XMarkIcon,
  UserPlusIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";

const Dashboard = () => {
  const { user, logout, isAdmin, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ─── Dashboard tab data ──────────────────────────
  const [studyGroups, setStudyGroups] = useState([]);
  const [myGroupsList, setMyGroupsList] = useState([]);
  const [suggestedBuddies, setSuggestedBuddies] = useState([]);
  const [dashLoading, setDashLoading] = useState(true);
  const [dashError, setDashError] = useState(null);

  // ─── Study Groups tab data ───────────────────────
  const [sgSearchType, setSgSearchType] = useState("all");
  const [sgSubject, setSgSubject] = useState("");
  const [sgMeetingTime, setSgMeetingTime] = useState({
    day: "",
    startTime: "",
    endTime: "",
  });
  const [sgGroups, setSgGroups] = useState([]);
  const [sgLoading, setSgLoading] = useState(false);
  const [sgError, setSgError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinLoading, setJoinLoading] = useState(null);

  // ─── My Groups tab data ──────────────────────────
  const [mgCreated, setMgCreated] = useState([]);
  const [mgJoined, setMgJoined] = useState([]);
  const [mgLoading, setMgLoading] = useState(true);
  const [mgError, setMgError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [mgActionLoading, setMgActionLoading] = useState(null);

  // ─── Invite friends to group ─────────────────────
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteGroupId, setInviteGroupId] = useState(null);
  const [inviteFriends, setInviteFriends] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSending, setInviteSending] = useState(null);

  // ─── Find Buddies tab data ────────────────────────
  const [fbSearchType, setFbSearchType] = useState("all");
  const [fbSubject, setFbSubject] = useState("");
  const [fbAvailableTime, setFbAvailableTime] = useState({
    weekdays: false, weekend: false, morning: false, evening: false,
  });
  const [fbStudents, setFbStudents] = useState([]);
  const [fbLoading, setFbLoading] = useState(false);
  const [fbError, setFbError] = useState("");
  const [fbHasSearched, setFbHasSearched] = useState(false);
  const [friendStatusMap, setFriendStatusMap] = useState({});
  const [frActionLoading, setFrActionLoading] = useState(null);

  // ─── Friends tab data ─────────────────────────────
  const [friendsTab, setFriendsTab] = useState("myfriends");
  const [myFriendsList, setMyFriendsList] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequestsList, setSentRequestsList] = useState([]);
  const [groupInvitesList, setGroupInvitesList] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState("");
  const [friendActionLoading, setFriendActionLoading] = useState(null);

  // ─── Profile state ──────────────────────────────
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");


  // ─── Helpers ──────────────────────────────────────
  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };
  const groupColors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-orange-500", "bg-pink-500", "bg-cyan-500"];
  const buddyColors = ["bg-indigo-500", "bg-teal-500", "bg-rose-500", "bg-amber-500", "bg-violet-500"];

  const formatTime = (d) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const formatDate = (d) => d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  // ─── Greeting & clock ─────────────────────────────
  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // ─── Dashboard data fetch ────────────────────────
  const fetchDashboardData = useCallback(async () => {
    setDashLoading(true);
    setDashError(null);
    try {
      const groupsRes = await getAllStudyGroups();
      const all = groupsRes.studyGroups || [];
      setStudyGroups(all);
      const uid = (user?._id || user?.id || "").toString();

      // Build my groups list from all groups
      const myGroups = all.filter((g) =>
        g.members?.some((m) => ((m._id || m.id || m) || "").toString() === uid)
      );
      setMyGroupsList(myGroups);

      // ── Suggest buddies from same study groups ──
      let buddySuggestions = [];
      try {
        // Load all students so we have full profile data
        const studentsRes = await getAllStudents();
        const allStudents = studentsRes.users || [];

        if (myGroups.length > 0 && allStudents.length > 0) {
          const suggestionsMap = new Map();

          allStudents.forEach((student) => {
            const sid = (student._id || student.id || "").toString();
            if (!sid || sid === uid) return; // skip self / invalid ids

            // Find groups this student shares with the current user
            const sharedGroups = myGroups.filter((g) =>
              g.members?.some((m) => ((m._id || m.id || m) || "").toString() === sid)
            );

            if (sharedGroups.length > 0) {
              const existing = suggestionsMap.get(sid);
              const payload = {
                ...student,
                sharedGroups: sharedGroups.map((g) => ({
                  _id: g._id,
                  name: g.name,
                  subject: g.subject,
                })),
              };
              suggestionsMap.set(sid, existing ? { ...existing, ...payload } : payload);
            }
          });

          buddySuggestions = Array.from(suggestionsMap.values());
        }
      } catch (e) {
        console.error("Failed to build same-group buddy suggestions", e);
      }

      // Fallback: if no same-group buddies, use subject-based suggestions as before
      if (buddySuggestions.length === 0 && user?.subjects?.length > 0) {
        try {
          const b = await searchStudentsBySubject(user.subjects[0]);
          buddySuggestions = (b.users || []).slice(0, 5);
        } catch {
          buddySuggestions = [];
        }
      }

      setSuggestedBuddies(buddySuggestions.slice(0, 8));
      // Load pending friend requests & group invites for dashboard
      try {
        const [pData, giData] = await Promise.all([getPendingRequests(), getMyGroupInvites()]);
        setPendingRequests(pData.requests || []);
        setGroupInvitesList(giData.invites || []);
      } catch { /* ignore */ }
    } catch (err) {
      console.error(err);
      setDashError("Failed to load data.");
    } finally { setDashLoading(false); }
  }, [user]);

  useEffect(() => { if (user) fetchDashboardData(); }, [user, fetchDashboardData]);

  // ─── Study Groups helpers ────────────────────────
  const sgLoadAll = useCallback(async () => {
    setSgLoading(true); setSgError("");
    try { const d = await getAllStudyGroups(); setSgGroups(d.studyGroups); }
    catch (e) { setSgError(e.message || "Failed to load groups"); }
    finally { setSgLoading(false); }
  }, []);

  const sgSearchBySubject = async (e) => {
    e.preventDefault();
    if (!sgSubject.trim()) { setSgError("Please enter a subject"); return; }
    setSgLoading(true); setSgError("");
    try { const d = await searchStudyGroupsBySubject(sgSubject); setSgGroups(d.studyGroups); }
    catch (e) { setSgError(e.message || "Search failed"); }
    finally { setSgLoading(false); }
  };

  const sgAdvancedSearch = async (e) => {
    e.preventDefault();
    setSgLoading(true); setSgError("");
    try {
      const day = sgMeetingTime?.day || undefined;
      const startTime = sgMeetingTime?.startTime || undefined;
      const endTime = sgMeetingTime?.endTime || undefined;

      const d = await searchStudyGroupsByAvailability({
        subject: sgSubject || undefined,
        day,
        startTime,
        endTime,
      });
      setSgGroups(d.studyGroups);
    }
    catch (e) { setSgError(e.message || "Search failed"); }
    finally { setSgLoading(false); }
  };

  const handleJoinGroup = async (id) => {
    setJoinLoading(id); setSgError("");
    try {
      await joinStudyGroup(id);
      toast.success("Successfully joined the group!");
      sgLoadAll();
      fetchDashboardData();
    } catch (e) { setSgError(e.message || "Failed to join"); }
    finally { setJoinLoading(null); }
  };

  useEffect(() => { if (activeTab === "studygroups") sgLoadAll(); }, [activeTab, sgLoadAll]);

  // ─── My Groups helpers ───────────────────────────
  const loadMyGroups = useCallback(async () => {
    setMgLoading(true); setMgError("");
    try {
      const d = await getAllStudyGroups();
      const all = d.studyGroups;
      const uid = user?._id || user?.id;
      setMgCreated(all.filter((g) => g.creator?._id === uid || g.creator?.id === uid));
      setMgJoined(all.filter((g) => g.members?.some((m) => (m._id === uid || m.id === uid)) && g.creator?._id !== uid && g.creator?.id !== uid));
    } catch (e) { setMgError(e.message || "Failed to load"); }
    finally { setMgLoading(false); }
  }, [user]);

  useEffect(() => { if (activeTab === "mygroups") loadMyGroups(); }, [activeTab, loadMyGroups]);

  const mgViewDetails = async (id) => {
    setMgActionLoading(id);
    try { const d = await getStudyGroupById(id); setSelectedGroup(d.studyGroup || d); setShowDetailsModal(true); }
    catch (e) { setMgError(e.message || "Failed to load details"); }
    finally { setMgActionLoading(false); }
  };

  const mgOpenEdit = (g) => {
    setSelectedGroup(g);
    setEditFormData({
      name: g.name,
      description: g.description || "",
      subject: g.subject,
      maxMembers: g.maxMembers,
      meetingTimes: g.meetingTimes && Array.isArray(g.meetingTimes) ? [...g.meetingTimes] : [],
      hallAllocation: g.hallAllocation ? {
        building: g.hallAllocation.building || "",
        floor: g.hallAllocation.floor || "",
        lab: g.hallAllocation.lab || "",
      } : {
        building: "",
        floor: "",
        lab: "",
      },
      image: g.image || "",
    });
    setShowEditModal(true);
  };

  const mgUpdate = async (formData) => {
    setMgActionLoading(selectedGroup._id);
    setMgError("");
    try {
      await updateStudyGroup(selectedGroup._id, formData);
      toast.success("Updated!");
      setShowEditModal(false);
      loadMyGroups();
      fetchDashboardData();
    } catch (e) {
      setMgError(e.message || "Update failed");
    } finally {
      setMgActionLoading(null);
    }
  };

  const mgDelete = async (id, name) => {
    setMgActionLoading(id); setMgError("");
    try { await deleteStudyGroup(id); toast.success("Deleted!"); loadMyGroups(); fetchDashboardData(); }
    catch (e) { setMgError(e.message || "Delete failed"); }
    finally { setMgActionLoading(null); }
  };

  const mgLeave = async (id, name) => {
    if (!window.confirm(`Leave "${name}"?`)) return;
    setMgActionLoading(id); setMgError("");
    try { await leaveStudyGroup(id); toast.success("Left group!"); loadMyGroups(); fetchDashboardData(); }
    catch (e) { setMgError(e.message || "Leave failed"); }
    finally { setMgActionLoading(null); }
  };

  // ─── Invite friends to group ─────────────────────
  const openInviteModal = async (groupId) => {
    setInviteGroupId(groupId);
    setInviteLoading(true);
    setShowInviteModal(true);
    try {
      const data = await getMyFriends();
      // Get group to filter out existing members
      const gData = await getStudyGroupById(groupId);
      const group = gData.studyGroup || gData;
      const memberIds = (group.members || []).map((m) => (m._id || m).toString());
      const available = (data.friends || []).filter((f) => !memberIds.includes(f._id.toString()));
      setInviteFriends(available);
    } catch (e) { console.error(e); setInviteFriends([]); }
    finally { setInviteLoading(false); }
  };

  const handleSendInvite = async (friendId) => {
    setInviteSending(friendId);
    try {
      await sendGroupInvite(inviteGroupId, friendId);
      toast.success("Invite sent!");
      setInviteFriends((prev) => prev.filter((f) => f._id !== friendId));
    } catch (e) { toast.error(e.message || "Failed to send invite"); }
    finally { setInviteSending(null); }
  };

  // ─── Find Buddies helpers ────────────────────────
  const loadFriendStatuses = useCallback(async () => {
    try {
      const data = await getFriendStatuses();
      setFriendStatusMap(data.statusMap || {});
    } catch { setFriendStatusMap({}); }
  }, []);

  const fbLoadAll = useCallback(async () => {
    setFbLoading(true); setFbError("");
    try {
      const d = await getAllStudents();
      setFbStudents(d.users || []);
      setFbHasSearched(true);
    } catch (e) { setFbError(e.message || "Failed to load students"); }
    finally { setFbLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === "findbuddies") {
      loadFriendStatuses();
      if (fbSearchType === "all") fbLoadAll();
    }
  }, [activeTab, fbSearchType, loadFriendStatuses, fbLoadAll]);

  // Also load friend statuses once so dashboard suggestions can show correct buttons
  useEffect(() => {
    loadFriendStatuses();
  }, [loadFriendStatuses]);

  const fbSimpleSearch = async (e) => {
    e.preventDefault();
    if (!fbSubject.trim()) { setFbError("Enter a subject"); return; }
    setFbLoading(true); setFbError(""); setFbHasSearched(false);
    try { const d = await searchStudentsBySubject(fbSubject); setFbStudents(d.users); setFbHasSearched(true); }
    catch (e) { setFbError(e.message || "Search failed"); }
    finally { setFbLoading(false); }
  };

  const fbAdvancedSearch = async (e) => {
    e.preventDefault();
    if (!fbSubject.trim()) { setFbError("Enter a subject"); return; }
    setFbLoading(true); setFbError(""); setFbHasSearched(false);
    try { const d = await searchStudentsByAvailability({ subject: fbSubject, availableTime: fbAvailableTime }); setFbStudents(d.users); setFbHasSearched(true); }
    catch (e) { setFbError(e.message || "Search failed"); }
    finally { setFbLoading(false); }
  };

  const handleSendFriendRequest = async (userId) => {
    setFrActionLoading(userId);
    try {
      await sendFriendReq(userId);
      setFriendStatusMap((prev) => ({ ...prev, [userId]: { status: "pending", direction: "sent" } }));
    } catch (e) { toast.error(e.message || "Failed to send request"); }
    finally { setFrActionLoading(null); }
  };

  // ─── Friends tab helpers ──────────────────────────
  const loadFriendsData = useCallback(async () => {
    setFriendsLoading(true); setFriendsError("");
    try {
      const [fData, pData, sData, giData] = await Promise.all([
        getMyFriends(),
        getPendingRequests(),
        getSentRequests(),
        getMyGroupInvites(),
      ]);
      setMyFriendsList(fData.friends || []);
      setPendingRequests(pData.requests || []);
      setSentRequestsList(sData.requests || []);
      setGroupInvitesList(giData.invites || []);
    } catch (e) { setFriendsError(e.message || "Failed to load"); }
    finally { setFriendsLoading(false); }
  }, []);

  // Load friends once so dashboard can filter out existing friends
  useEffect(() => {
    if (user) loadFriendsData();
  }, [user, loadFriendsData]);

  useEffect(() => { if (activeTab === "friends") loadFriendsData(); }, [activeTab, loadFriendsData]);

  const handleAcceptFriend = async (requestId) => {
    setFriendActionLoading(requestId);
    try { await acceptFriendReq(requestId); loadFriendsData(); loadFriendStatuses(); fetchDashboardData(); }
    catch (e) { setFriendsError(e.message || "Failed"); }
    finally { setFriendActionLoading(null); }
  };

  const handleRejectFriend = async (requestId) => {
    setFriendActionLoading(requestId);
    try { await rejectFriendReq(requestId); loadFriendsData(); loadFriendStatuses(); fetchDashboardData(); }
    catch (e) { setFriendsError(e.message || "Failed"); }
    finally { setFriendActionLoading(null); }
  };

  const handleRemoveFriend = async (requestId, name) => {
    if (!window.confirm(`Remove ${name} from friends?`)) return;
    setFriendActionLoading(requestId);
    try { await removeFriend(requestId); loadFriendsData(); loadFriendStatuses(); }
    catch (e) { setFriendsError(e.message || "Failed"); }
    finally { setFriendActionLoading(null); }
  };

  const handleAcceptGroupInvite = async (inviteId) => {
    setFriendActionLoading(inviteId);
    try { await acceptGroupInvite(inviteId); toast.success("You joined the group!"); loadFriendsData(); fetchDashboardData(); }
    catch (e) { setFriendsError(e.message || "Failed"); }
    finally { setFriendActionLoading(null); }
  };

  const handleRejectGroupInvite = async (inviteId) => {
    setFriendActionLoading(inviteId);
    try { await rejectGroupInvite(inviteId); loadFriendsData(); }
    catch (e) { setFriendsError(e.message || "Failed"); }
    finally { setFriendActionLoading(null); }
  };

  // ─── Profile edit helpers ────────────────────────
  const openProfileEdit = () => {
    setActiveTab("profile");
  };

  // ─── Logout ───────────────────────────────────────
  const handleLogout = () => { logout(); navigate("/login"); };

  // ─── Tab definitions ──────────────────────────────
  const tabs = [
    { id: "dashboard", name: "Dashboard", icon: HomeIcon },
    { id: "studygroups", name: "Study Groups", icon: UserGroupIcon },
    { id: "mygroups", name: "My Groups", icon: BookOpenIcon },
    { id: "findbuddies", name: "Find Buddies", icon: MagnifyingGlassIcon },
    { id: "friends", name: "Friends", icon: HeartIcon },
  ];

  // ─── Friend request button helper ─────────────────
  const renderFriendButton = (studentId) => {
    const status = friendStatusMap[studentId];
    if (!status) {
      return (
        <button onClick={() => handleSendFriendRequest(studentId)} disabled={frActionLoading === studentId}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition">
          <UserPlusIcon className="w-4 h-4" />{frActionLoading === studentId ? "Sending..." : "Add Friend"}
        </button>
      );
    }
    if (status.status === "accepted") {
      return <span className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-lg"><CheckIcon className="w-4 h-4" />Friends</span>;
    }
    if (status.status === "pending" && status.direction === "sent") {
      return <span className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-100 rounded-lg"><PaperAirplaneIcon className="w-4 h-4" />Request Sent</span>;
    }
    if (status.status === "pending" && status.direction === "received") {
      return (
        <div className="flex gap-1">
          <button onClick={() => handleAcceptFriend(status.requestId)} disabled={frActionLoading === studentId}
            className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition">
            <CheckIcon className="w-3.5 h-3.5" />Accept
          </button>
          <button onClick={() => handleRejectFriend(status.requestId)} disabled={frActionLoading === studentId}
            className="flex items-center gap-1 px-2 py-1.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition">
            <XMarkIcon className="w-3.5 h-3.5" />Reject
          </button>
        </div>
      );
    }
    return (
      <button onClick={() => handleSendFriendRequest(studentId)} disabled={frActionLoading === studentId}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition">
        <UserPlusIcon className="w-4 h-4" />Add Friend
      </button>
    );
  };

  // ════════════════════════════════════════════════════
  //  TAB CONTENT MAP
  // ════════════════════════════════════════════════════
  const tabContent = {
    dashboard: () => (
      <DashboardTab
        user={user}
        dashLoading={dashLoading}
        dashError={dashError}
        greeting={greeting}
        myGroupsList={myGroupsList}
        studyGroups={studyGroups}
        suggestedBuddies={suggestedBuddies}
        friendStatusMap={friendStatusMap}
        pendingRequests={pendingRequests}
        groupInvitesList={groupInvitesList}
        friendActionLoading={friendActionLoading}
        setActiveTab={setActiveTab}
        setFriendsTab={setFriendsTab}
        openProfileEdit={openProfileEdit}
        handleAcceptFriend={handleAcceptFriend}
        handleRejectFriend={handleRejectFriend}
        handleAcceptGroupInvite={handleAcceptGroupInvite}
        handleRejectGroupInvite={handleRejectGroupInvite}
        getInitials={getInitials}
        groupColors={groupColors}
        buddyColors={buddyColors}
        myFriendsList={myFriendsList}
        renderFriendButton={renderFriendButton}
      />
    ),
    studygroups: () => (
      <StudyGroupsTab
        user={user}
        sgSearchType={sgSearchType}
        setSgSearchType={setSgSearchType}
        sgSubject={sgSubject}
        setSgSubject={setSgSubject}
        sgMeetingTime={sgMeetingTime}
        setSgMeetingTime={setSgMeetingTime}
        sgGroups={sgGroups}
        sgLoading={sgLoading}
        sgError={sgError}
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        joinLoading={joinLoading}
        sgLoadAll={sgLoadAll}
        sgSearchBySubject={sgSearchBySubject}
        sgAdvancedSearch={sgAdvancedSearch}
        handleJoinGroup={handleJoinGroup}
        fetchDashboardData={fetchDashboardData}
      />
    ),
    mygroups: () => (
      <MyGroupsTab
        mgLoading={mgLoading}
        mgError={mgError}
        mgCreated={mgCreated}
        mgJoined={mgJoined}
        mgActionLoading={mgActionLoading}
        mgViewDetails={mgViewDetails}
        mgOpenEdit={mgOpenEdit}
        mgDelete={mgDelete}
        mgLeave={mgLeave}
        openInviteModal={openInviteModal}
        showDetailsModal={showDetailsModal}
        setShowDetailsModal={setShowDetailsModal}
        selectedGroup={selectedGroup}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        mgUpdate={mgUpdate}
      />
    ),
    findbuddies: () => (
      <FindBuddiesTab
        fbSearchType={fbSearchType}
        setFbSearchType={setFbSearchType}
        fbSubject={fbSubject}
        setFbSubject={setFbSubject}
        fbAvailableTime={fbAvailableTime}
        setFbAvailableTime={setFbAvailableTime}
        fbStudents={fbStudents}
        fbLoading={fbLoading}
        fbError={fbError}
        fbHasSearched={fbHasSearched}
        fbLoadAll={fbLoadAll}
        fbSimpleSearch={fbSimpleSearch}
        fbAdvancedSearch={fbAdvancedSearch}
        renderFriendButton={renderFriendButton}
        getInitials={getInitials}
        buddyColors={buddyColors}
      />
    ),
    friends: () => (
      <FriendsTab
        friendsTab={friendsTab}
        setFriendsTab={setFriendsTab}
        myFriendsList={myFriendsList}
        pendingRequests={pendingRequests}
        sentRequestsList={sentRequestsList}
        groupInvitesList={groupInvitesList}
        friendsLoading={friendsLoading}
        friendsError={friendsError}
        friendActionLoading={friendActionLoading}
        setActiveTab={setActiveTab}
        handleAcceptFriend={handleAcceptFriend}
        handleRejectFriend={handleRejectFriend}
        handleRemoveFriend={handleRemoveFriend}
        handleAcceptGroupInvite={handleAcceptGroupInvite}
        handleRejectGroupInvite={handleRejectGroupInvite}
        getInitials={getInitials}
        buddyColors={buddyColors}
      />
    ),
    profile: () => (
      <ProfileTab
        user={user}
        getInitials={getInitials}
        onUpdateProfile={async (data) => {
          setProfileLoading(true);
          setProfileError("");
          setProfileSuccess("");
          try {
            const result = await updateProfile(data);
            updateUser(result.user);
            setProfileSuccess("Profile updated successfully!");
            fetchDashboardData();
            setTimeout(() => setProfileSuccess(""), 3000);
          } catch (err) {
            setProfileError(err.message || "Failed to update profile");
            throw err;
          } finally {
            setProfileLoading(false);
          }
        }}
        onUploadImage={async (file) => {
          setProfileLoading(true);
          setProfileError("");
          setProfileSuccess("");
          try {
            const result = await uploadProfileImage(file);
            updateUser(result.user);
            setProfileSuccess("Profile picture updated!");
            setTimeout(() => setProfileSuccess(""), 3000);
          } catch (err) {
            setProfileError(err.message || "Failed to upload image");
            throw err;
          } finally {
            setProfileLoading(false);
          }
        }}
        profileLoading={profileLoading}
        profileError={profileError}
        profileSuccess={profileSuccess}
      />
    ),
    settings: () => (
      <SettingsTab
        onChangePassword={async ({ currentPassword, newPassword }) => {
          await updateProfile({ currentPassword, newPassword });
        }}
      />
    ),
  };

  // ════════════════════════════════════════════════════
  //  MAIN LAYOUT
  // ════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="min-h-screen">
        {/* ─── Sidebar ─── */}
        <Sidebar
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tabs={tabs}
          pendingRequests={pendingRequests}
          groupInvitesList={groupInvitesList}
          myGroupsList={myGroupsList}
          myFriendsList={myFriendsList}
          getInitials={getInitials}
          handleLogout={handleLogout}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          onProfileEdit={() => setActiveTab("profile")}
        />

        {/* ─── Main Content ─── */}
        <div className={`transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'}`}>
          {/* Top Bar */}
          <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 lg:px-8">
              <div className="flex items-center space-x-2 lg:hidden"><AcademicCapIcon className="text-indigo-600 w-7 h-7" /><span className="text-lg font-bold text-gray-900">StudyBuddy</span></div>
              <div className="hidden md:block"><p className="font-semibold text-gray-900">{formatTime(currentTime)}</p><p className="text-xs text-gray-500">{formatDate(currentTime)}</p></div>
              <div className="flex items-center space-x-3">
                {isAdmin && <button onClick={() => navigate("/admin")} className="flex items-center px-4 py-2 space-x-2 text-white transition-all bg-indigo-600 rounded-xl hover:bg-indigo-700"><ShieldCheckIcon className="w-4 h-4" /><span className="text-sm font-medium">Admin</span></button>}
                <button onClick={handleLogout} className="p-2 text-gray-400 transition-all hover:text-gray-700 hover:bg-gray-100 rounded-xl"><ArrowRightOnRectangleIcon className="w-6 h-6" /></button>
              </div>
            </div>
          </div>

          {/* Page content */}
          <div
            className={
              activeTab === 'studygroups'
                ? 'pb-24 sm:pb-24 lg:pb-10'
                : 'p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-10'
            }
          >
            {tabContent[activeTab]()}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav is rendered inside Sidebar component */}

      {/* ─── Invite Friends to Group Modal ─── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Invite Friends to Group</h3>
              <button onClick={() => setShowInviteModal(false)} className="p-1 text-gray-400 transition rounded-lg hover:text-gray-700 hover:bg-gray-100"><span className="text-2xl leading-none">&times;</span></button>
            </div>
            {inviteLoading ? <div className="py-8 text-center text-gray-500">Loading friends...</div> : inviteFriends.length > 0 ? (
              <div className="space-y-3">
                {inviteFriends.map((f, idx) => (
                  <div key={f._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-xl text-white font-bold text-sm ${buddyColors[idx % buddyColors.length]}`}>{getInitials(f.name)}</div>
                      <div><p className="text-sm font-medium text-gray-900">{f.name}</p><p className="text-xs text-gray-500">{f.email}</p></div>
                    </div>
                    <button onClick={() => handleSendInvite(f._id)} disabled={inviteSending === f._id}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:bg-gray-400 transition">
                      <PaperAirplaneIcon className="w-3.5 h-3.5" />{inviteSending === f._id ? "Sending..." : "Invite"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <HeartIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No friends available to invite.</p>
                <p className="mt-1 text-xs text-gray-400">Add friends first from the Find Buddies tab, or all your friends are already members.</p>
              </div>
            )}
          </div>
        </div>
      )}



      <style>{`.line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}`}</style>
    </div>
  );
};

export default Dashboard;