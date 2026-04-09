import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Modal, message } from "antd";
import { useAuth } from "../hooks/useAuth";

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
  padding: "24px",
};

const wrapperStyle = {
  maxWidth: "1280px",
  margin: "0 auto",
};

const heroCard = {
  background: "linear-gradient(135deg, #0f172a, #4338ca)",
  borderRadius: "28px",
  padding: "28px",
  color: "#ffffff",
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.22)",
  marginBottom: "24px",
};

const heroTitle = {
  margin: 0,
  fontSize: "32px",
  fontWeight: 800,
};

const heroText = {
  margin: "10px 0 0",
  color: "rgba(255,255,255,0.88)",
  lineHeight: 1.7,
  fontSize: "15px",
  maxWidth: "760px",
};

const cardStyle = {
  background: "#ffffff",
  borderRadius: "24px",
  padding: "24px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
  marginBottom: "24px",
};

const sectionTitle = {
  margin: 0,
  fontSize: "22px",
  fontWeight: 800,
  color: "#0f172a",
};

const sectionText = {
  margin: "8px 0 0",
  color: "#64748b",
  fontSize: "14px",
};

const tabsRow = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "18px",
};

const tabButton = (active) => ({
  border: "none",
  borderRadius: "12px",
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
  background: active ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : "#e2e8f0",
  color: active ? "#ffffff" : "#1e293b",
  transition: "all 0.25s ease",
});

const filterGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
  marginTop: "18px",
};

const inputStyle = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: "14px",
  border: "1px solid #cbd5e1",
  fontSize: "14px",
  outline: "none",
  background: "#ffffff",
  boxSizing: "border-box",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
};

const selectStyle = {
  ...inputStyle,
};

const actionRow = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "16px",
};

const secondaryButton = {
  border: "none",
  borderRadius: "12px",
  padding: "11px 18px",
  fontWeight: 700,
  cursor: "pointer",
  background: "#e2e8f0",
  color: "#1e293b",
  transition: "all 0.25s ease",
};

const resultsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "18px",
  marginTop: "18px",
};

const baseGroupCard = {
  background: "#ffffff",
  borderRadius: "22px",
  overflow: "hidden",
  border: "1px solid #e2e8f0",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
  transition: "transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease",
};

const imageStyle = {
  width: "100%",
  height: "200px",
  objectFit: "cover",
  display: "block",
  transition: "transform 0.35s ease",
};

const cardBody = {
  padding: "18px",
};

const chipWrap = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  margin: "14px 0 16px",
};

const chipStyle = {
  padding: "7px 12px",
  borderRadius: "999px",
  background: "#f1f5f9",
  color: "#334155",
  fontSize: "12px",
  fontWeight: 600,
  transition: "all 0.2s ease",
};

const statusBadge = (joined, full, popular) => ({
  display: "inline-block",
  padding: "6px 12px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700,
  marginBottom: "12px",
  background: joined ? "#dcfce7" : full ? "#fee2e2" : popular ? "#ede9fe" : "#e0f2fe",
  color: joined ? "#166534" : full ? "#b91c1c" : popular ? "#5b21b6" : "#0369a1",
});

const progressTrack = {
  width: "100%",
  height: "10px",
  background: "#e2e8f0",
  borderRadius: "999px",
  overflow: "hidden",
  marginBottom: "16px",
};

const emptyState = {
  textAlign: "center",
  padding: "50px 20px",
  border: "2px dashed #cbd5e1",
  borderRadius: "18px",
  color: "#64748b",
  background: "#f8fafc",
  marginTop: "18px",
};

const viewButtonStyle = {
  border: "none",
  borderRadius: "12px",
  padding: "11px 18px",
  fontWeight: 700,
  cursor: "pointer",
  background: "#e2e8f0",
  color: "#1e293b",
  width: "50%",
  transition: "all 0.25s ease",
};

const joinButtonBase = {
  border: "none",
  borderRadius: "12px",
  padding: "11px 18px",
  fontWeight: 700,
  cursor: "pointer",
  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
  color: "#ffffff",
  width: "50%",
  transition: "all 0.25s ease",
};

const modalImageStyle = {
  width: "100%",
  height: "240px",
  objectFit: "cover",
  borderRadius: "18px",
  marginBottom: "18px",
  border: "1px solid #e2e8f0",
};

const modalTitle = {
  margin: "0 0 10px",
  fontSize: "28px",
  fontWeight: 800,
  color: "#0f172a",
};

const modalDescription = {
  margin: "0 0 16px",
  color: "#475569",
  lineHeight: 1.7,
  fontSize: "14px",
};

const modalInfoGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
  marginTop: "16px",
};

const modalInfoCard = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "14px",
};

const modalLabel = {
  margin: "0 0 6px",
  color: "#64748b",
  fontSize: "13px",
  fontWeight: 600,
};

const modalValue = {
  margin: 0,
  color: "#0f172a",
  fontSize: "15px",
  fontWeight: 700,
};

const modalActionRow = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "22px",
};

const modalSecondaryButton = {
  border: "none",
  borderRadius: "12px",
  padding: "11px 18px",
  fontWeight: 700,
  cursor: "pointer",
  background: "#e2e8f0",
  color: "#1e293b",
  transition: "all 0.25s ease",
};

const modalPrimaryButton = {
  border: "none",
  borderRadius: "12px",
  padding: "11px 18px",
  fontWeight: 700,
  cursor: "pointer",
  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
  color: "#ffffff",
  transition: "all 0.25s ease",
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

  const modalAlreadyJoined = isUserJoined(selectedGroup);
  const modalMemberCount = selectedGroup?.members?.length || 0;
  const modalMaxMembers = selectedGroup?.maxMembers || 1;
  const modalIsFull = modalMemberCount >= modalMaxMembers;

  return (
    <div style={pageStyle}>
      <div style={wrapperStyle}>
        <div style={heroCard}>
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
                    ? "0 10px 20px rgba(15, 23, 42, 0.08)"
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
                      transform: hoveredCard === cardKey ? "translateY(-6px)" : "translateY(0)",
                      boxShadow:
                        hoveredCard === cardKey
                          ? "0 18px 36px rgba(79, 70, 229, 0.14)"
                          : baseGroupCard.boxShadow,
                      borderColor: hoveredCard === cardKey ? "#c7d2fe" : "#e2e8f0",
                    }}
                    onMouseEnter={() => setHoveredCard(cardKey)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    {group.image ? (
                      <img
                        src={group.image}
                        alt={group.name}
                        style={{
                          ...imageStyle,
                          transform: hoveredCard === cardKey ? "scale(1.05)" : "scale(1)",
                        }}
                      />
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

                      <h3 style={{ margin: "0 0 8px", color: "#0f172a", fontSize: "20px" }}>
                        {group.name}
                      </h3>

                      <p style={{ margin: "0 0 12px", color: "#475569", lineHeight: 1.6 }}>
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
                            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                            transition: "width 0.35s ease",
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          style={{
                            ...viewButtonStyle,
                            background:
                              hoveredButton === `view-${cardKey}` ? "#dbe4ff" : "#e2e8f0",
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
                                ? "0 12px 24px rgba(79, 70, 229, 0.25)"
                                : "none",
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
        width={760}
        centered
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
              <div style={{ marginBottom: "8px", color: "#475569", fontSize: "14px" }}>
                Group Capacity Progress
              </div>

              <div style={progressTrack}>
                <div
                  style={{
                    width: `${Math.min((modalMemberCount / modalMaxMembers) * 100, 100)}%`,
                    height: "100%",
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  }}
                />
              </div>
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