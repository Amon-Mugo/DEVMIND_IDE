import { useState } from "react";
import useDevMindStore from "../../store/useDevMindStore";

export default function EditorTabs() {
  const { tabs, activeTab, setActiveTab, addTab, removeTab, renameTab } = useDevMindStore();
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const handleDoubleClick = (tab) => {
    setRenamingId(tab.id);
    setRenameValue(tab.name);
  };

  const handleRenameCommit = (id) => {
    if (renameValue.trim()) renameTab(id, renameValue.trim());
    setRenamingId(null);
  };

  const handleRenameKey = (e, id) => {
    if (e.key === "Enter") handleRenameCommit(id);
    if (e.key === "Escape") setRenamingId(null);
  };

  const getFileColor = (name) => {
    if (name.endsWith(".jsx") || name.endsWith(".js")) return "#60a5fa";
    if (name.endsWith(".css")) return "#f472b6";
    if (name.endsWith(".json")) return "#fbbf24";
    if (name.endsWith(".py")) return "#34d399";
    if (name.endsWith(".md")) return "#a78bfa";
    return "#94a3b8";
  };

  return (
    <div className="flex items-center bg-gray-900 border-b border-gray-800 overflow-x-auto min-h-[36px]">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          onDoubleClick={() => handleDoubleClick(tab)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs whitespace-nowrap border-r border-gray-800 cursor-pointer transition-all group min-w-0 ${
            activeTab === tab.id
              ? "bg-gray-950 text-white border-t-2 border-t-blue-500"
              : "text-gray-500 hover:text-white hover:bg-gray-800"
          }`}
          style={{ maxWidth: "160px" }}
        >
          {/* File color dot */}
          <span
            style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: getFileColor(tab.name), flexShrink: 0,
            }}
          />

          {/* Tab name or rename input */}
          {renamingId === tab.id ? (
            <input
              className="bg-gray-800 text-white text-xs px-1 rounded outline-none w-24"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => handleRenameCommit(tab.id)}
              onKeyDown={(e) => handleRenameKey(e, tab.id)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate">{tab.name}</span>
          )}

          {/* Close button */}
          {tabs.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); removeTab(tab.id); }}
              className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all ml-1 flex-shrink-0 text-gray-500"
              title="Close tab"
            >
              ✕
            </button>
          )}
        </div>
      ))}

      {/* New tab button */}
      <button
        onClick={() => addTab()}
        className="px-3 py-1.5 text-gray-500 hover:text-white hover:bg-gray-800 text-sm transition-all flex-shrink-0"
        title="New file"
      >
        +
      </button>
    </div>
  );
}