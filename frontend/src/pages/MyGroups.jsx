import React, { useEffect, useState } from "react";
import axios from "axios";
import { Select, TimePicker, Modal, message } from "antd";
import dayjs from "dayjs";
import { useAuth } from "../hooks/useAuth";

const pageStyle = {
  minHeight: "100vh",
  padding: "24px",
  background:
    "radial-gradient(circle at top left, rgba(99,102,241,0.16), transparent 26%), radial-gradient(circle at top right, rgba(168,85,247,0.14), transparent 28%), linear-gradient(180deg, #f8fbff 0%, #eef2ff 45%, #f8fafc 100%)",
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
  opacity: 0.5,
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
  background:
    "linear-gradient(135deg, #0f172a 0%, #312e81 38%, #6d28d9 72%, #9333ea 100%)",
  borderRadius: "30px",
  padding: "32px",
  color: "#ffffff",
  boxShadow: "0 24px 55px rgba(79, 70, 229, 0.24)",
  marginBottom: "24px",
  border: "1px solid rgba(255,255,255,0.12)",
};

const heroGlow = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.16), transparent 22%), radial-gradient(circle at 85% 18%, rgba(255,255,255,0.12), transparent 20%), radial-gradient(circle at 72% 82%, rgba(255,255,255,0.08), transparent 26%)",
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
  background: "rgba(255,255,255,0.82)",
  backdropFilter: "blur(14px)",
  borderRadius: "28px",
  padding: "24px",
  boxShadow: "0 16px 35px rgba(15, 23, 42, 0.08)",
  border: "1px solid rgba(226,232,240,0.95)",
};

const headerWrap = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "16px",
  marginBottom: "28px",
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

const subtitleStyle = {
  margin: 0,
  color: "#64748b",
  fontSize: "15px",
  lineHeight: 1.7,
};

const summaryBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "12px 16px",
  borderRadius: "16px",
  background: "linear-gradient(135deg, #eef2ff, #f5f3ff)",
  border: "1px solid #ddd6fe",
  color: "#4f46e5",
  fontWeight: 800,
  fontSize: "14px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
  gap: "20px",
};

const baseGroupCard = {
  background: "rgba(255,255,255,0.96)",
  borderRadius: "24px",
  overflow: "hidden",
  border: "1px solid #e2e8f0",
  boxShadow: "0 14px 30px rgba(15, 23, 42, 0.08)",
  transition: "transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease",
};

const imageWrap = {
  position: "relative",
  overflow: "hidden",
};

const imageOverlay = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(to top, rgba(15,23,42,0.34), rgba(15,23,42,0.04))",
};

const imageStyle = {
  width: "100%",
  height: "220px",
  objectFit: "cover",
  display: "block",
  transition: "transform 0.35s ease",
};

const cardBody = {
  padding: "20px",
};

const badgeStyle = {
  display: "inline-block",
  padding: "7px 13px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 800,
  marginBottom: "12px",
  background: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
  color: "#5b21b6",
  border: "1px solid rgba(255,255,255,0.7)",
};

const descriptionStyle = {
  margin: "0 0 14px",
  color: "#475569",
  lineHeight: 1.7,
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
  padding: "8px 13px",
  borderRadius: "999px",
  background: "linear-gradient(135deg, #f8fafc, #eef2ff)",
  color: "#334155",
  fontSize: "12px",
  fontWeight: 700,
  transition: "all 0.2s ease",
  border: "1px solid #e2e8f0",
};

const progressLabel = {
  marginBottom: "8px",
  color: "#475569",
  fontSize: "13px",
  fontWeight: 700,
};

const progressTrack = {
  width: "100%",
  height: "12px",
  background: "#e2e8f0",
  borderRadius: "999px",
  overflow: "hidden",
  marginBottom: "18px",
};

const actionRow = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "10px",
};

const primaryButton = {
  border: "none",
  borderRadius: "14px",
  padding: "12px 18px",
  fontWeight: 800,
  cursor: "pointer",
  background: "linear-gradient(135deg, #4f46e5, #7c3aed, #9333ea)",
  color: "#fff",
  boxShadow: "0 12px 22px rgba(99,102,241,0.18)",
  transition: "all 0.25s ease",
};

const secondaryButton = {
  border: "none",
  borderRadius: "14px",
  padding: "12px 18px",
  fontWeight: 800,
  cursor: "pointer",
  background: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
  color: "#4338ca",
  transition: "all 0.25s ease",
};

