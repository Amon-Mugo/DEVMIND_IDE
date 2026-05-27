import { useState } from "react";
import useDevMindStore from "../../store/useDevMindStore";
import { supabase } from "../../lib/supabase";

export default function TopBar({ showChat, setShowChat, user }) {
  const { mode, setMode, code, undo, redo, historyIndex, history } = useDevMindStore();
  const [copied, setCopied] = useState(false);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleExport = () => {
    const blob = new Blob([code], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "App.jsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
      <div className="flex items-center gap-3">
        <span className="text-blue-400 font-bold text-xl">⚡ DevMind</span>
        <span className="text-gray-600 text-sm">AI-Powered IDE</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Mode toggle */}
        <div className="flex items-center gap-2 bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setMode("ai")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === "ai"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            🤖 AI Mode
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === "manual"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            ✏️ Manual Mode
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-lg">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="px-3 py-1.5 rounded-md text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:text-white hover:bg-gray-700"
          >
            ↩ Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="px-3 py-1.5 rounded-md text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:text-white hover:bg-gray-700"
          >
            ↪ Redo
          </button>
        </div>

        {/* AI Chat toggle */}
        <button
          onClick={() => setShowChat(!showChat)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            showChat
              ? "bg-purple-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          💬 {showChat ? "Hide Chat" : "AI Chat"}
        </button>

        {/* Copy */}
        <button
          onClick={handleCopy}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            copied
              ? "bg-green-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          {copied ? "✅ Copied!" : "📋 Copy"}
        </button>

        {/* Export */}
        <button
          onClick={handleExport}
          className="px-4 py-1.5 rounded-lg text-sm font-medium bg-green-700 hover:bg-green-600 text-white transition-all"
        >
          ⬇️ Export
        </button>
      </div>

      {/* User info + logout */}
      <div className="flex items-center gap-3">
        <span className="text-gray-500 text-xs">
          {user?.email}
        </span>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-400 hover:bg-red-900 hover:text-red-400 transition-all"
        >
          Logout
        </button>
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      </div>
    </div>
  );
}