export default function Sidebar({ activePanel, setActivePanel }) {
  const panels = [
    { id: "editor", icon: "📝", label: "Editor" },
    { id: "preview", icon: "👁️", label: "Preview" },
    { id: "database", icon: "🗄️", label: "Database" },
    { id: "library", icon: "📦", label: "Components" },
    { id: "backend", icon: "⚙️", label: "Backend" },
    { id: "api", icon: "🧪", label: "API Tester" },
    { id: "ai", icon: "🤖", label: "AI Chat" },
  ];

  return (
    <div className="flex flex-col items-center gap-2 py-4 px-2 bg-gray-900 border-r border-gray-800 w-14">
      {panels.map((panel) => (
        <button
          key={panel.id}
          onClick={() => setActivePanel(panel.id)}
          title={panel.label}
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
            activePanel === panel.id
              ? "bg-blue-600 text-white"
              : "text-gray-500 hover:bg-gray-800 hover:text-white"
          }`}
        >
          {panel.icon}
        </button>
      ))}
    </div>
  );
}