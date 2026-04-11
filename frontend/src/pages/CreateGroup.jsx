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
  background:
    "radial-gradient(circle at 0% 0%, rgba(99,102,241,0.22), transparent 28%), radial-gradient(circle at 100% 0%, rgba(168,85,247,0.18), transparent 30%), radial-gradient(circle at 50% 100%, rgba(59,130,246,0.10), transparent 30%), linear-gradient(180deg, #f5f7ff 0%, #eef2ff 48%, #f8fafc 100%)",
  padding: "26px",
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
  filter: "blur(18px)",
  opacity: 0.55,
  animation: "floaty 9s ease-in-out infinite",
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
    "linear-gradient(135deg, #0b1023 0%, #1e1b4b 28%, #4c1d95 68%, #7c3aed 100%)",
  borderRadius: "34px",
  padding: "34px",
  color: "#ffffff",
  boxShadow: "0 30px 70px rgba(76, 29, 149, 0.30)",
  marginBottom: "24px",
  border: "1px solid rgba(255,255,255,0.12)",
};

const heroGlow = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(circle at 18% 20%, rgba(255,255,255,0.18), transparent 20%), radial-gradient(circle at 85% 20%, rgba(255,255,255,0.12), transparent 22%), radial-gradient(circle at 75% 82%, rgba(255,255,255,0.08), transparent 26%)",
  pointerEvents: "none",
};

const heroTitle = {
  margin: 0,
  fontSize: "40px",
  fontWeight: 900,
  letterSpacing: "-1px",
  position: "relative",
  zIndex: 1,
};

const heroText = {
  margin: "12px 0 0",
  fontSize: "15px",
  color: "rgba(255,255,255,0.88)",
  lineHeight: 1.85,
  maxWidth: "760px",
  position: "relative",
  zIndex: 1,
};

const heroBadgeRow = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "20px",
  position: "relative",
  zIndex: 1,
};

const heroBadge = {
  padding: "9px 14px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: 800,
  backdropFilter: "blur(10px)",
};

const contentGrid = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.2fr) minmax(290px, 0.8fr)",
  gap: "22px",
  alignItems: "start",
};

const formCard = {
  background: "rgba(255,255,255,0.68)",
  backdropFilter: "blur(18px)",
  borderRadius: "32px",
  padding: "30px",
  border: "1px solid rgba(226,232,240,0.9)",
  boxShadow: "0 25px 60px rgba(15, 23, 42, 0.10)",
};

const sidePanel = {
  display: "grid",
  gap: "18px",
};

const sideCardDark = {
  position: "relative",
  overflow: "hidden",
  background: "linear-gradient(135deg, #111827, #312e81, #6d28d9)",
  color: "#ffffff",
  borderRadius: "28px",
  padding: "24px",
  boxShadow: "0 20px 45px rgba(49, 46, 129, 0.24)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const sideCardLight = {
  background: "rgba(255,255,255,0.82)",
  backdropFilter: "blur(14px)",
  borderRadius: "24px",
  padding: "20px",
  border: "1px solid rgba(226,232,240,0.95)",
  boxShadow: "0 16px 35px rgba(15, 23, 42, 0.07)",
};

const sideTitle = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 800,
};

const sideText = {
  margin: "8px 0 0",
  fontSize: "13px",
  lineHeight: 1.7,
  color: "rgba(255,255,255,0.84)",
};

const sideMiniGrid = {
  display: "grid",
  gap: "12px",
  marginTop: "18px",
};

const sideMiniItem = {
  padding: "14px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.10)",
  backdropFilter: "blur(8px)",
};

const sideMiniTitle = {
  margin: "0 0 4px",
  fontSize: "13px",
  fontWeight: 800,
};

const sideMiniText = {
  margin: 0,
  fontSize: "12px",
  lineHeight: 1.6,
  color: "rgba(255,255,255,0.78)",
};

const sectionTitle = {
  margin: "0 0 6px",
  fontSize: "24px",
  fontWeight: 900,
  color: "#0f172a",
  letterSpacing: "-0.5px",
};

const sectionText = {
  margin: "0 0 24px",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.7,
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "18px",
};

const fullWidth = {
  gridColumn: "1 / -1",
};

const fieldWrap = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const labelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontWeight: 800,
  color: "#334155",
  fontSize: "13px",
  letterSpacing: "0.2px",
};

const labelDot = (bg) => ({
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  background: bg,
  boxShadow: `0 0 0 4px ${bg}22`,
});

