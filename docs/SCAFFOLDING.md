# Scaffolding & Local Development Guide

This guide walks you through setting up **AI Video & Story Studio** from a fresh clone to a running local instance — with zero paid accounts required.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ (24 LTS recommended) | [nodejs.org](https://nodejs.org/) |
| pnpm | 9+ | `npm i -g pnpm` |
| Git | any | [git-scm.com](https://git-scm.com/) |
| ffmpeg | optional | for offline `assemble.sh` export |

---

## 1. Clone the repository

```bash
git clone https://github.com/krnbwj/ai-video-story-studio.git
cd ai-video-story-studio
```

---

## 2. Install dependencies

```bash
pnpm install
```

If you hit pnpm store errors:

```bash
pnpm install --store-dir ~/Library/pnpm/store/v3
# or on Linux:
pnpm install --store-dir ~/.local/share/pnpm/store/v3
```

---

## 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` — only **one** variable is required for local dev:

```env
AUTH_SECRET=any-random-string-at-least-32-chars
NEXTAUTH_URL=http://127.0.0.1:3000
DATABASE_URL=./data/studio.db
```

Generate a secret:

```bash
openssl rand -base64 32
```

Everything else (API keys, Google OAuth, Resend email) is **optional** for local testing.

---

## 4. Initialize the database

```bash
pnpm run db:migrate
```

This creates `./data/studio.db` (SQLite) with all tables:
- Users, sessions, auth tokens
- Projects, episodes, scenes, shots
- Characters (frozen profiles)
- Assets, generation jobs
- Provider connections
- Story memory (bible, continuity, arcs)
- Usage events

Re-running is safe — all statements use `CREATE TABLE IF NOT EXISTS`.

---

## 5. Start the dev server

```bash
pnpm run dev
```

Open **http://127.0.0.1:3000**

> **Tip:** If `pnpm dev` returns 404, a stale process may be holding port 3000.
> Kill it: `lsof -ti :3000 | xargs kill -9` then restart.

### Production mode (recommended for testing)

```bash
pnpm run build
pnpm start --hostname 127.0.0.1
```

---

## 6. First-time user flow

1. **Sign up** at `/auth/signup`
   - Verification email prints to your **terminal** in dev mode (no Resend key needed)
2. Click the verify link (or copy URL from terminal)
3. **Sign in** at `/auth/signin`
4. **Create a project** via the wizard (`/projects/new`)
   - Basics → Characters → Story → Look → Generate
5. **Add frozen characters** (`/projects/[id]/characters`)
   - Lock name, description, traits — reused in every shot prompt
6. **Add story memory** (`/projects/[id]/memory`)
   - Continuity facts, character arcs, style anchors
7. **Generate on storyboard** (`/projects/[id]/storyboard`)
   - Enable "Smart routing" to auto-pick best free provider
   - Mock assets generated without any API keys
8. **Export** (`/projects/[id]/export`)
   - Download zip with images, clips, scripts, `story.json`, `assemble.sh`

---

## 7. Activating real AI providers

### Option A: Environment variables (server-wide)

Add keys to `.env.local`:

```env
DEEPSEEK_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...
DASHSCOPE_API_KEY=sk-...
```

Restart the dev server. Providers with valid keys switch from `mock` to `live`.

### Option B: Per-user connections (UI)

1. Go to `/connections`
2. Paste API key for any provider
3. Click **Connect**
4. Status changes from `mock` to `live`

### Recommended free providers to start

| Priority | Provider | Key env var | Signup |
|----------|----------|-------------|--------|
| 1 | DeepSeek | `DEEPSEEK_API_KEY` | platform.deepseek.com |
| 2 | OpenRouter | `OPENROUTER_API_KEY` | openrouter.ai |
| 3 | Qwen / Wan | `DASHSCOPE_API_KEY` | dashscope.console.aliyun.com |
| 4 | GLM (z.ai) | `ZHIPU_API_KEY` | open.bigmodel.cn |
| 5 | Groq | `GROQ_API_KEY` | console.groq.com |

OpenRouter is especially useful — one key gives access to dozens of free models (Llama, Mistral, Gemma, etc.) through a single OpenAI-compatible endpoint.

---

## 8. Project structure

```
ai-video-story-studio/
├── src/
│   ├── app/                    # Next.js App Router pages + API routes
│   │   ├── api/                # REST endpoints (auth, projects, generate, export)
│   │   ├── auth/               # Sign in, sign up, verify, reset password
│   │   ├── dashboard/          # Project list
│   │   ├── projects/[id]/      # Wizard, characters, memory, storyboard, library, export
│   │   └── connections/        # Provider key management
│   ├── components/             # React UI (wizard, storyboard, memory, etc.)
│   ├── db/                     # Drizzle schema + SQLite connection
│   ├── lib/
│   │   ├── providers/          # 34 adapter definitions + registry + router
│   │   ├── memory.ts           # Story continuity layer
│   │   ├── export.ts           # Zip bundle + ffmpeg script
│   │   └── project-service.ts  # CRUD helpers
│   └── auth.ts                 # Auth.js config
├── scripts/migrate.mjs         # Database migration (run via pnpm db:migrate)
├── data/studio.db              # Local SQLite (gitignored)
├── .env.example                # All env vars documented
├── docs/                       # Extended documentation
└── vercel.json                 # Deployment config
```

---

## 9. Common issues

| Problem | Fix |
|---------|-----|
| Port 3000 returns 404 | Kill stale process: `lsof -ti :3000 \| xargs kill -9`, restart |
| `EMFILE: too many open files` in dev | Use production mode: `pnpm build && pnpm start` |
| pnpm store location error | `pnpm install --store-dir ~/Library/pnpm/store/v3` |
| Email not arriving | Expected in dev — check terminal output for verification link |
| All providers show `mock` | Normal without API keys; add keys via `.env.local` or `/connections` |
| Build fails on types | Run `pnpm install` to ensure all deps are present |

---

## 10. Deploy to Vercel

```bash
# Push to GitHub first
git push origin main

# Deploy
npx vercel
```

Required production env vars:
- `AUTH_SECRET`
- `NEXTAUTH_URL` (your Vercel domain)
- `DATABASE_URL` (Neon Postgres — free tier)
- `RESEND_API_KEY` (for real emails)

See [ARCHITECTURE.md](../ARCHITECTURE.md) for the full system design.
