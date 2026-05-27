import { useState } from "react";

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const METHOD_COLORS = {
  GET: "#10b981",
  POST: "#3b82f6",
  PUT: "#f59e0b",
  PATCH: "#8b5cf6",
  DELETE: "#ef4444",
};

export default function APITester() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("http://localhost:5000/todos");
  const [body, setBody] = useState('{\n  "title": "Buy groceries",\n  "description": "Milk, eggs, bread"\n}');
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("body");
  const [responseTab, setResponseTab] = useState("response");
  const [history, setHistory] = useState([]);

  const handleSend = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResponse(null);

    const startTime = Date.now();

    try {
      let parsedHeaders = {};
      try {
        parsedHeaders = JSON.parse(headers);
      } catch {}

      const options = {
        method,
        headers: parsedHeaders,
      };

      if (["POST", "PUT", "PATCH"].includes(method) && body.trim()) {
        options.body = body;
      }

      const res = await fetch(url, options);
      const responseTime = Date.now() - startTime;
      const contentType = res.headers.get("content-type");

      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      const result = {
        status: res.status,
        statusText: res.statusText,
        time: responseTime,
        data,
        headers: Object.fromEntries(res.headers.entries()),
        url,
        method,
        timestamp: new Date().toLocaleTimeString(),
      };

      setResponse(result);
      setHistory((prev) => [result, ...prev.slice(0, 9)]);
      setResponseTab("response");
    } catch (err) {
      setResponse({
        status: 0,
        statusText: "Error",
        time: Date.now() - startTime,
        data: null,
        error: err.message,
        url,
        method,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status) => {
    if (status >= 200 && status < 300) return "#10b981";
    if (status >= 300 && status < 400) return "#f59e0b";
    if (status >= 400) return "#ef4444";
    return "#94a3b8";
  };

  const PRESETS = [
    { label: "Get All", method: "GET", path: "/todos" },
    { label: "Create", method: "POST", path: "/todos" },
    { label: "Get One", method: "GET", path: "/todos/1" },
    { label: "Update", method: "PUT", path: "/todos/1" },
    { label: "Delete", method: "DELETE", path: "/todos/1" },
  ];

  const baseUrl = url.split("/").slice(0, 3).join("/");

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <span className="text-gray-300 text-sm font-medium">🧪 API Tester</span>
        <span className="text-gray-600 text-xs">Test your backend APIs directly</span>
      </div>

      {/* Quick presets */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800 overflow-x-auto">
        <span className="text-gray-600 text-xs whitespace-nowrap">Quick:</span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              setMethod(p.method);
              setUrl(`${baseUrl}${p.path}`);
            }}
            className="px-2 py-1 rounded text-xs whitespace-nowrap transition-all bg-gray-800 hover:bg-gray-700"
            style={{ color: METHOD_COLORS[p.method] }}
          >
            {p.method} {p.label}
          </button>
        ))}
      </div>

      {/* URL bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          style={{ color: METHOD_COLORS[method] }}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-bold outline-none"
        >
          {HTTP_METHODS.map((m) => (
            <option key={m} value={m} style={{ color: METHOD_COLORS[m] }}>
              {m}
            </option>
          ))}
        </select>

        <input
          className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 border border-gray-700"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="http://localhost:5000/api/endpoint"
        />

        <button
          onClick={handleSend}
          disabled={loading}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white text-sm rounded-lg font-medium transition-all"
        >
          {loading ? "⏳" : "Send"}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — Request */}
        <div className="w-1/2 border-r border-gray-800 flex flex-col">
          <div className="flex border-b border-gray-800">
            {["body", "headers", "history"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-medium capitalize transition-all ${
                  activeTab === tab
                    ? "text-white border-b-2 border-blue-500"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                {tab === "body" ? "📄 Body" : tab === "headers" ? "🔧 Headers" : `🕐 History (${history.length})`}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto">
            {activeTab === "body" && (
              <div className="h-full flex flex-col">
                {["POST", "PUT", "PATCH"].includes(method) ? (
                  <textarea
                    className="flex-1 bg-gray-950 text-green-400 font-mono text-xs p-4 outline-none resize-none leading-relaxed"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder='{"key": "value"}'
                    spellCheck={false}
                  />
                ) : (
                  <div className="p-4 text-gray-600 text-xs">
                    No body for {method} requests
                  </div>
                )}
              </div>
            )}

            {activeTab === "headers" && (
              <textarea
                className="flex-1 w-full h-full bg-gray-950 text-yellow-400 font-mono text-xs p-4 outline-none resize-none leading-relaxed"
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                spellCheck={false}
              />
            )}

            {activeTab === "history" && (
              <div className="p-2 space-y-2">
                {history.length === 0 ? (
                  <p className="text-gray-600 text-xs p-4">No requests yet</p>
                ) : (
                  history.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setMethod(h.method);
                        setUrl(h.url);
                        setResponse(h);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg text-left transition-all"
                    >
                      <span
                        className="text-xs font-bold"
                        style={{ color: METHOD_COLORS[h.method] }}
                      >
                        {h.method}
                      </span>
                      <span className="text-gray-400 text-xs truncate flex-1">{h.url}</span>
                      <span
                        className="text-xs font-medium"
                        style={{ color: statusColor(h.status) }}
                      >
                        {h.status}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right — Response */}
        <div className="w-1/2 flex flex-col">
          <div className="flex items-center justify-between border-b border-gray-800">
            <div className="flex">
              {["response", "headers"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setResponseTab(tab)}
                  className={`px-4 py-2 text-xs font-medium capitalize transition-all ${
                    responseTab === tab
                      ? "text-white border-b-2 border-blue-500"
                      : "text-gray-500 hover:text-white"
                  }`}
                >
                  {tab === "response" ? "📥 Response" : "🔧 Headers"}
                </button>
              ))}
            </div>

            {response && (
              <div className="flex items-center gap-3 px-4">
                <span
                  className="text-xs font-bold"
                  style={{ color: statusColor(response.status) }}
                >
                  {response.status} {response.statusText}
                </span>
                <span className="text-gray-600 text-xs">{response.time}ms</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4">
            {!response ? (
              <div className="text-center mt-20">
                <p className="text-gray-600 text-4xl mb-3">🧪</p>
                <p className="text-gray-600 text-sm">Send a request to see the response</p>
                <p className="text-gray-700 text-xs mt-2">
                  Make sure your backend is running locally first
                </p>
              </div>
            ) : response.error ? (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                <p className="text-red-400 text-xs font-bold mb-2">❌ Request Failed</p>
                <p className="text-red-300 text-xs">{response.error}</p>
                <p className="text-gray-600 text-xs mt-3">
                  Make sure your backend server is running on the correct port.
                </p>
              </div>
            ) : responseTab === "response" ? (
              <pre className="text-green-400 text-xs whitespace-pre-wrap leading-relaxed">
                {typeof response.data === "object"
                  ? JSON.stringify(response.data, null, 2)
                  : response.data}
              </pre>
            ) : (
              <pre className="text-yellow-400 text-xs whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(response.headers, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}