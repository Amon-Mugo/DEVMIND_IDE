# ⚡ DevMind — AI-Powered Full-Stack IDE
Build production-ready web applications from plain English descriptions.
multi-file editing, database tools, backend studio, and one-click Vercel deployment.
Site can be  found live here https://devmind-ide.vercel.app


FEATURES

🤖 AI Code Generation,Describe a UI in plain English — Gemini generates complete React components instantly.

👁️ Live Preview,"Iframe-based renderer with desktop, tablet, and mobile simulation."

📝 Multi-File Editor,"Monaco-based editor with tabs, rename, delete, and per-tab code history."

🗂️ File Tree,VS Code-style file explorer with icons per file type.

🗄️ SQL Editor,In-browser SQLite powered by sql.js — no server needed.

⚙️ Backend Studio,"AI-generated Python, Node.js, Go, Java, and PHP backends with live execution."

🧪 API Tester,Built-in Postman-style HTTP client for testing your APIs.

📦 Component Library,"Save, search, and reuse generated components across projects."

💬 AI Chat,Persistent chat history saved per project.

🌐 Deploy,One-click deployment to Vercel.

📁 Project Dashboard,"Full project management with grid/table view, rename, delete, and search."

🔐 Auth,Supabase authentication with rate limiting and a password strength meter.

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `devmind/.env` with your API keys:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# AI Providers
VITE_GEMINI_API_KEY=your_google_ai_studio_key
VITE_GROQ_API_KEY=your_groq_key
VITE_OPENROUTER_API_KEY=your_openrouter_key

# Images
VITE_PEXELS_API_KEY=your_pexels_key

# Deploy
VITE_VERCEL_TOKEN=your_vercel_token

# GitHub (for Backend Studio push)
VITE_GITHUB_TOKEN=your_github_token
```

### 4. Set up Supabase database

Run these in your Supabase SQL editor:

```sql
-- Projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Project',
  code TEXT DEFAULT '',
  tabs JSONB DEFAULT '[]',
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own projects"
ON projects FOR ALL
USING (auth.uid() = user_id);
```

### 5. Run the IDE

```bash
cd devmind
npm run dev
```

Open `http://localhost:5173`

### 6. Run demo backends (optional)

**Flask ecommerce API:**
```bash
cd backend
pip install flask flask-cors
python app.py
# Runs on http://localhost:5000
```

**FastAPI restaurant API:**
```bash
cd tastemind-backend
pip install fastapi uvicorn sqlalchemy pyjwt python-multipart
uvicorn main:app --reload --port 8000
# Runs on http://localhost:8000
```

---

## 🔑 API Keys — Where to Get Them

