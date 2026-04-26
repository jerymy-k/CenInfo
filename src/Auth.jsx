import { useState } from "react";
import { supabase } from "./supabase";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError("");
    setMessage("");
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage("Check your email to confirm your account!");
    }
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#0f0f0f"
    }}>
      <div style={{
        background: "#1a1a1a", border: "1px solid #2a2a2a",
        borderRadius: 12, padding: "2rem", width: "100%", maxWidth: 400
      }}>
        <h1 style={{ color: "#e50914", marginBottom: "0.5rem" }}>🎬 CenInfo</h1>
        <h2 style={{ color: "#fff", marginBottom: "1.5rem", fontWeight: 500, fontSize: 18 }}>
          {isLogin ? "Welcome back" : "Create account"}
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: 12, padding: "10px 14px", borderRadius: 6, border: "1px solid #333", background: "#0f0f0f", color: "#fff", fontSize: 15 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={{ width: "100%", marginBottom: 16, padding: "10px 14px", borderRadius: 6, border: "1px solid #333", background: "#0f0f0f", color: "#fff", fontSize: 15 }}
        />

        {error && <p style={{ color: "#e50914", marginBottom: 12, fontSize: 14 }}>{error}</p>}
        {message && <p style={{ color: "#4caf50", marginBottom: 12, fontSize: 14 }}>{message}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: "100%", padding: "10px", background: "#e50914", color: "#fff", border: "none", borderRadius: 6, fontSize: 16, fontWeight: 600, cursor: "pointer" }}
        >
          {loading ? "Loading..." : isLogin ? "Login" : "Sign Up"}
        </button>

        <p style={{ color: "#888", marginTop: 16, textAlign: "center", fontSize: 14 }}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={() => { setIsLogin(f => !f); setError(""); setMessage(""); }}
            style={{ background: "none", border: "none", color: "#e50914", cursor: "pointer", fontSize: 14, marginLeft: 6 }}
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}