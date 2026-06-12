# Contributing to AI Video & Story Studio

Thank you for considering contributing! This project aims to be the most useful open-source platform for AI video story creation — your help makes that possible.

## Ways to contribute

- **Add provider adapters** — wire real APIs for image/video/audio providers (most are stubbed with mock fallback)
- **Improve routing** — smarter quota detection, rate-limit awareness, cost optimization
- **Memory layer** — semantic search over story bible, auto-extract continuity from generated scripts
- **UI/UX** — drag-and-drop storyboard (dnd-kit is installed), timeline view, mobile layout
- **Export** — DaVinci Resolve `.drp` project file generation, EDL/XML export
- **Documentation** — tutorials, video walkthroughs, provider setup guides
- **Tests** — unit tests for router, memory, export; E2E for auth + wizard flow
- **Bug reports** — [open an issue](https://github.com/krnbwj/ai-video-story-studio/issues)

## Development setup

See [docs/SCAFFOLDING.md](docs/SCAFFOLDING.md) for the full guide. Quick version:

```bash
git clone https://github.com/krnbwj/ai-video-story-studio.git
cd ai-video-story-studio
pnpm install
cp .env.example .env.local   # set AUTH_SECRET
pnpm run db:migrate
pnpm run dev
```

## Code style

- TypeScript strict mode
- Functional React components with hooks
- Server components for data fetching, client components for interactivity
- API routes return `NextResponse.json()`
- No unnecessary comments — code should be self-documenting
- Keep dependencies lightweight; prefer stdlib + small focused packages

## Adding a new provider

1. Add an entry to `src/lib/providers/config.ts`:

```typescript
{
  id: "my-provider",
  label: "My Provider",
  kind: "text",           // text | image | video | audio
  origin: "global",       // cn | global
  free: true,
  envKey: "MY_PROVIDER_API_KEY",
  signupUrl: "https://myprovider.com/signup",
  baseUrl: "https://api.myprovider.com/v1",  // if OpenAI-compatible
  model: "my-model-name",                     // if OpenAI-compatible
  description: "Short description for the Connections page.",
}
```

2. If OpenAI-compatible text: **done** — the registry auto-builds the adapter.
3. If media (image/video/audio): add a custom `generate()` in a new file under `src/lib/providers/`.
4. Add the env var to `.env.example`.
5. Test with mock mode first, then with a real key.

## Pull request process

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make changes, ensure `pnpm run build` passes
4. Commit with clear messages (see existing commit style)
5. Open a PR against `main`
6. Describe what changed and why

## Community

- **Issues:** [github.com/krnbwj/ai-video-story-studio/issues](https://github.com/krnbwj/ai-video-story-studio/issues)
- **Discussions:** Use GitHub Discussions for ideas and questions

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
