// Run JavaScript directly in browser
const runJavaScript = (code) => {
  const logs = [];
  const originalLog = console.log;
  const originalError = console.error;

  try {
    const proxiedConsole = {
      log: (...args) => logs.push(args.join(" ")),
      error: (...args) => logs.push("ERROR: " + args.join(" ")),
      warn: (...args) => logs.push("WARN: " + args.join(" ")),
    };

    const fn = new Function("console", code);
    fn(proxiedConsole);

    return { output: logs.join("\n"), error: "" };
  } catch (err) {
    return { output: logs.join("\n"), error: err.message };
  } finally {
    console.log = originalLog;
    console.error = originalError;
  }
};

// Run Python using Pyodide (Python in browser via WebAssembly)
let pyodide = null;

const loadPyodide = async () => {
  if (pyodide) return pyodide;

  // Load Pyodide script if not already loaded
  if (!window.loadPyodide) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  pyodide = await window.loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/",
  });

  return pyodide;
};

const runPython = async (code) => {
  try {
    const py = await loadPyodide();

    // Capture stdout
    await py.runPythonAsync(`
import sys
import io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
    `);

    await py.runPythonAsync(code);

    const stdout = py.runPython("sys.stdout.getvalue()");
    const stderr = py.runPython("sys.stderr.getvalue()");

    // Reset stdout
    await py.runPythonAsync(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
    `);

    return { output: stdout || "", error: stderr || "" };
  } catch (err) {
    return { output: "", error: err.message };
  }
};

export const runCode = async (language, code) => {
  if (language === "javascript") {
    return runJavaScript(code);
  }

  if (language === "python") {
    return await runPython(code);
  }

  return {
    output: "",
    error: `Live execution for ${language} is coming soon. Copy and run locally.`,
  };
};