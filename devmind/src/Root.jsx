import { useState, useEffect } from "react";
import App from "./App";
import Login from "./components/Auth/Login";
import Dashboard from "./components/Dashboard/Dashboard";
import { supabase } from "./lib/supabase";

export default function Root() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState(null);
  const [resetMode, setResetMode] = useState(false);

  useEffect(() => {
    // Check if this is a password reset callback
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setResetMode(true);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (_event === "PASSWORD_RECOVERY") {
          setResetMode(true);
          setLoading(false);
          return;
        }
        setUser(session?.user ?? null);
        if (!session) setCurrentProject(null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0f172a",
        display: "flex", alignItems: "center",
        justifyContent: "center", color: "#60a5fa",
        fontSize: "24px", fontFamily: "sans-serif",
      }}>
        ⚡ Loading DevMind...
      </div>
    );
  }

  if (resetMode) {
    return <ResetPassword onDone={() => setResetMode(false)} />;
  }

  if (!user) return <Login onLogin={setUser} />;

  if (!currentProject) {
    return (
      <Dashboard
        user={user}
        onOpenProject={(project) => setCurrentProject(project)}
        onNewProject={(project) => setCurrentProject(project)}
      />
    );
  }

  return (
    <App
      user={user}
      project={currentProject}
      onBackToDashboard={() => setCurrentProject(null)}
    />
  );
}

// ── Reset Password Component ─────────────────────────────────────────────
function ResetPassword({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => onDone(), 2000);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "Inter, sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: "420px",
        background: "#141414", border: "1px solid #262626",
        borderRadius: "12px", padding: "40px 36px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      }}>
        <h2 style={{ color: "#f5f5f5", fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>
          Set new password
        </h2>
        <p style={{ color: "#a3a3a2", fontSize: "13px", marginBottom: "28px" }}>
          Choose a strong password for your DevMind account.
        </p>

        {success ? (
          <div style={{
            background: "#0a2417", border: "1px solid #166534",
            borderRadius: "8px", padding: "14px",
            color: "#86efac", fontSize: "14px", textAlign: "center",
          }}>
            ✅ Password updated! Redirecting to login...
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: "#a3a3a2", fontSize: "11px", fontWeight: 600, display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%", padding: "12px 14px",
                  background: "#0f0f0f", border: "1px solid #2e2e2e",
                  borderRadius: "8px", color: "#f5f5f5",
                  fontSize: "14px", fontFamily: "inherit",
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ color: "#a3a3a2", fontSize: "11px", fontWeight: 600, display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReset()}
                placeholder="••••••••"
                style={{
                  width: "100%", padding: "12px 14px",
                  background: "#0f0f0f", border: `1px solid ${confirm && confirm !== password ? "#7f1d1d" : "#2e2e2e"}`,
                  borderRadius: "8px", color: "#f5f5f5",
                  fontSize: "14px", fontFamily: "inherit",
                  outline: "none", boxSizing: "border-box",
                }}
              />
              {confirm && confirm === password && (
                <p style={{ color: "#86efac", fontSize: "11px", marginTop: "6px" }}>✓ Passwords match</p>
              )}
            </div>

            {error && (
              <div style={{
                background: "#2a0f10", border: "1px solid #7f1d1d",
                borderRadius: "8px", padding: "12px 14px",
                color: "#fca5a5", fontSize: "13px", marginBottom: "16px",
              }}>
                ⚠ {error}
              </div>
            )}

            <button
              onClick={handleReset}
              disabled={loading}
              style={{
                width: "100%", padding: "13px",
                background: loading ? "#262626" : "linear-gradient(180deg, #fafafa 0%, #e5e5e5 100%)",
                border: "none", borderRadius: "8px",
                color: loading ? "#525252" : "#111",
                fontSize: "14px", fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}