import { useRef, useEffect } from "react";
import useDevMindStore from "../../store/useDevMindStore";
import MessageBubble from "./MessageBubble";
import PromptInput from "./PromptInput";

export default function ChatSidebar() {
  const { messages, clearMessages } = useDevMindStore();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <span className="text-gray-400 text-xs font-medium">AI ASSISTANT</span>
        <button
          onClick={clearMessages}
          className="text-gray-600 hover:text-red-400 text-xs transition-all"
        >
          Clear
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-600 text-sm text-center mt-10">
            Describe what you want to build...
          </p>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <PromptInput />
    </div>
  );
}