import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Modal, message } from "antd";
import { useAuth } from "../hooks/useAuth";

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f3f4f6 0%, #eef2f7 45%, #f8fafc 100%)",
  padding: "24px",
  position: "relative",
  overflow: "hidden",
};

const floatingOrb = (top, left, size, bg, delay = "0s") => ({
  position: "absolute",
  top,
  left,
  width: size,
  height: size,
  borderRadius: "50%",
  background: bg,
  filter: "blur(10px)",
  opacity: 0.25,
  animation: "floaty 8s ease-in-out infinite",
  animationDelay: delay,
  pointerEvents: "none",
});

const wrapperStyle = {
  maxWidth: "1280px",
  margin: "0 auto",
  position: "relative",
  zIndex: 2,
};

const heroCard = {
  position: "relative",
  overflow: "hidden",
  background: "linear-gradient(135deg, #2f5fd0 0%, #3f7ee8 55%, #6466f1 100%)",
  borderRadius: "28px",
  padding: "32px",
  color: "#ffffff",
  boxShadow: "0 14px 30px rgba(59, 130, 246, 0.18)",
  marginBottom: "24px",
  border: "1px solid rgba(255,255,255,0.14)",
};

const heroGlow = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.14), transparent 22%), radial-gradient(circle at 85% 18%, rgba(255,255,255,0.10), transparent 20%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.08), transparent 26%)",
  pointerEvents: "none",
};

const heroTitle = {
  margin: 0,
  fontSize: "36px",
  fontWeight: 800,
  letterSpacing: "-0.8px",
  position: "relative",
  zIndex: 1,
};

const heroText = {
  margin: "12px 0 0",
  color: "rgba(255,255,255,0.9)",
  lineHeight: 1.8,
  fontSize: "15px",
  maxWidth: "760px",
  position: "relative",
  zIndex: 1,
};

const cardStyle = {
  background: "#ffffff",
  backdropFilter: "blur(14px)",
  borderRadius: "24px",
  padding: "24px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
  marginBottom: "24px",
};

const sectionTitle = {
  margin: 0,
  fontSize: "24px",
  fontWeight: 800,
  color: "#0f172a",
  letterSpacing: "-0.5px",
};

const sectionText = {
  margin: "8px 0 0",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.7,
};

const tabsRow = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "20px",
};

const tabButton = (active) => ({
  border: "none",
  borderRadius: "14px",
  padding: "11px 18px",
  fontWeight: 800,
  cursor: "pointer",
  background: active ? "#f59e0b" : "#f8fafc",
  color: active ? "#ffffff" : "#334155",
  transition: "all 0.25s ease",
  boxShadow: active ? "0 10px 20px rgba(245, 158, 11, 0.22)" : "none",
  border: active ? "none" : "1px solid #e2e8f0",
});

const filterGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
  marginTop: "20px",
};

const inputStyle = {
  width: "100%",
  padding: "14px 15px",
  borderRadius: "16px",
  border: "1px solid #dbe2ea",
  fontSize: "14px",
  outline: "none",
  background: "#ffffff",
  boxSizing: "border-box",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
};

const selectStyle = {
  ...inputStyle,
  cursor: "pointer",
};

const actionRow = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "18px",
};

const secondaryButton = {
  border: "none",
  borderRadius: "14px",
  padding: "12px 18px",
  fontWeight: 800,
  cursor: "pointer",
  background: "#f8fafc",
  color: "#334155",
  transition: "all 0.25s ease",
  border: "1px solid #e2e8f0",
};

const resultsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "20px",
  marginTop: "20px",
};

const baseGroupCard = {
  background: "#ffffff",
  borderRadius: "24px",
  overflow: "hidden",
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
  transition: "transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease",
};

const imageWrap = {
  position: "relative",
  overflow: "hidden",
};

const imageOverlay = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(to top, rgba(15,23,42,0.28), rgba(15,23,42,0.04))",
};

