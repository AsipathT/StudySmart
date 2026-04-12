import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const GroupChat = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const bottomRef = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`chat_${groupId}`) || "[]");
    setMessages(saved);
  }, [groupId]);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);

    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }

    if (document.body) {
      document.body.scrollTop = 0;
    }

    if (chatRef.current) {
      chatRef.current.scrollTop = 0;
    }
  }, [groupId]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const msg = {
      text: input,
      sender: user?.name || "You",
      time: new Date().toLocaleTimeString(),
    };

    const updated = [...messages, msg];
    setMessages(updated);

    localStorage.setItem(`chat_${groupId}`, JSON.stringify(updated));

    setInput("");

    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "30px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        background: `
          radial-gradient(circle at 20% 20%, #c7d2fe 0%, transparent 40%),
          radial-gradient(circle at 80% 80%, #a5b4fc 0%, transparent 40%),
          linear-gradient(135deg,#eef2ff,#f8fafc)
        `,
      }}
    >
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {[...Array(18)].map((_, i) => {
          const size = 30 + (i % 5) * 20;

          const colors = [
            "rgba(99,102,241,0.25)",
            "rgba(139,92,246,0.25)",
            "rgba(59,130,246,0.25)",
            "rgba(34,197,94,0.25)",
          ];

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: `${size}px`,
                height: `${size}px`,
                background: colors[i % colors.length],
                borderRadius: "50%",
                left: `${(i * 7) % 100}%`,
                bottom: `-${size}px`,
                filter: "blur(8px)",
                animation: `floatUp ${8 + (i % 6)}s linear infinite`,
                animationDelay: `${i * 0.6}s`,
              }}
            />
          );
        })}
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "720px",
          height: "calc(100vh - 60px)",
          display: "flex",
          flexDirection: "column",
          borderRadius: "24px",
          overflow: "hidden",
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 30px 80px rgba(79,70,229,0.25)",
          border: "1px solid rgba(255,255,255,0.4)",
          zIndex: 1,
        }}
      >
        <div
          style={{
            padding: "18px",
            background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
            color: "#fff",
            fontWeight: "700",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: "10px",
              color: "#fff",
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            ←
          </button>

          💬 Group Chat
        </div>

        <div
          ref={chatRef}
          style={{
            flex: 1,
            minHeight: 0,
            padding: "20px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            background: `
              radial-gradient(circle at 10% 20%, rgba(99,102,241,0.08), transparent 40%),
              radial-gradient(circle at 90% 80%, rgba(139,92,246,0.08), transparent 40%),
              linear-gradient(to bottom, #f8fafc, #eef2ff)
            `,
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                textAlign: "center",
                margin: "auto 0",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 15px",
                  color: "#fff",
                  fontSize: "32px",
                }}
              >
                💬
              </div>

              <h2 style={{ margin: 0, color: "#4f46e5" }}>Start chatting</h2>

              <p style={{ color: "#64748b" }}>Send your first message</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isMe = msg.sender === (user?.name || "You");

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: isMe ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    background: isMe
                      ? "linear-gradient(135deg,#4f46e5,#7c3aed)"
                      : "#fff",
                    color: isMe ? "#fff" : "#000",
                    padding: "12px 16px",
                    borderRadius: "16px",
                    maxWidth: "70%",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                  }}
                >
                  {!isMe && (
                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                      {msg.sender}
                    </div>
                  )}

                  <div>{msg.text}</div>

                  <div
                    style={{
                      fontSize: "10px",
                      opacity: 0.7,
                      textAlign: "right",
                      marginTop: "4px",
                    }}
                  >
                    {msg.time}
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        <div
          style={{
            padding: "14px",
            background: "transparent",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(255,255,255,0.9)",
              borderRadius: "20px",
              padding: "8px 10px",
              boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
              backdropFilter: "blur(10px)",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                padding: "12px",
                fontSize: "14px",
                background: "transparent",
              }}
            />

            <button
              onClick={sendMessage}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                border: "none",
                background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                color: "#fff",
                fontSize: "16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ➤
            </button>
          </div>
        </div>

        <style>
          {`
            @keyframes floatUp {
              0% { transform: translateY(0) scale(0.8); opacity: 0; }
              20% { opacity: 0.6; }
              100% { transform: translateY(-120vh) scale(1.2); opacity: 0; }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default GroupChat;