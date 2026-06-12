# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-06-12

### Added
- **Story memory layer** — persist story bible, continuity facts, character arcs, timeline, and style anchors; injected into every generation prompt
- **Smart provider routing** — auto-pick the best available free provider (Chinese-first), fall back on failure, never hard-fail
- **Usage tracking** — per-user generation events with live/mock/billable flags (foundation for pay-later longtail model)
- **OpenRouter integration** — first-class adapter + routing candidate (`OPENROUTER_API_KEY`)
- Story Bible UI page per project (`/projects/[id]/memory`)
- Auto-route toggle on storyboard with routed-provider feedback
- `/api/projects/[id]/memory` and `/api/usage` endpoints

### Changed
- Generate route now composes memory + character + shot context before routing
- Package marked public for open-source distribution

## [0.1.0] - 2026-06-11

### Added
- Initial release: wizard, frozen characters, storyboard, 34 provider adapters
- Auth (email/password + optional Google OAuth)
- Mock mode (zero API keys required)
- Export bundle for offline DaVinci Resolve / ffmpeg editing
- Connections page for per-user API key management
- SQLite local DB with migration script

[0.2.0]: https://github.com/krnbwj/ai-video-story-studio/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/krnbwj/ai-video-story-studio/releases/tag/v0.1.0
