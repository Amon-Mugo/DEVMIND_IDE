import useDevMindStore from "../../store/useDevMindStore";

export default function EditorTabs() {
  const { tabs, activeTab, setActiveTab, addTab } = useDevMindStore();

  const handleNewTab = () => {
    const id = tabs.length + 1;
    addTab({ id, name: `file${id}.jsx`, code: "" });
    setActiveTab(id);
  };

  return (
    <div className="flex items-center bg-gray-900 border-b border-gray-800 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-2 text-sm whitespace-nowrap border-r border-gray-800 transition-all ${
            activeTab === tab.id
              ? "bg-gray-950 text-white border-t-2 border-t-blue-500"
              : "text-gray-500 hover:text-white hover:bg-gray-800"
          }`}
        >
          {tab.name}
        </button>
      ))}
      <button
        onClick={handleNewTab}
        className="px-3 py-2 text-gray-500 hover:text-white hover:bg-gray-800 text-lg"
      >
        +
      </button>
    </div>
  );
}