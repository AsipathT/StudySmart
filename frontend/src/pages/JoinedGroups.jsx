import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { message } from "antd";
import { useNavigate } from "react-router-dom";

const pageStyle = {
  padding: "20px",
  background: "#f8fafc",
  minHeight: "100vh",
};

const sectionCard = {
  background: "#ffffff",
  borderRadius: "24px",
  padding: "28px",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
  border: "1px solid #e2e8f0",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "18px",
};

const baseGroupCard = {
  background: "#ffffff",
  borderRadius: "20px",
  overflow: "hidden",
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
  transition: "all 0.25s ease",
};

const imageStyle = {
  width: "100%",
  height: "190px",
  objectFit: "cover",
};

const cardBody = {
  padding: "18px",
};

const chipWrap = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  margin: "14px 0",
};

const chipStyle = {
  padding: "7px 12px",
  borderRadius: "999px",
  background: "#f1f5f9",
  color: "#334155",
  fontSize: "13px",
};

const JoinedGroups = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);

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
      <div style={sectionCard}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ margin: 0, fontSize: "30px", fontWeight: 700 }}>
            Joined Groups
          </h1>
          <p style={{ marginTop: "8px", color: "#64748b" }}>
            These are the study groups you are currently part of.
          </p>
        </div>

        {groups.length > 0 ? (
          <div style={gridStyle}>
            {groups.map((group) => {
              const cardKey = group._id;

              return (
                <div
                  key={group._id}
                  style={{
                    ...baseGroupCard,
                    transform:
                      hoveredCard === cardKey
                        ? "translateY(-6px)"
                        : "translateY(0)",
                    boxShadow:
                      hoveredCard === cardKey
                        ? "0 18px 36px rgba(79, 70, 229, 0.14)"
                        : baseGroupCard.boxShadow,
                  }}
                  onMouseEnter={() => setHoveredCard(cardKey)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {group.image && (
                    <img
                      src={group.image}
                      alt={group.name}
                      style={imageStyle}
                    />
                  )}

                  <div style={cardBody}>
                    <div
                      style={{
                        display: "inline-block",
                        padding: "6px 12px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: 700,
                        marginBottom: "12px",
                        background: "#dcfce7",
                        color: "#166534",
                      }}
                    >
                      Joined
                    </div>

                    <h3 style={{ margin: "0 0 8px" }}>{group.name}</h3>

                    <p style={{ color: "#475569" }}>
                      {group.description || "No description available."}
                    </p>

                    <div style={chipWrap}>
                      <span style={chipStyle}>📘 {group.subject}</span>
                      <span style={chipStyle}>
                        👥 {group.members?.length}/{group.maxMembers}
                      </span>
                      <span style={chipStyle}>
                        📅 {group.selectedDays?.join(", ")}
                      </span>
                      <span style={chipStyle}>
                        ⏰ {group.startTime} - {group.endTime}
                      </span>
                      <span style={chipStyle}>🏢 {group.building}</span>
                      <span style={chipStyle}>📍 {group.hall}</span>
                    </div>

                    {/* BUTTONS */}
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        onClick={() =>
                          navigate(`/buddy/chat/${group._id}`)
                        }
                        style={{
                          flex: 1,
                          border: "none",
                          borderRadius: "12px",
                          padding: "10px",
                          background:
                            "linear-gradient(135deg,#4f46e5,#7c3aed)",
                          color: "#fff",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        💬 Chat
                      </button>

                      <button
                        onClick={() => handleLeaveGroup(group)}
                        style={{
                          flex: 1,
                          border: "none",
                          borderRadius: "12px",
                          padding: "10px",
                          background: "#fef2f2",
                          color: "#dc2626",
                          fontWeight: "600",
                          cursor: "pointer",
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
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#64748b",
            }}
          >
            You haven't joined any groups yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinedGroups;