import { useState, useEffect, useMemo, useId, useCallback, useRef } from "react";
import { loadProjects, createProject, deleteProject, supabase } from "../../lib/supabase";

const DEFAULT_CODE = `function DevApp() {
  return (
    <div>
      <h1>Hello DevMind</h1>
    </div>
  );
}`;

// ── time helper ─────────────────────────────────────────────────────────────
const timeAgo = (d) => {
  if (!d) return "—";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

// ── rename helper (assumes supabase projects table) ────────────────────────
async function renameProject(id, name) {
  const { data, error } = await supabase
    .from("projects")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── theme tokens ────────────────────────────────────────────────────────────
const TOKENS = {
  light: {
    bg: "#fafaf9", surface: "#ffffff", surfaceAlt: "#f7f7f5",
    border: "#eceae6", borderStrong: "#0a0a0a",
    text: "#0a0a0a", textMuted: "#6b6b68", textSubtle: "#a8a8a4",
    accent: "#0a0a0a", accentHover: "#1f1f1f", onAccent: "#ffffff",
    danger: "#dc2626", dangerBg: "#fef2f2", dangerBorder: "#fecaca",
    hover: "#f5f4f1", focus: "#2563eb",
    success: "#059669", successBg: "#ecfdf5",
    shadowSm: "0 1px 2px rgba(15,15,15,0.04)",
    shadowMd: "0 4px 12px rgba(15,15,15,0.06), 0 1px 3px rgba(15,15,15,0.04)",
    shadowLg: "0 12px 32px rgba(15,15,15,0.08), 0 2px 6px rgba(15,15,15,0.04)",
  },
  dark: {
    bg: "#0a0a0a", surface: "#141414", surfaceAlt: "#1a1a1a",
    border: "#262626", borderStrong: "#f5f5f5",
    text: "#f5f5f5", textMuted: "#a3a3a2", textSubtle: "#6b6b68",
    accent: "#f5f5f5", accentHover: "#ffffff", onAccent: "#0a0a0a",
    danger: "#f87171", dangerBg: "#2a1212", dangerBorder: "#5a1f1f",
    hover: "#1f1f1f", focus: "#60a5fa",
    success: "#34d399", successBg: "#0f2a1f",
    shadowSm: "0 1px 2px rgba(0,0,0,0.4)",
    shadowMd: "0 4px 12px rgba(0,0,0,0.5)",
    shadowLg: "0 12px 32px rgba(0,0,0,0.6)",
  },
};

// ── theme hook ──────────────────────────────────────────────────────────────
function useTheme() {
  const [pref, setPref] = useState(() => {
    if (typeof window === "undefined") return "system";
    return localStorage.getItem("devmind-theme") || "system";
  });
  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  const isDark = pref === "dark" || (pref === "system" && systemDark);
  const toggle = useCallback(() => {
    const next = isDark ? "light" : "dark";
    setPref(next);
    try { localStorage.setItem("devmind-theme", next); } catch {}
  }, [isDark]);
  return { isDark, toggle, pref };
}

function useViewMode() {
  const [mode, setMode] = useState(() => {
    if (typeof window === "undefined") return "grid";
    return localStorage.getItem("devmind-view") || "grid";
  });
  const set = useCallback((m) => {
    setMode(m);
    try { localStorage.setItem("devmind-view", m); } catch {}
  }, []);
  return [mode, set];
}

// ── small toast hook ────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, type = "success") => {
    setToast({ msg, type, id: Date.now() });
    setTimeout(() => setToast(null), 2400);
  }, []);
  return { toast, show };
}

export default function Dashboard({ user, onOpenProject, onNewProject }) {
  const { isDark, toggle: toggleTheme } = useTheme();
  const t = useMemo(() => TOKENS[isDark ? "dark" : "light"], [isDark]);
  const { toast, show: showToast } = useToast();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [viewMode, setViewMode] = useViewMode();
  const [sortBy, setSortBy] = useState("updated");
  const [menuOpenId, setMenuOpenId] = useState(null);

  // rename state
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);
  const renameInputRef = useRef(null);

  const searchId = useId();

  useEffect(() => {
    loadProjects(user.id)
      .then(setProjects)
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        requestAnimationFrame(() => setVisible(true));
      });
  }, [user.id]);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const handleNew = async () => {
    setCreating(true);
    try {
      const p = await createProject(
        user.id, "Untitled Project", DEFAULT_CODE,
        [{ id: 1, name: "App.jsx", code: DEFAULT_CODE }]
      );
      onNewProject(p);
    } catch (e) { console.error(e); showToast("Couldn't create project", "error"); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      showToast("Project deleted");
    } catch (e) { console.error(e); showToast("Delete failed", "error"); }
    finally { setDeletingId(null); setConfirmDel(null); }
  };

  const startRename = (p) => {
    setMenuOpenId(null);
    setConfirmDel(null);
    setRenamingId(p.id);
    setRenameValue(p.name);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  const commitRename = async () => {
    if (!renamingId) return;
    const name = renameValue.trim();
    const current = projects.find((p) => p.id === renamingId);
    if (!name || !current || name === current.name) {
      cancelRename();
      return;
    }
    setRenameSaving(true);
    // optimistic update
    setProjects((prev) =>
      prev.map((p) => (p.id === renamingId ? { ...p, name } : p))
    );
    try {
      await renameProject(renamingId, name);
      showToast("Renamed");
    } catch (e) {
      console.error(e);
      // revert
      setProjects((prev) =>
        prev.map((p) => (p.id === renamingId ? { ...p, name: current.name } : p))
      );
      showToast("Rename failed", "error");
    } finally {
      setRenameSaving(false);
      setRenamingId(null);
      setRenameValue("");
    }
  };

  const onRenameKey = (e) => {
    if (e.key === "Enter") { e.preventDefault(); commitRename(); }
    else if (e.key === "Escape") { e.preventDefault(); cancelRename(); }
  };

  const sorted = useMemo(() => {
    const arr = [...projects];
    if (sortBy === "name") arr.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "created") arr.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    else arr.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
    return arr;
  }, [projects, sortBy]);

  const filtered = useMemo(
    () => sorted.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [sorted, search]
  );

  const totalFiles = useMemo(
    () => projects.reduce((acc, p) => acc + (p.tabs?.length || 1), 0),
    [projects]
  );
  const lastActivity = projects[0]?.updated_at;
  const initial = (user?.email || "?").charAt(0).toUpperCase();

  // close popovers on outside click
  useEffect(() => {
    const close = () => { setAccountOpen(false); setMenuOpenId(null); };
    if (!accountOpen && menuOpenId === null) return;
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [accountOpen, menuOpenId]);

  // ── styles ────────────────────────────────────────────────────────────────
  const S = {
    page: {
      minHeight: "100dvh", background: t.bg, color: t.text,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      opacity: visible ? 1 : 0, transition: "opacity 0.3s ease",
      letterSpacing: "-0.005em",
    },
    nav: {
      position: "sticky", top: 0, zIndex: 30,
      height: "60px",
      borderBottom: `1px solid ${t.border}`,
      background: isDark ? "rgba(10,10,10,0.8)" : "rgba(255,255,255,0.8)",
      backdropFilter: "saturate(180%) blur(16px)",
      WebkitBackdropFilter: "saturate(180%) blur(16px)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 clamp(16px, 4vw, 40px)",
    },
    navLeft: { display: "flex", alignItems: "center", gap: "12px" },
    brandMark: {
      width: "30px", height: "30px",
      background: `linear-gradient(135deg, ${t.accent}, ${isDark ? "#666" : "#444"})`,
      color: t.onAccent,
      borderRadius: "8px", display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: "13px", fontWeight: "800",
      letterSpacing: "-0.04em",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)",
    },
    brandName: { fontSize: "14px", fontWeight: "700", color: t.text, letterSpacing: "-0.02em" },
    brandBadge: {
      fontSize: "9px", fontWeight: "700", color: t.textSubtle,
      padding: "2px 6px", border: `1px solid ${t.border}`, borderRadius: "4px",
      textTransform: "uppercase", letterSpacing: "0.08em",
    },
    navRight: { display: "flex", alignItems: "center", gap: "8px", position: "relative" },
    iconBtn: {
      width: "36px", height: "36px", display: "inline-flex",
      alignItems: "center", justifyContent: "center",
      background: "transparent", color: t.textMuted,
      border: `1px solid ${t.border}`, borderRadius: "8px",
      cursor: "pointer", fontFamily: "inherit", fontSize: "15px",
      transition: "all 0.15s",
    },
    avatarBtn: {
      display: "inline-flex", alignItems: "center", gap: "8px",
      padding: "4px 12px 4px 4px",
      background: t.surface, color: t.text,
      border: `1px solid ${t.border}`, borderRadius: "999px",
      cursor: "pointer", fontFamily: "inherit", fontSize: "12px",
      fontWeight: 500,
      transition: "all 0.15s",
    },
    avatar: {
      width: "28px", height: "28px", borderRadius: "50%",
      background: `linear-gradient(135deg, ${t.accent}, ${isDark ? "#888" : "#555"})`,
      color: t.onAccent,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: "12px", fontWeight: "700",
    },
    popover: {
      position: "absolute", top: "calc(100% + 8px)", right: 0,
      minWidth: "240px",
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: "12px", boxShadow: t.shadowLg, padding: "6px",
      zIndex: 40,
    },
    popoverHeader: {
      padding: "10px 12px 12px",
      borderBottom: `1px solid ${t.border}`, marginBottom: "6px",
    },
    popoverName: { fontSize: "12px", fontWeight: 600, color: t.text, marginBottom: "2px" },
    popoverEmail: { fontSize: "11px", color: t.textMuted, wordBreak: "break-all" },
    popoverItem: {
      display: "flex", alignItems: "center", gap: "10px",
      width: "100%", padding: "9px 12px",
      background: "transparent", border: "none",
      borderRadius: "6px", color: t.text,
      fontFamily: "inherit", fontSize: "12px", textAlign: "left",
      cursor: "pointer", transition: "background 0.1s",
    },

    main: {
      maxWidth: "1240px", margin: "0 auto",
      padding: "clamp(28px, 4vw, 48px) clamp(16px, 4vw, 40px)",
    },

    hero: {
      display: "flex", alignItems: "flex-end",
      justifyContent: "space-between", gap: "16px",
      marginBottom: "32px", flexWrap: "wrap",
    },
    heroEyebrow: {
      fontSize: "11px", color: t.textSubtle,
      textTransform: "uppercase", letterSpacing: "0.12em",
      fontWeight: 600, marginBottom: "10px",
    },
    heroTitle: {
      fontSize: "clamp(26px, 3vw, 32px)", fontWeight: "700",
      color: t.text, letterSpacing: "-0.03em", lineHeight: 1.15,
    },
    heroSub: {
      fontSize: "13px", color: t.textMuted, marginTop: "8px",
    },
    primaryBtn: {
      padding: "11px 18px", background: t.accent, color: t.onAccent,
      border: "none", borderRadius: "8px",
      fontSize: "13px", fontWeight: "600",
      fontFamily: "inherit", cursor: "pointer",
      letterSpacing: "-0.005em", whiteSpace: "nowrap",
      transition: "all 0.15s",
      boxShadow: t.shadowSm,
      display: "inline-flex", alignItems: "center", gap: "8px",
    },

    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "12px", marginBottom: "32px",
    },
    statCard: {
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: "12px", padding: "18px 20px",
      boxShadow: t.shadowSm,
      transition: "border-color 0.15s",
    },
    statLabel: {
      fontSize: "11px", color: t.textMuted,
      letterSpacing: "0.02em", marginBottom: "6px", fontWeight: 500,
    },
    statValue: {
      fontSize: "24px", fontWeight: "700", color: t.text,
      letterSpacing: "-0.025em", lineHeight: 1.1,
    },

    toolbar: {
      display: "flex", alignItems: "center",
      justifyContent: "space-between", marginBottom: "18px",
      gap: "12px", flexWrap: "wrap",
    },
    searchWrap: {
      position: "relative", flex: "1 1 280px", maxWidth: "420px",
      display: "flex", alignItems: "center",
    },
    searchIcon: {
      position: "absolute", left: "14px", color: t.textSubtle,
      fontSize: "14px", pointerEvents: "none",
    },
    searchInput: {
      width: "100%", padding: "11px 14px 11px 38px",
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: "8px", fontSize: "13px",
      color: t.text, fontFamily: "inherit",
      outline: "none", boxSizing: "border-box",
      transition: "border-color 0.15s, box-shadow 0.15s",
    },
    toolbarRight: { display: "flex", alignItems: "center", gap: "8px" },
    select: {
      padding: "10px 12px", background: t.surface,
      border: `1px solid ${t.border}`, borderRadius: "8px",
      color: t.text, fontSize: "12px", fontFamily: "inherit",
      cursor: "pointer", outline: "none", fontWeight: 500,
    },
    segment: {
      display: "inline-flex", background: t.surface,
      border: `1px solid ${t.border}`, borderRadius: "8px",
      padding: "3px",
    },
    segmentBtn: (active) => ({
      padding: "6px 12px", fontSize: "12px", fontWeight: 600,
      background: active ? t.accent : "transparent",
      color: active ? t.onAccent : t.textMuted,
      border: "none", borderRadius: "5px",
      cursor: "pointer", fontFamily: "inherit",
      transition: "all 0.15s",
      display: "inline-flex", alignItems: "center", gap: "6px",
    }),

    // table
    listRegion: {
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: "12px", overflow: "hidden", boxShadow: t.shadowSm,
    },
    table: { width: "100%", borderCollapse: "collapse" },
    thead: { background: t.surfaceAlt },
    th: {
      fontSize: "11px", fontWeight: 600, color: t.textMuted,
      padding: "14px 20px", textAlign: "left",
      borderBottom: `1px solid ${t.border}`,
      letterSpacing: "-0.005em",
    },
    tr: (hover) => ({
      borderBottom: `1px solid ${t.border}`,
      background: hover ? t.hover : "transparent",
      cursor: "pointer", transition: "background 0.1s",
    }),
    td: { padding: "16px 20px", fontSize: "13px", color: t.text, verticalAlign: "middle" },
    tdMuted: { padding: "16px 20px", fontSize: "12px", color: t.textMuted, verticalAlign: "middle" },
    projectIcon: {
      width: "36px", height: "36px", borderRadius: "8px",
      background: t.surfaceAlt, border: `1px solid ${t.border}`,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: "14px", fontWeight: 700, color: t.textMuted,
      flexShrink: 0,
    },
    projectCell: { display: "flex", alignItems: "center", gap: "14px" },
    projectName: {
      fontSize: "13px", fontWeight: 600, color: t.text,
      marginBottom: "2px", letterSpacing: "-0.01em",
    },
    codeSnip: {
      fontSize: "11px", color: t.textSubtle,
      fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      maxWidth: "380px",
    },
    renameInput: {
      width: "100%", maxWidth: "320px",
      padding: "6px 10px",
      background: t.bg, border: `1px solid ${t.focus}`,
      borderRadius: "6px", fontSize: "13px", fontWeight: 600,
      color: t.text, fontFamily: "inherit", outline: "none",
      boxShadow: `0 0 0 3px ${t.focus}22`,
    },

    actionsCell: { padding: "10px 20px", textAlign: "right", whiteSpace: "nowrap" },
    actionRow: { display: "inline-flex", gap: "6px", alignItems: "center" },

    iconAction: {
      width: "32px", height: "32px",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      background: "transparent", border: `1px solid transparent`,
      borderRadius: "6px", color: t.textMuted,
      cursor: "pointer", fontFamily: "inherit", fontSize: "14px",
      transition: "all 0.12s",
    },
    openBtn: {
      background: t.accent, border: "none",
      borderRadius: "6px", padding: "7px 14px",
      fontSize: "12px", fontWeight: 600,
      color: t.onAccent, cursor: "pointer",
      fontFamily: "inherit",
      transition: "all 0.15s",
    },
    ghostBtn: {
      background: "transparent", border: `1px solid ${t.border}`,
      borderRadius: "6px", padding: "7px 12px",
      fontSize: "12px", color: t.textMuted, fontWeight: 500,
      cursor: "pointer", fontFamily: "inherit",
      transition: "all 0.15s",
    },
    delBtnConfirm: {
      background: t.dangerBg, border: `1px solid ${t.dangerBorder}`,
      borderRadius: "6px", padding: "7px 12px",
      fontSize: "12px", color: t.danger, fontWeight: 600,
      cursor: "pointer", fontFamily: "inherit",
    },

    rowMenu: {
      position: "absolute", top: "calc(100% + 4px)", right: 0,
      minWidth: "160px",
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: "10px", boxShadow: t.shadowLg, padding: "5px",
      zIndex: 25,
    },
    menuItem: (danger) => ({
      display: "flex", alignItems: "center", gap: "10px",
      width: "100%", padding: "8px 10px",
      background: "transparent", border: "none",
      borderRadius: "6px",
      color: danger ? t.danger : t.text,
      fontFamily: "inherit", fontSize: "12px", fontWeight: 500,
      textAlign: "left", cursor: "pointer",
      transition: "background 0.1s",
    }),

    // grid
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: "16px",
    },
    card: (hover) => ({
      background: t.surface, border: `1px solid ${hover ? t.borderStrong : t.border}`,
      borderRadius: "12px", overflow: "hidden",
      cursor: "pointer",
      transform: hover ? "translateY(-2px)" : "translateY(0)",
      boxShadow: hover ? t.shadowMd : t.shadowSm,
      transition: "transform 0.18s, box-shadow 0.18s, border-color 0.18s",
      display: "flex", flexDirection: "column",
      position: "relative",
    }),
    cardPreview: {
      padding: "16px 18px",
      background: `linear-gradient(180deg, ${t.surfaceAlt} 0%, ${t.surface} 100%)`,
      borderBottom: `1px solid ${t.border}`,
      fontSize: "10.5px", color: t.textMuted,
      fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
      whiteSpace: "pre", overflow: "hidden",
      maxHeight: "110px", minHeight: "110px", lineHeight: 1.6,
    },
    cardBody: { padding: "14px 18px 12px", flex: 1 },
    cardTitle: {
      fontSize: "14px", fontWeight: 600, color: t.text,
      letterSpacing: "-0.01em", marginBottom: "4px",
    },
    cardMeta: { fontSize: "11px", color: t.textMuted },
    cardFoot: {
      padding: "10px 18px",
      borderTop: `1px solid ${t.border}`,
      display: "flex", justifyContent: "space-between", alignItems: "center",
      fontSize: "11px", color: t.textSubtle,
      background: t.surfaceAlt,
    },

    empty: {
      padding: "88px 24px", textAlign: "center",
      background: t.surface, border: `1px dashed ${t.border}`,
      borderRadius: "12px",
    },
    emptyGlyph: {
      width: "64px", height: "64px", borderRadius: "16px",
      background: t.surfaceAlt, border: `1px solid ${t.border}`,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: "26px", color: t.textMuted, marginBottom: "20px",
    },
    emptyTitle: {
      fontSize: "17px", fontWeight: 700, color: t.text,
      marginBottom: "6px", letterSpacing: "-0.02em",
    },
    emptyText: { fontSize: "13px", color: t.textMuted, marginBottom: "24px" },

    skCard: {
      background: t.surface, border: `1px solid ${t.border}`,
      borderRadius: "12px", padding: "18px", boxShadow: t.shadowSm,
    },
    skBar: (w, h = 10) => ({
      height: `${h}px`, background: t.surfaceAlt, borderRadius: "4px",
      width: w, animation: "shimmer 1.4s ease-in-out infinite",
    }),

    toast: {
      position: "fixed", bottom: "24px", left: "50%",
      transform: "translateX(-50%)",
      padding: "10px 16px",
      background: t.text, color: t.bg,
      borderRadius: "8px", fontSize: "12px", fontWeight: 500,
      boxShadow: t.shadowLg, zIndex: 100,
      animation: "toastIn 0.2s ease",
    },

    visuallyHidden: {
      position: "absolute", width: "1px", height: "1px",
      padding: 0, margin: "-1px", overflow: "hidden",
      clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0,
    },
  };

  const onRowKey = (e, p) => {
    if (renamingId === p.id) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpenProject(p);
    }
  };

  const RowMenu = ({ p }) => (
    <div style={S.rowMenu} onClick={(e) => e.stopPropagation()}>
      <button
        style={S.menuItem(false)}
        className="dm-popitem"
        onClick={() => startRename(p)}
      >
        ✎ Rename
      </button>
      <button
        style={S.menuItem(false)}
        className="dm-popitem"
        onClick={() => { setMenuOpenId(null); onOpenProject(p); }}
      >
        ↗ Open
      </button>
      <button
        style={S.menuItem(true)}
        className="dm-popitem"
        onClick={() => { setMenuOpenId(null); setConfirmDel(p.id); }}
      >
        ✕ Delete
      </button>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; background: ${t.bg}; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        @keyframes shimmer { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes toastIn { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
        button:focus-visible, input:focus-visible, select:focus-visible, [role="button"]:focus-visible {
          outline: 2px solid ${t.focus}; outline-offset: 2px;
        }
        .dm-search:focus { border-color: ${t.borderStrong} !important; box-shadow: 0 0 0 3px ${t.focus}22 !important; }
        .dm-icon-btn:hover { color: ${t.text} !important; border-color: ${t.borderStrong} !important; background: ${t.hover} !important; }
        .dm-avatar-btn:hover { border-color: ${t.borderStrong} !important; }
        .dm-primary:hover { background: ${t.accentHover} !important; transform: translateY(-1px); box-shadow: ${t.shadowMd} !important; }
        .dm-ghost:hover { border-color: ${t.borderStrong} !important; color: ${t.text} !important; }
        .dm-icon-action:hover { background: ${t.hover} !important; color: ${t.text} !important; }
        .dm-icon-action-danger:hover { background: ${t.dangerBg} !important; color: ${t.danger} !important; }
        .dm-popitem:hover { background: ${t.hover} !important; }
        .dm-stat:hover { border-color: ${t.borderStrong} !important; }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
        }
      `}</style>

      <div style={S.page}>
        {/* ── NAV ── */}
        <nav style={S.nav}>
          <div style={S.navLeft}>
            <div style={S.brandMark}>D</div>
            <span style={S.brandName}>DevMind</span>
            <span style={S.brandBadge}>Beta</span>
          </div>

          <div style={S.navRight}>
            <button
              style={S.iconBtn} className="dm-icon-btn"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? "☀" : "☾"}
            </button>

            <button
              style={S.avatarBtn} className="dm-avatar-btn"
              onClick={(e) => { e.stopPropagation(); setAccountOpen((v) => !v); }}
              aria-haspopup="menu" aria-expanded={accountOpen}
            >
              <span style={S.avatar}>{initial}</span>
              <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.email}
              </span>
            </button>

            {accountOpen && (
              <div style={S.popover} role="menu" onClick={(e) => e.stopPropagation()}>
                <div style={S.popoverHeader}>
                  <div style={S.popoverName}>Signed in as</div>
                  <div style={S.popoverEmail}>{user?.email}</div>
                </div>
                <button
                  style={S.popoverItem} className="dm-popitem"
                  onClick={() => supabase.auth.signOut()}
                >
                  ↩  Sign out
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* ── MAIN ── */}
        <main style={S.main}>
          {/* Hero */}
          <div style={S.hero}>
            <div>
              <div style={S.heroEyebrow}>Workspace</div>
              <h1 style={S.heroTitle}>Your Projects</h1>
              <p style={S.heroSub}>
                {projects.length} project{projects.length !== 1 ? "s" : ""}
                {lastActivity ? ` · last activity ${timeAgo(lastActivity)}` : ""}
              </p>
            </div>
            <button
              style={S.primaryBtn} className="dm-primary"
              onClick={handleNew} disabled={creating}
            >
              {creating ? "Creating…" : <><span style={{fontSize:"15px",lineHeight:1}}>＋</span> New Project</>}
            </button>
          </div>

          {/* Stat cards */}
          <div style={S.statsGrid}>
            {[
              { label: "Total projects", value: projects.length },
              { label: "Files", value: totalFiles },
              { label: "Last activity", value: lastActivity ? timeAgo(lastActivity) : "—" },
              { label: "Storage", value: "Supabase" },
            ].map((s) => (
              <div key={s.label} style={S.statCard} className="dm-stat">
                <div style={S.statLabel}>{s.label}</div>
                <div style={S.statValue}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div style={S.toolbar}>
            <div style={S.searchWrap}>
              <label htmlFor={searchId} style={S.visuallyHidden}>Search projects</label>
              <span style={S.searchIcon}>⌕</span>
              <input
                id={searchId} style={S.searchInput} className="dm-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects…"
                aria-label="Search projects"
              />
            </div>

            <div style={S.toolbarRight}>
              <label htmlFor="sort" style={S.visuallyHidden}>Sort by</label>
              <select
                id="sort" style={S.select}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="updated">Recently updated</option>
                <option value="name">Name (A–Z)</option>
                <option value="created">Oldest first</option>
              </select>

              <div style={S.segment} role="tablist" aria-label="View mode">
                <button
                  style={S.segmentBtn(viewMode === "grid")}
                  onClick={() => setViewMode("grid")}
                  aria-pressed={viewMode === "grid"}
                >▦ Grid</button>
                <button
                  style={S.segmentBtn(viewMode === "table")}
                  onClick={() => setViewMode("table")}
                  aria-pressed={viewMode === "table"}
                >☰ Table</button>
              </div>
            </div>
          </div>

          {/* List region */}
          {loading ? (
            <div style={S.grid}>
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} style={S.skCard}>
                  <div style={{...S.skBar("60%", 14), marginBottom: 12}} />
                  <div style={{...S.skBar("90%"), marginBottom: 8}} />
                  <div style={{...S.skBar("40%")}} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={S.empty}>
              <div style={S.emptyGlyph}>◳</div>
              {projects.length === 0 ? (
                <>
                  <div style={S.emptyTitle}>No projects yet</div>
                  <div style={S.emptyText}>Create your first project to get started.</div>
                  <button
                    style={S.primaryBtn} className="dm-primary"
                    onClick={handleNew} disabled={creating}
                  >
                    {creating ? "Creating…" : "+ New Project"}
                  </button>
                </>
              ) : (
                <>
                  <div style={S.emptyTitle}>No results for "{search}"</div>
                  <div style={S.emptyText}>Try a different search term.</div>
                </>
              )}
            </div>
          ) : viewMode === "table" ? (
            <div style={S.listRegion}>
              <table style={S.table}>
                <thead style={S.thead}>
                  <tr>
                    <th style={S.th}>Project</th>
                    <th style={S.th}>Files</th>
                    <th style={S.th}>Last updated</th>
                    <th style={{...S.th, textAlign: "right"}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr
                      key={p.id}
                      style={S.tr(hoverId === p.id)}
                      onMouseEnter={() => setHoverId(p.id)}
                      onMouseLeave={() => setHoverId(null)}
                      onClick={() => renamingId !== p.id && onOpenProject(p)}
                      onKeyDown={(e) => onRowKey(e, p)}
                      tabIndex={0}
                      role="button"
                      aria-label={`Open ${p.name}`}
                    >
                      <td style={S.td}>
                        <div style={S.projectCell}>
                          <div style={S.projectIcon}>{p.name.charAt(0).toUpperCase()}</div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            {renamingId === p.id ? (
                              <input
                                ref={renameInputRef}
                                style={S.renameInput}
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={onRenameKey}
                                onBlur={commitRename}
                                onClick={(e) => e.stopPropagation()}
                                disabled={renameSaving}
                                aria-label="Rename project"
                              />
                            ) : (
                              <>
                                <div style={S.projectName}>{p.name}</div>
                                <div style={S.codeSnip}>
                                  {(p.code || "").slice(0, 80).replace(/\n/g, " ").trim()}…
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={S.tdMuted}>
                        {p.tabs?.length || 1} file{(p.tabs?.length || 1) !== 1 ? "s" : ""}
                      </td>
                      <td style={S.tdMuted}>{timeAgo(p.updated_at)}</td>
                      <td style={S.actionsCell} onClick={(e) => e.stopPropagation()}>
                        <div style={{...S.actionRow, position: "relative"}}>
                          {confirmDel === p.id ? (
                            <>
                              <button
                                style={S.delBtnConfirm}
                                onClick={() => handleDelete(p.id)}
                                disabled={deletingId === p.id}
                              >
                                {deletingId === p.id ? "Deleting…" : "Confirm delete"}
                              </button>
                              <button
                                style={S.ghostBtn} className="dm-ghost"
                                onClick={() => setConfirmDel(null)}
                              >Cancel</button>
                            </>
                          ) : (
                            <>
                              <button
                                style={S.iconAction} className="dm-icon-action"
                                onClick={() => startRename(p)}
                                aria-label={`Rename ${p.name}`}
                                title="Rename"
                              >✎</button>
                              <button
                                style={S.openBtn} className="dm-primary"
                                onClick={() => onOpenProject(p)}
                              >Open →</button>
                              <div style={{ position: "relative" }}>
                                <button
                                  style={S.iconAction} className="dm-icon-action"
                                  onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === p.id ? null : p.id); }}
                                  aria-label={`More actions for ${p.name}`}
                                  aria-haspopup="menu"
                                >⋯</button>
                                {menuOpenId === p.id && <RowMenu p={p} />}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={S.grid}>
              {filtered.map((p) => (
                <div
                  key={p.id}
                  style={S.card(hoverId === p.id)}
                  onMouseEnter={() => setHoverId(p.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => renamingId !== p.id && onOpenProject(p)}
                  onKeyDown={(e) => onRowKey(e, p)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Open ${p.name}`}
                >
                  <div style={S.cardPreview}>
                    {(p.code || "").split("\n").slice(0, 5).join("\n")}
                  </div>
                  <div style={S.cardBody}>
                    {renamingId === p.id ? (
                      <input
                        ref={renameInputRef}
                        style={S.renameInput}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={onRenameKey}
                        onBlur={commitRename}
                        onClick={(e) => e.stopPropagation()}
                        disabled={renameSaving}
                        aria-label="Rename project"
                      />
                    ) : (
                      <>
                        <div style={S.cardTitle}>{p.name}</div>
                        <div style={S.cardMeta}>
                          {p.tabs?.length || 1} file{(p.tabs?.length || 1) !== 1 ? "s" : ""}
                          {" · "}{timeAgo(p.updated_at)}
                        </div>
                      </>
                    )}
                  </div>
                  <div style={S.cardFoot} onClick={(e) => e.stopPropagation()}>
                    {confirmDel === p.id ? (
                      <div style={S.actionRow}>
                        <button
                          style={S.delBtnConfirm}
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                        >{deletingId === p.id ? "…" : "Confirm"}</button>
                        <button
                          style={S.ghostBtn} className="dm-ghost"
                          onClick={() => setConfirmDel(null)}
                        >Cancel</button>
                      </div>
                    ) : (
                      <>
                        <span>Open project</span>
                        <div style={{ display: "inline-flex", gap: 4, position: "relative" }}>
                          <button
                            style={S.iconAction} className="dm-icon-action"
                            onClick={() => startRename(p)}
                            aria-label={`Rename ${p.name}`}
                            title="Rename"
                          >✎</button>
                          <button
                            style={S.iconAction} className="dm-icon-action"
                            onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === p.id ? null : p.id); }}
                            aria-label={`More actions for ${p.name}`}
                          >⋯</button>
                          {menuOpenId === p.id && <RowMenu p={p} />}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {toast && <div style={S.toast} role="status">{toast.msg}</div>}
      </div>
    </>
  );
}