const inputShell = {
  position: "relative",
  borderRadius: "18px",
  padding: "1px",
  background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(168,85,247,0.18), rgba(255,255,255,0.9))",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
};

const inputStyle = {
  width: "100%",
  padding: "15px 16px",
  borderRadius: "17px",
  border: "none",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  background: "rgba(255,255,255,0.96)",
  transition: "all 0.25s ease",
  color: "#0f172a",
};

const textareaStyle = {
  ...inputStyle,
  minHeight: "150px",
  resize: "vertical",
  lineHeight: 1.75,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
};

const fancyPanel = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.72), rgba(238,242,255,0.78), rgba(245,243,255,0.78))",
  border: "1px solid #ddd6fe",
  borderRadius: "26px",
  padding: "22px",
  boxShadow: "0 16px 35px rgba(79, 70, 229, 0.07)",
};

const panelHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "16px",
};

const panelTitle = {
  margin: 0,
  fontSize: "19px",
  color: "#0f172a",
  fontWeight: 900,
  letterSpacing: "-0.3px",
};

const panelText = {
  margin: "6px 0 0",
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.7,
};

const panelBadge = {
  padding: "8px 12px",
  borderRadius: "999px",
  background: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
  color: "#5b21b6",
  fontSize: "12px",
  fontWeight: 800,
};

const previewCard = {
  borderRadius: "24px",
  overflow: "hidden",
  border: "1px solid #e2e8f0",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))",
  boxShadow: "0 18px 35px rgba(15, 23, 42, 0.08)",
};

const previewImageWrap = {
  position: "relative",
  minHeight: "250px",
  background:
    "linear-gradient(135deg, #312e81 0%, #4f46e5 40%, #7c3aed 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const previewImage = {
  width: "100%",
  height: "260px",
  objectFit: "cover",
  display: "block",
};

const previewPlaceholder = {
  color: "rgba(255,255,255,0.88)",
  fontSize: "14px",
  textAlign: "center",
  padding: "24px",
  lineHeight: 1.8,
  maxWidth: "320px",
};

const previewContent = {
  padding: "18px",
};

const previewChipWrap = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "12px",
};

const previewChip = {
  padding: "8px 12px",
  borderRadius: "999px",
  background: "linear-gradient(135deg, #f8fafc, #eef2ff)",
  color: "#334155",
  fontSize: "12px",
  fontWeight: 800,
  border: "1px solid #e2e8f0",
};

const tipsRow = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
  marginTop: "18px",
};

const tipCard = {
  background: "rgba(255,255,255,0.82)",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  padding: "14px",
  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
};

const tipTitle = {
  margin: "0 0 6px",
  fontSize: "14px",
  fontWeight: 800,
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
  marginTop: "28px",
};

const primaryButton = {
  border: "none",
  borderRadius: "16px",
  padding: "14px 24px",
  fontWeight: 900,
  cursor: "pointer",
  background: "linear-gradient(135deg, #4f46e5, #7c3aed, #9333ea)",
  color: "#ffffff",
  boxShadow: "0 16px 30px rgba(79, 70, 229, 0.30)",
  transition: "all 0.25s ease",
};

const secondaryButton = {
  border: "none",
  borderRadius: "16px",
  padding: "14px 24px",
  fontWeight: 900,
  cursor: "pointer",
  background: "linear-gradient(135deg, #ffffff, #eef2f7)",
  color: "#1e293b",
  boxShadow: "0 10px 22px rgba(15, 23, 42, 0.06)",
  transition: "all 0.25s ease",
};

