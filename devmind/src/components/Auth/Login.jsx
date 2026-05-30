import { useState, useEffect, useId, useMemo } from "react";
import { supabase } from "../../lib/supabase";

// ── Security constants ─────────────────────────────────────────────────────
const MAX_ATTEMPTS  = 5;
const LOCKOUT_SECS  = 60;
const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const FEATURES = [
  { label: "AI Code Generation",        desc: "React components from plain English in seconds." },
  { label: "Full-Stack Backend Studio", desc: "Python, Node.js, Go & Java — live execution included." },
  { label: "Live Preview",              desc: "Instant rendering as you type or generate." },
  { label: "API Tester",                desc: "Test endpoints directly inside the IDE." },
  { label: "Component Library",         desc: "Save and reuse components across projects." },
  { label: "SQL Editor",                desc: "Query your database without leaving the IDE." },
];

const SUPPORT = [
  { label: "Phone",    value: "0740 117 1715",            href: "tel:+254740117171" },
  { label: "WhatsApp", value: "0732 931 333",             href: "https://wa.me/254732931333" },
  { label: "Email",    value: "amonkariuki321@gmail.com", href: "mailto:amonkariuki321@gmail.com" },
];

// ── Theme tokens ───────────────────────────────────────────────────────────
const TOKENS = {
  light: {
    bg: "#fafaf9", surface: "#ffffff", surfaceAlt: "#fff",
    border: "#ececea", borderSoft: "#f4f4f2",
    text: "#111111", textMuted: "#737373", textFaint: "#a3a3a2", textLabel: "#525252",
    accent: "#2563eb", accentSoft: "#7c3aed",
    btnGrad: "linear-gradient(180deg, #1a1a1a 0%, #000 100%)",
    btnDisabled: "#e5e5e4", btnDisabledText: "#a3a3a2",
    iconGrad: "linear-gradient(135deg, #111 0%, #2a2a2a 100%)",
    errBg: "#fef2f2", errBorder: "#fecaca", errText: "#b91c1c",
    okBg: "#f0fdf4", okBorder: "#bbf7d0", okText: "#15803d",
    inputBg: "#fff", inputBorder: "#d4d4d3",
    focusRing: "rgba(37,99,235,0.25)",
    capsWarn: "#d97706",
  },
  dark: {
    bg: "#0a0a0a", surface: "#141414", surfaceAlt: "#0f0f0f",
    border: "#262626", borderSoft: "#1f1f1f",
    text: "#f5f5f5", textMuted: "#a3a3a2", textFaint: "#737373", textLabel: "#d4d4d4",
    accent: "#60a5fa", accentSoft: "#a78bfa",
    btnGrad: "linear-gradient(180deg, #fafafa 0%, #e5e5e5 100%)",
    btnDisabled: "#262626", btnDisabledText: "#525252",
    iconGrad: "linear-gradient(135deg, #fafafa 0%, #d4d4d4 100%)",
    errBg: "#2a0f10", errBorder: "#7f1d1d", errText: "#fca5a5",
    okBg: "#0a2417", okBorder: "#166534", okText: "#86efac",
    inputBg: "#0f0f0f", inputBorder: "#2e2e2e",
    focusRing: "rgba(96,165,250,0.35)",
    capsWarn: "#fbbf24",
  },
};

// ── Theme hook ─────────────────────────────────────────────────────────────
function useTheme() {
  const [pref, setPref] = useState(() => {
    if (typeof window === "undefined") return "system";
    return localStorage.getItem("devmind-theme") || "system";
  });
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const fn = (e) => setSystemDark(e.matches);
    mq.addEventListener?.("change", fn);
    return () => mq.removeEventListener?.("change", fn);
  }, []);

  const isDark = pref === "dark" || (pref === "system" && systemDark);
  const setTheme = (t) => { setPref(t); localStorage.setItem("devmind-theme", t); };
  const toggle = () => setTheme(isDark ? "light" : "dark");
  return { isDark, pref, setTheme, toggle };
}

