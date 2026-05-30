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
- Always use this format: https://loremflickr.com/{width}/{height}/{topic}
- Examples:
  https://loremflickr.com/800/500/car
  https://loremflickr.com/800/500/restaurant
  https://loremflickr.com/800/500/gaming
  https://loremflickr.com/800/500/fitness
  https://loremflickr.com/200/200/person
  https://loremflickr.com/1200/600/business
- Match the topic word to the website theme.
- Add ?random=1, ?random=2 etc to get different images on same page:
  https://loremflickr.com/800/500/car?random=1
  https://loremflickr.com/800/500/car?random=2
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

const sendToGroq = async (messages, currentCode) => {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
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

const sendToOpenRouter = async (messages, currentCode) => {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
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

export const sendToAI = async (messages, currentCode) => {
  try {
    console.log("Trying Groq...");
    return await sendToGroq(messages, currentCode);
  } catch (err) {
    if (
      err.message.includes("Rate limit") ||
      err.message.includes("rate_limit") ||
      err.message.includes("too large") ||
      err.message.includes("TPD") ||
      err.message.includes("TPM")
    ) {
      console.log("Groq limit hit, switching to OpenRouter...");
      return await sendToOpenRouter(messages, currentCode);
    }
    throw err;
  }
};