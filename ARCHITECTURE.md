# Architecture

## Overview

AI Video & Story Studio is a **local-first, Vercel-deployable** web application for creating AI-generated video stories. It connects to 34+ free AI providers (Chinese models prioritized), maintains story continuity through a memory layer, and exports production-ready bundles for offline editing.

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser UI                         │
│  Wizard · Characters · Story Bible · Storyboard · Editor · Export   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              Next.js App Router (API Routes)                 │
│  /api/auth/*  /api/projects/*  /api/connections  /api/usage│
└──────┬──────────┬──────────────┬──────────────┬────────────┘
       │          │              │              │
   ┌───▼───┐  ┌──▼───┐    ┌────▼────┐    ┌────▼────┐
   │ Auth  │  │  DB  │    │ Router  │    │ Export  │
   │.js v5 │  │SQLite│    │ Engine  │    │ Zip+EDL │
   └───┬───┘  │/Neon │    └────┬────┘    └─────────┘
       │      └──────┘         │
       │                 ┌─────▼──────────────────────┐
       │                 │   Provider Registry (34)    │
       │                 │  ┌─────────┐ ┌──────────┐  │
       │                 │  │ Chinese │ │ Global   │  │
       │                 │  │ DeepSeek│ │ OpenRout │  │
       │                 │  │ Qwen    │ │ Groq     │  │
       │                 │  │ GLM     │ │ Gemini   │  │
       │                 │  │ Kling   │ │ ElevenLb │  │
       │                 │  │ Wan     │ │ Replicate│  │
       │                 │  └─────────┘ └──────────┘  │
       │                 └──────────────────────────┘
       │
   ┌───▼───┐
   │Resend │  (prod email)
   │Google │  (optional OAuth)
   └───────┘
```

## Core subsystems

### 1. Provider adapter system

Every AI service implements a common interface:

```typescript
interface ProviderAdapter {
  id: string;
  label: string;
  kind: 'text' | 'image' | 'video' | 'audio';
  origin: 'cn' | 'global';
  free: boolean;
  getStatus(apiKey?): 'live' | 'mock';
  generate(input): Promise<GenerationResult>;
}
```

**Implementation strategy:**
- **OpenAI-compatible text adapter** — one implementation parameterized by `baseURL` + `model` + `envKey`. Covers DeepSeek, Qwen, GLM, Kimi, MiniMax, StepFun, Groq, OpenRouter, Together, Fireworks.
- **Media adapters** — thinner stubs with mock fallback; ready for real API wiring.
- **Mock mode** — deterministic placeholder assets so the full flow works with zero keys.

Config table: `src/lib/providers/config.ts` (34 providers).
Registry: `src/lib/providers/registry.ts`.
Router: `src/lib/providers/router.ts`.

### 2. Smart routing engine

`routeGeneration()` in `src/lib/providers/router.ts`:

1. Resolve which providers are **live** for this user (per-user connection keys or server env vars)
2. Score candidates: preferred provider (+1000) → live (+500) → Chinese-first (+50) → free (+10)
3. Try live providers in score order; on failure, fall through
4. Final fallback: mock generation (never hard-fails)
5. Record usage event (live/mock/billable) for every attempt

This enables **large-scale free generation** by switching platforms as quotas exhaust, with a usage ledger for future billing.

### 3. Story memory layer

`src/lib/memory.ts` persists continuity across shots and episodes:

| Kind | Purpose | Example |
|------|---------|---------|
| `bible` | World/setting facts | "Story is set in Neo-Shanghai, 2087" |
| `continuity` | Must-remain-true facts | "Mara has a scar on her left cheek from S1E3" |
| `arc` | Character development | "Kai starts cynical, learns trust by E5" |
| `timeline` | Chronological events | "Day 3: The heist fails" |
| `style` | Visual/narrative anchors | "Blade Runner meets Studio Ghibli" |

`buildMemoryContext()` compacts entries by importance into a prompt-ready block injected before every generation alongside frozen character profiles.

### 4. Frozen character profiles

Characters have locked `description`, `traits`, `seed`, and `referenceImages/Videos`. When assigned to a shot, their context is composed into the generation prompt automatically. The `frozen` flag prevents accidental edits.

### 5. Export pipeline

`src/lib/export.ts` builds a zip containing:
- `/images/`, `/clips/`, `/audio/`, `/scripts/` — downloaded assets
- `story.json` — full manifest (project, characters, scenes, shots, assets)
- `assemble.sh` — ffmpeg concat script for offline assembly
- Per-shot prompt `.txt` files in `/scripts/`

Designed for import into DaVinci Resolve or any NLE.

### 6. Authentication

- **Auth.js v5** with JWT sessions
- **Credentials** provider (email/password + bcrypt)
- **Google OAuth** (optional, enabled when env vars present)
- Email verification + password reset via Resend (prod) or console transport (dev)
- Edge-safe middleware (no DB import in middleware — split auth config)

### 7. Database

**Local:** SQLite via `better-sqlite3` + Drizzle ORM (`./data/studio.db`)
**Production:** Postgres on Neon (swap `DATABASE_URL`)

Tables: user, account, session, verificationToken, project, episode, scene, shot, character, asset, generation_job, provider_connection, story_memory, usage_event.

Migration: `scripts/migrate.mjs` (idempotent, no ORM migration tool needed).

## Data flow: shot generation

```
User clicks "Generate" on storyboard
  → POST /api/projects/[id]/generate
    → Load shot prompt + assigned characters
    → Load story memory entries
    → buildCharacterContext() + buildMemoryContext()
    → routeGeneration() — try live providers, fall back to mock
    → Save asset + update shot status
    → Record usage event
  → Return { providerId, mode, attempts, asset }
```

## Deployment topology

| Environment | DB | Email | Assets | Compute |
|-------------|-----|-------|--------|---------|
| Local dev | SQLite | Console | Local files | `pnpm dev` |
| Vercel prod | Neon Postgres | Resend | Vercel Blob (future) | Serverless functions |

## Extension points

- **Add a provider:** Add entry to `config.ts` → auto-registered. If OpenAI-compatible text, zero code needed.
- **Add memory kind:** Extend `MemoryKind` type + UI labels in `memory-manager.tsx`.
- **Wire real media API:** Replace mock branch in provider adapter's `generate()`.
- **Add billing:** Query `usage_event` table where `billable = true`; gate on `billableUnits` threshold.
- **Video editor:** Timeline state in `project.editorData`; client-side ffmpeg.wasm render + offline `render.sh`. See [docs/EDITOR.md](docs/EDITOR.md).
