# AI Video & Story Studio

Create long-form and short-form AI video stories with frozen character profiles, a visual storyboard, 34 pluggable free AI providers (Chinese-first), and one-click export for offline DaVinci Resolve editing.

## Features

- **Wizard creation flow**: Basics → Characters → Story → Look → Generate
- **Frozen characters**: Lock descriptions, traits, seeds, and references for consistent generations
- **Storyboard production**: Per-shot prompts, provider picker, character assignment, inline previews
- **34 provider adapters**: DeepSeek, Qwen, GLM, Kimi, Kling, Wan, MiniMax, ElevenLabs, and more
- **Mock mode**: Runs fully locally with zero API keys
- **Export bundle**: Zip with images, clips, audio, scripts, `story.json`, and `assemble.sh`
- **Auth**: Email/password with verification + password reset; optional Google OAuth

## Quick start (local, zero credentials)

```bash
cp .env.example .env.local
# Set AUTH_SECRET to any random string

npm install
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

1. Sign up — verification email prints to your terminal in dev mode
2. Create a project via the wizard
3. Add frozen characters
4. Generate shots on the storyboard (mock assets by default)
5. Export the project zip for offline editing

## Activating real providers

Add API keys to `.env.local` or connect them per-user on the **Connections** page.

| Provider | Env var | Free signup |
|----------|---------|-------------|
| DeepSeek | `DEEPSEEK_API_KEY` | https://platform.deepseek.com/ |
| Qwen / Wan | `DASHSCOPE_API_KEY` | https://dashscope.console.aliyun.com/ |
| GLM (z.ai) | `ZHIPU_API_KEY` | https://open.bigmodel.cn/ |
| Kimi | `MOONSHOT_API_KEY` | https://platform.moonshot.cn/ |
| MiniMax | `MINIMAX_API_KEY` | https://www.minimaxi.com/ |
| Kling | `KLING_API_KEY` | https://klingai.com/ |
| ElevenLabs | `ELEVENLABS_API_KEY` | https://elevenlabs.io/ |
| Groq | `GROQ_API_KEY` | https://console.groq.com/ |
| OpenRouter | `OPENROUTER_API_KEY` | https://openrouter.ai/ |

See `.env.example` for the full list.

## Google sign-in (optional)

1. Create OAuth credentials at https://console.cloud.google.com/
2. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`

## Production (Vercel)

1. Push to GitHub
2. Import to Vercel
3. Set env vars: `AUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL` (Neon Postgres), `RESEND_API_KEY`
4. Deploy

For Postgres in production, point `DATABASE_URL` to Neon and run migrations.

## Tech stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- shadcn-style UI (Radix + CVA)
- Drizzle ORM + SQLite (local) / Postgres (prod)
- Auth.js v5
- Vercel AI SDK + OpenAI-compatible adapters
- archiver for export zips

## Offline editing

The export zip includes:

```
/images/
/clips/
/audio/
/scripts/
story.json
assemble.sh
```

Run `bash assemble.sh` locally with ffmpeg, or import clips into DaVinci Resolve using the manifest.
