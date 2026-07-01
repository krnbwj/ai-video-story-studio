# Vercel + Neon Postgres deployment

Vercel cannot run SQLite (`better-sqlite3`). Production requires a **Neon** (or other Postgres) database.

## 1. Create Neon database (free)

1. Go to [neon.tech](https://neon.tech) and create a project
2. Copy the connection string (starts with `postgresql://`)

## 2. Run migrations on Neon

```bash
DATABASE_URL="postgresql://..." node scripts/migrate-pg.mjs
```

## 3. Set Vercel environment variables

In Vercel → Project → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://...` (Neon connection string) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `DEEPSEEK_API_KEY` | Your DeepSeek key (never commit) |
| `BREVO_API_KEY` | Optional — Brevo transactional email |
| `EMAIL_FROM` | Optional — verified sender |

## 4. Deploy

```bash
npx vercel --prod
```

**Production URL:** https://10-murex-seven.vercel.app

## 5. Seed a test user on production

```bash
DATABASE_URL="postgresql://..." node scripts/seed-user.mjs test@yourdomain.com yourpassword
```

## Local vs production

| | Local | Vercel |
|---|-------|--------|
| Database | SQLite `./data/studio.db` | Postgres `DATABASE_URL` |
| Migrate | `pnpm run db:migrate` | `node scripts/migrate-pg.mjs` |
| DeepSeek | `.env.local` | Vercel env var |
