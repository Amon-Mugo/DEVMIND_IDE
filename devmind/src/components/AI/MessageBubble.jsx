export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const looksLikeCode =
    message.content.includes("export default") ||
    message.content.includes("function ") ||
    message.content.includes("const ") ||
    message.content.includes("import ");

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs px-4 py-2 rounded-xl text-sm ${
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-gray-800 text-gray-300 rounded-bl-none"
        }`}
      >
        {isUser ? (
          message.content
        ) : looksLikeCode ? (
          <span className="text-green-400">✅ Code generated and applied</span>
        ) : (
          message.content
        )}
      </div>
    </div>
  );
}