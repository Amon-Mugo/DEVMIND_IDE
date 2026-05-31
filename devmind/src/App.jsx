import { useState, useRef, useCallback, useEffect } from "react";
import TopBar from "./components/Layout/TopBar";
import Sidebar from "./components/Layout/Sidebar";
import FileTree from "./components/Layout/FileTree";
import MonacoEditor from "./components/Editor/MonacoEditor";
import LivePreview from "./components/Preview/LivePreview";
import ChatSidebar from "./components/AI/ChatSidebar";
import SQLEditor from "./components/Database/SQLEditor";
import ComponentLibrary from "./components/AI/ComponentLibrary";
import BackendStudio from "./components/Backend/BackendStudio";
import APITester from "./components/Backend/APITester";
import useDevMindStore from "./store/useDevMindStore";
import {
  loadProjects,
  createProject,
  saveProject,
  deleteProject,
} from "./lib/supabase";

const DEFAULT_CODE = `function DevApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Hello DevMind</h1>
    </div>
  );
}`;

export default function App({ user, project, onBackToDashboard }) {
  const [activePanel, setActivePanel] = useState("editor");
  const [showChat, setShowChat] = useState(false);
  const [editorWidth, setEditorWidth] = useState(50);
  const [projects, setProjects] = useState([]);
  const [showProjectPanel, setShowProjectPanel] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  const {
    mode,
    code,
    tabs,
    messages,
    currentProjectId,
    currentProjectName,
    setCurrentProject,
    setCurrentProjectName,
    loadProjectIntoEditor,
  } = useDevMindStore();

  // Load selected project from Dashboard into editor
  useEffect(() => {
    if (project) {
      loadProjectIntoEditor(project);
    }
  }, []);

  // Load user's projects on mount
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    loadProjects(user.id)
      .then((data) => { if (isMounted) setProjects(data); })
      .catch(console.error);
    return () => { isMounted = false; };
  }, [user]);

  // Auto-save 2 seconds after the user stops typing
  useEffect(() => {
    if (!currentProjectId) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    let isMounted = true;
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (isMounted) setSaveStatus("saving");
        await saveProject(currentProjectId, currentProjectName, code, tabs, messages);
        if (isMounted) {
          setSaveStatus("saved");
          setTimeout(() => { if (isMounted) setSaveStatus(null); }, 2000);
        }
      } catch (err) {
        if (isMounted) {
          setSaveStatus("error");
          console.error("Auto-save failed:", err);
        }
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(saveTimeoutRef.current);
    };
  }, [code, tabs, messages, currentProjectId, currentProjectName]);

  const handleNewProject = async () => {
    try {
      setSaveStatus("saving");
      const newProject = await createProject(
        user.id, "Untitled Project", DEFAULT_CODE,
        [{ id: 1, name: "App.jsx", code: DEFAULT_CODE }]
      );
      setProjects((prev) => [newProject, ...prev]);
      loadProjectIntoEditor(newProject);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      setSaveStatus("error");
      console.error("Failed to create project:", err);
    }
  };

  const handleSelectProject = (proj) => {
    loadProjectIntoEditor(proj);
    setShowProjectPanel(false);
  };

  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation();
    if (!confirm("Delete this project? This cannot be undone.")) return;
    setDeletingId(projectId);
    try {
      await deleteProject(projectId);
      const updated = projects.filter((p) => p.id !== projectId);
      setProjects(updated);
      if (projectId === currentProjectId) {
        if (updated.length > 0) loadProjectIntoEditor(updated[0]);
        else setCurrentProject(null, "Untitled Project");
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRenameProject = async (newName) => {
    setCurrentProjectName(newName);
    if (!currentProjectId) {
      try {
        setSaveStatus("saving");
        const newProject = await createProject(user.id, newName, code, tabs);
        setProjects((prev) => [newProject, ...prev]);
        loadProjectIntoEditor(newProject);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(null), 2000);
      } catch (err) {
        setSaveStatus("error");
        console.error("Create on rename failed:", err);
      }
      return;
    }
    try {
      await saveProject(currentProjectId, newName, code, tabs, messages);
      setProjects((prev) =>
        prev.map((p) => p.id === currentProjectId ? { ...p, name: newName } : p)
      );
    } catch (err) {
      console.error("Rename failed:", err);
    }
  };

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    if (newWidth > 20 && newWidth < 80) setEditorWidth(newWidth);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-950 text-white font-mono overflow-hidden">
      <TopBar
        showChat={showChat}
        setShowChat={setShowChat}
        user={user}
        saveStatus={saveStatus}
        currentProjectName={currentProjectName}
        onNewProject={handleNewProject}
        onRenameProject={handleRenameProject}
        onShowProjects={() => setShowProjectPanel(!showProjectPanel)}
        hasProject={!!currentProjectId}
        onBackToDashboard={onBackToDashboard}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activePanel={activePanel} setActivePanel={setActivePanel} />

        <div className="flex flex-1 overflow-hidden relative" ref={containerRef}>

          {/* Project panel */}
          {showProjectPanel && (
            <div className="absolute left-0 top-0 z-50 w-72 h-full bg-gray-900 border-r border-gray-800 flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <span className="text-gray-300 text-sm font-medium">📁 Projects</span>
                <button onClick={() => setShowProjectPanel(false)} className="text-gray-500 hover:text-white text-lg">✕</button>
              </div>
              <button
                onClick={handleNewProject}
                className="mx-4 mt-3 mb-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-all text-left"
              >
                + New Project
              </button>
              <div className="flex-1 overflow-y-auto p-2">
                {projects.length === 0 ? (
                  <p className="text-gray-600 text-xs p-4 text-center">No projects yet. Create one!</p>
                ) : (
                  projects.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProject(p)}
                      className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 cursor-pointer transition-all ${
                        p.id === currentProjectId
                          ? "bg-blue-600/20 border border-blue-600/30"
                          : "hover:bg-gray-800"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          p.id === currentProjectId ? "text-white" : "text-gray-400 group-hover:text-white"
                        }`}>{p.name}</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {new Date(p.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteProject(e, p.id)}
                        disabled={deletingId === p.id}
                        className="ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-900/30 transition-all disabled:opacity-50"
                      >
                        {deletingId === p.id ? "⏳" : "🗑️"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* File Tree Panel */}
          <div className={`${activePanel === "files" ? "flex" : "hidden"} flex-col overflow-hidden border-r border-gray-800`} style={{ width: "260px" }}>
            <FileTree />
          </div>

          {/* Editor + Preview */}
          <div className={`${activePanel === "editor" ? "flex" : "hidden"} flex-1 overflow-hidden`}>
            {mode === "manual" ? (
              <div className="flex-1 overflow-hidden flex flex-col">
                <MonacoEditor />
              </div>
            ) : (
              <>
                <div style={{ width: `${editorWidth}%` }} className="overflow-hidden flex flex-col border-r border-gray-800">
                  <MonacoEditor />
                </div>
                <div
                  onMouseDown={handleMouseDown}
                  className="w-1 bg-gray-800 hover:bg-blue-500 cursor-col-resize transition-colors duration-150 flex items-center justify-center group"
                >
                  <div className="w-0.5 h-8 bg-gray-600 group-hover:bg-blue-400 rounded-full" />
                </div>
                <div style={{ width: `${100 - editorWidth}%` }} className="overflow-hidden flex flex-col">
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

          {/* AI Chat full panel */}
          <div className={`${activePanel === "ai" ? "flex" : "hidden"} flex-1 overflow-hidden flex-col`}>
            <ChatSidebar />
          </div>

          {/* AI Chat side drawer */}
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