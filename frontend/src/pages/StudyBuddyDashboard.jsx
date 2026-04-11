import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Modal, message } from "antd";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const pageStyle = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(99,102,241,0.18), transparent 28%), radial-gradient(circle at top right, rgba(168,85,247,0.16), transparent 30%), linear-gradient(180deg, #f8fbff 0%, #eef2ff 45%, #f8fafc 100%)",
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
  opacity: 0.55,
  animation: `floaty 8s ease-in-out infinite`,
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
  background:
    "linear-gradient(135deg, #4338ca 0%, #6d28d9 42%, #9333ea 100%)",
  borderRadius: "32px",
  padding: "34px",
  color: "#ffffff",
  boxShadow: "0 25px 60px rgba(99, 102, 241, 0.35)",
  marginBottom: "24px",
  border: "1px solid rgba(255,255,255,0.16)",
};

const heroGlow = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.22), transparent 22%), radial-gradient(circle at 85% 18%, rgba(255,255,255,0.16), transparent 20%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.12), transparent 25%)",
  pointerEvents: "none",
};

const heroTitle = {
  margin: 0,
  fontSize: "38px",
  fontWeight: 800,
  letterSpacing: "-0.8px",
  position: "relative",
  zIndex: 1,
};

const heroText = {
  margin: "12px 0 0",
  maxWidth: "760px",
  lineHeight: 1.8,
  color: "rgba(255,255,255,0.88)",
  fontSize: "15px",
  position: "relative",
  zIndex: 1,
};

const heroActions = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "24px",
  position: "relative",
  zIndex: 1,
};

const primaryButton = {
  border: "none",
  borderRadius: "16px",
  padding: "13px 22px",
  fontWeight: 800,
  cursor: "pointer",
  background: "#ffffff",
  color: "#4338ca",
  boxShadow: "0 12px 25px rgba(255,255,255,0.18)",
  transition: "all 0.25s ease",
};

const secondaryButton = {
  border: "1px solid rgba(255,255,255,0.22)",
  borderRadius: "16px",
  padding: "13px 22px",
  fontWeight: 800,
  cursor: "pointer",
  background: "rgba(255,255,255,0.12)",
  backdropFilter: "blur(10px)",
  color: "#ffffff",
  transition: "all 0.25s ease",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
  marginBottom: "24px",
};

const statCard = {
  background: "rgba(255,255,255,0.78)",
  backdropFilter: "blur(14px)",
  borderRadius: "24px",
  padding: "22px",
  border: "1px solid rgba(226,232,240,0.9)",
  boxShadow: "0 16px 35px rgba(15, 23, 42, 0.08)",
  position: "relative",
  overflow: "hidden",
};

const statAccent = (bg) => ({
  position: "absolute",
  top: "-24px",
  right: "-18px",
  width: "90px",
  height: "90px",
  borderRadius: "50%",
  background: bg,
  opacity: 0.18,
});

const statLabel = {
  margin: 0,
  color: "#64748b",
  fontSize: "14px",
  fontWeight: 700,
  position: "relative",
  zIndex: 1,
};

const statValue = {
  margin: "10px 0 6px",
  color: "#0f172a",
  fontSize: "33px",
  fontWeight: 800,
  position: "relative",
  zIndex: 1,
};

const statHint = {
  margin: 0,
  color: "#94a3b8",
  fontSize: "13px",
  position: "relative",
  zIndex: 1,
};

const contentGrid = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.25fr) minmax(320px, 0.75fr)",
  gap: "20px",
  alignItems: "start",
};

const sectionCard = {
  background: "rgba(255,255,255,0.78)",
  backdropFilter: "blur(14px)",
  borderRadius: "28px",
  padding: "24px",
  border: "1px solid rgba(226,232,240,0.9)",
  boxShadow: "0 16px 35px rgba(15, 23, 42, 0.08)",
};

const insightsCard = {
  ...sectionCard,
  height: "fit-content",
  position: "sticky",
  top: "20px",
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

const listGrid = {
  display: "grid",
  gap: "18px",
  marginTop: "20px",
};

const groupCard = {
  background: "rgba(255,255,255,0.94)",
  borderRadius: "24px",
  border: "1px solid #e2e8f0",
  overflow: "hidden",
  boxShadow: "0 16px 35px rgba(15, 23, 42, 0.08)",
  transition: "all 0.3s ease",
};

const imageWrapStyle = {
  position: "relative",
};

const imageOverlay = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(to top, rgba(15,23,42,0.35), rgba(15,23,42,0.02))",
};

