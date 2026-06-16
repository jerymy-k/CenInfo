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
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!email || !password) {
        setError("Please fill in all fields.");
        setLoading(false);
        return;
    }

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
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { 
          redirectTo: window.location.origin
        }
      });
      
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError(err.message || "Failed to initialize Google Login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrapper fade-in">
      <div className="auth-header">
        <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
        <p className="auth-subtitle">
          {isLogin ? "Sign in to pick up where you left off." : "Join to unlock your personal library."}
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="auth-input"
            required
          />
        </div>

        <div className="input-group password-group">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="auth-input"
            required
          />
          <button 
            type="button" 
            className="password-toggle" 
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            {error}
          </div>
        )}
        
        {message && (
          <div className="alert alert-success">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="auth-submit"
        >
          {loading ? <span className="auth-spinner"></span> : (isLogin ? "Sign In" : "Get Started")}
        </button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <button onClick={handleGoogle} className="google-btn" type="button">
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continue with Google
      </button>

      <footer className="auth-footer">
        <p>
          {isLogin ? "New here?" : "Already have an account?"}
          <button
            onClick={() => { setIsLogin(f => !f); setError(""); setMessage(""); }}
            className="toggle-auth-btn"
            type="button"
          >
            {isLogin ? "Sign up now" : "Sign in"}
          </button>
        </p>
      </footer>
    </div>
  );
}