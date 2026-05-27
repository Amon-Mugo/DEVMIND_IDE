export default function PreviewToolbar({ onRefresh, device, setDevice, theme, setTheme, showConsole, setShowConsole, logCount }) {
  const devices = [
    { id: "desktop", icon: "🖥️", label: "Desktop", width: "100%" },
    { id: "tablet", icon: "📱", label: "Tablet", width: "768px" },
    { id: "mobile", icon: "📲", label: "Mobile", width: "375px" },
  ];

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
      <span className="text-gray-400 text-xs font-medium">LIVE PREVIEW</span>

      <div className="flex items-center gap-2">
        {/* Device toggle */}
        <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-lg">
          {devices.map((d) => (
            <button
              key={d.id}
              onClick={() => setDevice(d)}
              title={d.label}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                device.id === d.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {d.icon} {d.label}
            </button>
          ))}
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-800 text-gray-400 hover:text-white transition-all"
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>

        {/* Console toggle */}
        <button
          onClick={() => setShowConsole(!showConsole)}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all relative ${
            showConsole
              ? "bg-yellow-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          🖥 Console
          {logCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {logCount}
            </span>
          )}
        </button>
      </div>

      <button
        onClick={onRefresh}
        className="text-gray-500 hover:text-white text-sm transition-all"
        title="Refresh Preview"
      >
        🔄
      </button>
    </div>
  );
}