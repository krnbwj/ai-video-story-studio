# Roadmap

## Shipped (v0.2.0)

- [x] Auth (email/password, verify, reset, optional Google)
- [x] 34 provider adapters with mock mode
- [x] Smart routing + usage tracking
- [x] Story memory / continuity layer
- [x] Wizard, characters, storyboard (drag-reorder), library, export
- [x] Brevo + Resend + console email with DB templates
- [x] Provider ping test on connect
- [x] OpenRouter integration

## Next (pre-production)

- [ ] Wire live video APIs (Kling, Wan, Fal, Replicate)
- [ ] Vercel Blob for production asset storage
- [ ] Neon Postgres for production DB
- [ ] Async job polling for long video generations
- [ ] Resend/Brevo production sender domain verification

## Planned (post-MVP)

- [ ] **Superadmin / CMS** — user list, usage dashboards, provider health, template editor, feature flags (`user.role` column exists; no UI yet)
- [ ] Billing / paywall on usage thresholds
- [ ] Multi-episode season management
- [ ] DaVinci Resolve `.drp` project export
- [ ] Semantic search over story memory
- [ ] Community provider registry (submit adapters via PR)
