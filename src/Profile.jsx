import { useState } from "react";
import { supabase } from "./supabase";

export default function Profile({ user, favorites, onClose }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${user?.email}&backgroundColor=e50914&textColor=ffffff`;
  const joinDate = new Date(user?.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });
  const username = user?.email?.split("@")[0];

  async function handleChangePassword() {
    if (!newPassword.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setMessage(error.message);
    else setMessage("Password updated successfully!");
    setNewPassword("");
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
      <button className="back-link-btn" onClick={onClose}>
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
        Back
      </button>

      {/* HERO BANNER */}
      <div style={{
        background: "linear-gradient(135deg, #1a0a0a 0%, #2d0a0a 50%, #1a1a1a 100%)",
        borderRadius: 20, padding: "2rem", marginBottom: "1.5rem",
        border: "1px solid rgba(229,9,20,0.2)", position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 200, height: 200, borderRadius: "50%",
          background: "rgba(229,9,20,0.05)", pointerEvents: "none"
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <img src={avatarUrl} alt="avatar" style={{
              width: 90, height: 90, borderRadius: "50%",
              border: "3px solid #e50914",
              boxShadow: "0 0 30px rgba(229,9,20,0.4)"
            }} />
            <span style={{
              position: "absolute", bottom: 2, right: 2,
              width: 16, height: 16, background: "#4caf50",
              borderRadius: "50%", border: "2px solid #121212"
            }} />
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ color: "#e50914", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, marginBottom: 4 }}>Member</p>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 4 }}>@{username}</h1>
            <p style={{ color: "#888", fontSize: 14 }}>{user?.email}</p>
            <p style={{ color: "#555", fontSize: 12, marginTop: 4 }}>Joined {joinDate}</p>
          </div>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{
              background: "rgba(229,9,20,0.1)", border: "1px solid rgba(229,9,20,0.3)",
              borderRadius: 12, padding: "1rem 1.5rem", textAlign: "center", minWidth: 80
            }}>
              <strong style={{ fontSize: "1.8rem", color: "#e50914", display: "block" }}>{favorites.length}</strong>
              <span style={{ fontSize: 12, color: "#888" }}>Favorites</span>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12, padding: "1rem 1.5rem", textAlign: "center", minWidth: 80
            }}>
              <strong style={{ fontSize: "1.8rem", color: "#fff", display: "block" }}>
                {user?.app_metadata?.provider === "google" ? "G" : "✉"}
              </strong>
              <span style={{ fontSize: 12, color: "#888" }}>{user?.app_metadata?.provider || "email"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 4, background: "#1a1a1a", padding: 4, borderRadius: 12, marginBottom: "1.5rem", border: "1px solid rgba(255,255,255,0.05)" }}>
        {["overview", "security"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: "10px", border: "none", borderRadius: 8,
            background: activeTab === tab ? "#e50914" : "transparent",
            color: activeTab === tab ? "white" : "#888",
            cursor: "pointer", fontSize: 14, fontWeight: 600,
            transition: "all 0.2s", textTransform: "capitalize"
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gap: "1rem" }}>
          <div style={{
            background: "#121212", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: "1.5rem"
          }}>
            <h3 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1, color: "#555", marginBottom: "1rem" }}>Account Info</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { label: "Email", value: user?.email },
                { label: "Login Method", value: user?.app_metadata?.provider || "Email" },
                { label: "Account ID", value: user?.id?.slice(0, 8) + "..." },
                { label: "Member Since", value: joinDate },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ color: "#666", fontSize: 14 }}>{label}</span>
                  <span style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: "#121212", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: "1.5rem"
          }}>
            <h3 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1, color: "#555", marginBottom: "1rem" }}>Your Activity</h3>
            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ flex: 1, background: "rgba(229,9,20,0.08)", borderRadius: 12, padding: "1rem", textAlign: "center" }}>
                <strong style={{ fontSize: "2rem", color: "#e50914" }}>{favorites.length}</strong>
                <p style={{ color: "#888", fontSize: 12, marginTop: 4 }}>Saved titles</p>
              </div>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "1rem", textAlign: "center" }}>
                <strong style={{ fontSize: "2rem", color: "#fff" }}>∞</strong>
                <p style={{ color: "#888", fontSize: 12, marginTop: 4 }}>Movies browsed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECURITY TAB */}
      {activeTab === "security" && (
        <div style={{ display: "grid", gap: "1rem" }}>
          <div style={{
            background: "#121212", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: "1.5rem"
          }}>
            <h3 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1, color: "#555", marginBottom: "1.5rem" }}>Change Password</h3>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 10,
                border: "1px solid #333", background: "#0a0a0a",
                color: "#fff", fontSize: 15, marginBottom: 12, outline: "none",
                boxSizing: "border-box"
              }}
            />
            {message && (
              <p style={{
                color: message.includes("success") ? "#4caf50" : "#e50914",
                marginBottom: 12, fontSize: 14
              }}>{message}</p>
            )}
            <button
              onClick={handleChangePassword}
              disabled={loading}
              style={{
                width: "100%", padding: "12px", background: "#e50914",
                color: "#fff", border: "none", borderRadius: 10,
                fontSize: 15, fontWeight: 700, cursor: "pointer"
              }}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>

          <div style={{
            background: "#121212", border: "1px solid rgba(229,9,20,0.15)",
            borderRadius: 16, padding: "1.5rem"
          }}>
            <h3 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1, color: "#555", marginBottom: "0.5rem" }}>Danger Zone</h3>
            <p style={{ color: "#666", fontSize: 13, marginBottom: "1rem" }}>Sign out from all devices</p>
            <button
              onClick={() => supabase.auth.signOut()}
              style={{
                width: "100%", padding: "12px", background: "transparent",
                color: "#e50914", border: "1px solid rgba(229,9,20,0.4)",
                borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer"
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}