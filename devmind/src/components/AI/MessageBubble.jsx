import { useState } from "react";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const [expanded, setExpanded] = useState(false);

  const looksLikeCode =
    message.content.includes("function DevApp") ||
    message.content.includes("const DevApp") ||
    message.content.includes("return (") ||
    message.content.includes("React.createElement");

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs w-full px-4 py-2 rounded-xl text-sm ${
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-gray-800 text-gray-300 rounded-bl-none"
        }`}
      >
        {isUser ? (
          message.content
        ) : looksLikeCode ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-400 text-xs font-medium">
                ✅ Code generated and applied
              </span>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-gray-500 hover:text-white text-xs transition-all ml-2"
              >
                {expanded ? "Hide ▲" : "View ▼"}
              </button>
            </div>

            {expanded && (
              <div className="relative mt-2">
                <pre className="text-green-400 text-xs bg-gray-950 rounded-lg p-3 overflow-x-auto max-h-60 leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </pre>
                <button
                  onClick={() => navigator.clipboard.writeText(message.content)}
                  className="absolute top-2 right-2 text-gray-600 hover:text-white text-xs bg-gray-800 px-2 py-0.5 rounded transition-all"
                >
                  Copy
                </button>
              </div>
            )}
          </div>
        ) : (
          message.content
        )}
      </div>
    </div>
  );
}