| Key | Source | Free Tier |
|-----|--------|-----------|
| `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` | [supabase.com](https://supabase.com) | ✅ Free |
| `VITE_GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) | ✅ 1500 req/day |
| `VITE_GROQ_API_KEY` | [console.groq.com](https://console.groq.com) | ✅ Free tier |
| `VITE_OPENROUTER_API_KEY` | [openrouter.ai](https://openrouter.ai) | ✅ Free credits |
| `VITE_PEXELS_API_KEY` | [pexels.com/api](https://pexels.com/api) | ✅ 200 req/hour |
| `VITE_VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) | ✅ Free |
| `VITE_GITHUB_TOKEN` | [github.com/settings/tokens](https://github.com/settings/tokens) | ✅ Free |

---
## Architecture

DevMind/
├── devmind/                  # Main IDE (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── AI/           # ChatSidebar, ComponentLibrary, MessageBubble, PromptInput
│   │   │   ├── Auth/         # Login (signup, signin, forgot password)
│   │   │   ├── Backend/      # BackendStudio, APITester
│   │   │   ├── Dashboard/    # Project management dashboard
│   │   │   ├── Database/     # SQLEditor, DBResults
│   │   │   ├── Editor/       # MonacoEditor, EditorTabs
│   │   │   ├── Layout/       # TopBar, Sidebar, FileTree
│   │   │   └── Preview/      # LivePreview, PreviewToolbar
│   │   ├── hooks/            # useAI, usePreview
│   │   ├── lib/              # ai.js, supabase.js, codeRunner.js, unsplash.js, github.js, sqlRunner.js
│   │   └── store/            # useDevMindStore (Zustand)
├── backend/                  # Flask ecommerce demo API
├── tastemind-backend/        # FastAPI restaurant demo API
└── shopmind-frontend/        # React ecommerce frontend demo

### AI Pipeline
User prompt
↓
detectKeyword() → fetch Pexels images
↓
inject image URLs into prompt
↓
sendToAI() → try Gemini 2.0 Flash
↓ (on rate limit)
fallback → Groq (llama-3.3-70b)
↓ (on rate limit)
fallback → OpenRouter (Gemini 2.0 Flash)
↓
clean response → setCode() → live preview updates
## Installation
 bash
cd devmind
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `devmind/.env` with your API keys:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

# AI Providers
VITE_GEMINI_API_KEY=your_google_ai_studio_key
VITE_GROQ_API_KEY=your_groq_key
VITE_OPENROUTER_API_KEY=your_openrouter_key

# Images
VITE_PEXELS_API_KEY=your_pexels_key

# Deploy
VITE_VERCEL_TOKEN=your_vercel_token

# GitHub (for Backend Studio push)
VITE_GITHUB_TOKEN=your_github_token
```

### 4. Set up Supabase database

Run these in your Supabase SQL editor:

```sql
-- Projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Project',
  code TEXT DEFAULT '',
  tabs JSONB DEFAULT '[]',
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own projects"
ON projects FOR ALL
USING (auth.uid() = user_id);
```

### 5. Run the IDE

```bash
cd devmind
npm run dev
```

Open `http://localhost:5173`

### 6. Run demo backends (optional)

**Flask ecommerce API:**
```bash
cd backend
pip install flask flask-cors
python app.py
# Runs on http://localhost:5000
```

**FastAPI restaurant API:**
```bash
cd tastemind-backend
pip install fastapi uvicorn sqlalchemy pyjwt python-multipart
uvicorn main:app --reload --port 8000
# Runs on http://localhost:8000
```

---

## 🔑 API Keys — Where to Get Them

| Key | Source | Free Tier |
|-----|--------|-----------|
| `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` | [supabase.com](https://supabase.com) | ✅ Free |
| `VITE_GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) | ✅ 1500 req/day |
| `VITE_GROQ_API_KEY` | [console.groq.com](https://console.groq.com) | ✅ Free tier |
| `VITE_OPENROUTER_API_KEY` | [openrouter.ai](https://openrouter.ai) | ✅ Free credits |
| `VITE_PEXELS_API_KEY` | [pexels.com/api](https://pexels.com/api) | ✅ 200 req/hour |
| `VITE_VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) | ✅ Free |
| `VITE_GITHUB_TOKEN` | [github.com/settings/tokens](https://github.com/settings/tokens) | ✅ Free |

---
## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 4 |
| Editor | Monaco Editor (@monaco-editor/react) |
| State | Zustand |
| Auth + DB | Supabase (PostgreSQL + RLS) |
| Primary AI | Google Gemini 2.0 Flash |
| AI Fallback 1 | Groq (llama-3.3-70b-versatile) |
| AI Fallback 2 | OpenRouter |
| Images | Pexels API + loremflickr fallback |
| Code Runner | Pyodide (Python in-browser) + eval (JavaScript) |
| SQL | sql.js (SQLite in WebAssembly) |
| Deploy | Vercel API |
| Demo Backends | Flask, FastAPI |

## 🗺️ Roadmap

### ✅ Version 1.0 — Core IDE (Completed)
- [x] AI code generation (Gemini + Groq + OpenRouter)
- [x] Live preview with device simulation
- [x] Monaco editor with syntax highlighting
- [x] Multi-file tabs with rename and delete
- [x] VS Code-style file tree
- [x] Supabase authentication
- [x] Project dashboard with grid/table view
- [x] Auto-save to Supabase
- [x] Undo/redo history
- [x] AI/Manual mode toggle
- [x] One-click Vercel deployment
- [x] Export code as .jsx file

### 🔄 Version 1.1 — Developer Tools (In Progress)
- [x] SQL editor (sql.js in-browser SQLite)
- [x] Backend Studio (Python, Node.js, Go, Java, PHP)
- [x] API Tester (Postman-style HTTP client)
- [x] Component Library (save and reuse components)
- [x] Python code runner (Pyodide in-browser)
- [x] Chat history saved per project
- [x] Pexels API for real topic-accurate images

### 🔜 Version 1.2 — Collaboration (Planned)
- [ ] Real-time collaboration (multiple users editing same project)
- [ ] Project sharing via public link
- [ ] Comments and annotations on code
- [ ] Project forking

### 🔜 Version 1.3 — GitHub Integration (Planned)
- [ ] Push projects directly to GitHub
- [ ] Pull and import existing GitHub repos
- [ ] Commit history viewer
- [ ] Branch management

### 🔜 Version 1.4 — Templates & Marketplace (Planned)
- [ ] Pre-built starter templates (landing page, dashboard, ecommerce)
- [ ] Community template marketplace
- [ ] One-click template deployment
- [ ] Template categories and search

### 🔜 Version 1.5 — Advanced AI (Planned)
- [ ] AI code review and suggestions
- [ ] Auto-fix errors with AI
- [ ] AI-generated unit tests
- [ ] Multi-file AI generation (full project from one prompt)
- [ ] Voice prompts

### 🔜 Version 2.0 — Platform (Future)
- [ ] Mobile app (React Native generation)
- [ ] Custom domain deployment
- [ ] Team workspaces
- [ ] Usage analytics dashboard
- [ ] Plugin/extension system
- [ ] TypeScript support
- [ ] Docker container generation
## Photos
LOGIN PAGE=https://imgur.com/a/8G2xQbQ

DASHBOARD=https://imgur.com/a/8G2xQbQ

IDE=https://imgur.com/a/8G2xQbQ


## Author

**Amon Mugo**
- Email: amonkariuki325@gmail.com
- GitHub: [@Amon-Mugo](https://github.com/Amon-Mugo)
- WhatsApp: +254 732 931 333

BSc Information Technology (Data Engineering) — Masinde Muliro University of Science and Technology
