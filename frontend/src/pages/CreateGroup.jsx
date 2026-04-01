import React, { useState } from "react";
import axios from "axios";
import { Select, TimePicker } from "antd";
import { useAuth } from "../hooks/useAuth";
import { message } from "antd";

const buildingOptions = {
  "Main Building": [
    "A101", "A102", "A201", "A202", "A301", "A302", "A401", "A402", "A501", "A502",
  ],
  "New Building": [
    "F301", "F401", "F501", "F601", "F701", "F801", "F901", "F1001", "F1101", "F1201", "F1301",
  ],
};

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
  padding: "24px",
};

const wrapperStyle = {
  maxWidth: "1100px",
  margin: "0 auto",
};

const heroCard = {
  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
  borderRadius: "28px",
  padding: "30px",
  color: "#ffffff",
  boxShadow: "0 18px 40px rgba(79, 70, 229, 0.28)",
  marginBottom: "22px",
};

const heroTitle = {
  margin: 0,
  fontSize: "34px",
  fontWeight: 800,
  letterSpacing: "-0.5px",
};

const heroText = {
  margin: "10px 0 0",
  fontSize: "15px",
  color: "rgba(255,255,255,0.88)",
  lineHeight: 1.7,
  maxWidth: "720px",
};

const formCard = {
  background: "#ffffff",
  borderRadius: "28px",
  padding: "28px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
};

const sectionTitle = {
  margin: "0 0 6px",
  fontSize: "20px",
  fontWeight: 700,
  color: "#0f172a",
};

const sectionText = {
  margin: "0 0 22px",
  color: "#64748b",
  fontSize: "14px",
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "18px",
};

const fullWidth = {
  gridColumn: "1 / -1",
};

const fieldWrap = {
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
  border: "1px solid #cbd5e1",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  background: "#ffffff",
  transition: "0.2s ease",
};

const textareaStyle = {
  ...inputStyle,
  minHeight: "120px",
  resize: "vertical",
};

const softPanel = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  padding: "18px",
};

const previewBox = {
  borderRadius: "20px",
  overflow: "hidden",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  minHeight: "220px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const previewImage = {
  width: "100%",
  height: "240px",
  objectFit: "cover",
  display: "block",
};

const placeholderText = {
  color: "#94a3b8",
  fontSize: "14px",
  textAlign: "center",
  padding: "20px",
  lineHeight: 1.6,
};

const tipsRow = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
  marginTop: "18px",
};

const tipCard = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "14px",
};

const tipTitle = {
  margin: "0 0 6px",
  fontSize: "14px",
  fontWeight: 700,
  color: "#1e293b",
};

const tipText = {
  margin: 0,
  fontSize: "13px",
  color: "#64748b",
  lineHeight: 1.6,
};

const actionRow = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "26px",
};

const primaryButton = {
  border: "none",
  borderRadius: "14px",
  padding: "13px 22px",
  fontWeight: 700,
  cursor: "pointer",
  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
  color: "#ffffff",
  boxShadow: "0 10px 24px rgba(79, 70, 229, 0.28)",
};

const secondaryButton = {
  border: "none",
  borderRadius: "14px",
  padding: "13px 22px",
  fontWeight: 700,
  cursor: "pointer",
  background: "#e2e8f0",
  color: "#1e293b",
};

