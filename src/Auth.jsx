import { useState } from "react";
import { supabase } from "./supabase";
import "./Auth.css";

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

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
  }

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <header className="auth-header">
          <h1 className="logo">Cen<span>Info</span></h1>
          <h2>{isLogin ? "Welcome back" : "Create account"}</h2>
          <p className="auth-subtitle">
            {isLogin ? "Enter your credentials to access your dashboard" : "Join our community of movie enthusiasts"}
          </p>
        </header>

        <div className="auth-form">
          <div className="input-group">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="auth-input"
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              className="auth-input"
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary auth-submit"
          >
            {loading ? <span className="spinner"></span> : (isLogin ? "Sign In" : "Get Started")}
          </button>
        </div>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button onClick={handleGoogle} className="btn-secondary google-btn">
          <img src="https://www.google.com/favicon.ico" alt="Google" width={18} height={18} />
          Continue with Google
        </button>

        <footer className="auth-footer">
          <p>
            {isLogin ? "New to CenInfo?" : "Already have an account?"}
            <button
              onClick={() => { setIsLogin(f => !f); setError(""); setMessage(""); }}
              className="toggle-auth-btn"
            >
              {isLogin ? "Create an account" : "Sign In"}
            </button>
          </p>
        </footer>
      </div>
    </div>
  );
}