const neutralButton = {
  border: "none",
  borderRadius: "14px",
  padding: "12px 18px",
  fontWeight: 800,
  cursor: "pointer",
  background: "linear-gradient(135deg, #f8fafc, #e2e8f0)",
  color: "#1e293b",
  transition: "all 0.25s ease",
};

const dangerButton = {
  border: "none",
  borderRadius: "14px",
  padding: "12px 18px",
  fontWeight: 800,
  cursor: "pointer",
  background: "linear-gradient(135deg, #fff1f2, #fee2e2)",
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
  fontWeight: 700,
  color: "#334155",
  fontSize: "14px",
};

const inputStyle = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: "14px",
  border: "1px solid #dbe2ea",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
};

const emptyState = {
  textAlign: "center",
  padding: "56px 24px",
  border: "2px dashed #cbd5e1",
  borderRadius: "22px",
  color: "#64748b",
  background: "linear-gradient(135deg, #f8fafc, #eef2ff)",
};

const modalSectionTitle = {
  margin: "0 0 8px",
  fontSize: "28px",
  fontWeight: 800,
  color: "#0f172a",
  letterSpacing: "-0.5px",
};

const modalSectionText = {
  margin: "0 0 22px",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.7,
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
      <style>
        {`
          @keyframes floaty {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-18px) translateX(10px); }
          }
        `}
      </style>

      <div style={floatingOrb("80px", "-40px", "180px", "rgba(129,140,248,0.28)")}></div>
      <div style={floatingOrb("430px", "90%", "160px", "rgba(192,132,252,0.24)", "1s")}></div>
      <div style={floatingOrb("78%", "6%", "130px", "rgba(96,165,250,0.18)", "2s")}></div>

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

          <h1 style={heroTitle}>My Groups</h1>
          <p style={heroText}>
            Manage the study groups you created, keep details updated, and make your groups look organized and inviting.
          </p>
        </div>

        <div style={sectionCard}>
          <div style={headerWrap}>
            <div style={titleWrap}>
              <h2 style={titleStyle}>Your Created Groups</h2>
              <p style={subtitleStyle}>
                Edit or delete the study groups you created.
              </p>
            </div>

            <div style={summaryBadge}>✨ {groups.length} Groups</div>
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
                      transform: hoveredCard === cardKey ? "translateY(-7px)" : "translateY(0)",
                      boxShadow:
                        hoveredCard === cardKey
                          ? "0 22px 40px rgba(79, 70, 229, 0.14)"
                          : baseGroupCard.boxShadow,
                      borderColor: hoveredCard === cardKey ? "#c7d2fe" : "#e2e8f0",
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
                            transform: hoveredCard === cardKey ? "scale(1.06)" : "scale(1)",
                          }}
                        />
                        <div style={imageOverlay}></div>
                      </div>
                    )}

                    <div style={cardBody}>
                      <div style={badgeStyle}>Your Group</div>

                      <h3
                        style={{
                          margin: "0 0 8px",
                          color: "#0f172a",
                          fontSize: "22px",
                          fontWeight: 800,
                          letterSpacing: "-0.4px",
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
                          👥 {memberCount} / {group.maxMembers}
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

                      <div style={progressLabel}>Group capacity</div>
                      <div style={progressTrack}>
                        <div
                          style={{
                            width: `${progress}%`,
                            height: "100%",
                            background:
                              "linear-gradient(135deg, #4f46e5, #7c3aed, #9333ea)",
                            borderRadius: "999px",
                            transition: "width 0.35s ease",
                          }}
                        />
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
            <div style={emptyState}>
              <h3 style={{ marginTop: 0, marginBottom: "8px", color: "#334155" }}>
                No groups created yet
              </h3>
              <p style={{ margin: 0 }}>
                You haven't created any groups yet.
              </p>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={isEditModalOpen}
        onCancel={closeEditModal}
        footer={null}
        width={860}
        centered
        styles={{
          content: {
            borderRadius: "28px",
            overflow: "hidden",
            padding: "24px",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
          },
          body: {
            paddingTop: "4px",
          },
        }}
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
                  minHeight: "110px",
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
                style={{ width: "100%", height: "48px", borderRadius: "14px" }}
              />
            </div>

            <div style={fieldBox}>
              <label style={labelStyle}>End Time</label>
              <TimePicker
                use12Hours
                format="h:mm A"
                value={editForm.endTime ? dayjs(editForm.endTime, "h:mm A") : null}
                onChange={handleEndTimeChange}
                style={{ width: "100%", height: "48px", borderRadius: "14px" }}
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