const imageStyle = {
  width: "100%",
  height: "210px",
  objectFit: "cover",
  display: "block",
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
  background: "linear-gradient(135deg, #f8fafc, #eef2ff)",
  color: "#334155",
  fontSize: "12px",
  fontWeight: 700,
  border: "1px solid #e2e8f0",
};

const statusBadge = (type) => ({
  display: "inline-block",
  padding: "7px 13px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 800,
  marginBottom: "12px",
  background:
    type === "joined"
      ? "linear-gradient(135deg, #dcfce7, #bbf7d0)"
      : type === "popular"
      ? "linear-gradient(135deg, #ede9fe, #ddd6fe)"
      : type === "full"
      ? "linear-gradient(135deg, #fee2e2, #fecaca)"
      : "linear-gradient(135deg, #e0f2fe, #bae6fd)",
  color:
    type === "joined"
      ? "#166534"
      : type === "popular"
      ? "#5b21b6"
      : type === "full"
      ? "#b91c1c"
      : "#0369a1",
  border: "1px solid rgba(255,255,255,0.6)",
});

const progressTrack = {
  width: "100%",
  height: "12px",
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
  background: "linear-gradient(135deg, #ffffff, #f8fafc)",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  padding: "16px",
  boxShadow: "0 10px 20px rgba(15, 23, 42, 0.05)",
};

const compactValue = {
  margin: "8px 0 4px",
  color: "#0f172a",
  fontSize: "24px",
  fontWeight: 800,
};

const featuredPanel = {
  marginTop: "18px",
  background:
    "linear-gradient(135deg, rgba(238,242,255,1), rgba(245,243,255,1), rgba(250,245,255,1))",
  border: "1px solid #ddd6fe",
  borderRadius: "20px",
  padding: "18px",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
};

const popularList = {
  display: "grid",
  gap: "12px",
  marginTop: "16px",
};

const popularItem = {
  background: "linear-gradient(135deg, #ffffff, #f8fafc)",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  padding: "15px",
  boxShadow: "0 10px 22px rgba(15, 23, 42, 0.05)",
};

const emptyState = {
  textAlign: "center",
  padding: "42px 20px",
  border: "2px dashed #cbd5e1",
  borderRadius: "20px",
  color: "#64748b",
  background: "linear-gradient(135deg, #f8fafc, #eef2ff)",
  marginTop: "16px",
};

const actionButton = {
  width: "100%",
  border: "none",
  borderRadius: "14px",
  padding: "12px 16px",
  fontWeight: 800,
  cursor: "pointer",
  background: "linear-gradient(135deg, #4f46e5, #7c3aed, #9333ea)",
  color: "#ffffff",
  boxShadow: "0 14px 26px rgba(99, 102, 241, 0.22)",
  transition: "all 0.25s ease",
};

const viewButtonStyle = {
  ...actionButton,
  background: "linear-gradient(135deg, #f8fafc, #e2e8f0)",
  color: "#1e293b",
  boxShadow: "none",
  width: "50%",
};

const modalImageStyle = {
  width: "100%",
  height: "280px",
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
  letterSpacing: "-0.7px",
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
  background: "linear-gradient(135deg, #ffffff, #f8fafc)",
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
  background: "linear-gradient(135deg, #ffffff, #f8fafc)",
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
  background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
  color: "#1e293b",
};

