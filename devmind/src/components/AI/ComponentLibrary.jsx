import { useState } from "react";
import useDevMindStore from "../../store/useDevMindStore";

const STORAGE_KEY = "devmind_components";

const getSaved = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

export default function ComponentLibrary() {
  const { code, setCode } = useDevMindStore();
  const [components, setComponents] = useState(getSaved);
  const [saveName, setSaveName] = useState("");
  const [showSave, setShowSave] = useState(false);
  const [search, setSearch] = useState("");

  const handleSave = () => {
    if (!saveName.trim()) return;
    const newComponent = {
      id: Date.now(),
      name: saveName.trim(),
      code,
      savedAt: new Date().toLocaleDateString(),
    };
    const updated = [newComponent, ...components];
    setComponents(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSaveName("");
    setShowSave(false);
  };

  const handleLoad = (component) => {
    setCode(component.code);
  };

  const handleDelete = (id) => {
    const updated = components.filter((c) => c.id !== id);
    setComponents(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const filtered = components.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900">
        <span className="text-gray-300 text-sm font-medium">
          📦 Component Library
        </span>
        <button
          onClick={() => setShowSave(!showSave)}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-all"
        >
          + Save Current
        </button>
      </div>

      {/* Save form */}
      {showSave && (
        <div className="p-4 border-b border-gray-800 bg-gray-900">
          <p className="text-gray-400 text-xs mb-2">Name this component:</p>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-600"
              placeholder="e.g. Dark Dashboard, Login Form..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
            />
            <button
              onClick={handleSave}
              className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition-all"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="px-4 py-3 border-b border-gray-800">
        <input
          className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-600"
          placeholder="Search components..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Component list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center mt-10">
            <p className="text-gray-600 text-sm">No components saved yet.</p>
            <p className="text-gray-700 text-xs mt-1">
              Generate something great then save it!
            </p>
          </div>
        ) : (
          filtered.map((component) => (
            <div
              key={component.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-white text-sm font-medium">
                    {component.name}
                  </h3>
                  <p className="text-gray-600 text-xs mt-0.5">
                    Saved {component.savedAt}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleLoad(component)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-all"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => handleDelete(component.id)}
                    className="px-3 py-1 bg-gray-800 hover:bg-red-900 text-gray-400 hover:text-red-400 text-xs rounded-lg transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Code preview */}
              <pre className="text-gray-500 text-xs bg-gray-950 rounded-lg p-2 overflow-hidden max-h-16 leading-relaxed">
                {component.code.slice(0, 120)}...
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}