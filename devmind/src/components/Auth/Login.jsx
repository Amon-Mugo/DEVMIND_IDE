import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Login({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const checkPasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    setPasswordStrength(strength);
  };

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"];

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async () => {
    setError(null);
    setMessage(null);

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (isForgot) {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      setLoading(false);
      if (error) setError(error.message);
      else setMessage("Password reset link sent to your email.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (isSignup) {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (passwordStrength < 2) {
        setError("Password is too weak. Add uppercase letters, numbers or symbols.");
        return;
      }
      if (!name.trim()) {
        setError("Please enter your full name.");
        return;
      }
    }

    setLoading(true);

    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        setMessage("Account created! Check your email to confirm before signing in.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onLogin(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "13px 16px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border 0.2s ease",
  };

  const labelStyle = {
    color: "#94a3b8",
    fontSize: "13px",
    fontWeight: "500",
    display: "block",
    marginBottom: "6px",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a1a",
        display: "flex",
        fontFamily: "Segoe UI, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background blobs */}
      <div style={{
        position: "absolute", top: "-200px", left: "-200px",
        width: "600px", height: "600px",
        background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-200px", right: "-200px",
        width: "600px", height: "600px",
        background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />

      {/* Left panel — branding */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px",
          position: "relative",
        }}
      >
        <div style={{ maxWidth: "480px" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>⚡</div>
          <h1 style={{
            fontSize: "48px", fontWeight: "800", color: "#fff",
            lineHeight: "1.1", margin: "0 0 16px 0",
          }}>
            Build faster with{" "}
            <span style={{ color: "#60a5fa" }}>AI</span>
          </h1>
          <p style={{
            fontSize: "18px", color: "#64748b", lineHeight: "1.7", margin: "0 0 48px 0",
          }}>
            DevMind is an AI-powered IDE that generates beautiful, production-ready React components in seconds.
          </p>

          {/* Feature list */}
          {[
            { icon: "🤖", text: "AI generates code from your description" },
            { icon: "⚡", text: "Live preview updates instantly as you type" },
            { icon: "📦", text: "Save and reuse components across projects" },
            { icon: "🗄️", text: "Built-in SQL editor for database work" },
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
              }}>
                {f.icon}
              </div>
              <span style={{ color: "#94a3b8", fontSize: "14px" }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — auth form */}
      <div
        style={{
          width: "480px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
          borderLeft: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div style={{ width: "100%" }}>
          <h2 style={{
            color: "#fff", fontSize: "24px", fontWeight: "700",
            margin: "0 0 8px 0",
          }}>
            {isForgot ? "Reset password" : isSignup ? "Create account" : "Sign in"}
          </h2>
          <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 32px 0" }}>
            {isForgot
              ? "Enter your email and we'll send a reset link"
              : isSignup
              ? "Start building with AI today"
              : "Welcome back to DevMind"}
          </p>

          {/* Name field */}
          {isSignup && !isForgot && (
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Amon Mugo"
                style={inputStyle}
              />
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>

          {/* Password */}
          {!isForgot && (
            <div style={{ marginBottom: isSignup ? "8px" : "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={labelStyle}>Password</label>
                {!isSignup && (
                  <button
                    onClick={() => { setIsForgot(true); setError(null); }}
                    style={{ background: "none", border: "none", color: "#60a5fa", fontSize: "12px", cursor: "pointer" }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (isSignup) checkPasswordStrength(e.target.value);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: "48px" }}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: "14px", top: "50%",
                    transform: "translateY(-50%)", background: "none",
                    border: "none", color: "#64748b", cursor: "pointer", fontSize: "16px",
                  }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>

              {/* Password strength */}
              {isSignup && password && (
                <div style={{ marginTop: "8px" }}>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} style={{
                        flex: 1, height: "3px", borderRadius: "2px",
                        background: i <= passwordStrength ? strengthColor[passwordStrength] : "rgba(255,255,255,0.1)",
                        transition: "background 0.2s ease",
                      }} />
                    ))}
                  </div>
                  <span style={{ fontSize: "11px", color: strengthColor[passwordStrength] }}>
                    {strengthLabel[passwordStrength]}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Confirm password */}
          {isSignup && !isForgot && (
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Confirm Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="••••••••"
                style={{
                  ...inputStyle,
                  borderColor: confirmPassword && confirmPassword !== password
                    ? "rgba(239,68,68,0.5)"
                    : confirmPassword && confirmPassword === password
                    ? "rgba(16,185,129,0.5)"
                    : "rgba(255,255,255,0.12)",
                }}
              />
              {confirmPassword && confirmPassword === password && (
                <p style={{ color: "#10b981", fontSize: "12px", marginTop: "4px" }}>✓ Passwords match</p>
              )}
            </div>
          )}

          {/* Error/Success */}
          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: "10px", padding: "12px 16px", color: "#fca5a5",
              fontSize: "13px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px",
            }}>
              ⚠️ {error}
            </div>
          )}

          {message && (
            <div style={{
              background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: "10px", padding: "12px 16px", color: "#6ee7b7",
              fontSize: "13px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px",
            }}>
              ✅ {message}
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%", padding: "14px",
              background: loading ? "#1e293b" : "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
              border: "none", borderRadius: "12px", color: "#fff",
              fontSize: "15px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease", marginBottom: "20px",
              boxShadow: loading ? "none" : "0 4px 20px rgba(59,130,246,0.3)",
            }}
          >
            {loading ? "⏳ Please wait..." : isForgot ? "Send Reset Link" : isSignup ? "Create Account" : "Sign In →"}
          </button>

          {/* Toggle links */}
          <div style={{ textAlign: "center" }}>
            {isForgot ? (
              <button
                onClick={() => { setIsForgot(false); setError(null); setMessage(null); }}
                style={{ background: "none", border: "none", color: "#60a5fa", fontSize: "13px", cursor: "pointer" }}
              >
                ← Back to sign in
              </button>
            ) : (
              <p style={{ color: "#64748b", fontSize: "13px", margin: "0" }}>
                {isSignup ? "Already have an account? " : "Don't have an account? "}
                <button
                  onClick={() => { setIsSignup(!isSignup); setError(null); setMessage(null); setPassword(""); setConfirmPassword(""); }}
                  style={{ background: "none", border: "none", color: "#60a5fa", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                >
                  {isSignup ? "Sign in" : "Sign up for free"}
                </button>
              </p>
            )}
          </div>

          {/* Security note */}
          <p style={{
            textAlign: "center", color: "#334155", fontSize: "11px",
            marginTop: "32px", lineHeight: "1.5",
          }}>
            🔒 Secured by Supabase • Your data is encrypted and protected
          </p>
        </div>
      </div>
    </div>
  );
}