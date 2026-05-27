import { useState, useEffect } from "react";
import { initDB, runQuery } from "../../lib/sqlRunner";
import DBResults from "./DBResults";

export default function SQLEditor() {
  const [query, setQuery] = useState("SELECT 'Hello DevMind' AS message;");
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDB().then(() => setDbReady(true));
  }, []);

  const handleRun = () => {
    setError(null);
    setResults(null);
    try {
      const res = runQuery(query);
      setResults(res);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <span className="text-gray-400 text-xs font-medium">SQL EDITOR</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${dbReady ? "text-green-400" : "text-yellow-400"}`}>
            {dbReady ? "● DB Ready" : "● Loading DB..."}
          </span>
          <button
            onClick={handleRun}
            disabled={!dbReady}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white px-3 py-1 rounded text-xs transition-all"
          >
            ▶ Run
          </button>
        </div>
      </div>

      <textarea
        className="w-full h-40 bg-gray-950 text-green-400 font-mono text-sm p-4 outline-none border-b border-gray-800 resize-none"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Write your SQL query here..."
        spellCheck={false}
      />

      <div className="flex-1 overflow-auto">
        <DBResults results={results} error={error} />
      </div>
    </div>
  );
}