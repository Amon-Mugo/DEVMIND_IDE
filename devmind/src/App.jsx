import { useState, useRef, useCallback } from "react";
import TopBar from "./components/Layout/TopBar";
import Sidebar from "./components/Layout/Sidebar";
import MonacoEditor from "./components/Editor/MonacoEditor";
import LivePreview from "./components/Preview/LivePreview";
import ChatSidebar from "./components/AI/ChatSidebar";
import SQLEditor from "./components/Database/SQLEditor";
import ComponentLibrary from "./components/AI/ComponentLibrary";
import BackendStudio from "./components/Backend/BackendStudio";
import APITester from "./components/Backend/APITester";
import useDevMindStore from "./store/useDevMindStore";
import { supabase } from "./lib/supabase";

export default function App({ user }) {
  const [activePanel, setActivePanel] = useState("editor");
  const [showChat, setShowChat] = useState(false);
  const [editorWidth, setEditorWidth] = useState(50);
  const isDragging = useRef(false);
  const containerRef = useRef(null);
  const { mode } = useDevMindStore();

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    if (newWidth > 20 && newWidth < 80) {
      setEditorWidth(newWidth);
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  }, []);

  return (
    <div
      className="flex flex-col h-screen w-screen bg-gray-950 text-white font-mono overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <TopBar showChat={showChat} setShowChat={setShowChat} user={user} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activePanel={activePanel} setActivePanel={setActivePanel} />

        <div className="flex flex-1 overflow-hidden">

          {/* Editor + Preview */}
          <div
            ref={containerRef}
            className={`${activePanel === "editor" ? "flex" : "hidden"} flex-1 overflow-hidden`}
          >
            {mode === "manual" ? (
              <div className="flex-1 overflow-hidden flex flex-col">
                <MonacoEditor />
              </div>
            ) : (
              <>
                <div
                  style={{ width: `${editorWidth}%` }}
                  className="overflow-hidden flex flex-col border-r border-gray-800"
                >
                  <MonacoEditor />
                </div>

                <div
                  onMouseDown={handleMouseDown}
                  className="w-1 bg-gray-800 hover:bg-blue-500 cursor-col-resize transition-colors duration-150 flex items-center justify-center group"
                >
                  <div className="w-0.5 h-8 bg-gray-600 group-hover:bg-blue-400 rounded-full" />
                </div>

                <div
                  style={{ width: `${100 - editorWidth}%` }}
                  className="overflow-hidden flex flex-col"
                >
                  <LivePreview />
                </div>
              </>
            )}
          </div>

          {/* Preview only */}
          <div className={`${activePanel === "preview" ? "flex" : "hidden"} flex-1 overflow-hidden flex-col`}>
            <LivePreview />
          </div>

          {/* Database */}
          <div className={`${activePanel === "database" ? "flex" : "hidden"} flex-1 overflow-hidden flex-col`}>
            <SQLEditor />
          </div>

          {/* Component Library */}
          <div className={`${activePanel === "library" ? "flex" : "hidden"} flex-1 overflow-hidden flex-col`}>
            <ComponentLibrary />
          </div>

          {/* Backend Studio */}
          <div className={`${activePanel === "backend" ? "flex" : "hidden"} flex-1 overflow-hidden flex-col`}>
            <BackendStudio />
          </div>

          {/* API Tester */}
          <div className={`${activePanel === "api" ? "flex" : "hidden"} flex-1 overflow-hidden flex-col`}>
            <APITester />
          </div>

          {/* AI Chat sidebar */}
          {showChat && (
            <div className="w-80 border-l border-gray-800 flex flex-col overflow-hidden">
              <ChatSidebar />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}