const CreateGroup = () => {
  const { user } = useAuth();

  const [group, setGroup] = useState({
    name: "",
    description: "",
    subject: "",
    maxMembers: 5,
    selectedDays: [],
    startTime: "",
    endTime: "",
    building: "",
    hall: "",
    image: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "building") {
      setGroup({
        ...group,
        building: value,
        hall: "",
      });
      return;
    }

    setGroup({ ...group, [name]: value });
  };

  const handleDaysChange = (value) => {
    setGroup({ ...group, selectedDays: value });
  };

  const handleStartTimeChange = (_, timeString) => {
    setGroup({ ...group, startTime: timeString });
  };

  const handleEndTimeChange = (_, timeString) => {
    setGroup({ ...group, endTime: timeString });
  };

  const handleReset = () => {
    setGroup({
      name: "",
      description: "",
      subject: "",
      maxMembers: 5,
      selectedDays: [],
      startTime: "",
      endTime: "",
      building: "",
      hall: "",
      image: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        name: group.name,
        description: group.description,
        subject: group.subject,
        maxMembers: Number(group.maxMembers),
        image: group.image,
        creator: user?._id || user?.id || null,
        selectedDays: group.selectedDays,
        startTime: group.startTime,
        endTime: group.endTime,
        building: group.building,
        hall: group.hall,
      };

      await axios.post("http://localhost:5000/api/study-groups", payload);

      message.success("Group created successfully");
      handleReset();
    } catch (error) {
      console.error("Create group error:", error.response?.data || error.message);
      alert("Error creating group");
    }
  };

  return (
    <div style={pageStyle}>
      <div style={wrapperStyle}>
        <div style={heroCard}>
          <h1 style={heroTitle}>Create Study Group</h1>
          <p style={heroText}>
            Set up a focused study session with your preferred subject, meeting days,
            time slot, and classroom location. Keep it neat, clear, and easy for others to join.
          </p>
        </div>

        <div style={formCard}>
          <div style={{ marginBottom: "24px" }}>
            <h2 style={sectionTitle}>Group Details</h2>
            <p style={sectionText}>
              Add the main information first, then choose the schedule and venue.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={formGrid}>
              <div style={fieldWrap}>
                <label style={labelStyle}>Group Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter a clear group name"
                  value={group.name}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>Subject</label>
                <input
                  type="text"
                  name="subject"
                  placeholder="Ex: Database Systems"
                  value={group.subject}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ ...fieldWrap, ...fullWidth }}>
                <label style={labelStyle}>Description</label>
                <textarea
                  name="description"
                  placeholder="Describe the goal of this group, study plan, or who should join..."
                  value={group.description}
                  onChange={handleChange}
                  style={textareaStyle}
                />
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>Maximum Members</label>
                <input
                  type="number"
                  name="maxMembers"
                  min="2"
                  max="20"
                  value={group.maxMembers}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>Image URL</label>
                <input
                  type="text"
                  name="image"
                  placeholder="Paste an image URL"
                  value={group.image}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>

              <div style={{ ...fullWidth }}>
                <div style={softPanel}>
                  <div style={{ marginBottom: "16px" }}>
                    <h3 style={{ margin: 0, fontSize: "17px", color: "#0f172a" }}>
                      Schedule & Location
                    </h3>
                    <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "13px" }}>
                      Help other students quickly see when and where your group meets.
                    </p>
                  </div>

                  <div style={formGrid}>
                    <div style={fieldWrap}>
                      <label style={labelStyle}>Select Days</label>
                      <Select
                        mode="multiple"
                        placeholder="Choose meeting days"
                        value={group.selectedDays}
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

                    <div style={fieldWrap}>
                      <label style={labelStyle}>Building</label>
                      <select
                        name="building"
                        value={group.building}
                        onChange={handleChange}
                        style={inputStyle}
                        required
                      >
                        <option value="">Select Building</option>
                        <option value="Main Building">Main Building</option>
                        <option value="New Building">New Building</option>
                      </select>
                    </div>

                    <div style={fieldWrap}>
                      <label style={labelStyle}>Start Time</label>
                      <TimePicker
                        use12Hours
                        format="h:mm A"
                        onChange={handleStartTimeChange}
                        style={{ width: "100%", height: "48px", borderRadius: "14px" }}
                      />
                    </div>

                    <div style={fieldWrap}>
                      <label style={labelStyle}>End Time</label>
                      <TimePicker
                        use12Hours
                        format="h:mm A"
                        onChange={handleEndTimeChange}
                        style={{ width: "100%", height: "48px", borderRadius: "14px" }}
                      />
                    </div>

                    <div style={fieldWrap}>
                      <label style={labelStyle}>Hall</label>
                      <select
                        name="hall"
                        value={group.hall}
                        onChange={handleChange}
                        style={inputStyle}
                        required
                        disabled={!group.building}
                      >
                        <option value="">Select Hall</option>
                        {(buildingOptions[group.building] || []).map((hall) => (
                          <option key={hall} value={hall}>
                            {hall}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ ...fullWidth }}>
                <div style={softPanel}>
                  <div style={{ marginBottom: "14px" }}>
                    <h3 style={{ margin: 0, fontSize: "17px", color: "#0f172a" }}>
                      Group Preview
                    </h3>
                    <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "13px" }}>
                      A quick visual preview based on the image URL you entered.
                    </p>
                  </div>

                  <div style={previewBox}>
                    {group.image ? (
                      <img
                        src={group.image}
                        alt="Group preview"
                        style={previewImage}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div style={placeholderText}>
                        No image yet.
                        <br />
                        Add an image URL to make your group card look more attractive.
                      </div>
                    )}
                  </div>

                  <div style={tipsRow}>
                    <div style={tipCard}>
                      <h4 style={tipTitle}>Clear title</h4>
                      <p style={tipText}>Use a short, readable name students can understand fast.</p>
                    </div>

                    <div style={tipCard}>
                      <h4 style={tipTitle}>Good schedule</h4>
                      <p style={tipText}>Choose exact days and time so members know what to expect.</p>
                    </div>

                    <div style={tipCard}>
                      <h4 style={tipTitle}>Useful image</h4>
                      <p style={tipText}>A nice image makes the group card feel more professional.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={actionRow}>
              <button type="submit" style={primaryButton}>
                Create Group
              </button>

              <button type="button" onClick={handleReset} style={secondaryButton}>
                Clear Form
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateGroup;