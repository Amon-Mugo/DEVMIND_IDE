import { useState } from "react";
import useAI from "../../hooks/useAI";
import useDevMindStore from "../../store/useDevMindStore";

const TEMPLATES = [
  { icon: "🏠", label: "Landing Page", prompt: "Build me a modern landing page with hero section, features, testimonials and pricing" },
  { icon: "📊", label: "Dashboard", prompt: "Build me a dark analytics dashboard with sidebar, stat cards, charts represented as colored bars, and a recent activity table" },
  { icon: "🛒", label: "E-commerce", prompt: "Build me an e-commerce product listing page with filters, product cards with images prices and ratings, and a cart icon" },
  { icon: "🎮", label: "Gaming", prompt: "Build me a gaming website homepage with dark neon theme, hero section, featured games, leaderboard and team section" },
  { icon: "📝", label: "Blog", prompt: "Build me a blog homepage with featured article hero, article cards with author avatars dates and categories, and a sidebar with trending posts" },
  { icon: "💰", label: "Finance", prompt: "Build me a fintech banking app homepage with hero section, feature cards, pricing plans and a trusted by section with company logos as text" },
  { icon: "🍔", label: "Food App", prompt: "Build me a food delivery app homepage with hero, featured restaurants with ratings, popular dishes with images and prices, and a how it works section" },
  { icon: "💪", label: "Fitness", prompt: "Build me a fitness app landing page with hero, workout categories, trainer profiles with avatars, pricing plans and testimonials" },
];

export default function PromptInput() {
  const [prompt, setPrompt] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const { sendPrompt } = useAI();
  const { loading, mode } = useDevMindStore();

  if (mode === "manual") return null;

  const handleSend = async () => {
    if (!prompt.trim() || loading) return;
    await sendPrompt(prompt);
    setPrompt("");
  };

  const handleTemplate = async (template) => {
    setShowTemplates(false);
    setPrompt(template.prompt);
  };

  return (
    <div className="border-t border-gray-800 bg-gray-900">
      {/* Templates panel */}
      {showTemplates && (
        <div className="p-3 border-b border-gray-800 grid grid-cols-2 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              onClick={() => handleTemplate(t)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 hover:text-white transition-all text-left"
            >
              <span className="text-base">{t.icon}</span>
              <span className="font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Prompt input */}
      <div className="p-4">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showTemplates
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            ⚡ Templates
          </button>
          <span className="text-gray-600 text-xs flex items-center">
            or type your own prompt
          </span>
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-600"
            placeholder="Build me a login page..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-all"
          >
            {loading ? "⏳" : "➤"}
          </button>
        </div>
      </div>
    </div>
  );
}