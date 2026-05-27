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
    };
  }),

  undo: () => set((state) => {
    if (state.historyIndex <= 0) return state;
    const newIndex = state.historyIndex - 1;
    return {
      historyIndex: newIndex,
      code: state.history[newIndex],
    };
  }),

  redo: () => set((state) => {
    if (state.historyIndex >= state.history.length - 1) return state;
    const newIndex = state.historyIndex + 1;
    return {
      historyIndex: newIndex,
      code: state.history[newIndex],
    };
  }),

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  tabs: [{ id: 1, name: "App.jsx", code: "" }],
  activeTab: 1,
  setActiveTab: (id) => set({ activeTab: id }),
  addTab: (tab) => set((state) => ({ tabs: [...state.tabs, tab] })),
  messages: [],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  clearMessages: () => set({ messages: [] }),
  mode: "ai",
  setMode: (mode) => set({ mode }),
  loading: false,
  setLoading: (val) => set({ loading: val }),
}));

export default useDevMindStore;