import React, { useEffect, useState } from "react";
import axios from "axios";
import { Select, TimePicker, Modal, message } from "antd";
import dayjs from "dayjs";
import { useAuth } from "../hooks/useAuth";

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
  marginBottom: "28px",
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

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
  gap: "18px",
};

const baseGroupCard = {
  background: "#ffffff",
  borderRadius: "22px",
  overflow: "hidden",
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
  transition: "transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease",
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

const badgeStyle = {
  display: "inline-block",
  padding: "6px 12px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700,
  marginBottom: "12px",
  background: "#ede9fe",
  color: "#5b21b6",
};

const descriptionStyle = {
  margin: "0 0 14px",
  color: "#475569",
  lineHeight: 1.6,
  fontSize: "14px",
};

const chipWrap = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "14px",
  marginBottom: "18px",
};

const chipStyle = {
  padding: "7px 12px",
  borderRadius: "999px",
  background: "#f1f5f9",
  color: "#334155",
  fontSize: "13px",
  fontWeight: 500,
  transition: "all 0.2s ease",
};

const actionRow = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "10px",
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
  transition: "all 0.25s ease",
};

const secondaryButton = {
  border: "none",
  borderRadius: "12px",
  padding: "11px 18px",
  fontWeight: 600,
  cursor: "pointer",
  background: "#eef2ff",
  color: "#4338ca",
  transition: "all 0.25s ease",
};

const neutralButton = {
  border: "none",
  borderRadius: "12px",
  padding: "11px 18px",
  fontWeight: 600,
  cursor: "pointer",
  background: "#e2e8f0",
  color: "#1e293b",
  transition: "all 0.25s ease",
};

const dangerButton = {
  border: "none",
  borderRadius: "12px",
  padding: "11px 18px",
  fontWeight: 600,
  cursor: "pointer",
  background: "#fef2f2",
  color: "#dc2626",
  transition: "all 0.25s ease",
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "16px",
};

const fullWidth = {
  gridColumn: "1 / -1",
};

const fieldBox = {
  display: "flex",
  flexDirection: "column",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontWeight: 600,
  color: "#334155",
  fontSize: "14px",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};

const emptyState = {
  textAlign: "center",
  padding: "48px 20px",
  border: "2px dashed #cbd5e1",
  borderRadius: "18px",
  color: "#64748b",
  background: "#f8fafc",
};

const modalSectionTitle = {
  margin: "0 0 6px",
  fontSize: "22px",
  fontWeight: 700,
  color: "#0f172a",
};

const modalSectionText = {
  margin: "0 0 20px",
  color: "#64748b",
  fontSize: "14px",
};

const buildingOptions = {
  "Main Building": [
    "A101", "A102", "A201", "A202", "A301", "A302", "A401", "A402", "A501", "A502",
  ],
  "New Building": [
    "F301", "F401", "F501", "F601", "F701", "F801", "F901", "F1001", "F1101", "F1201", "F1301",
  ],
};

