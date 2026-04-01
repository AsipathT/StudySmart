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

const headerWrap = {
  marginBottom: "24px",
};

const titleStyle = {
  margin: 0,
  fontSize: "30px",
  fontWeight: 700,
  color: "#0f172a",
};

const subtitleStyle = {
  marginTop: "8px",
  color: "#64748b",
  fontSize: "15px",
};

const toolbarStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
  marginBottom: "24px",
  padding: "16px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
};

const inputStyle = {
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  fontSize: "14px",
  outline: "none",
  background: "#fff",
  minWidth: "220px",
  flex: 1,
};

const selectStyle = {
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  fontSize: "14px",
  outline: "none",
  background: "#fff",
  minWidth: "180px",
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

const primaryButton = {
  border: "none",
  borderRadius: "12px",
  padding: "11px 18px",
  fontWeight: 600,
  cursor: "pointer",
  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
  color: "#fff",
  boxShadow: "0 8px 20px rgba(79, 70, 229, 0.25)",
};

const emptyState = {
  textAlign: "center",
  padding: "48px 20px",
  border: "2px dashed #cbd5e1",
  borderRadius: "18px",
  color: "#64748b",
  background: "#f8fafc",
};

const statusBadge = (joined, full) => ({
  display: "inline-block",
  padding: "6px 12px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700,
  marginBottom: "12px",
  background: joined ? "#dcfce7" : full ? "#fee2e2" : "#ede9fe",
  color: joined ? "#166534" : full ? "#b91c1c" : "#5b21b6",
});

const AllGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState("");

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/study-groups");
      setGroups(res.data || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      const userId = user?._id || user?.id;

      await axios.put(`http://localhost:5000/api/study-groups/${groupId}/join`, {
        userId,
      });

      message.success("Joined group successfully");
      fetchGroups();
    } catch (error) {
      console.error("Join group error:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Failed to join group");
    }
  };

  const filteredGroups = groups.filter((group) => {
    const matchSubject =
      group.subject?.toLowerCase().includes(search.toLowerCase()) ||
      group.name?.toLowerCase().includes(search.toLowerCase());

    const matchDay = selectedDay
      ? group.selectedDays?.includes(selectedDay)
      : true;

    return matchSubject && matchDay;
  });

  return (
    <div style={pageStyle}>
      <div style={sectionCard}>
        <div style={headerWrap}>
          <h1 style={titleStyle}>All Study Groups</h1>
          <p style={subtitleStyle}>
            Browse available groups, explore details, and join the ones that match your schedule.
          </p>
        </div>

        <div style={toolbarStyle}>
          <input
            type="text"
            placeholder="Search by group name or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={inputStyle}
          />

          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
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
        </div>

        {filteredGroups.length > 0 ? (
          <div style={gridStyle}>
            {filteredGroups.map((group) => {
              const currentUserId = user?._id || user?.id;

              const alreadyJoined = group.members?.some(
                (memberId) => String(memberId) === String(currentUserId)
              );

              const isFull = (group.members?.length || 0) >= group.maxMembers;

              return (
                <div key={group._id} style={groupCard}>
                  {group.image && (
                    <img src={group.image} alt={group.name} style={imageStyle} />
                  )}

                  <div style={cardBody}>
                    <div style={statusBadge(alreadyJoined, isFull)}>
                      {alreadyJoined ? "Joined" : isFull ? "Full" : "Open"}
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

                    <button
                      onClick={() => handleJoinGroup(group._id)}
                      disabled={alreadyJoined || isFull}
                      style={{
                        ...primaryButton,
                        width: "100%",
                        opacity: alreadyJoined || isFull ? 0.6 : 1,
                        cursor: alreadyJoined || isFull ? "not-allowed" : "pointer",
                      }}
                    >
                      {alreadyJoined ? "Already Joined" : isFull ? "Group Full" : "Join Group"}
                    </button>
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
  );
};

export default AllGroups;