export default function Login({ onLogin }) {
  const [mode,        setMode]        = useState("signin"); // signin | signup | forgot
  const [name,        setName]        = useState("");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [showPwd,     setShowPwd]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [notice,      setNotice]      = useState(null);
  const [strength,    setStrength]    = useState(0);
  const [attempts,    setAttempts]    = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [capsOn,      setCapsOn]      = useState(false);
  const [visible,     setVisible]     = useState(false);
  const [, force]                     = useState(0);

  const { isDark, toggle } = useTheme();
  const t = useMemo(() => TOKENS[isDark ? "dark" : "light"], [isDark]);

  // Stable IDs for label/aria associations
  const nameId    = useId();
  const emailId   = useId();
  const pwdId     = useId();
  const confirmId = useId();
  const alertId   = useId();
  const strengthId = useId();

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  useEffect(() => {
    if (!lockedUntil) return;
    const id = setInterval(() => {
      if (Date.now() >= lockedUntil) { setLockedUntil(null); clearInterval(id); }
      else force((n) => n + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  // ── password strength ────────────────────────────────────────────────────
  const calcStrength = (p) => {
    let s = 0;
    if (p.length >= 8)          s++;
    if (/[A-Z]/.test(p))        s++;
    if (/[0-9]/.test(p))        s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strengthLabel = ["Too short", "Weak", "Fair", "Good", "Strong"];
  const strengthHex   = ["#a3a3a2", "#dc2626", "#d97706", isDark ? "#60a5fa" : "#2563eb", "#16a34a"];

  // ── helpers ──────────────────────────────────────────────────────────────
  const isLocked   = () => lockedUntil && Date.now() < lockedUntil;
  const secsLeft   = () => Math.ceil((lockedUntil - Date.now()) / 1000);
  const clearForm  = () => { setError(null); setNotice(null); setPassword(""); setConfirm(""); setStrength(0); };
  const switchMode = (m) => { clearForm(); setMode(m); };

  // Field-level validation flags (for aria-invalid)
  const emailInvalid   = !!error && (error.includes("email") || error.includes("Incorrect"));
  const pwdInvalid     = !!error && (error.includes("Password") || error.includes("Incorrect") || error.includes("weak"));
  const confirmInvalid = mode === "signup" && confirm.length > 0 && confirm !== password;

  // ── submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setError(null);
    setNotice(null);

    if (isLocked()) {
      setError(`Account temporarily locked. Try again in ${secsLeft()} seconds.`);
      return;
    }
    if (!validateEmail(email)) { setError("Enter a valid email address."); return; }

    if (mode === "forgot") {
      setLoading(true);
      try { await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }); }
      catch (_) {}
      finally   { setLoading(false); }
      setNotice("If that address is registered, a reset link is on its way.");
      return;
    }

    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }

    if (mode === "signup") {
      if (!name.trim())         { setError("Full name is required."); return; }
      if (strength < 2)         { setError("Password is too weak — add numbers or symbols."); return; }
      if (password !== confirm) { setError("Passwords do not match."); return; }
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error: e2 } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: name } },
        });
        if (e2) throw new Error("SIGNUP_ERROR");
        setNotice("Account created. Check your email to confirm before signing in.");
      } else {
        const { data, error: e2 } = await supabase.auth.signInWithPassword({ email, password });
        if (e2) {
          const next = attempts + 1;
          setAttempts(next);
          if (next >= MAX_ATTEMPTS) {
            setLockedUntil(Date.now() + LOCKOUT_SECS * 1000);
            setAttempts(0);
            throw new Error("LOCKED");
          }
          throw new Error("INVALID");
        }
        setAttempts(0);
        setLockedUntil(null);
        onLogin(data.user);
      }
    } catch (err) {
      if      (err.message === "LOCKED")       setError(`Too many failed attempts. Wait ${LOCKOUT_SECS} seconds.`);
      else if (err.message === "INVALID")      setError("Incorrect email or password.");
      else if (err.message === "SIGNUP_ERROR") setError("Could not create account. Please try again.");
      else                                     setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => {
    setCapsOn(e.getModifierState && e.getModifierState("CapsLock"));
  };

  // ── styles ───────────────────────────────────────────────────────────────
  const S = {
    page: {
      minHeight: "100dvh", display: "flex",
      background: t.bg, color: t.text,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(6px)",
      transition: "opacity 0.4s ease, transform 0.4s ease, background 0.25s, color 0.25s",
    },

    /* LEFT */
    left: {
      flex: 1, display: "flex", flexDirection: "column",
      padding: "clamp(28px, 5vw, 56px) clamp(24px, 5vw, 64px)",
      borderRight: `1px solid ${t.border}`,
      background: t.surface,
      transition: "background 0.25s, border-color 0.25s",
    },
    wordmark: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "clamp(40px, 8vw, 72px)" },
    wordmarkIcon: {
      width: "32px", height: "32px",
      background: t.iconGrad, borderRadius: "8px",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: isDark ? "#111" : "#fff", fontSize: "15px", fontWeight: 700,
      boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
    },
    wordmarkText: { fontSize: "16px", fontWeight: 700, letterSpacing: "-0.01em", color: t.text },
    tagline: { fontSize: "11px", color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.12em", marginTop: "2px" },

    headline: {
      fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, letterSpacing: "-0.035em",
      lineHeight: 1.1, margin: "0 0 16px", color: t.text,
    },
    headlineAccent: {
      background: `linear-gradient(135deg, ${t.accent} 0%, ${t.accentSoft} 100%)`,
      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    },
    subtext: {
      fontSize: "14px", color: t.textMuted, lineHeight: 1.7,
      margin: "0 0 clamp(32px, 6vw, 56px)", maxWidth: "420px",
    },

    featureTable: { flex: 1, borderTop: `1px solid ${t.border}` },
    featureRow: {
      display: "grid", gridTemplateColumns: "minmax(140px, 200px) 1fr",
      borderBottom: `1px solid ${t.border}`,
      padding: "16px 0", gap: "24px",
    },
    featureLabel: { fontSize: "13px", fontWeight: 600, color: t.text },
    featureDesc:  { fontSize: "13px", color: t.textMuted, lineHeight: 1.55 },

    supportBlock: { marginTop: "clamp(32px, 6vw, 48px)", paddingTop: "28px", borderTop: `1px solid ${t.border}` },
    supportHeading: {
      fontSize: "10px", textTransform: "uppercase",
      letterSpacing: "0.14em", color: t.textFaint, marginBottom: "16px", fontWeight: 600,
    },
    supportRow: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 0", borderBottom: `1px solid ${t.borderSoft}`,
      textDecoration: "none", color: "inherit",
      minHeight: "44px", gap: "12px",
    },
    supportKey:   { fontSize: "11px", color: t.textFaint, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 },
    supportValue: { fontSize: "13px", fontWeight: 600, color: t.text },

    /* RIGHT */
    right: {
      width: "480px", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "clamp(24px, 5vw, 56px)",
      background: t.bg,
    },
    card: {
      width: "100%", maxWidth: "440px",
      background: t.surface,
      border: `1px solid ${t.border}`, borderRadius: "12px",
      padding: "clamp(28px, 5vw, 40px) clamp(24px, 5vw, 36px)",
      boxShadow: isDark
        ? "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3)"
        : "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)",
      position: "relative",
      transition: "background 0.25s, border-color 0.25s, box-shadow 0.25s",
    },
    themeToggle: {
      position: "absolute", top: "16px", right: "16px",
      width: "36px", height: "36px",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      background: "transparent", border: `1px solid ${t.border}`,
      borderRadius: "8px", cursor: "pointer", color: t.text,
      fontSize: "16px", lineHeight: 1,
      transition: "background 0.15s, border-color 0.15s, color 0.15s",
    },
    formTitle: { fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 40px 6px 0", color: t.text },
    formSub:   { fontSize: "13px", color: t.textMuted, margin: "0 0 28px" },

    field: { marginBottom: "16px" },
    label: {
      display: "flex", justifyContent: "space-between", alignItems: "center",
      fontSize: "11px", fontWeight: 600, color: t.textLabel,
      textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "7px",
    },
    input: (invalid) => ({
      width: "100%", padding: "12px 14px",
      background: t.inputBg,
      border: `1px solid ${invalid ? "#dc2626" : t.inputBorder}`,
      borderRadius: "8px",
      fontSize: "14px", color: t.text,
      fontFamily: "inherit", outline: "none",
      boxSizing: "border-box",
      transition: "border-color 0.15s, box-shadow 0.15s, background 0.25s",
    }),
    inputWrap: { position: "relative" },
    pwdToggle: {
      position: "absolute", right: "8px", top: "50%",
      transform: "translateY(-50%)",
      minHeight: "32px", minWidth: "44px",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      background: "none", border: "none",
      color: t.textMuted, cursor: "pointer",
      fontSize: "11px", fontWeight: 600,
      fontFamily: "inherit", padding: "4px 8px",
      textTransform: "uppercase", letterSpacing: "0.06em",
      borderRadius: "6px",
    },

    barsRow: { display: "flex", gap: "4px", marginTop: "10px" },
    bar: (i, s) => ({
      flex: 1, height: "3px", borderRadius: "2px",
      background: i <= s ? strengthHex[s] : t.border,
      transition: "background 0.25s",
    }),
    strengthText: (s) => ({
      fontSize: "10px", marginTop: "6px", fontWeight: 600,
      color: strengthHex[s] || t.textFaint,
      textTransform: "uppercase", letterSpacing: "0.1em",
    }),
    matchHint: (ok) => ({
      fontSize: "11px", marginTop: "6px", fontWeight: 500,
      color: ok ? (isDark ? "#86efac" : "#16a34a") : (isDark ? "#fca5a5" : "#dc2626"),
    }),
    capsHint: { fontSize: "11px", marginTop: "6px", color: t.capsWarn, fontWeight: 500 },
    fieldHint: { fontSize: "11px", marginTop: "6px", color: t.textMuted },

    forgotBtn: {
      background: "none", border: "none",
      color: t.accent, fontSize: "11px",
      fontWeight: 600, cursor: "pointer",
      fontFamily: "inherit", padding: "4px 0",
      minHeight: "28px",
    },

    alert: (type) => ({
      padding: "12px 14px", borderRadius: "8px",
      fontSize: "13px", marginBottom: "16px", lineHeight: 1.5,
      display: "flex", alignItems: "flex-start", gap: "8px",
      background: type === "error" ? t.errBg : t.okBg,
      border:     `1px solid ${type === "error" ? t.errBorder : t.okBorder}`,
      color:      type === "error" ? t.errText : t.okText,
    }),

    btn: (disabled) => ({
      width: "100%", padding: "13px", minHeight: "48px",
      background: disabled ? t.btnDisabled : t.btnGrad,
      border: "none", borderRadius: "8px",
      color: disabled ? t.btnDisabledText : (isDark ? "#111" : "#fff"),
      fontSize: "14px", fontWeight: 600,
      fontFamily: "inherit",
      cursor: disabled ? "not-allowed" : "pointer",
      letterSpacing: "0.01em",
      transition: "transform 0.1s, box-shadow 0.15s, opacity 0.15s",
      boxShadow: disabled ? "none" : "0 1px 2px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.12)",
      marginBottom: "20px",
      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    }),
    spinner: {
      width: "14px", height: "14px",
      border: `2px solid ${isDark ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.3)"}`,
      borderTopColor: isDark ? "#111" : "#fff",
      borderRadius: "50%",
      animation: "dm-spin 0.7s linear infinite",
    },

    divider: {
      display: "flex", alignItems: "center", gap: "12px",
      margin: "8px 0 20px",
      fontSize: "10px", color: t.textFaint,
      textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600,
    },
    dividerLine: { flex: 1, height: "1px", background: t.border },

    toggle: { textAlign: "center", fontSize: "13px", color: t.textMuted },
    toggleBtn: {
      background: "none", border: "none",
      color: t.accent, fontSize: "13px", fontWeight: 600,
      cursor: "pointer", fontFamily: "inherit", padding: "4px 6px",
      minHeight: "32px",
    },

    footer: {
      marginTop: "28px", paddingTop: "20px",
      borderTop: `1px solid ${t.border}`,
      fontSize: "11px", color: t.textFaint,
      lineHeight: 1.7, textAlign: "center",
    },
    footerLink: { color: t.textLabel, textDecoration: "none", fontWeight: 500 },

    // Visually-hidden text for screen readers
    srOnly: {
      position: "absolute", width: "1px", height: "1px",
      padding: 0, margin: "-1px", overflow: "hidden",
      clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0,
    },
  };

  const isDisabled = loading || isLocked();
  const focusRing  = t.focusRing;
  const accent     = t.accent;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { margin: 0; -webkit-font-smoothing: antialiased; background: ${t.bg}; }
        input:focus-visible {
          border-color: ${accent} !important;
          box-shadow: 0 0 0 3px ${focusRing} !important;
        }
        button:focus-visible, a:focus-visible {
          outline: 2px solid ${accent};
          outline-offset: 2px;
          border-radius: 6px;
        }
        a:hover .support-arrow { transform: translateX(4px); }
        a:hover .support-value { color: ${accent} !important; }
        .support-arrow, .support-value { transition: transform 0.18s, color 0.18s; }
        .dm-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,0.18), 0 8px 20px rgba(0,0,0,0.18); }
        .dm-btn:active:not(:disabled) { transform: translateY(0); }
        .dm-link:hover { text-decoration: underline; text-underline-offset: 3px; }
        .dm-pwd-toggle:hover { background: ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}; }
        .dm-theme-toggle:hover { background: ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}; border-color: ${accent}; }
        @keyframes dm-spin { to { transform: rotate(360deg); } }

        @media (max-width: 1023px) {
          .dm-page { flex-direction: column; }
          .dm-right { width: 100% !important; }
          .dm-left { border-right: none !important; border-bottom: 1px solid ${t.border}; }
          .dm-feature-table { display: none; }
          .dm-support { display: none; }
          .dm-headline { font-size: clamp(24px, 6vw, 32px) !important; }
          .dm-subtext { margin-bottom: 8px !important; }
        }
        @media (max-width: 600px) {
          .dm-feature-row { grid-template-columns: 1fr !important; gap: 4px !important; }
          .dm-support-row { flex-direction: column !important; align-items: flex-start !important; gap: 4px; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.001ms !important;
            transition-duration: 0.001ms !important;
          }
        }
      `}</style>

      <div className="dm-page" style={S.page}>
        {/* ── LEFT ───────────────────────────────────────────────────────── */}
        <aside className="dm-left" style={S.left} aria-label="Product overview">
          <div style={S.wordmark}>
            <div style={S.wordmarkIcon} aria-hidden="true">D</div>
            <div>
              <div style={S.wordmarkText}>DevMind</div>
              <div style={S.tagline}>Full-Stack AI IDE</div>
            </div>
          </div>

          <h1 className="dm-headline" style={S.headline}>
            The IDE that<br />
            <span style={S.headlineAccent}>builds with you.</span>
          </h1>
          <p className="dm-subtext" style={S.subtext}>
            AI-generated frontends, live backend execution, integrated API
            testing, and a built-in SQL editor — all in one browser tab.
          </p>

          <div className="dm-feature-table" style={S.featureTable}>
            {FEATURES.map((f, i) => (
              <div key={i} className="dm-feature-row" style={S.featureRow}>
                <div style={S.featureLabel}>{f.label}</div>
                <div style={S.featureDesc}>{f.desc}</div>
              </div>
            ))}
          </div>

          <div className="dm-support" style={S.supportBlock}>
            <h2 style={S.supportHeading}>Community & Support</h2>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {SUPPORT.map((s, i) => (
                <li key={i}>
                  <a
                    href={s.href}
                    className="dm-support-row"
                    style={S.supportRow}
                    aria-label={`${s.label}: ${s.value}`}
                  >
                    <span style={S.supportKey}>{s.label}</span>
                    <span style={S.supportValue} className="support-value">
                      {s.value} <span className="support-arrow" aria-hidden="true">→</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* ── RIGHT ──────────────────────────────────────────────────────── */}
        <main className="dm-right" style={S.right}>
          <form
            style={S.card}
            onSubmit={handleSubmit}
            noValidate
            aria-labelledby={`${alertId}-title`}
          >
            <button
              type="button"
              onClick={toggle}
              className="dm-theme-toggle"
              style={S.themeToggle}
              aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
              aria-pressed={isDark}
              title={`Switch to ${isDark ? "light" : "dark"} mode`}
            >
              <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
            </button>

            <h2 id={`${alertId}-title`} style={S.formTitle}>
              {mode === "forgot" ? "Reset your password"
                : mode === "signup" ? "Create your account"
                : "Welcome back"}
            </h2>
            <p style={S.formSub}>
              {mode === "forgot" ? "We'll email you a secure reset link."
                : mode === "signup" ? "Start building in seconds — no credit card required."
                : "Sign in to continue to DevMind."}
            </p>

            {/* Name */}
            {mode === "signup" && (
              <div style={S.field}>
                <label htmlFor={nameId} style={S.label}>Full name</label>
                <input
                  id={nameId}
                  style={S.input(false)}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Amon Mugo"
                  autoComplete="name"
                  spellCheck={false}
                  required
                />
              </div>
            )}

            {/* Email */}
            <div style={S.field}>
              <label htmlFor={emailId} style={S.label}>Email address</label>
              <input
                id={emailId}
                style={S.input(emailInvalid)}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                spellCheck={false}
                required
                aria-invalid={emailInvalid || undefined}
                aria-describedby={emailInvalid ? alertId : undefined}
              />
            </div>

            {/* Password */}
            {mode !== "forgot" && (
              <div style={S.field}>
                <div style={S.label}>
                  <label htmlFor={pwdId}>Password</label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      style={S.forgotBtn}
                      className="dm-link"
                      onClick={() => switchMode("forgot")}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div style={S.inputWrap}>
                  <input
                    id={pwdId}
                    style={{ ...S.input(pwdInvalid), paddingRight: "64px" }}
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setStrength(calcStrength(e.target.value)); }}
                    onKeyUp={onKey}
                    placeholder="••••••••"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    required
                    minLength={8}
                    aria-invalid={pwdInvalid || undefined}
                    aria-describedby={[
                      pwdInvalid ? alertId : null,
                      mode === "signup" && password ? strengthId : null,
                    ].filter(Boolean).join(" ") || undefined}
                  />
                  <button
                    type="button"
                    className="dm-pwd-toggle"
                    style={S.pwdToggle}
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={showPwd ? "Hide password" : "Show password"}
                    aria-pressed={showPwd}
                  >
                    {showPwd ? "Hide" : "Show"}
                  </button>
                </div>

                {capsOn && (
                  <div style={S.capsHint} role="status">
                    <span aria-hidden="true">⚠ </span>Caps Lock is on
                  </div>
                )}

                {mode === "signup" && password && (
                  <div
                    id={strengthId}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={4}
                    aria-valuenow={strength}
                    aria-valuetext={`Password strength: ${strengthLabel[strength]}`}
                  >
                    <div style={S.barsRow} aria-hidden="true">
                      {[1, 2, 3, 4].map((i) => <div key={i} style={S.bar(i, strength)} />)}
                    </div>
                    <div style={S.strengthText(strength)}>
                      {strengthLabel[strength]}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Confirm */}
            {mode === "signup" && (
              <div style={S.field}>
                <label htmlFor={confirmId} style={S.label}>Confirm password</label>
                <input
                  id={confirmId}
                  style={S.input(confirmInvalid)}
                  type={showPwd ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  aria-invalid={confirmInvalid || undefined}
                />
                {confirm && (
                  <div style={S.matchHint(confirm === password)} role="status">
                    <span aria-hidden="true">{confirm === password ? "✓ " : "✗ "}</span>
                    {confirm === password ? "Passwords match" : "Passwords don't match"}
                  </div>
                )}
              </div>
            )}

            {/* Alerts */}
            <div id={alertId} aria-live="polite" aria-atomic="true">
              {error  && <div style={S.alert("error")}   role="alert"><span aria-hidden="true">⚠ </span>{error}</div>}
              {notice && <div style={S.alert("success")} role="status"><span aria-hidden="true">✓ </span>{notice}</div>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              style={S.btn(isDisabled)}
              className="dm-btn"
              disabled={isDisabled}
              aria-busy={loading || undefined}
            >
              {loading && <span style={S.spinner} aria-hidden="true" />}
              <span>
                {loading ? "Please wait…"
                  : isLocked() ? `Locked — ${secsLeft()}s`
                  : mode === "forgot" ? "Send reset link"
                  : mode === "signup" ? "Create account"
                  : "Sign in"}
              </span>
            </button>

            <div style={S.divider} aria-hidden="true">
              <span style={S.dividerLine} />
              <span>or</span>
              <span style={S.dividerLine} />
            </div>

            <div style={S.toggle}>
              {mode === "forgot" ? (
                <button type="button" style={S.toggleBtn} className="dm-link" onClick={() => switchMode("signin")}>
                  ← Back to sign in
                </button>
              ) : mode === "signup" ? (
                <>Already have an account?{" "}
                  <button type="button" style={S.toggleBtn} className="dm-link" onClick={() => switchMode("signin")}>
                    Sign in
                  </button>
                </>
              ) : (
                <>New to DevMind?{" "}
                  <button type="button" style={S.toggleBtn} className="dm-link" onClick={() => switchMode("signup")}>
                    Create a free account
                  </button>
                </>
              )}
            </div>

            <div style={S.footer}>
              Secured by <a href="#" style={S.footerLink}>Supabase</a> · Encrypted & protected.
              <br />
              Need help?{" "}
              <a href="https://wa.me/254732931333" style={S.footerLink}>
                WhatsApp us
              </a>
            </div>
          </form>
        </main>
      </div>
    </>
  );
}
