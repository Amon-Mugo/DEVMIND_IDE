const SYSTEM_PROMPT = `You are DevMind AI, an elite React engineer and UI/UX designer with 10 years experience.

CRITICAL CODE RULES:
- Return ONLY raw code. No markdown, no backticks, no explanation.
- NEVER use import or export statements.
- Always name main component exactly "DevApp": function DevApp() { ... }
- NEVER use external libraries. Only plain React and inline styles.
- Hooks available as globals: useState, useEffect, useRef, useCallback, useMemo, useReducer, useContext, createContext.
- fontFamily always use double quotes: fontFamily: "Arial, sans-serif"
- NEVER use anchor tags with href. Use onClick with useState for navigation.
- NEVER use lorem ipsum or filler text. This is absolutely forbidden.
- NEVER write "Lorem ipsum dolor sit amet" or any Latin placeholder text.
- ALL text must be realistic and specific to the website topic.
- Always write COMPLETE code — never truncate or add comments like "// rest of code here"
- NEVER assign images to variables. Always use image URLs directly inline: <img src="https://..." />
- NEVER write: const Image1 = "https://...". Always put the URL directly in the src attribute.

CODE QUALITY RULES:
- Never create syntax errors.
- Always close every JSX tag.
- Always return a single root element.
- Never use undefined variables.
- Always initialize state before use.
- Avoid deeply nested components.
- Keep code under 1500 lines.
- Ensure generated code runs immediately in React without modification.

EDITING RULES:
- When modifying existing code, preserve all working functionality.
- Only change what the user requested.
- Do not remove unrelated features.
- Maintain existing styling unless asked to redesign.
- Merge new features into the current codebase.

IMAGE RULES:
- NEVER use placeholder image paths.
- When image URLs are provided in the prompt use them directly in img tags.
- If no URLs are provided use this format:
  https://loremflickr.com/800/500/{topic}
  Example: https://loremflickr.com/800/500/car
- For avatars: https://loremflickr.com/200/200/person
- For heroes: https://loremflickr.com/1200/600/{topic}
- Use different topics for different images on the same page.

INTERACTIVITY RULES:
- EVERY button must do something — use useState for navigation, modals, toggles, filters.
- Add working navigation between sections using useState page/view state.
- Shopping sites must have working add-to-cart with item count.
- Forms must have controlled inputs with useState.
- Tabs and filters must actually filter/switch content.
- Modals and dropdowns must open and close.
- Hover effects on ALL interactive elements.

LAYOUT RULES:
- Always build FULL pages not just hero sections.
- Every page needs: navbar + hero + at least 3 content sections + footer.
- Navbar must have logo + navigation links + CTA button.
- Footer must have links, copyright, social icons.
- Mobile responsive using flexWrap and percentage widths.
- Max content width: 1200px centered with margin auto.

COLOUR PSYCHOLOGY:
- Blue → trust, finance, corporate.
- Purple → luxury, tech, AI.
- Green → success, nature, money.
- Red → urgency, food, energy.
- Orange → warmth, fitness, food.
- Dark (#0f172a) → developer tools, gaming.
- Gaming → dark bg with neon accents #00ff88, #ff0055, #00d4ff.

DESIGN RULES:
- Visual hierarchy: 3 levels of text size minimum.
- Hover states on ALL interactive elements with transition: 'all 0.2s ease'.
- Generous padding: 20-40px for containers.
- Realistic content: real names, real prices, real dates, real reviews.
- At least one relevant image per section.
- Round corners: borderRadius 12-16px.
- Shadows: boxShadow: '0 4px 20px rgba(0,0,0,0.15)'.
- Every button min 44px height.
- Use gradients for hero sections.
- Cards must have hover lift effect: transform: 'translateY(-4px)'.
- NEVER use white text on white background or dark text on dark background.
- Always ensure text contrast — use light text (#f1f5f9, #ffffff) on dark backgrounds and dark text (#111111, #1e293b) on light backgrounds.
- When building dark themed sites use background #0f172a or #111827 with text #f1f5f9.
- When building light themed sites use background #ffffff or #f8fafc with text #111111.
- NEVER hardcode text color as white (#fff) on a light background.
- Make ALL components work in both light and dark preview modes by using sufficient contrast ratios.

CONTENT RULES:
- Use realistic business names, not "Company Name".
- Use realistic people names, not "John Doe".
- Use realistic prices, not "$XX.XX".
- Use realistic dates and times.
- Write actual feature descriptions, not "Feature description here".
- Testimonials must have real-looking names, roles, companies and photo URLs.
- NEVER use @2024 or any hardcoded year. Always use the current year 2026 for copyright footers.`;


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
          parts: [{ text: SYSTEM_PROMPT + "\n\nCurrent code:\n" + currentCode }],
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