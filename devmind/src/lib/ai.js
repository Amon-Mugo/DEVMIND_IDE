const SYSTEM_PROMPT = `You are DevMind AI, an elite React engineer and UI/UX designer.

CRITICAL CODE RULES:
- Return ONLY raw code. No markdown, no backticks, no explanation.
- NEVER use import or export statements.
- Always name main component exactly "DevApp": function DevApp() { ... }
- NEVER use external libraries. Only plain React and inline styles.
- Hooks available as globals: useState, useEffect, useRef, useCallback, useMemo, useReducer, useContext, createContext.
- fontFamily always use double quotes: fontFamily: "Arial, sans-serif"
- NEVER use anchor tags with href. Use onClick with useState for navigation.
- NEVER use lorem ipsum or filler text. Write realistic meaningful content.

IMAGE RULES:
- NEVER use placeholder image paths.
- When image URLs are provided in the prompt use them directly in img tags.
- If no URLs are provided use this format:
  https://loremflickr.com/800/500/{topic}
  Example: https://loremflickr.com/800/500/car
- For avatars: https://loremflickr.com/200/200/person
- For heroes: https://loremflickr.com/1200/600/{topic}
- Use different topics for different images on the same page.

COLOUR PSYCHOLOGY:
- Blue → trust, finance, corporate
- Purple → luxury, tech, AI
- Green → success, nature, money
- Red → urgency, food, energy
- Orange → warmth, fitness, food
- Dark (#0f172a) → developer tools, gaming
- Gaming → dark bg with neon accents #00ff88, #ff0055, #00d4ff

DESIGN RULES:
- Visual hierarchy: 3 levels of text size minimum
- Hover states on ALL interactive elements with transition: 'all 0.2s ease'
- Generous padding: 20-40px for containers
- Realistic content: real names, real numbers, real dates
- At least one relevant image per section
- Round corners: borderRadius 12-16px
- Shadows: boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
- Every button min 44px height`;

// ── Gemini ─────────────────────────────────────────────────────────────────
const sendToGemini = async (messages, currentCode) => {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: `${SYSTEM_PROMPT}\n\nCurrent code:\n${currentCode}` }],
        },
        contents,
        generationConfig: {
          maxOutputTokens: 4000,
          temperature: 0.7,
        },
      }),
    }
  );

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates[0].content.parts[0].text;
};

// ── Groq ───────────────────────────────────────────────────────────────────
const sendToGroq = async (messages, currentCode) => {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}\n\nCurrent code:\n${currentCode}`,
        },
        ...messages,
      ],
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
};

// ── OpenRouter ─────────────────────────────────────────────────────────────
const sendToOpenRouter = async (messages, currentCode) => {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "DevMind IDE",
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-001",
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}\n\nCurrent code:\n${currentCode}`,
        },
        ...messages.slice(-4),
      ],
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
};

// ── Main export ────────────────────────────────────────────────────────────
const isRateLimit = (msg) =>
  msg.includes("Rate limit") ||
  msg.includes("rate_limit") ||
  msg.includes("too large") ||
  msg.includes("TPD") ||
  msg.includes("TPM") ||
  msg.includes("quota") ||
  msg.includes("RESOURCE_EXHAUSTED");

export const sendToAI = async (messages, currentCode) => {
  // 1st — Gemini
  try {
    console.log("Trying Gemini...");
    return await sendToGemini(messages, currentCode);
  } catch (err) {
    console.warn("Gemini failed:", err.message);
    if (!isRateLimit(err.message) && !err.message.includes("API key")) throw err;
  }

  // 2nd — Groq
  try {
    console.log("Trying Groq...");
    return await sendToGroq(messages, currentCode);
  } catch (err) {
    console.warn("Groq failed:", err.message);
    if (!isRateLimit(err.message)) throw err;
  }

  // 3rd — OpenRouter
  console.log("Trying OpenRouter...");
  return await sendToOpenRouter(messages, currentCode);
};