const imageStyle = {
  width: "100%",
  height: "210px",
  objectFit: "cover",
  display: "block",
  transition: "transform 0.35s ease",
};

const cardBody = {
  padding: "20px",
};

const chipWrap = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  margin: "14px 0 16px",
};

const chipStyle = {
  padding: "8px 13px",
  borderRadius: "999px",
  background: "#f8fafc",
  color: "#475569",
  fontSize: "12px",
  fontWeight: 700,
  border: "1px solid #e2e8f0",
  transition: "all 0.2s ease",
};

const statusBadge = (joined, full, popular) => ({
  display: "inline-block",
  padding: "7px 13px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 800,
  marginBottom: "12px",
  background: joined
    ? "#e8f7ee"
    : full
    ? "#fee2e2"
    : popular
    ? "#eef2ff"
    : "#e0f2fe",
  color: joined ? "#16a34a" : full ? "#dc2626" : popular ? "#4f46e5" : "#2563eb",
  border: "1px solid rgba(255,255,255,0.7)",
});

const progressTrack = {
  width: "100%",
  height: "12px",
  background: "#e5e7eb",
  borderRadius: "999px",
  overflow: "hidden",
  marginBottom: "16px",
};

const emptyState = {
  textAlign: "center",
  padding: "50px 20px",
  border: "2px dashed #cbd5e1",
  borderRadius: "20px",
  color: "#64748b",
  background: "#f8fafc",
  marginTop: "18px",
};

const viewButtonStyle = {
  border: "none",
  borderRadius: "14px",
  padding: "12px 18px",
  fontWeight: 800,
  cursor: "pointer",
  background: "#f1efff",
  color: "#5b50c9",
  width: "50%",
  transition: "all 0.25s ease",
  border: "1px solid #ddd7ff",
  boxShadow: "0 6px 14px rgba(108, 99, 232, 0.12)",
};

const joinButtonBase = {
  border: "none",
  borderRadius: "14px",
  padding: "12px 18px",
  fontWeight: 800,
  cursor: "pointer",
  background: "#f59e0b",
  color: "#ffffff",
  width: "50%",
  transition: "all 0.25s ease",
 background: "linear-gradient(135deg, #6366f1, #4f46e5)",
boxShadow: "0 12px 24px rgba(79, 70, 229, 0.30)",
};

const modalImageStyle = {
  width: "100%",
  height: "260px",
  objectFit: "cover",
  borderRadius: "20px",
  marginBottom: "18px",
  border: "1px solid #e2e8f0",
};

const modalTitle = {
  margin: "0 0 10px",
  fontSize: "30px",
  fontWeight: 800,
  color: "#0f172a",
  letterSpacing: "-0.6px",
};

const modalDescription = {
  margin: "0 0 16px",
  color: "#475569",
  lineHeight: 1.8,
  fontSize: "14px",
};

const modalInfoGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
  marginTop: "16px",
};

const modalInfoCard = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  padding: "14px",
  boxShadow: "0 10px 20px rgba(15, 23, 42, 0.05)",
};

const modalLabel = {
  margin: "0 0 6px",
  color: "#64748b",
  fontSize: "13px",
  fontWeight: 700,
};

const modalValue = {
  margin: 0,
  color: "#0f172a",
  fontSize: "15px",
  fontWeight: 800,
};

const membersSection = {
  marginTop: "20px",
};

const membersGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "10px",
  marginTop: "12px",
};

const memberCard = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "13px",
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
};

const modalActionRow = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "24px",
};

const modalSecondaryButton = {
  border: "none",
  borderRadius: "14px",
  padding: "12px 18px",
  fontWeight: 800,
  cursor: "pointer",
  background: "#f1f5f9",
  color: "#334155",
  transition: "all 0.25s ease",
};

