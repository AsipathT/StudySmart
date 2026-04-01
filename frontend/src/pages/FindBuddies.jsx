import React, { useState } from "react";

const cardStyle = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
  border: "1px solid #e5e7eb",
};

const inputStyle = {
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  fontSize: "14px",
  width: "100%",
  outline: "none",
};

const selectStyle = {
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #cbd5e1",
  fontSize: "14px",
  width: "100%",
  outline: "none",
};

const buttonStyle = {
  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  padding: "12px 20px",
  fontWeight: 600,
  cursor: "pointer",
};

const FindBuddies = () => {
  const [subject, setSubject] = useState("");
  const [time, setTime] = useState("");

  const students = [
    { id: 1, name: "Anuji", subject: "OOP", time: "Evening", year: "2nd Year" },
    { id: 2, name: "Nidu", subject: "Database", time: "Morning", year: "3rd Year" },
    { id: 3, name: "Kasun", subject: "OOP", time: "Weekend", year: "2nd Year" },
  ];

  const filteredStudents = students.filter((student) => {
    const subjectMatch = subject ? student.subject.toLowerCase().includes(subject.toLowerCase()) : true;
    const timeMatch = time ? student.time === time : true;
    return subjectMatch && timeMatch;
  });

  return (
    <div style={{ padding: "8px" }}>
      <div style={cardStyle}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ margin: 0, fontSize: "28px", color: "#1e293b" }}>Find Buddies</h1>
          <p style={{ marginTop: "8px", color: "#64748b" }}>
            Search students who study the same subject and match your available time.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr auto",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <input
            type="text"
            placeholder="Enter subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={inputStyle}
          />

          <select value={time} onChange={(e) => setTime(e.target.value)} style={selectStyle}>
            <option value="">All Times</option>
            <option value="Morning">Morning</option>
            <option value="Evening">Evening</option>
            <option value="Weekend">Weekend</option>
          </select>

          <button style={buttonStyle}>Search</button>
        </div>

        <div style={{ display: "grid", gap: "16px" }}>
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              style={{
                border: "1px solid #dbeafe",
                background: "#f8fbff",
                borderRadius: "14px",
                padding: "18px",
              }}
            >
              <h3 style={{ margin: "0 0 8px 0", color: "#1d4ed8" }}>{student.name}</h3>
              <p style={{ margin: "4px 0", color: "#475569" }}>
                <strong>Subject:</strong> {student.subject}
              </p>
              <p style={{ margin: "4px 0", color: "#475569" }}>
                <strong>Year:</strong> {student.year}
              </p>
              <p style={{ margin: "4px 0 14px 0", color: "#475569" }}>
                <strong>Available Time:</strong> {student.time}
              </p>

              <button
                style={{
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px 16px",
                  fontWeight: 600,
                  cursor: "pointer",
                  background: "#ede9fe",
                  color: "#5b21b6",
                }}
              >
                View Profile
              </button>
            </div>
          ))}

          {filteredStudents.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                border: "2px dashed #cbd5e1",
                borderRadius: "16px",
                color: "#64748b",
              }}
            >
              No study buddies found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindBuddies;