import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Modal, message } from "antd";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

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
  background: "linear-gradient(135deg, #4338ca, #7c3aed)",
  borderRadius: "30px",
  padding: "32px",
  color: "#ffffff",
  boxShadow: "0 20px 50px rgba(79, 70, 229, 0.28)",
  marginBottom: "24px",
};

const heroTitle = {
  margin: 0,
  fontSize: "36px",
  fontWeight: 800,
};

const heroText = {
  margin: "10px 0 0",
  maxWidth: "760px",
  lineHeight: 1.7,
  color: "rgba(255,255,255,0.88)",
  fontSize: "15px",
};

const heroActions = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "22px",
};

const primaryButton = {
  border: "none",
  borderRadius: "14px",
  padding: "12px 20px",
  fontWeight: 700,
  cursor: "pointer",
  background: "#ffffff",
  color: "#4338ca",
};

const secondaryButton = {
  border: "1px solid rgba(255,255,255,0.28)",
  borderRadius: "14px",
  padding: "12px 20px",
  fontWeight: 700,
  cursor: "pointer",
  background: "rgba(255,255,255,0.12)",
  color: "#ffffff",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
  marginBottom: "24px",
};

const statCard = {
  background: "#ffffff",
  borderRadius: "22px",
  padding: "22px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
};

const statLabel = {
  margin: 0,
  color: "#64748b",
  fontSize: "14px",
  fontWeight: 600,
};

const statValue = {
  margin: "10px 0 6px",
  color: "#0f172a",
  fontSize: "32px",
  fontWeight: 800,
};

const statHint = {
  margin: 0,
  color: "#94a3b8",
  fontSize: "13px",
};

const contentGrid = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.25fr) minmax(300px, 0.75fr)",
  gap: "20px",
  alignItems: "start",
};

const sectionCard = {
  background: "#ffffff",
  borderRadius: "24px",
  padding: "24px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
};

const insightsCard = {
  ...sectionCard,
  height: "fit-content",
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

const listGrid = {
  display: "grid",
  gap: "16px",
  marginTop: "18px",
};

const groupCard = {
  background: "#ffffff",
  borderRadius: "20px",
  border: "1px solid #e2e8f0",
  overflow: "hidden",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
};

const imageStyle = {
  width: "100%",
  height: "180px",
  objectFit: "cover",
  display: "block",
};

const cardBody = {
  padding: "18px",
};

const chipWrap = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  margin: "12px 0 16px",
};

const chipStyle = {
  padding: "7px 12px",
  borderRadius: "999px",
  background: "#f1f5f9",
  color: "#334155",
  fontSize: "12px",
  fontWeight: 600,
};

const statusBadge = (type) => ({
  display: "inline-block",
  padding: "6px 12px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700,
  marginBottom: "12px",
  background:
    type === "joined"
      ? "#dcfce7"
      : type === "popular"
      ? "#ede9fe"
      : type === "full"
      ? "#fee2e2"
      : "#e0f2fe",
  color:
    type === "joined"
      ? "#166534"
      : type === "popular"
      ? "#5b21b6"
      : type === "full"
      ? "#b91c1c"
      : "#0369a1",
});

const progressTrack = {
  width: "100%",
  height: "10px",
  background: "#e2e8f0",
  borderRadius: "999px",
  overflow: "hidden",
  marginBottom: "14px",
};

const compactStatsGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
  marginTop: "18px",
};

const compactCard = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  padding: "16px",
};

const compactValue = {
  margin: "8px 0 4px",
  color: "#0f172a",
  fontSize: "24px",
  fontWeight: 800,
};

const featuredPanel = {
  marginTop: "16px",
  background: "linear-gradient(135deg, #eef2ff, #f5f3ff)",
  border: "1px solid #ddd6fe",
  borderRadius: "18px",
  padding: "18px",
};

const popularList = {
  display: "grid",
  gap: "12px",
  marginTop: "16px",
};

const popularItem = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "14px",
};

const emptyState = {
  textAlign: "center",
  padding: "42px 20px",
  border: "2px dashed #cbd5e1",
  borderRadius: "18px",
  color: "#64748b",
  background: "#f8fafc",
  marginTop: "16px",
};

const actionButton = {
  width: "100%",
  border: "none",
  borderRadius: "12px",
  padding: "11px 16px",
  fontWeight: 700,
  cursor: "pointer",
  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
  color: "#ffffff",
};

const viewButtonStyle = {
  ...actionButton,
  background: "#e2e8f0",
  color: "#1e293b",
  width: "50%",
};