const CreateGroup = () => {
  const { user } = useAuth();
  const [hoveredButton, setHoveredButton] = useState("");

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
      <style>
        {`
          @keyframes floaty {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            50% { transform: translateY(-18px) translateX(10px); }
          }

          .create-group-form input:focus,
          .create-group-form textarea:focus,
          .create-group-form select:focus {
            box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.16);
            transform: translateY(-1px);
          }

          .create-group-form input::placeholder,
          .create-group-form textarea::placeholder {
            color: #94a3b8;
          }

          @media (max-width: 980px) {
            .create-layout {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>

      <div style={floatingOrb("80px", "-40px", "180px", "rgba(129,140,248,0.30)")}></div>
      <div style={floatingOrb("420px", "92%", "170px", "rgba(192,132,252,0.24)", "1s")}></div>
      <div style={floatingOrb("82%", "5%", "140px", "rgba(96,165,250,0.20)", "2s")}></div>

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
          />

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
          />

          <h1 style={heroTitle}>Create Study Group</h1>
          <p style={heroText}>
            Build a study group that feels inviting, organized, and easy to join.
            Add a nice image, clear timing, and a clean description so other students instantly know what your group is about.
          </p>

          <div style={heroBadgeRow}>
            <div style={heroBadge}>✨ Modern group setup</div>
            <div style={heroBadge}>📚 Smart scheduling</div>
            <div style={heroBadge}>🏫 Clean location details</div>
          </div>
        </div>

        <div className="create-layout" style={contentGrid}>
          <div style={formCard}>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={sectionTitle}>Group Details</h2>
              <p style={sectionText}>
                Fill in the information below to create a polished study group card.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="create-group-form">
              <div style={formGrid}>
                <div style={fieldWrap}>
                  <label style={labelStyle}>
                    <span style={labelDot("#6366f1")}></span>
                    Group Name
                  </label>
                  <div style={inputShell}>
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
                </div>

                <div style={fieldWrap}>
                  <label style={labelStyle}>
                    <span style={labelDot("#8b5cf6")}></span>
                    Subject
                  </label>
                  <div style={inputShell}>
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
                </div>

                <div style={{ ...fieldWrap, ...fullWidth }}>
                  <label style={labelStyle}>
                    <span style={labelDot("#ec4899")}></span>
                    Description
                  </label>
                  <div style={inputShell}>
                    <textarea
                      name="description"
                      placeholder="Describe the purpose of this study group, who should join, what you plan to cover, and how the sessions will help members..."
                      value={group.description}
                      onChange={handleChange}
                      style={textareaStyle}
                    />
                  </div>
                </div>

                <div style={fieldWrap}>
                  <label style={labelStyle}>
                    <span style={labelDot("#06b6d4")}></span>
                    Maximum Members
                  </label>
                  <div style={inputShell}>
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
                </div>

                <div style={fieldWrap}>
                  <label style={labelStyle}>
                    <span style={labelDot("#f59e0b")}></span>
                    Image URL
                  </label>
                  <div style={inputShell}>
                    <input
                      type="text"
                      name="image"
                      placeholder="Paste a nice image URL"
                      value={group.image}
                      onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ ...fullWidth }}>
                  <div style={fancyPanel}>
                    <div style={panelHeader}>
                      <div>
                        <h3 style={panelTitle}>Schedule & Location</h3>
                        <p style={panelText}>
                          Make your group easy to understand with proper days, time, and classroom details.
                        </p>
                      </div>
                      <div style={panelBadge}>Organize clearly</div>
                    </div>

                    <div style={formGrid}>
                      <div style={fieldWrap}>
                        <label style={labelStyle}>
                          <span style={labelDot("#6366f1")}></span>
                          Select Days
                        </label>
                        <div style={inputShell}>
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
                      </div>

                      <div style={fieldWrap}>
                        <label style={labelStyle}>
                          <span style={labelDot("#8b5cf6")}></span>
                          Building
                        </label>
                        <div style={inputShell}>
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
                      </div>

                      <div style={fieldWrap}>
                        <label style={labelStyle}>
                          <span style={labelDot("#ec4899")}></span>
                          Start Time
                        </label>
                        <div style={inputShell}>
                          <TimePicker
                            use12Hours
                            format="h:mm A"
                            onChange={handleStartTimeChange}
                            style={{ width: "100%", height: "50px", borderRadius: "17px" }}
                          />
                        </div>
                      </div>

                      <div style={fieldWrap}>
                        <label style={labelStyle}>
                          <span style={labelDot("#06b6d4")}></span>
                          End Time
                        </label>
                        <div style={inputShell}>
                          <TimePicker
                            use12Hours
                            format="h:mm A"
                            onChange={handleEndTimeChange}
                            style={{ width: "100%", height: "50px", borderRadius: "17px" }}
                          />
                        </div>
                      </div>

                      <div style={fieldWrap}>
                        <label style={labelStyle}>
                          <span style={labelDot("#f59e0b")}></span>
                          Hall
                        </label>
                        <div style={inputShell}>
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
                </div>

                <div style={{ ...fullWidth }}>
                  <div style={fancyPanel}>
                    <div style={panelHeader}>
                      <div>
                        <h3 style={panelTitle}>Group Preview</h3>
                        <p style={panelText}>
                          This gives you a nicer idea of how your group will feel to others.
                        </p>
                      </div>
                      <div style={panelBadge}>Live preview</div>
                    </div>

                    <div style={previewCard}>
                      <div style={previewImageWrap}>
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
                          <div style={previewPlaceholder}>
                            No image yet.
                            <br />
                            Add a vibrant image URL to instantly make the group card feel premium.
                          </div>
                        )}
                      </div>

                      <div style={previewContent}>
                        <h3
                          style={{
                            margin: "0 0 8px",
                            fontSize: "22px",
                            fontWeight: 900,
                            color: "#0f172a",
                          }}
                        >
                          {group.name || "Your Group Name"}
                        </h3>

                        <p
                          style={{
                            margin: 0,
                            color: "#64748b",
                            fontSize: "14px",
                            lineHeight: 1.7,
                          }}
                        >
                          {group.description || "Your description will appear here and help other students understand the focus of your study group."}
                        </p>

                        <div style={previewChipWrap}>
                          <span style={previewChip}>📘 {group.subject || "Subject"}</span>
                          <span style={previewChip}>👥 {group.maxMembers || 5} max</span>
                          <span style={previewChip}>📅 {group.selectedDays?.join(", ") || "Days"}</span>
                          <span style={previewChip}>🏢 {group.building || "Building"}</span>
                          <span style={previewChip}>📍 {group.hall || "Hall"}</span>
                        </div>
                      </div>
                    </div>

                    <div style={tipsRow}>
                      <div style={tipCard}>
                        <h4 style={tipTitle}>Clear title</h4>
                        <p style={tipText}>Use a short name that makes the group purpose obvious right away.</p>
                      </div>

                      <div style={tipCard}>
                        <h4 style={tipTitle}>Good description</h4>
                        <p style={tipText}>Say what members will study, who should join, and how sessions will work.</p>
                      </div>

                      <div style={tipCard}>
                        <h4 style={tipTitle}>Strong image</h4>
                        <p style={tipText}>A bright image makes the card feel less plain and more professional.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={actionRow}>
                <button
                  type="submit"
                  style={{
                    ...primaryButton,
                    transform: hoveredButton === "create" ? "translateY(-2px) scale(1.01)" : "translateY(0)",
                  }}
                  onMouseEnter={() => setHoveredButton("create")}
                  onMouseLeave={() => setHoveredButton("")}
                >
                  ✨ Create Group
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    ...secondaryButton,
                    transform: hoveredButton === "clear" ? "translateY(-2px)" : "translateY(0)",
                  }}
                  onMouseEnter={() => setHoveredButton("clear")}
                  onMouseLeave={() => setHoveredButton("")}
                >
                  Clear Form
                </button>
              </div>
            </form>
          </div>

          <div style={sidePanel}>
            <div style={sideCardDark}>
              <h3 style={sideTitle}>Make it stand out</h3>
              <p style={sideText}>
                The best group cards feel clear, friendly, and easy to trust. Good titles and good descriptions matter a lot.
              </p>

              <div style={sideMiniGrid}>
                <div style={sideMiniItem}>
                  <p style={sideMiniTitle}>📚 Subject first</p>
                  <p style={sideMiniText}>Let students understand the topic instantly.</p>
                </div>
                <div style={sideMiniItem}>
                  <p style={sideMiniTitle}>🕒 Keep timing clear</p>
                  <p style={sideMiniText}>Exact days and time make groups feel organized.</p>
                </div>
                <div style={sideMiniItem}>
                  <p style={sideMiniTitle}>🖼 Add a nice image</p>
                  <p style={sideMiniText}>It makes the whole page feel more alive.</p>
                </div>
              </div>
            </div>

            <div style={sideCardLight}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 900, color: "#0f172a" }}>
                Quick idea
              </h3>
              <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: "13px", lineHeight: 1.7 }}>
                Try using a description like:
              </p>

              <div
                style={{
                  marginTop: "14px",
                  padding: "14px",
                  borderRadius: "18px",
                  background: "linear-gradient(135deg, #f8fafc, #eef2ff)",
                  border: "1px solid #e2e8f0",
                  color: "#334155",
                  fontSize: "13px",
                  lineHeight: 1.7,
                }}
              >
                “Focused study sessions for Database Systems. We review lecture content, solve past paper questions, and help each other prepare for quizzes and exams.”
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGroup;