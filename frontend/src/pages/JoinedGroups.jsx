import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { message } from "antd";

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

const groupCard = {
  background: "#ffffff",
  borderRadius: "20px",
  overflow: "hidden",
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
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
  fontWeight: 500,
};

const dangerButton = {
  border: "none",
  borderRadius: "12px",
  padding: "11px 18px",
  fontWeight: 600,
  cursor: "pointer",
  background: "#fef2f2",
  color: "#dc2626",
  width: "100%",
};

const emptyState = {
  textAlign: "center",
  padding: "48px 20px",
  border: "2px dashed #cbd5e1",
  borderRadius: "18px",
  color: "#64748b",
  background: "#f8fafc",
};

const JoinedGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    if (user) fetchJoinedGroups();
  }, [user]);

  const fetchJoinedGroups = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/study-groups");
      const allGroups = res.data || [];
      const currentUserId = user?._id || user?.id;

      const joinedGroups = allGroups.filter((group) =>
        group.members?.some((memberId) => String(memberId) === String(currentUserId))
      );

      setGroups(joinedGroups);
    } catch (error) {
      console.error("Error fetching joined groups:", error);
    }
  };

  const handleLeaveGroup = async (group) => {
    try {
      const currentUserId = user?._id || user?.id;

      const matchedMemberId = group.members?.find(
        (memberId) => String(memberId) === String(currentUserId)
      );

      const userIdToSend = matchedMemberId || currentUserId;

      if (!userIdToSend) {
        alert("Could not identify current user");
        return;
      }

      await axios.put(`http://localhost:5000/api/study-groups/${group._id}/leave`, {
        userId: userIdToSend,
      });

      message.success("Left group successfully");
      fetchJoinedGroups();
    } catch (error) {
      console.error("Leave group error:", error.response?.data || error.message);
      message.error(error.response?.data?.message || "Failed to leave group");
    }
  };

  return (
    <div style={pageStyle}>
      <div style={sectionCard}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ margin: 0, fontSize: "30px", fontWeight: 700, color: "#0f172a" }}>
            Joined Groups
          </h1>
          <p style={{ marginTop: "8px", color: "#64748b", fontSize: "15px" }}>
            These are the study groups you are currently part of.
          </p>
        </div>

        {groups.length > 0 ? (
          <div style={gridStyle}>
            {groups.map((group) => (
              <div key={group._id} style={groupCard}>
                {group.image && <img src={group.image} alt={group.name} style={imageStyle} />}

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

                  <h3 style={{ margin: "0 0 8px", color: "#0f172a", fontSize: "20px" }}>
                    {group.name}
                  </h3>

                  <p style={{ margin: "0 0 12px", color: "#475569", lineHeight: 1.6 }}>
                    {group.description || "No description available."}
                  </p>

                  <div style={chipWrap}>
                    <span style={chipStyle}>📘 {group.subject || "No subject"}</span>
                    <span style={chipStyle}>
                      👥 {group.members?.length || 0} / {group.maxMembers}
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

                  <button onClick={() => handleLeaveGroup(group)} style={dangerButton}>
                    Leave Group
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={emptyState}>You haven't joined any groups yet.</div>
        )}
      </div>
    </div>
  );
};

export default JoinedGroups;