const MyGroups = () => {
  const { user } = useAuth();

  const [groups, setGroups] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredButton, setHoveredButton] = useState("");

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    subject: "",
    maxMembers: 5,
    image: "",
    selectedDays: [],
    startTime: "",
    endTime: "",
    building: "",
    hall: "",
  });

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  const fetchGroups = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/study-groups");
      const allGroups = res.data || [];

      const currentUserId = user?._id || user?.id;

      const myCreatedGroups = allGroups.filter((group) => {
        const creatorId =
          typeof group.creator === "object" && group.creator !== null
            ? group.creator._id
            : group.creator;

        return String(creatorId) === String(currentUserId);
      });

      setGroups(myCreatedGroups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      message.error("Failed to fetch groups");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/study-groups/${id}`);
      message.success("Group deleted successfully");
      fetchGroups();
    } catch (error) {
      console.error("Error deleting group:", error);
      message.error("Failed to delete group");
    }
  };

  const openEditModal = (group) => {
    setEditingGroupId(group._id);
    setEditForm({
      name: group.name || "",
      description: group.description || "",
      subject: group.subject || "",
      maxMembers: group.maxMembers || 5,
      image: group.image || "",
      selectedDays: group.selectedDays || [],
      startTime: group.startTime || "",
      endTime: group.endTime || "",
      building: group.building || "",
      hall: group.hall || "",
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingGroupId(null);
    setEditForm({
      name: "",
      description: "",
      subject: "",
      maxMembers: 5,
      image: "",
      selectedDays: [],
      startTime: "",
      endTime: "",
      building: "",
      hall: "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    if (name === "building") {
      setEditForm((prev) => ({
        ...prev,
        building: value,
        hall: "",
      }));
      return;
    }

    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDaysChange = (value) => {
    setEditForm((prev) => ({ ...prev, selectedDays: value }));
  };

  const handleStartTimeChange = (_, timeString) => {
    setEditForm((prev) => ({ ...prev, startTime: timeString }));
  };

  const handleEndTimeChange = (_, timeString) => {
    setEditForm((prev) => ({ ...prev, endTime: timeString }));
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`http://localhost:5000/api/study-groups/${editingGroupId}`, {
        name: editForm.name,
        description: editForm.description,
        subject: editForm.subject,
        maxMembers: Number(editForm.maxMembers),
        image: editForm.image,
        selectedDays: editForm.selectedDays,
        startTime: editForm.startTime,
        endTime: editForm.endTime,
        building: editForm.building,
        hall: editForm.hall,
      });

      message.success("Group updated successfully");
      closeEditModal();
      fetchGroups();
    } catch (error) {
      console.error("Error updating group:", error);
      message.error("Failed to update group");
    }
  };

  return (
    <div style={pageStyle}>
      <div style={sectionCard}>
        <div style={headerWrap}>
          <h1 style={titleStyle}>My Groups</h1>
          <p style={subtitleStyle}>
            Edit or delete the study groups you created.
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
                  {group.image && (
                    <img
                      src={group.image}
                      alt={group.name}
                      style={{
                        ...imageStyle,
                        transform: hoveredCard === cardKey ? "scale(1.05)" : "scale(1)",
                      }}
                    />
                  )}

                  <div style={cardBody}>
                    <div style={badgeStyle}>Your Group</div>

                    <h3
                      style={{
                        margin: "0 0 8px",
                        color: "#0f172a",
                        fontSize: "21px",
                        fontWeight: 700,
                      }}
                    >
                      {group.name}
                    </h3>

                    <p style={descriptionStyle}>
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
                        ⏰ {group.startTime || "Not set"} - {group.endTime || "Not set"}
                      </span>
                      <span style={chipStyle}>🏢 {group.building || "Not set"}</span>
                      <span style={chipStyle}>📍 {group.hall || "Not set"}</span>
                    </div>

                    <div style={actionRow}>
                      <button
                        onMouseEnter={() => setHoveredButton(`edit-${cardKey}`)}
                        onMouseLeave={() => setHoveredButton("")}
                        onClick={() => openEditModal(group)}
                        style={{
                          ...secondaryButton,
                          transform:
                            hoveredButton === `edit-${cardKey}` ? "translateY(-2px)" : "translateY(0)",
                          boxShadow:
                            hoveredButton === `edit-${cardKey}`
                              ? "0 10px 20px rgba(67, 56, 202, 0.12)"
                              : "none",
                        }}
                      >
                        Edit
                      </button>

                      <button
                        onMouseEnter={() => setHoveredButton(`delete-${cardKey}`)}
                        onMouseLeave={() => setHoveredButton("")}
                        onClick={() => handleDelete(group._id)}
                        style={{
                          ...dangerButton,
                          transform:
                            hoveredButton === `delete-${cardKey}` ? "translateY(-2px)" : "translateY(0)",
                          boxShadow:
                            hoveredButton === `delete-${cardKey}`
                              ? "0 10px 20px rgba(220, 38, 38, 0.12)"
                              : "none",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={emptyState}>You haven't created any groups yet.</div>
        )}
      </div>

      <Modal
        open={isEditModalOpen}
        onCancel={closeEditModal}
        footer={null}
        width={820}
        centered
      >
        <div>
          <h2 style={modalSectionTitle}>Edit Group</h2>
          <p style={modalSectionText}>
            Update your group details in this popup without stretching the cards.
          </p>

          <div style={formGrid}>
            <div style={fieldBox}>
              <label style={labelStyle}>Group Name</label>
              <input
                type="text"
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                placeholder="Group Name"
                style={inputStyle}
              />
            </div>

            <div style={fieldBox}>
              <label style={labelStyle}>Subject</label>
              <input
                type="text"
                name="subject"
                value={editForm.subject}
                onChange={handleEditChange}
                placeholder="Subject"
                style={inputStyle}
              />
            </div>

            <div style={{ ...fieldBox, ...fullWidth }}>
              <label style={labelStyle}>Description</label>
              <textarea
                name="description"
                value={editForm.description}
                onChange={handleEditChange}
                placeholder="Description"
                style={{
                  ...inputStyle,
                  minHeight: "100px",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={fieldBox}>
              <label style={labelStyle}>Max Members</label>
              <input
                type="number"
                name="maxMembers"
                value={editForm.maxMembers}
                onChange={handleEditChange}
                placeholder="Max Members"
                style={inputStyle}
              />
            </div>

            <div style={fieldBox}>
              <label style={labelStyle}>Image URL</label>
              <input
                type="text"
                name="image"
                value={editForm.image}
                onChange={handleEditChange}
                placeholder="Image URL"
                style={inputStyle}
              />
            </div>

            <div style={fieldBox}>
              <label style={labelStyle}>Select Days</label>
              <Select
                mode="multiple"
                placeholder="Choose days"
                value={editForm.selectedDays}
                onChange={handleDaysChange}
                style={{ width: "100%" }}
                options={[
                  { value: "Monday", label: "Monday" },
                  { value: "Tuesday", label: "Tuesday" },
                  { value: "Wednesday", label: "Wednesday" },
                  { value: "Thursday", label: "Thursday" },
                  { value: "Friday", label: "Friday" },
                  { value: "Saturday", label: "Saturday" },
                  { value: "Sunday", label: "Sunday" },
                ]}
              />
            </div>

            <div style={fieldBox}>
              <label style={labelStyle}>Building</label>
              <select
                name="building"
                value={editForm.building}
                onChange={handleEditChange}
                style={inputStyle}
              >
                <option value="">Select Building</option>
                <option value="Main Building">Main Building</option>
                <option value="New Building">New Building</option>
              </select>
            </div>

            <div style={fieldBox}>
              <label style={labelStyle}>Start Time</label>
              <TimePicker
                use12Hours
                format="h:mm A"
                value={editForm.startTime ? dayjs(editForm.startTime, "h:mm A") : null}
                onChange={handleStartTimeChange}
                style={{ width: "100%", height: "46px", borderRadius: "12px" }}
              />
            </div>

            <div style={fieldBox}>
              <label style={labelStyle}>End Time</label>
              <TimePicker
                use12Hours
                format="h:mm A"
                value={editForm.endTime ? dayjs(editForm.endTime, "h:mm A") : null}
                onChange={handleEndTimeChange}
                style={{ width: "100%", height: "46px", borderRadius: "12px" }}
              />
            </div>

            <div style={fieldBox}>
              <label style={labelStyle}>Hall</label>
              <select
                name="hall"
                value={editForm.hall}
                onChange={handleEditChange}
                style={inputStyle}
                disabled={!editForm.building}
              >
                <option value="">Select Hall</option>
                {(buildingOptions[editForm.building] || []).map((hall) => (
                  <option key={hall} value={hall}>
                    {hall}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ ...actionRow, marginTop: "24px", justifyContent: "flex-end" }}>
            <button style={neutralButton} onClick={closeEditModal}>
              Cancel
            </button>
            <button style={primaryButton} onClick={handleUpdate}>
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyGroups;