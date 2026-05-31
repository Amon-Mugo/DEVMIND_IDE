import { create } from "zustand";

const DEFAULT_CODE = `function DevApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Hello DevMind</h1>
    </div>
  );
}`;

const useDevMindStore = create((set, get) => ({
  code: DEFAULT_CODE,
  history: [DEFAULT_CODE],
  historyIndex: 0,

  setCode: (code) => set((state) => {
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(code);
    return {
      code,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      tabs: state.tabs.map(t =>
        t.id === state.activeTab ? { ...t, code } : t
      ),
    };
  }),

  undo: () => set((state) => {
    if (state.historyIndex <= 0) return state;
    const newIndex = state.historyIndex - 1;
    return { historyIndex: newIndex, code: state.history[newIndex] };
  }),

  redo: () => set((state) => {
    if (state.historyIndex >= state.history.length - 1) return state;
    const newIndex = state.historyIndex + 1;
    return { historyIndex: newIndex, code: state.history[newIndex] };
  }),

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  // ── Tabs ──────────────────────────────────────────────────────────────
  tabs: [{ id: 1, name: "App.jsx", code: DEFAULT_CODE }],
  activeTab: 1,

  setActiveTab: (id) => set((state) => {
    const tab = state.tabs.find(t => t.id === id);
    if (!tab) return state;
    return {
      activeTab: id,
      code: tab.code,
      history: [tab.code],
      historyIndex: 0,
    };
  }),

  addTab: (name = null) => set((state) => {
    const id = Date.now();
    const tabName = name || `file${state.tabs.length + 1}.jsx`;
    const newTab = { id, name: tabName, code: "" };
    return {
      tabs: [...state.tabs, newTab],
      activeTab: id,
      code: "",
      history: [""],
      historyIndex: 0,
    };
  }),

  removeTab: (id) => set((state) => {
    if (state.tabs.length === 1) return state;
    const updated = state.tabs.filter(t => t.id !== id);
    const newActive = state.activeTab === id
      ? updated[updated.length - 1]
      : state.tabs.find(t => t.id === state.activeTab);
    return {
      tabs: updated,
      activeTab: newActive.id,
      code: newActive.code,
      history: [newActive.code],
      historyIndex: 0,
    };
  }),

  renameTab: (id, name) => set((state) => ({
    tabs: state.tabs.map(t => t.id === id ? { ...t, name } : t),
  })),

  // ── Project ───────────────────────────────────────────────────────────
  currentProjectId: null,
  currentProjectName: "Untitled Project",

  setCurrentProject: (id, name) => set({
    currentProjectId: id,
    currentProjectName: name,
  }),

  setCurrentProjectName: (name) => set({ currentProjectName: name }),

  loadProjectIntoEditor: (project) => {
    const tabs = project.tabs && project.tabs.length > 0
      ? project.tabs
      : [{ id: 1, name: "App.jsx", code: project.code || DEFAULT_CODE }];
    const firstTab = tabs[0];
    set({
      currentProjectId: project.id,
      currentProjectName: project.name,
      tabs,
      activeTab: firstTab.id,
      code: firstTab.code,
      history: [firstTab.code],
      historyIndex: 0,
      messages: project.messages || [],
    });
  },

  // ── Messages ──────────────────────────────────────────────────────────
  messages: [],
  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, msg],
  })),
  clearMessages: () => set({ messages: [] }),

  // ── Mode ──────────────────────────────────────────────────────────────
  mode: "ai",
  setMode: (mode) => set({ mode }),
  loading: false,
  setLoading: (val) => set({ loading: val }),
  saving: false,
  setSaving: (val) => set({ saving: val }),
}));

export default useDevMindStore;