const modalImageStyle = {
  width: "100%",
  height: "260px",
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

const membersSection = {
  marginTop: "18px",
};

const membersGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "10px",
  marginTop: "12px",
};

const memberCard = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  padding: "12px",
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
};

const modalPrimaryButton = {
  border: "none",
  borderRadius: "12px",
  padding: "11px 18px",
  fontWeight: 700,
  cursor: "pointer",
  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
  color: "#ffffff",
};

const StudyBuddyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const isUserJoined = (group) => {
    return group?.members?.some((member) => {
      const memberId = typeof member === "object" ? member._id : member;
      return String(memberId) === String(currentUserId);
    });
  };

  const isGroupFull = (group) => {
    return (group?.members?.length || 0) >= (group?.maxMembers || 0);
  };

  const getMemberNames = (group) => {
    if (!group?.members?.length) return [];
    return group.members.map((member, index) => {
      if (typeof member === "object" && member !== null) {
        return member.name || `Member ${index + 1}`;
      }
      return `Member ${index + 1}`;
    });
  };

  const stats = useMemo(() => {
    const joined = groups.filter((group) => isUserJoined(group));

    const created = groups.filter((group) => {
      const creatorId =
        typeof group.creator === "object" && group.creator !== null
          ? group.creator._id
          : group.creator;

      return String(creatorId) === String(currentUserId);
    });

    const open = groups.filter(
      (group) => (group.members?.length || 0) < (group.maxMembers || 0)
    );

    const full = groups.filter((group) => isGroupFull(group));

    return {
      total: groups.length,
      joined: joined.length,
      created: created.length,
      open: open.length,
      full: full.length,
    };
  }, [groups, currentUserId]);

  const recommendedGroups = useMemo(() => {
    return [...groups]
      .filter((group) => !isUserJoined(group) && !isGroupFull(group))
      .sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0))
      .slice(0, 3);
  }, [groups]);

  const popularGroups = useMemo(() => {
    return [...groups]
      .sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0))
      .slice(0, 3);
  }, [groups]);

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

  const modalAlreadyJoined = isUserJoined(selectedGroup);
  const modalMemberCount = selectedGroup?.members?.length || 0;
  const modalMaxMembers = selectedGroup?.maxMembers || 1;
  const modalIsFull = modalMemberCount >= modalMaxMembers;
  const modalMemberNames = getMemberNames(selectedGroup);

  return (
    <div style={pageStyle}>
      <div style={wrapperStyle}>
        <div style={heroCard}>
          <h1 style={heroTitle}>Study Buddy Dashboard</h1>
          <p style={heroText}>
            Explore study groups, track your activity, discover popular sessions,
            and manage your study collaborations in one place.
          </p>

          <div style={heroActions}>
            <button style={primaryButton} onClick={() => navigate("/buddy/create")}>
              + Create Group
            </button>
            <button style={secondaryButton} onClick={() => navigate("/buddy/find")}>
              Find Buddies
            </button>
            <button style={secondaryButton} onClick={() => navigate("/buddy/joined")}>
              Joined Groups
            </button>
          </div>
        </div>

        <div style={statsGrid}>
          <div style={statCard}>
            <p style={statLabel}>Total Groups</p>
            <h2 style={statValue}>{stats.total}</h2>
            <p style={statHint}>All study groups available</p>
          </div>

          <div style={statCard}>
            <p style={statLabel}>Joined Groups</p>
            <h2 style={statValue}>{stats.joined}</h2>
            <p style={statHint}>Groups you are currently in</p>
          </div>

          <div style={statCard}>
            <p style={statLabel}>Created by You</p>
            <h2 style={statValue}>{stats.created}</h2>
            <p style={statHint}>Groups you manage</p>
          </div>

          <div style={statCard}>
            <p style={statLabel}>Open Groups</p>
            <h2 style={statValue}>{stats.open}</h2>
            <p style={statHint}>Groups still accepting members</p>
          </div>
        </div>

        <div style={contentGrid}>
          <div style={sectionCard}>
            <h2 style={sectionTitle}>Recommended Groups</h2>
            <p style={sectionText}>
              Good groups to join right now based on open seats and popularity.
            </p>

            {recommendedGroups.length > 0 ? (
              <div style={listGrid}>
                {recommendedGroups.map((group) => {
                  const memberCount = group.members?.length || 0;
                  const maxMembers = group.maxMembers || 1;
                  const progress = Math.min((memberCount / maxMembers) * 100, 100);
                  const alreadyJoined = isUserJoined(group);
                  const isFull = isGroupFull(group);

                  return (
                    <div key={group._id} style={groupCard}>
                      {group.image ? (
                        <img src={group.image} alt={group.name} style={imageStyle} />
                      ) : null}

                      <div style={cardBody}>
                        <div style={statusBadge("popular")}>Recommended</div>

                        <h3 style={{ margin: "0 0 8px", color: "#0f172a", fontSize: "20px" }}>
                          {group.name}
                        </h3>

                        <p style={{ margin: "0 0 12px", color: "#475569", lineHeight: 1.6 }}>
                          {group.description || "No description available."}
                        </p>

                        <div style={chipWrap}>
                          <span style={chipStyle}>📘 {group.subject || "No subject"}</span>
                          <span style={chipStyle}>
                            📅 {group.selectedDays?.join(", ") || "Not set"}
                          </span>
                          <span style={chipStyle}>
                            ⏰ {group.startTime || "N/A"} - {group.endTime || "N/A"}
                          </span>
                          <span style={chipStyle}>🏢 {group.building || "No building"}</span>
                        </div>

                        <div style={{ marginBottom: "8px", color: "#475569", fontSize: "14px" }}>
                          Members: {memberCount} / {maxMembers}
                        </div>

                        <div style={progressTrack}>
                          <div
                            style={{
                              width: `${progress}%`,
                              height: "100%",
                              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                            }}
                          />
                        </div>

                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            style={viewButtonStyle}
                            onClick={() => openGroupModal(group)}
                          >
                            View
                          </button>

                          <button
                            style={{
                              ...actionButton,
                              width: "50%",
                              opacity: alreadyJoined || isFull ? 0.6 : 1,
                              cursor: alreadyJoined || isFull ? "not-allowed" : "pointer",
                            }}
                            onClick={() => handleJoinGroup(group._id)}
                            disabled={alreadyJoined || isFull}
                          >
                            {alreadyJoined ? "Joined" : isFull ? "Full" : "Join"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={emptyState}>No recommendations available right now.</div>
            )}
          </div>

          <div style={insightsCard}>
            <h2 style={sectionTitle}>Quick Insights</h2>
            <p style={sectionText}>
              A cleaner summary of your study buddy activity.
            </p>

            <div style={compactStatsGrid}>
              <div style={compactCard}>
                <p style={statLabel}>Created</p>
                <h3 style={compactValue}>{stats.created}</h3>
                <p style={statHint}>Groups you manage</p>
              </div>

              <div style={compactCard}>
                <p style={statLabel}>Joined</p>
                <h3 style={compactValue}>{stats.joined}</h3>
                <p style={statHint}>Current memberships</p>
              </div>

              <div style={compactCard}>
                <p style={statLabel}>Open</p>
                <h3 style={compactValue}>{stats.open}</h3>
                <p style={statHint}>Available to join</p>
              </div>

              <div style={compactCard}>
                <p style={statLabel}>Full</p>
                <h3 style={compactValue}>{stats.full}</h3>
                <p style={statHint}>Reached capacity</p>
              </div>
            </div>

            <div style={featuredPanel}>
              <h3 style={{ margin: "0 0 8px", color: "#312e81", fontSize: "18px" }}>
                Most Popular Right Now
              </h3>
              <p style={{ margin: 0, color: "#6366f1", fontSize: "14px" }}>
                Quick view of the most active groups on the platform.
              </p>
            </div>

            {popularGroups.length > 0 ? (
              <div style={popularList}>
                {popularGroups.map((group) => (
                  <div key={group._id} style={popularItem}>
                    <div style={statusBadge("popular")}>Popular Group</div>
                    <h3 style={{ margin: "0 0 6px", color: "#0f172a", fontSize: "17px" }}>
                      {group.name}
                    </h3>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
                      {group.members?.length || 0} members joined
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={emptyState}>No popular groups available.</div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={isModalOpen}
        onCancel={closeGroupModal}
        footer={null}
        width={780}
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

            <div
              style={statusBadge(
                modalAlreadyJoined ? "joined" : modalIsFull ? "full" : "popular"
              )}
            >
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

            <div style={membersSection}>
              <h3 style={{ margin: "0 0 8px", color: "#0f172a", fontSize: "18px" }}>
                Group Members
              </h3>
              <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
                Students currently in this group.
              </p>

              {modalMemberNames.length > 0 ? (
                <div style={membersGrid}>
                  {modalMemberNames.map((name, index) => (
                    <div key={`${name}-${index}`} style={memberCard}>
                      <p style={{ margin: 0, color: "#0f172a", fontWeight: 700 }}>
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
              <button style={modalSecondaryButton} onClick={closeGroupModal}>
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

export default StudyBuddyDashboard;