const modalPrimaryButton = {
  border: "none",
  borderRadius: "14px",
  padding: "12px 18px",
  fontWeight: 800,
  cursor: "pointer",
  background: "linear-gradient(135deg, #4f46e5, #7c3aed, #9333ea)",
  color: "#ffffff",
  boxShadow: "0 14px 26px rgba(99, 102, 241, 0.22)",
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
      <style>
        {`
          @keyframes floaty {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-18px) translateX(10px); }
          }

          @keyframes shineMove {
            0% { transform: translateX(-120%); }
            100% { transform: translateX(220%); }
          }

          .study-dashboard-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
          }

          .study-dashboard-btn:hover {
            transform: translateY(-2px) scale(1.01);
          }

          .study-dashboard-stat:hover {
            transform: translateY(-4px);
            box-shadow: 0 18px 35px rgba(15, 23, 42, 0.10);
          }
        `}
      </style>

      <div style={floatingOrb("80px", "-40px", "180px", "rgba(129,140,248,0.28)")}></div>
      <div style={floatingOrb("420px", "90%", "160px", "rgba(192,132,252,0.25)", "1s")}></div>
      <div style={floatingOrb("75%", "5%", "130px", "rgba(96,165,250,0.20)", "2s")}></div>

      <div style={wrapperStyle}>
        <div style={heroCard}>
          <div style={heroGlow}></div>

          <div
            style={{
              position: "absolute",
              top: "-20px",
              right: "-60px",
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.10)",
              filter: "blur(3px)",
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
              background: "rgba(255,255,255,0.09)",
            }}
          ></div>

          <h1 style={heroTitle}>Study Buddy Dashboard</h1>
          <p style={heroText}>
            Explore study groups, track your activity, discover popular sessions,
            and manage your study collaborations in one beautiful space.
          </p>

          <div style={heroActions}>
            <button
              className="study-dashboard-btn"
              style={primaryButton}
              onClick={() => navigate("/buddy/create")}
            >
              + Create Group
            </button>
            <button
              className="study-dashboard-btn"
              style={secondaryButton}
              onClick={() => navigate("/buddy/find")}
            >
              Find Buddies
            </button>
            <button
              className="study-dashboard-btn"
              style={secondaryButton}
              onClick={() => navigate("/buddy/joined")}
            >
              Joined Groups
            </button>
          </div>
        </div>

        <div style={statsGrid}>
          <div className="study-dashboard-stat" style={statCard}>
            <div style={statAccent("linear-gradient(135deg, #6366f1, #8b5cf6)")}></div>
            <p style={statLabel}>Total Groups</p>
            <h2 style={statValue}>{stats.total}</h2>
            <p style={statHint}>All study groups available</p>
          </div>

          <div className="study-dashboard-stat" style={statCard}>
            <div style={statAccent("linear-gradient(135deg, #22c55e, #4ade80)")}></div>
            <p style={statLabel}>Joined Groups</p>
            <h2 style={statValue}>{stats.joined}</h2>
            <p style={statHint}>Groups you are currently in</p>
          </div>

          <div className="study-dashboard-stat" style={statCard}>
            <div style={statAccent("linear-gradient(135deg, #ec4899, #f97316)")}></div>
            <p style={statLabel}>Created by You</p>
            <h2 style={statValue}>{stats.created}</h2>
            <p style={statHint}>Groups you manage</p>
          </div>

          <div className="study-dashboard-stat" style={statCard}>
            <div style={statAccent("linear-gradient(135deg, #06b6d4, #3b82f6)")}></div>
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
                    <div key={group._id} className="study-dashboard-card" style={groupCard}>
                      {group.image ? (
                        <div style={imageWrapStyle}>
                          <img src={group.image} alt={group.name} style={imageStyle} />
                          <div style={imageOverlay}></div>
                        </div>
                      ) : null}

                      <div style={cardBody}>
                        <div style={statusBadge("popular")}>Recommended</div>

                        <h3
                          style={{
                            margin: "0 0 8px",
                            color: "#0f172a",
                            fontSize: "22px",
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
                          <span style={chipStyle}>
                            📅 {group.selectedDays?.join(", ") || "Not set"}
                          </span>
                          <span style={chipStyle}>
                            ⏰ {group.startTime || "N/A"} - {group.endTime || "N/A"}
                          </span>
                          <span style={chipStyle}>🏢 {group.building || "No building"}</span>
                        </div>

                        <div
                          style={{
                            marginBottom: "8px",
                            color: "#475569",
                            fontSize: "14px",
                            fontWeight: 700,
                          }}
                        >
                          Members: {memberCount} / {maxMembers}
                        </div>

                        <div style={progressTrack}>
                          <div
                            style={{
                              width: `${progress}%`,
                              height: "100%",
                              background:
                                "linear-gradient(135deg, #4f46e5, #7c3aed, #9333ea)",
                              borderRadius: "999px",
                            }}
                          />
                        </div>

                        <div style={{ display: "flex", gap: "10px" }}>
                          <button
                            className="study-dashboard-btn"
                            style={viewButtonStyle}
                            onClick={() => openGroupModal(group)}
                          >
                            View
                          </button>

                          <button
                            className="study-dashboard-btn"
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
              <p style={{ margin: 0, color: "#6366f1", fontSize: "14px", lineHeight: 1.7 }}>
                Quick view of the most active groups on the platform.
              </p>
            </div>

            {popularGroups.length > 0 ? (
              <div style={popularList}>
                {popularGroups.map((group) => (
                  <div key={group._id} style={popularItem}>
                    <div style={statusBadge("popular")}>Popular Group</div>
                    <h3
                      style={{
                        margin: "0 0 6px",
                        color: "#0f172a",
                        fontSize: "17px",
                        fontWeight: 800,
                      }}
                    >
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
        width={820}
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

            <div style={{ marginTop: "20px" }}>
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
                    background:
                      "linear-gradient(135deg, #4f46e5, #7c3aed, #9333ea)",
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
                      <p
                        style={{
                          margin: 0,
                          color: "#0f172a",
                          fontWeight: 800,
                          fontSize: "14px",
                        }}
                      >
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