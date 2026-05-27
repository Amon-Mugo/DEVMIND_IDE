import Editor from "@monaco-editor/react";
import { useRef, useState } from "react";
import useDevMindStore from "../../store/useDevMindStore";
import EditorTabs from "./EditorTabs";
import { sendToAI } from "../../lib/anthropic";

export default function MonacoEditor() {
  const { code, setCode, mode } = useDevMindStore();
  const editorRef = useRef(null);
  const [explanation, setExplanation] = useState(null);
  const [explaining, setExplaining] = useState(false);
  const [explainPos, setExplainPos] = useState({ top: 0, left: 0 });

  const handleEditorMount = (editor) => {
    editorRef.current = editor;

    editor.onMouseDown((e) => {
      if (e.event.rightButton) {
        const selection = editor.getSelection();
        const selectedText = editor.getModel().getValueInRange(selection);
        if (selectedText.trim()) {
          const pos = e.event;
          setExplainPos({ top: pos.posy, left: pos.posx });
          handleExplain(selectedText);
        }
      }
    });
  };

  const handleExplain = async (selectedText) => {
    setExplaining(true);
    setExplanation(null);

    try {
      const response = await sendToAI(
        [
          {
            role: "user",
            content: `Explain this React/JavaScript code in simple terms in 2-3 sentences maximum. Be concise and developer-friendly:\n\n${selectedText}`,
          },
        ],
        ""
      );
      setExplanation(response);
    } catch (err) {
      setExplanation("Could not explain this code. Try again.");
    } finally {
      setExplaining(false);
    }
  };

  const handleExplainSelected = () => {
    if (!editorRef.current) return;
    const selection = editorRef.current.getSelection();
    const selectedText = editorRef.current.getModel().getValueInRange(selection);
    if (selectedText.trim()) {
      handleExplain(selectedText);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <EditorTabs />

      {/* Mode indicator */}
      <div
        className={`px-4 py-1 text-xs font-medium flex items-center justify-between ${
          mode === "ai"
            ? "bg-blue-900/30 text-blue-400 border-b border-blue-800"
            : "bg-green-900/30 text-green-400 border-b border-green-800"
        }`}
      >
        <span>
          {mode === "ai" ? (
            <><span>🤖</span> AI Mode — use the chat to generate code</>
          ) : (
            <><span>✏️</span> Manual Mode — edit code directly</>
          )}
        </span>

        <button
          onClick={handleExplainSelected}
          className="px-2 py-0.5 bg-purple-700 hover:bg-purple-600 text-white rounded text-xs transition-all"
          title="Select code then click to explain"
        >
          🔍 Explain Selected
        </button>
      </div>

      {/* Explanation popup */}
      {(explanation || explaining) && (
        <div className="absolute top-16 right-4 z-50 w-80 bg-gray-800 border border-purple-500 rounded-xl shadow-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-purple-400 text-xs font-bold uppercase tracking-wider">
              🔍 AI Explanation
            </span>
            <button
              onClick={() => setExplanation(null)}
              className="text-gray-500 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>
          {explaining ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <span className="animate-spin">⏳</span>
              <span>Analyzing code...</span>
            </div>
          ) : (
            <p className="text-gray-300 text-sm leading-relaxed">{explanation}</p>
          )}
        </div>
      )}

      <div className="flex-1">
        <Editor
          height="100%"
          language="javascript"
          theme="vs-dark"
          value={code}
          onChange={(val) => setCode(val || "")}
          onMount={handleEditorMount}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            fontFamily: "JetBrains Mono, Fira Code, monospace",
            fontLigatures: true,
            tabSize: 2,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}