import { sendToAI } from "../lib/ai";
import { fetchImages, detectKeyword } from "../lib/unsplash";
import useDevMindStore from "../store/useDevMindStore";

const useAI = () => {
  const { code, messages, addMessage, setCode, setLoading } = useDevMindStore();

  const cleanResponse = (response) => {
    return response
      .replace(/```jsx/g, "")
      .replace(/```javascript/g, "")
      .replace(/```js/g, "")
      .replace(/```react/g, "")
      .replace(/```/g, "")
      .trim();
  };

  const sendPrompt = async (prompt) => {
    const userMsg = { role: "user", content: prompt };
    addMessage(userMsg);
    setLoading(true);

    try {
      const recentMessages = [...messages.slice(-4), userMsg];
      const codeContext = code.includes("Hello DevMind") ? "" : code.slice(0, 500);

      // Fetch relevant images from Unsplash
      const keyword = detectKeyword(prompt);
      const images = await fetchImages(keyword, 6);

      // Build image URLs string to inject into prompt
      let imageContext = "";
      if (images.length > 0) {
        imageContext = "\n\nUSE THESE REAL IMAGE URLS IN YOUR CODE:\n" +
          images.map((img, i) => `Image ${i + 1}: ${img.url}`).join("\n");
      }

      // Add image context to the last message
      const messagesWithImages = [
        ...recentMessages.slice(0, -1),
        {
          role: "user",
          content: prompt + imageContext,
        },
      ];

      const response = await sendToAI(messagesWithImages, codeContext);
      const cleaned = cleanResponse(response);

      const looksLikeCode =
        cleaned.includes("function DevApp") ||
        cleaned.includes("const DevApp") ||
        cleaned.includes("return (") ||
        cleaned.includes("React.createElement");

      if (looksLikeCode) setCode(cleaned);

      addMessage({ role: "assistant", content: cleaned });
    } catch (err) {
      addMessage({
        role: "assistant",
        content: `❌ Error: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return { sendPrompt };
};

export default useAI;