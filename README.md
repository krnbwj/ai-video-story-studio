# AI Video & Story Studio

[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](VERSION)
[![Providers](https://img.shields.io/badge/providers-34-green.svg)](src/lib/providers/config.ts)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](package.json)

**The open-source platform for creating AI video stories, TV shows, and short-form content — with frozen characters, story continuity memory, and 34+ free AI providers.**

Runs locally with **zero API keys**. Smart routing switches between free Chinese and global models automatically. Export everything for offline editing in DaVinci Resolve.

[Quick Start](#quick-start) · [Features](#features) · [Architecture](ARCHITECTURE.md) · [Scaffolding Guide](docs/SCAFFOLDING.md) · [Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md)

---

## Why this exists

Creating consistent AI video stories today requires juggling 10+ platforms, losing character continuity between shots, and paying before you can even test. This project solves that:

- **One studio** for scripts, images, video clips, audio, and storyboards
- **34 free providers** (DeepSeek, Qwen, GLM, Kling, OpenRouter, Groq, ElevenLabs...) with automatic fallback
- **Frozen characters** — lock a profile once, reuse it in every generation
- **Story memory** — continuity facts, character arcs, and style anchors persist across episodes
- **Mock mode** — test the entire flow without signing up for anything
- **Export for DaVinci** — one-click zip with clips, scripts, manifest, and ffmpeg assembly script
- **Pay-later model** — free tier generates at scale; usage tracked for future billing

---

## Features

| Feature | Description |
|---------|-------------|
| **Creation wizard** | 5-step flow: Basics → Characters → Story → Look → Generate |
| **Frozen characters** | Lock description, traits, seed, references — auto-injected into every shot |
| **Story Bible** | Memory layer for continuity, arcs, timeline, style anchors |
| **Smart routing** | Auto-pick best free provider (Chinese-first), fall back on failure |
| **Storyboard** | Per-shot prompts, provider picker, character chips, inline previews |
| **34 providers** | Text, image, video, audio — Chinese models prioritized |
| **OpenRouter** | One key → dozens of free models (Llama, Mistral, Gemma...) |
| **Mock mode** | Full flow works offline with placeholder assets |
| **Export bundle** | Zip: images, clips, audio, scripts, `story.json`, `assemble.sh` |
| **Usage tracking** | Per-generation events — foundation for pay-later billing |
| **Auth** | Email/password + verification + reset; optional Google OAuth |

---

## Quick start

**Zero credentials required.** Clone, install, migrate, run.

```bash
git clone https://github.com/krnbwj/ai-video-story-studio.git
cd ai-video-story-studio
pnpm install
cp .env.example .env.local
# Edit .env.local — set AUTH_SECRET to any random string (openssl rand -base64 32)
pnpm run db:migrate
pnpm run dev
```

Open **http://127.0.0.1:3000**

1. Sign up → verification link prints to your **terminal**
2. Create a project via the wizard
3. Add frozen characters + story memory
4. Generate shots on the storyboard (mock assets, no keys needed)
5. Export zip for offline DaVinci Resolve editing

For detailed setup, troubleshooting, and provider activation, see **[docs/SCAFFOLDING.md](docs/SCAFFOLDING.md)**.

### Production mode (more stable than dev)

```bash
pnpm run build
pnpm start --hostname 127.0.0.1
```

---

## Provider ecosystem

34 adapters organized Chinese-first, then global. All visible on the **Connections** page.

### Chinese (priority)

| Provider | Kind | Env var | Free signup |
|----------|------|---------|-------------|
| DeepSeek | text | `DEEPSEEK_API_KEY` | [platform.deepseek.com](https://platform.deepseek.com/) |
| Qwen / DashScope | text, image, video | `DASHSCOPE_API_KEY` | [dashscope.console.aliyun.com](https://dashscope.console.aliyun.com/) |
| GLM (Zhipu / z.ai) | text, image, video | `ZHIPU_API_KEY` | [open.bigmodel.cn](https://open.bigmodel.cn/) |
| Kimi (Moonshot) | text | `MOONSHOT_API_KEY` | [platform.moonshot.cn](https://platform.moonshot.cn/) |
| MiniMax / Hailuo | text, TTS, video | `MINIMAX_API_KEY` | [minimaxi.com](https://www.minimaxi.com/) |
| Kling (Kuaishou) | video | `KLING_API_KEY` | [klingai.com](https://klingai.com/) |
| Wan / Tongyi Wanxiang | video | `DASHSCOPE_API_KEY` | [dashscope.console.aliyun.com](https://dashscope.console.aliyun.com/) |
| StepFun | text | `STEPFUN_API_KEY` | [platform.stepfun.com](https://platform.stepfun.com/) |
| Hunyuan (Tencent) | text, image, video | `HUNYUAN_API_KEY` | [cloud.tencent.com/product/hunyuan](https://cloud.tencent.com/product/hunyuan) |
| Vidu | video | `VIDU_API_KEY` | [vidu.studio](https://www.vidu.studio/) |
| Seedream / Seedance | image, video | `VOLCENGINE_API_KEY` | [volcengine.com](https://www.volcengine.com/) |
| Pixverse | video | `PIXVERSE_API_KEY` | [pixverse.ai](https://pixverse.ai/) |

### Global

| Provider | Kind | Env var | Free signup |
|----------|------|---------|-------------|
| **OpenRouter** | text | `OPENROUTER_API_KEY` | [openrouter.ai](https://openrouter.ai/) |
| Google Gemini | text | `GOOGLE_GENERATIVE_AI_API_KEY` | [aistudio.google.com](https://aistudio.google.com/apikey) |
| Groq | text | `GROQ_API_KEY` | [console.groq.com](https://console.groq.com/) |
| Together AI | text | `TOGETHER_API_KEY` | [together.xyz](https://api.together.xyz/) |
| Fireworks | text | `FIREWORKS_API_KEY` | [fireworks.ai](https://fireworks.ai/) |
| Hugging Face | image | `HF_API_KEY` | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |
| Replicate | video | `REPLICATE_API_TOKEN` | [replicate.com](https://replicate.com/) |
| Fal.ai | video | `FAL_KEY` | [fal.ai](https://fal.ai/) |
| Stability AI | image | `STABILITY_API_KEY` | [platform.stability.ai](https://platform.stability.ai/) |
| Luma | video | `LUMA_API_KEY` | [lumalabs.ai](https://lumalabs.ai/) |
| Runway | video | `RUNWAY_API_KEY` | [runwayml.com](https://runwayml.com/) |
| ElevenLabs | audio | `ELEVENLABS_API_KEY` | [elevenlabs.io](https://elevenlabs.io/) |

See [`.env.example`](.env.example) for the complete list.

**Activate via:** `.env.local` (server-wide) or `/connections` page (per-user).

---

## Smart routing

Enable **Smart routing** on the storyboard to automatically:

1. Pick the highest-scored live provider (preferred → Chinese-first → free)
2. Fall back to the next provider on failure
3. Never hard-fail — mock assets as last resort
4. Track every generation in the usage ledger

This lets you generate at scale across free tiers by switching platforms as quotas exhaust.

---

## Story memory

The memory layer keeps your story consistent across shots and episodes:

- **Story Bible** — world facts, tone, rules
- **Continuity** — established facts that must remain true
- **Character Arcs** — development notes per character
- **Timeline** — chronological events
- **Style Anchors** — visual/narrative references

All entries are ranked by importance and injected into every generation prompt alongside frozen character profiles.

---

## Export for offline editing

One click downloads a zip:

```
project_export.zip
├── images/          # Generated stills
├── clips/           # Generated video clips
├── audio/           # Voice/music assets
├── scripts/         # Per-shot prompts + generated scripts
├── story.json       # Full manifest (project, characters, scenes, shots)
└── assemble.sh      # ffmpeg concat script
```

Import clips into **DaVinci Resolve**, run `assemble.sh` with ffmpeg, or use `story.json` as a production brief.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS 4 + CVA components |
| Database | Drizzle ORM + SQLite (local) / Postgres (prod) |
| Auth | Auth.js v5 (JWT + Credentials + Google OAuth) |
| AI | Vercel AI SDK v6 + OpenAI-compatible adapters |
| Email | Resend (prod) / nodemailer console (dev) |
| Export | archiver (zip) + ffmpeg script generation |
| Deploy | Vercel (serverless) |

---

## Deploy to Vercel

```bash
git push origin main
npx vercel
```

Production env vars: `AUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL` (Neon), `RESEND_API_KEY`.

---

## Project structure

```
src/
├── app/                    # Pages + API routes
│   ├── api/                # auth, projects, generate, export, memory, usage
│   ├── auth/               # signin, signup, verify, reset
│   ├── dashboard/          # project list
│   ├── projects/[id]/      # wizard, characters, memory, storyboard, library, export
│   └── connections/        # provider key management
├── components/             # UI (wizard, storyboard, memory, characters, etc.)
├── db/                     # Drizzle schema + SQLite
├── lib/
│   ├── providers/          # 34 adapters, registry, smart router
│   ├── memory.ts           # Story continuity layer
│   ├── export.ts           # Zip + ffmpeg assembly
│   └── project-service.ts  # CRUD
└── auth.ts                 # Auth.js configuration
```

---

## Roadmap

- [ ] Real media API wiring (Kling, Wan, Fal, Replicate video/image)
- [ ] Vercel Blob storage for generated assets
- [ ] Drag-and-drop storyboard reordering (dnd-kit)
- [ ] DaVinci Resolve `.drp` project file export
- [ ] Semantic search over story memory
- [ ] Auto-extract continuity from generated scripts
- [ ] Billing gate on usage threshold
- [ ] Multi-episode / season management
- [ ] Community provider registry (submit new adapters via PR)

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md).

**High-impact areas:** wiring real video APIs, improving the routing engine, UI polish, tests, documentation.

---

## License

[MIT](LICENSE) — use freely, commercially or otherwise.

---

<p align="center">
  Built with care by <a href="https://github.com/krnbwj">krnbwj</a>
  <br>
  <sub>If this helps you create something amazing, give it a star.</sub>
</p>
