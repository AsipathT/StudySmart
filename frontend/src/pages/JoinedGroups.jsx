import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { message } from "antd";
import { useNavigate } from "react-router-dom";

const pageStyle = {
  minHeight: "100vh",
  padding: "24px",
  background: "linear-gradient(180deg, #f3f4f6 0%, #eef2f7 45%, #f8fafc 100%)",
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
    "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.14), transparent 22%), radial-gradient(circle at 85% 18%, rgba(255,255,255,0.10), transparent 20%), radial-gradient(circle at 72% 82%, rgba(255,255,255,0.08), transparent 26%)",
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
  marginTop: "10px",
  color: "rgba(255,255,255,0.9)",
  fontSize: "15px",
  lineHeight: 1.8,
  maxWidth: "760px",
  position: "relative",
  zIndex: 1,
};

const sectionCard = {
  background: "#ffffff",
  backdropFilter: "blur(14px)",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
  border: "1px solid #e2e8f0",
};

const sectionHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "24px",
};

const titleWrap = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const titleStyle = {
  margin: 0,
  fontSize: "30px",
  fontWeight: 800,
  color: "#0f172a",
  letterSpacing: "-0.6px",
};

const textStyle = {
  margin: 0,
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.7,
};

const countBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "12px 16px",
  borderRadius: "16px",
  background: "#eef2ff",
  border: "1px solid #c7d2fe",
  color: "#4f46e5",
  fontWeight: 800,
  fontSize: "14px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "20px",
};

const baseGroupCard = {
  background: "#ffffff",
  borderRadius: "24px",
  overflow: "hidden",
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
  transition: "all 0.28s ease",
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

const topRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "10px",
  marginBottom: "10px",
};

const joinedBadge = {
  display: "inline-block",
  padding: "7px 13px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 800,
  background: "#e8f7ee",
  color: "#16a34a",
  border: "1px solid rgba(255,255,255,0.7)",
};

const groupTitle = {
  margin: "0 0 8px",
  color: "#0f172a",
  fontSize: "22px",
  fontWeight: 800,
  letterSpacing: "-0.4px",
};

const groupDescription = {
  margin: "0 0 14px",
  color: "#475569",
  fontSize: "14px",
  lineHeight: 1.7,
};

const chipWrap = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  margin: "14px 0 18px",
};

const chipStyle = {
  padding: "8px 13px",
  borderRadius: "999px",
  background: "#f8fafc",
  color: "#475569",
  fontSize: "12px",
  fontWeight: 700,
  border: "1px solid #e2e8f0",
};

const progressText = {
  marginBottom: "8px",
  color: "#475569",
  fontSize: "13px",
  fontWeight: 700,
};

const progressTrack = {
  width: "100%",
  height: "12px",
  background: "#e5e7eb",
  borderRadius: "999px",
  overflow: "hidden",
  marginBottom: "18px",
};

const buttonRow = {
  display: "flex",
  gap: "10px",
};

const chatButton = {
  flex: 1,
  border: "none",
  borderRadius: "14px",
  padding: "12px",
  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(79, 70, 229, 0.25)",
  transition: "all 0.25s ease",
};

const leaveButton = {
  flex: 1,
  border: "none",
  borderRadius: "14px",
  padding: "12px",
  background: "#fef2f2",
  color: "#dc2626",
  fontWeight: 800,
  cursor: "pointer",
  transition: "all 0.25s ease",
  border: "1px solid #fecaca",
};

const emptyState = {
  textAlign: "center",
  padding: "56px 24px",
  color: "#64748b",
  background: "#f8fafc",
  border: "2px dashed #cbd5e1",
  borderRadius: "22px",
};

