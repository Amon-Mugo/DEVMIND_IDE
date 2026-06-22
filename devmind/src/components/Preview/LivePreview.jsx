import { useEffect, useRef, useState } from "react";
import usePreview from "../../hooks/usePreview";
import PreviewToolbar from "./PreviewToolbar";

export default function LivePreview() {
  const { previewCode } = usePreview();
  const iframeRef = useRef(null);
  const [key, setKey] = useState(0);
  const [device, setDevice] = useState({
    id: "desktop",
    icon: "🖥️",
    label: "Desktop",
    width: "100%",
  });
  const [theme, setTheme] = useState("light");
  const [logs, setLogs] = useState([]);
  const [showConsole, setShowConsole] = useState(false);

  const handleRefresh = () => {
    setLogs([]);
    setKey((prev) => prev + 1);
  };

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === "devmind-log") {
        setLogs((prev) => [...prev, event.data]);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    setLogs([]);
  }, [previewCode]);

  useEffect(() => {
    if (!iframeRef.current) return;

    const bgColor = theme === "light" ? "#ffffff" : "#0f172a";
    const textColor = theme === "light" ? "#000000" : "#ffffff";

    // Strip ES module imports — not supported in Babel standalone inline scripts
    const sanitizedCode = (previewCode || "")
      .split("\n")
      .filter((line) => !/^\s*import\s+/.test(line))
      .join("\n");

    const html = `<!DOCTYPE html>
<html style="height:100%">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body, #root { height: 100%; width: 100%; }
      body { font-family: sans-serif; background: ${bgColor}; color: ${textColor}; }
    </style>
    <script>
      // Intercept console logs and send to parent
      const _log = console.log;
      const _warn = console.warn;
      const _error = console.error;

      console.log = (...args) => {
        window.parent.postMessage({ type: 'devmind-log', level: 'log', message: args.join(' ') }, '*');
        _log(...args);
      };
      console.warn = (...args) => {
        window.parent.postMessage({ type: 'devmind-log', level: 'warn', message: args.join(' ') }, '*');
        _warn(...args);
      };
      console.error = (...args) => {
        window.parent.postMessage({ type: 'devmind-log', level: 'error', message: args.join(' ') }, '*');
        _error(...args);
      };

      window.onerror = (msg, src, line, col) => {
        window.parent.postMessage({ 
          type: 'devmind-log', 
          level: 'error', 
          message: msg + ' (line ' + line + ':' + col + ')'
        }, '*');
      };
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="text/babel" data-presets="react">
      const useState = React.useState;
      const useEffect = React.useEffect;
      const useRef = React.useRef;
      const useCallback = React.useCallback;
      const useMemo = React.useMemo;
      const useReducer = React.useReducer;
      const useContext = React.useContext;
      const createContext = React.createContext;

      try {
        ${sanitizedCode}

        if (typeof DevApp === 'undefined') {
          throw new Error('No DevApp component found');
        }

        ReactDOM.createRoot(document.getElementById('root')).render(
          React.createElement(DevApp)
        );
      } catch(e) {
        window.parent.postMessage({ type: 'devmind-log', level: 'error', message: e.message }, '*');
        document.getElementById('root').innerHTML =
          '<div style="padding:20px;color:red;font-family:monospace;background:#1a1a1a;height:100vh">' +
          '<h3 style="color:#ff6b6b;margin-bottom:10px">Preview Error</h3>' +
          '<pre style="font-size:13px;white-space:pre-wrap">' + e.message + '</pre>' +
          '</div>';
      }
    </script>
  </body>
</html>`;

    iframeRef.current.srcdoc = html;
  }, [previewCode, key, theme]);

  const logColor = (level) => {
    if (level === "error") return "#ff6b6b";
    if (level === "warn") return "#f59e0b";
    return "#a3e635";
  };

  const logIcon = (level) => {
    if (level === "error") return "❌";
    if (level === "warn") return "⚠️";
    return "📝";
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <PreviewToolbar
        onRefresh={handleRefresh}
        device={device}
        setDevice={setDevice}
        theme={theme}
        setTheme={setTheme}
        showConsole={showConsole}
        setShowConsole={setShowConsole}
        logCount={logs.filter((l) => l.level === "error").length}
      />

      <div className="flex-1 overflow-auto flex justify-center bg-gray-900 p-4">
        <div
          style={{
            width: device.width,
            height: "100%",
            transition: "width 0.3s ease",
            boxShadow:
              device.id !== "desktop"
                ? "0 0 0 2px #3b82f6, 0 20px 60px rgba(0,0,0,0.5)"
                : "none",
            borderRadius: device.id !== "desktop" ? "16px" : "0",
            overflow: "hidden",
            background: theme === "light" ? "#ffffff" : "#0f172a",
          }}
        >
          <iframe
            ref={iframeRef}
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin"
            title="preview"
          />
        </div>
      </div>

      {/* Console panel */}
      {showConsole && (
        <div className="h-40 border-t border-gray-800 bg-gray-950 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
            <span className="text-gray-400 text-xs font-medium">CONSOLE</span>
            <button
              onClick={() => setLogs([])}
              className="text-gray-600 hover:text-red-400 text-xs transition-all"
            >
              Clear
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1">
            {logs.length === 0 ? (
              <p className="text-gray-600 p-2">No console output</p>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 px-2 py-1 rounded"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <span>{logIcon(log.level)}</span>
                  <span style={{ color: logColor(log.level) }}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
