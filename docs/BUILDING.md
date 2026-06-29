# How We Are Building AI Video & Story Studio

This document tracks **how** the platform is built, what works today, and what is planned before production.

## Current version: 0.2.x

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 App Router | Vercel-native, server components, API routes |
| DB (local) | SQLite + Drizzle ORM | Zero setup for contributors |
| DB (prod) | Neon Postgres | Free tier, swap via `DATABASE_URL` |
| Auth | Auth.js v5, JWT + Credentials | Email/password works without OAuth |
| Email | Brevo → Resend → console | Brevo first for production; dev prints to terminal |
| Email templates | SQLite `email_template` table | Seeded on migrate; `{{link}}` variable substitution |
| AI text | Vercel AI SDK + OpenAI-compatible adapter | One client covers DeepSeek, Qwen, GLM, OpenRouter, Groq… |
| AI media | Per-provider adapters + mock fallback | Full flow works without keys; real APIs wired incrementally |
| Routing | `src/lib/providers/router.ts` | Chinese-first scoring, automatic fallback, usage ledger |
| Memory | `src/lib/memory.ts` | Story bible / continuity injected into every prompt |
| Assets | Local `public/generated` or Vercel Blob | `BLOB_READ_WRITE_TOKEN` enables cloud storage |
| Export | archiver zip + ffmpeg `assemble.sh` | Offline DaVinci Resolve workflow |

## Build & run (every session)

```bash
pnpm install
pnpm run db:migrate      # tables + email templates
pnpm run db:seed-user    # creates verified test user (prints user id)
pnpm run build
pnpm start --hostname 127.0.0.1 -p 3000
```

Open **http://127.0.0.1:3000** — not `localhost` (must match `NEXTAUTH_URL`).

## Test user

After `pnpm run db:seed-user`:

| Field | Default |
|-------|---------|
| Email | `test@studio.local` |
| Password | `studio1234` |
| Role | `user` |
| Verified | yes |

Custom: `node scripts/seed-user.mjs you@email.com yourpass`

The script prints the **User ID** to the terminal.

## Provider connection flow

1. User opens `/connections`
2. Pastes API key → clicks **Test** → `POST /api/connections/ping`
3. Ping hits provider `/models` (OpenAI-compatible) or marks media providers `unverified`
4. **Connect** → server re-pings → encrypts key → saves to `provider_connection`
5. Storyboard **Generate** → router picks live provider → records `usage_event`

## Auth bug fix (2026-06-12)

**Symptom:** `/api/auth/error` — "problem with the server configuration"

**Causes fixed:**
1. `DrizzleAdapter` + Credentials + JWT conflict → adapter only when Google OAuth enabled
2. `NEXTAUTH_URL=http://localhost:3000` but browser on `127.0.0.1` → aligned to `127.0.0.1`
3. Missing explicit `secret` in NextAuth config → added

## Email (Brevo)

Set in `.env.local`:

```env
BREVO_API_KEY=xkeysib-your-key
EMAIL_FROM=AI Story Studio <you@verified-sender.com>
```

Templates (`verify`, `reset`, `welcome`) live in DB after migrate. Code: `sendTemplateEmail(to, key, { link })`.

## Planned before production (not built yet)

- [ ] **Superadmin dashboard** — monitor users, usage, provider health (deferred; schema has `user.role` ready)
- [ ] Real video API wiring (Kling, Wan, Fal, Replicate)
- [ ] Vercel Blob for all generated assets in prod
- [ ] Neon Postgres migration script
- [ ] Billing gate on `usage_event.billableUnits`
- [ ] DaVinci `.drp` / EDL export

See [ROADMAP.md](ROADMAP.md) for the full public roadmap.

## Commit discipline

- `feat:` — user-facing features
- `fix:` — bugs (auth, routing, etc.)
- `docs:` — README, BUILDING, SCAFFOLDING
- `chore:` — deploy config, deps

Tags: `v0.1.0`, `v0.2.0` — see [CHANGELOG.md](../CHANGELOG.md).