const modalPrimaryButton = {
  border: "none",
  borderRadius: "14px",
  padding: "12px 18px",
  fontWeight: 800,
  cursor: "pointer",
  background: "#f59e0b",
  color: "#ffffff",
  transition: "all 0.25s ease",
  boxShadow: "0 10px 20px rgba(245, 158, 11, 0.22)",
};

const FindBuddies = () => {
  const { user } = useAuth();

  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredButton, setHoveredButton] = useState("");

  const [filters, setFilters] = useState({
    search: "",
    subject: "",
    day: "",
    building: "",
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/study-groups");
      setGroups(res.data || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
      message.error("Failed to load groups");
    }
  };

  const currentUserId = user?._id || user?.id;

  const getMemberId = (member) =>
    typeof member === "object" && member !== null ? member._id : member;

  const getMemberNames = (group) => {
    if (!group?.members?.length) return [];
    return group.members.map((member, index) => {
      if (typeof member === "object" && member !== null) {
        return member.name || member.username || member.fullName || `Member ${index + 1}`;
      }
      return `Member ${index + 1}`;
    });
  };

  const isUserJoined = (group) => {
    return group?.members?.some(
      (member) => String(getMemberId(member)) === String(currentUserId)
    );
  };

  const isGroupFull = (group) => {
    return (group?.members?.length || 0) >= (group?.maxMembers || 0);
  };

  const openGroupModal = (group) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
  };

  const closeGroupModal = () => {
    setSelectedGroup(null);
    setIsModalOpen(false);
  };

  const handleJoinGroup = async (groupId) => {
    try {
      if (!currentUserId) {
        message.error("User not found");
        return;
      }

      await axios.put(`http://localhost:5000/api/study-groups/${groupId}/join`, {
        userId: currentUserId,
      });

      message.success("Joined group successfully");
      closeGroupModal();
      fetchGroups();
    } catch (error) {
      console.error("Join group error:", error.response?.data || error.message);
      message.error(error.response?.data?.message || "Failed to join group");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFilters({
      search: "",
      subject: "",
      day: "",
      building: "",
    });
    setActiveTab("all");
  };

  const subjectOptions = useMemo(() => {
    const subjects = groups
      .map((group) => group.subject?.trim())
      .filter(Boolean);
    return [...new Set(subjects)].sort((a, b) => a.localeCompare(b));
  }, [groups]);

  const filteredGroups = useMemo(() => {
    return groups.filter((group) => {
      const searchText = filters.search.toLowerCase();

      const matchesSearch =
        !searchText ||
        group.name?.toLowerCase().includes(searchText) ||
        group.subject?.toLowerCase().includes(searchText) ||
        group.description?.toLowerCase().includes(searchText);

      const matchesSubject = filters.subject
        ? group.subject === filters.subject
        : true;

      const matchesDay = filters.day
        ? group.selectedDays?.includes(filters.day)
        : true;

      const matchesBuilding = filters.building
        ? group.building === filters.building
        : true;

      return matchesSearch && matchesSubject && matchesDay && matchesBuilding;
    });
  }, [groups, filters]);

  const processedGroups = useMemo(() => {
    let data = [...filteredGroups];

    if (activeTab === "joined") {
      data = data.filter((group) => isUserJoined(group));
    } else if (activeTab === "open") {
      data = data.filter((group) => !isGroupFull(group));
    } else if (activeTab === "popular") {
      data = data.sort((a, b) => {
        const memberDiff = (b.members?.length || 0) - (a.members?.length || 0);
        if (memberDiff !== 0) return memberDiff;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
    }

    return data;
  }, [filteredGroups, activeTab]);

  const modalAlreadyJoined = selectedGroup ? isUserJoined(selectedGroup) : false;
  const modalMemberCount = selectedGroup?.members?.length || 0;
  const modalMaxMembers = selectedGroup?.maxMembers || 1;
  const modalIsFull = modalMemberCount >= modalMaxMembers;
  const modalMemberNames = getMemberNames(selectedGroup);

  return (
    <div style={pageStyle}>
      <style>
        {`
          @keyframes floaty {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-18px) translateX(10px); }
          }
        `}
      </style>

      <div style={floatingOrb("80px", "-40px", "180px", "rgba(59,130,246,0.10)")}></div>
      <div style={floatingOrb("420px", "90%", "160px", "rgba(99,102,241,0.10)", "1s")}></div>
      <div style={floatingOrb("78%", "6%", "130px", "rgba(148,163,184,0.10)", "2s")}></div>

      <div style={wrapperStyle}>
        <div style={heroCard}>
          <div style={heroGlow}></div>

          <div
            style={{
              position: "absolute",
              top: "-25px",
              right: "-60px",
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
            }}
          ></div>

          <div
            style={{
              position: "absolute",
              bottom: "-55px",
              left: "-30px",
              width: "180px",
              height: "180px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
            }}
          ></div>

          <h1 style={heroTitle}>Find Buddies</h1>
          <p style={heroText}>
            Explore your study groups using simple tabs and reliable filters.
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={sectionTitle}>Group Discovery</h2>
          <p style={sectionText}>
            Browse all groups, open groups, joined groups, and the most popular groups.
          </p>

          <div style={tabsRow}>
            <button
              style={tabButton(activeTab === "all")}
              onClick={() => setActiveTab("all")}
            >
              All
            </button>
            <button
              style={tabButton(activeTab === "popular")}
              onClick={() => setActiveTab("popular")}
            >
              Popular
            </button>
            <button
              style={tabButton(activeTab === "open")}
              onClick={() => setActiveTab("open")}
            >
              Open
            </button>
            <button
              style={tabButton(activeTab === "joined")}
              onClick={() => setActiveTab("joined")}
            >
              Joined
            </button>
          </div>

          <div style={filterGrid}>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleChange}
              placeholder="Search by group name, subject, or description"
              style={inputStyle}
            />

            <select
              name="subject"
              value={filters.subject}
              onChange={handleChange}
              style={selectStyle}
            >
              <option value="">All Subjects</option>
              {subjectOptions.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>

            <select
              name="day"
              value={filters.day}
              onChange={handleChange}
              style={selectStyle}
            >
              <option value="">All Days</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>

            <select
              name="building"
              value={filters.building}
              onChange={handleChange}
              style={selectStyle}
            >
              <option value="">All Buildings</option>
              <option value="Main Building">Main Building</option>
              <option value="New Building">New Building</option>
            </select>
          </div>

          <div style={actionRow}>
            <button
              style={{
                ...secondaryButton,
                transform: hoveredButton === "reset" ? "translateY(-2px)" : "translateY(0)",
                boxShadow:
                  hoveredButton === "reset"
                    ? "0 12px 22px rgba(15, 23, 42, 0.08)"
                    : "none",
              }}
              onMouseEnter={() => setHoveredButton("reset")}
              onMouseLeave={() => setHoveredButton("")}
              onClick={handleReset}
            >
              Reset Filters
            </button>
          </div>

          {processedGroups.length > 0 ? (
            <div style={resultsGrid}>
              {processedGroups.map((group, index) => {
                const cardKey = group._id || index;
                const alreadyJoined = isUserJoined(group);
                const memberCount = group.members?.length || 0;
                const maxMembers = group.maxMembers || 1;
                const full = isGroupFull(group);
                const progress = Math.min((memberCount / maxMembers) * 100, 100);
                const isPopularTab = activeTab === "popular";

                return (
                  <div
                    key={cardKey}
                    style={{
                      ...baseGroupCard,
                      transform: hoveredCard === cardKey ? "translateY(-7px)" : "translateY(0)",
                      boxShadow:
                        hoveredCard === cardKey
                          ? "0 18px 34px rgba(59, 130, 246, 0.12)"
                          : baseGroupCard.boxShadow,
                      borderColor: hoveredCard === cardKey ? "#bfdbfe" : "#e2e8f0",
                    }}
                    onMouseEnter={() => setHoveredCard(cardKey)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    {group.image ? (
                      <div style={imageWrap}>
                        <img
                          src={group.image}
                          alt={group.name}
                          style={{
                            ...imageStyle,
                            transform: hoveredCard === cardKey ? "scale(1.06)" : "scale(1)",
                          }}
                        />
                        <div style={imageOverlay}></div>
                      </div>
                    ) : null}

                    <div style={cardBody}>
                      <div style={statusBadge(alreadyJoined, full, isPopularTab)}>
                        {alreadyJoined
                          ? "Joined"
                          : full
                          ? "Full"
                          : isPopularTab
                          ? "Popular"
                          : "Open to Join"}
                      </div>

                      <h3
                        style={{
                          margin: "0 0 8px",
                          color: "#0f172a",
                          fontSize: "21px",
                          fontWeight: 800,
                        }}
                      >
                        {group.name}
                      </h3>

                      <p
                        style={{
                          margin: "0 0 12px",
                          color: "#475569",
                          lineHeight: 1.7,
                          fontSize: "14px",
                        }}
                      >
                        {group.description || "No description available."}
                      </p>

                      <div style={chipWrap}>
                        <span style={chipStyle}>📘 {group.subject || "No subject"}</span>
                        <span style={chipStyle}>👥 {memberCount} / {maxMembers}</span>
                        <span style={chipStyle}>
                          📅 {group.selectedDays?.join(", ") || "Not set"}
                        </span>
                        <span style={chipStyle}>
                          ⏰ {group.startTime || "N/A"} - {group.endTime || "N/A"}
                        </span>
                        <span style={chipStyle}>🏢 {group.building || "No building"}</span>
                        <span style={chipStyle}>📍 {group.hall || "No hall"}</span>
                      </div>

                      <div style={progressTrack}>
                        <div
                          style={{
                            width: `${progress}%`,
                            height: "100%",
                            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                            transition: "width 0.35s ease",
                            borderRadius: "999px",
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          style={{
                            ...viewButtonStyle,
                            background:
                              hoveredButton === `view-${cardKey}`
                                ? "#eef2ff"
                                : "#f8fafc",
                            transform:
                              hoveredButton === `view-${cardKey}`
                                ? "translateY(-2px)"
                                : "translateY(0)",
                          }}
                          onMouseEnter={() => setHoveredButton(`view-${cardKey}`)}
                          onMouseLeave={() => setHoveredButton("")}
                          onClick={() => openGroupModal(group)}
                        >
                          View
                        </button>

                        <button
                          style={{
                            ...joinButtonBase,
                            opacity: alreadyJoined || full ? 0.6 : 1,
                            cursor: alreadyJoined || full ? "not-allowed" : "pointer",
                            transform:
                              hoveredButton === `join-${cardKey}` && !alreadyJoined && !full
                                ? "translateY(-2px)"
                                : "translateY(0)",
                            boxShadow:
                              hoveredButton === `join-${cardKey}` && !alreadyJoined && !full
                                ? "0 14px 26px rgba(245, 158, 11, 0.24)"
                                : joinButtonBase.boxShadow,
                          }}
                          onMouseEnter={() => setHoveredButton(`join-${cardKey}`)}
                          onMouseLeave={() => setHoveredButton("")}
                          onClick={() => handleJoinGroup(group._id)}
                          disabled={alreadyJoined || full}
                        >
                          {alreadyJoined ? "Joined" : full ? "Full" : "Join"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={emptyState}>No matching groups found.</div>
          )}
        </div>
      </div>

      <Modal
        open={isModalOpen}
        onCancel={closeGroupModal}
        footer={null}
        width={780}
        centered
        styles={{
          content: {
            borderRadius: "28px",
            overflow: "hidden",
            padding: "22px",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
          },
          body: {
            paddingTop: "4px",
          },
        }}
      >
        {selectedGroup && (
          <div>
            {selectedGroup.image ? (
              <img
                src={selectedGroup.image}
                alt={selectedGroup.name}
                style={modalImageStyle}
              />
            ) : null}

            <div style={statusBadge(modalAlreadyJoined, modalIsFull, false)}>
              {modalAlreadyJoined
                ? "Already Joined"
                : modalIsFull
                ? "Group Full"
                : "Open to Join"}
            </div>

            <h2 style={modalTitle}>{selectedGroup.name}</h2>

            <p style={modalDescription}>
              {selectedGroup.description || "No description available."}
            </p>

            <div style={chipWrap}>
              <span style={chipStyle}>📘 {selectedGroup.subject || "No subject"}</span>
              <span style={chipStyle}>
                📅 {selectedGroup.selectedDays?.join(", ") || "Not set"}
              </span>
              <span style={chipStyle}>
                ⏰ {selectedGroup.startTime || "N/A"} - {selectedGroup.endTime || "N/A"}
              </span>
              <span style={chipStyle}>🏢 {selectedGroup.building || "No building"}</span>
              <span style={chipStyle}>📍 {selectedGroup.hall || "No hall"}</span>
            </div>

            <div style={modalInfoGrid}>
              <div style={modalInfoCard}>
                <p style={modalLabel}>Members</p>
                <p style={modalValue}>
                  {modalMemberCount} / {modalMaxMembers}
                </p>
              </div>

              <div style={modalInfoCard}>
                <p style={modalLabel}>Availability</p>
                <p style={modalValue}>
                  {modalIsFull
                    ? "No available seats"
                    : `${modalMaxMembers - modalMemberCount} seats left`}
                </p>
              </div>

              <div style={modalInfoCard}>
                <p style={modalLabel}>Building</p>
                <p style={modalValue}>{selectedGroup.building || "Not set"}</p>
              </div>

              <div style={modalInfoCard}>
                <p style={modalLabel}>Hall</p>
                <p style={modalValue}>{selectedGroup.hall || "Not set"}</p>
              </div>
            </div>

            <div style={{ marginTop: "18px" }}>
              <div
                style={{
                  marginBottom: "8px",
                  color: "#475569",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                Group Capacity Progress
              </div>

              <div style={progressTrack}>
                <div
                  style={{
                    width: `${Math.min((modalMemberCount / modalMaxMembers) * 100, 100)}%`,
                    height: "100%",
                    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                    borderRadius: "999px",
                  }}
                />
              </div>
            </div>

            <div style={membersSection}>
              <h3
                style={{
                  margin: "0 0 8px",
                  color: "#0f172a",
                  fontSize: "18px",
                  fontWeight: 800,
                }}
              >
                Group Members
              </h3>
              <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
                Students currently in this group.
              </p>

              {modalMemberNames.length > 0 ? (
                <div style={membersGrid}>
                  {modalMemberNames.map((name, index) => (
                    <div key={`${name}-${index}`} style={memberCard}>
                      <p style={{ margin: 0, color: "#0f172a", fontWeight: 800 }}>
                        {name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={emptyState}>No members yet.</div>
              )}
            </div>

            <div style={modalActionRow}>
              <button
                style={modalSecondaryButton}
                onClick={closeGroupModal}
              >
                Close
              </button>

              <button
                style={{
                  ...modalPrimaryButton,
                  opacity: modalAlreadyJoined || modalIsFull ? 0.6 : 1,
                  cursor: modalAlreadyJoined || modalIsFull ? "not-allowed" : "pointer",
                }}
                onClick={() => handleJoinGroup(selectedGroup._id)}
                disabled={modalAlreadyJoined || modalIsFull}
              >
                {modalAlreadyJoined
                  ? "Already Joined"
                  : modalIsFull
                  ? "Group Full"
                  : "Join Group"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FindBuddies;