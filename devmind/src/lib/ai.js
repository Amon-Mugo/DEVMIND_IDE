export const sendToAI = async (messages, currentCode) => {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, currentCode }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "AI request failed");
  }

  const data = await response.json();
  return data.result;
};