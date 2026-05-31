import { useState } from "react";
import useDevMindStore from "../../store/useDevMindStore";

const FILE_ICONS = {
  jsx: "⚛️",
  js: "🟨",
  css: "🎨",
  json: "📋",
  py: "🐍",
  md: "📝",
  html: "🌐",
  ts: "🔷",
  tsx: "🔷",
};

const getIcon = (name) => {
  const ext = name.split(".").pop();
  return FILE_ICONS[ext] || "📄";
};

export default function FileTree() {
  const {
    tabs,
    activeTab,
    setActiveTab,
    addTab,
    removeTab,
    renameTab,
    currentProjectName,
  } = useDevMindStore();

  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [showNewFile, setShowNewFile] = useState(false);

  const handleRenameCommit = (id) => {
    if (renameValue.trim()) renameTab(id, renameValue.trim());
    setRenamingId(null);
  };

  const handleRenameKey = (e, id) => {
    if (e.key === "Enter") handleRenameCommit(id);
    if (e.key === "Escape") setRenamingId(null);
  };

  const handleNewFile = () => {
    if (!newFileName.trim()) return;
    const name = newFileName.includes(".")
      ? newFileName.trim()
      : newFileName.trim() + ".jsx";
    addTab(name);
    setNewFileName("");
    setShowNewFile(false);
  };

  const handleNewFileKey = (e) => {
    if (e.key === "Enter") handleNewFile();
    if (e.key === "Escape") {
      setShowNewFile(false);
      setNewFileName("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 bg-gray-900">
        <span className="text-gray-400 text-xs font-medium uppercase tracking-wider">
          Explorer
        </span>
        <button
          onClick={() => setShowNewFile(true)}
          className="text-gray-500 hover:text-white text-lg transition-all"
          title="New file"
        >
          +
        </button>
      </div>

      {/* Project name */}
      <div className="px-3 py-2 border-b border-gray-800">
        <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wider">
          <span>📁</span>
          <span className="truncate">{currentProjectName || "Untitled Project"}</span>
        </div>
      </div>

      {/* New file input */}
      {showNewFile && (
        <div className="px-3 py-2 border-b border-gray-800">
          <input
            className="w-full bg-gray-800 text-white text-xs px-2 py-1.5 rounded outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-600"
            placeholder="filename.jsx"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={handleNewFileKey}
            onBlur={() => {
              if (!newFileName.trim()) setShowNewFile(false);
            }}
            autoFocus
          />
        </div>
      )}

      {/* File list */}
      <div className="flex-1 overflow-y-auto py-1">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`group flex items-center justify-between px-3 py-1.5 cursor-pointer transition-all ${
              activeTab === tab.id
                ? "bg-blue-600/20 border-l-2 border-blue-500"
                : "hover:bg-gray-800 border-l-2 border-transparent"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-xs flex-shrink-0">{getIcon(tab.name)}</span>

              {renamingId === tab.id ? (
                <input
                  className="bg-gray-800 text-white text-xs px-1 py-0.5 rounded outline-none w-full"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => handleRenameCommit(tab.id)}
                  onKeyDown={(e) => handleRenameKey(e, tab.id)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <span
                  className={`text-xs truncate ${
                    activeTab === tab.id ? "text-white" : "text-gray-400 group-hover:text-white"
                  }`}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setRenamingId(tab.id);
                    setRenameValue(tab.name);
                  }}
                >
                  {tab.name}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRenamingId(tab.id);
                  setRenameValue(tab.name);
                }}
                className="text-gray-500 hover:text-white text-xs px-1"
                title="Rename"
              >
                ✎
              </button>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTab(tab.id);
                  }}
                  className="text-gray-500 hover:text-red-400 text-xs px-1"
                  title="Delete"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer stats */}
      <div className="px-3 py-2 border-t border-gray-800 text-gray-600 text-xs">
        {tabs.length} file{tabs.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}