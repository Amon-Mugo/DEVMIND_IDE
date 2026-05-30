import { useState } from "react";
import useDevMindStore from "../../store/useDevMindStore";
import { supabase } from "../../lib/supabase";

export default function TopBar({
  showChat,
  setShowChat,
  user,
  saveStatus,
  currentProjectName,
  onNewProject,
  onRenameProject,
  onShowProjects,
  hasProject,
  onBackToDashboard,
}) {
  const { mode, setMode, code, undo, redo, historyIndex, history } = useDevMindStore();
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [deploying, setDeploying] = useState(false);

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

  const handleDeploy = async () => {
    if (!code || deploying) return;
    setDeploying(true);

    try {
      const appCode = `import React, { useState, useEffect, useRef, useCallback, useMemo, useReducer, useContext, createContext } from "react";

${code}

export default DevApp;`;

      const files = [
        {
          file: "src/App.jsx",
          data: appCode,
        },
        {
          file: "src/main.jsx",
          data: `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);`,
        },
        {
          file: "index.html",
          data: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${currentProjectName || "DevMind Project"}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
        },
        {
          file: "package.json",
          data: JSON.stringify({
            name: (currentProjectName || "devmind-project")
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, "")
              .slice(0, 50),
            version: "1.0.0",
            scripts: {
              dev: "vite",
              build: "vite build",
            },
            dependencies: {
              react: "^18.2.0",
              "react-dom": "^18.2.0",
            },
            devDependencies: {
              "@vitejs/plugin-react": "^4.0.0",
              vite: "^4.0.0",
            },
          }, null, 2),
        },
        {
          file: "vite.config.js",
          data: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});`,
        },
      ];

      const projectName = (currentProjectName || "devmind-project")
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .slice(0, 50);

      const response = await fetch("https://api.vercel.com/v13/deployments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_VERCEL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: projectName,
          files,
          projectSettings: {
            framework: "vite",
            buildCommand: "vite build",
            outputDirectory: "dist",
            installCommand: "npm install",
          },
          target: "production",
        }),
      });

      const data = await response.json();

      if (data.url) {
        const liveUrl = `https://${data.url}`;
        window.open(liveUrl, "_blank");
        alert("🌐 Deployed! Your site is live at:\n" + liveUrl);
      } else {
        console.error("Vercel error:", data);
        alert("Deploy failed: " + (data.error?.message || JSON.stringify(data)));
      }
    } catch (err) {
      alert("Deploy failed: " + err.message);
    } finally {
      setDeploying(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleNameClick = () => {
    setNameInput(currentProjectName);
    setEditingName(true);
  };

  const handleNameSave = () => {
    if (nameInput.trim()) onRenameProject(nameInput.trim());
    setEditingName(false);
  };

  const saveLabel = () => {
    if (!hasProject) return null;
    if (saveStatus === "saving") return <span className="text-yellow-400 text-xs">⏳ Saving...</span>;
    if (saveStatus === "saved") return <span className="text-green-400 text-xs">✅ Saved</span>;
    if (saveStatus === "error") return <span className="text-red-400 text-xs">❌ Save failed</span>;
    return <span className="text-gray-600 text-xs">● Auto-save on</span>;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 gap-4">

      {/* Left — back button + logo + project name */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-all whitespace-nowrap"
          title="Back to dashboard"
        >
          ← Dashboard
        </button>

        <span className="text-gray-700 text-sm">|</span>
        <span className="text-blue-400 font-bold text-lg whitespace-nowrap">⚡</span>

        <button
          onClick={onShowProjects}
          className="text-gray-500 hover:text-white text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-all whitespace-nowrap"
        >
          📁
        </button>

        {editingName ? (
          <input
            className="bg-gray-800 text-white text-sm px-2 py-1 rounded outline-none focus:ring-1 focus:ring-blue-500 w-40"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
            autoFocus
          />
        ) : (
          <button
            onClick={handleNameClick}
            className="text-gray-400 hover:text-white text-sm truncate max-w-xs transition-all"
            title="Click to rename"
          >
            {currentProjectName}
          </button>
        )}

        {saveLabel()}
      </div>

      {/* Center — controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setMode("ai")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === "ai" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            🤖 AI
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === "manual" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            ✏️ Manual
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-lg">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="px-2 py-1.5 rounded-md text-xs transition-all disabled:opacity-30 text-gray-400 hover:text-white hover:bg-gray-700"
          >
            ↩
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="px-2 py-1.5 rounded-md text-xs transition-all disabled:opacity-30 text-gray-400 hover:text-white hover:bg-gray-700"
          >
            ↪
          </button>
        </div>

        {/* New project */}
        <button
          onClick={onNewProject}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-400 hover:text-white transition-all"
        >
          + New
        </button>

        {/* AI Chat */}
        <button
          onClick={() => setShowChat(!showChat)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            showChat ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          💬 {showChat ? "Hide" : "Chat"}
        </button>

        {/* Copy */}
        <button
          onClick={handleCopy}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            copied ? "bg-green-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          {copied ? "✅" : "📋"}
        </button>

        {/* Export */}
        <button
          onClick={handleExport}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-700 hover:bg-green-600 text-white transition-all"
        >
          ⬇️ Export
        </button>

        {/* Deploy */}
        <button
          onClick={handleDeploy}
          disabled={deploying}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 text-white transition-all"
          title="Deploy to Vercel"
        >
          {deploying ? "⏳ Deploying..." : "🌐 Deploy"}
        </button>
      </div>

      {/* Right — user */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-gray-500 text-xs truncate max-w-32">{user?.email}</span>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-400 hover:bg-red-900 hover:text-red-400 transition-all"
        >
          Logout
        </button>
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
      </div>
    </div>
  );
}