const JoinedGroups = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredButton, setHoveredButton] = useState("");

  const currentUserId = user?._id || user?.id;

  const getMemberId = (member) =>
    typeof member === "object" && member !== null ? member._id : member;

  const isUserInGroup = (group) =>
    group.members?.some(
      (member) => String(getMemberId(member)) === String(currentUserId)
    );

  useEffect(() => {
    if (user) fetchJoinedGroups();
  }, [user]);

  const fetchJoinedGroups = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/study-groups");
      const allGroups = res.data || [];
      const joinedGroups = allGroups.filter((group) => isUserInGroup(group));
      setGroups(joinedGroups);
    } catch (error) {
      console.error("Error fetching joined groups:", error);
    }
  };

  const handleLeaveGroup = async (group) => {
    try {
      await axios.put(
        `http://localhost:5000/api/study-groups/${group._id}/leave`,
        { userId: currentUserId }
      );

      message.success("Left group successfully");
      fetchJoinedGroups();
    } catch (error) {
      console.error("Leave group error:", error);
      message.error("Failed to leave group");
    }
  };

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
      <div style={floatingOrb("430px", "90%", "160px", "rgba(99,102,241,0.10)", "1s")}></div>
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

          <h1 style={heroTitle}>Joined Groups</h1>
          <p style={heroText}>
            These are the study groups you are currently part of. Jump back into
            conversations, stay connected, and manage your memberships easily.
          </p>
        </div>

        <div style={sectionCard}>
          <div style={sectionHeader}>
            <div style={titleWrap}>
              <h2 style={titleStyle}>Your Study Spaces</h2>
              <p style={textStyle}>
                All the groups you have already joined are shown here.
              </p>
            </div>

            <div style={countBadge}>✨ {groups.length} Joined</div>
          </div>

          {groups.length > 0 ? (
            <div style={gridStyle}>
              {groups.map((group) => {
                const cardKey = group._id;
                const memberCount = group.members?.length || 0;
                const maxMembers = group.maxMembers || 1;
                const progress = Math.min((memberCount / maxMembers) * 100, 100);

                return (
                  <div
                    key={group._id}
                    style={{
                      ...baseGroupCard,
                      transform:
                        hoveredCard === cardKey
                          ? "translateY(-7px)"
                          : "translateY(0)",
                      boxShadow:
                        hoveredCard === cardKey
                          ? "0 18px 34px rgba(59, 130, 246, 0.12)"
                          : baseGroupCard.boxShadow,
                      borderColor:
                        hoveredCard === cardKey ? "#bfdbfe" : "#e2e8f0",
                    }}
                    onMouseEnter={() => setHoveredCard(cardKey)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    {group.image && (
                      <div style={imageWrap}>
                        <img
                          src={group.image}
                          alt={group.name}
                          style={{
                            ...imageStyle,
                            transform:
                              hoveredCard === cardKey ? "scale(1.06)" : "scale(1)",
                          }}
                        />
                        <div style={imageOverlay}></div>
                      </div>
                    )}

                    <div style={cardBody}>
                      <div style={topRow}>
                        <div style={joinedBadge}>Joined</div>
                      </div>

                      <h3 style={groupTitle}>{group.name}</h3>

                      <p style={groupDescription}>
                        {group.description || "No description available."}
                      </p>

                      <div style={chipWrap}>
                        <span style={chipStyle}>📘 {group.subject || "No subject"}</span>
                        <span style={chipStyle}>
                          👥 {memberCount}/{maxMembers}
                        </span>
                        <span style={chipStyle}>
                          📅 {group.selectedDays?.join(", ") || "Not set"}
                        </span>
                        <span style={chipStyle}>
                          ⏰ {group.startTime || "N/A"} - {group.endTime || "N/A"}
                        </span>
                        <span style={chipStyle}>🏢 {group.building || "No building"}</span>
                        <span style={chipStyle}>📍 {group.hall || "No hall"}</span>
                      </div>

                      <div style={progressText}>Group capacity</div>
                      <div style={progressTrack}>
                        <div
                          style={{
                            width: `${progress}%`,
                            height: "100%",
                            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                            borderRadius: "999px",
                            transition: "width 0.35s ease",
                          }}
                        />
                      </div>

                      <div style={buttonRow}>
                        <button
                          onClick={() => navigate(`/buddy/chat/${group._id}`)}
                          onMouseEnter={() => setHoveredButton(`chat-${cardKey}`)}
                          onMouseLeave={() => setHoveredButton("")}
                          style={{
                            ...chatButton,
                            transform:
                              hoveredButton === `chat-${cardKey}`
                                ? "translateY(-2px)"
                                : "translateY(0)",
                            boxShadow:
                              hoveredButton === `chat-${cardKey}`
                                ? "0 14px 26px rgba(79, 70, 229, 0.28)"
                                : chatButton.boxShadow,
                          }}
                        >
                          💬 Chat
                        </button>

                        <button
                          onClick={() => handleLeaveGroup(group)}
                          onMouseEnter={() => setHoveredButton(`leave-${cardKey}`)}
                          onMouseLeave={() => setHoveredButton("")}
                          style={{
                            ...leaveButton,
                            transform:
                              hoveredButton === `leave-${cardKey}`
                                ? "translateY(-2px)"
                                : "translateY(0)",
                            boxShadow:
                              hoveredButton === `leave-${cardKey}`
                                ? "0 12px 22px rgba(220,38,38,0.12)"
                                : "none",
                          }}
                        >
                          Leave
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={emptyState}>
              <h3 style={{ marginTop: 0, marginBottom: "8px", color: "#334155" }}>
                No joined groups yet
              </h3>
              <p style={{ margin: 0 }}>
                You haven&apos;t joined any groups yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinedGroups;