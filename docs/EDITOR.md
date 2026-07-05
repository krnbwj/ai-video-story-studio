# Video Editor

CapCut-style timeline editor built into AI Story Studio. Edit project assets on a horizontal timeline, apply effects, cut shorts for social platforms, and export via browser (ffmpeg.wasm) or offline shell script.

## Quick start

```bash
pnpm run db:migrate
pnpm run db:seed-demo   # admin@studio.local / admin1234 + demo project
pnpm run dev
```

Open **Editor** from any project nav, or go directly to `/projects/{id}/editor`.

---

## User guide

### Timeline

- **Media bin** (left): click project assets (video/image/audio) to append clips.
- **Import storyboard**: one-click build from storyboard shots + linked assets.
- **Drag clips** on the horizontal timeline to reorder; start times recalculate automatically.
- **Trim**: select a clip and edit In / Out / Duration (milliseconds).
- **Playhead**: scrub the preview slider or press Play to preview.

Timelines support **10+ minutes** and beyond — add as many clips as needed. The demo seed ships a ~2 minute timeline for fast loading; longer projects work the same way.

### Effects (per clip)

| Effect | Description |
|--------|-------------|
| Fade in / out | 500ms fade at clip edges (preview + offline script) |
| Speed | 0.5× – 2× playback |
| Filter | vivid, cinematic, B&W, warm, cool (CSS preview + ffmpeg eq filters offline) |
| Text overlay | Title text on clip preview |

### Shorts / Reels

Create vertical **9:16** cuts from the current playhead:

| Preset | Max length |
|--------|------------|
| YouTube Short | 60s |
| Instagram Reel | 90s |
| TikTok | 60s |

Each short stores start + duration on the timeline. Use **Render short** for browser export, or download the bundle for offline ffmpeg.

### Export options

1. **Render in browser** — ffmpeg.wasm concatenates clips client-side (no server upload). Best for short timelines; large projects may be slow or hit memory limits.
2. **Bundle (JSON + sh)** — downloads `timeline.json` + `render.sh` for local ffmpeg:
   ```bash
   chmod +x render.sh && ./render.sh
   ```
3. **Auto-save** — editor state persists to `project.editorData` via PATCH `/api/projects/[id]`.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  VideoEditor (client)                                        │
│  Preview · Timeline (dnd-kit) · Effects · Shorts · Export    │
└───────────────┬──────────────────────────────┬──────────────┘
                │ PATCH editorData             │ render/export
                ▼                              ▼
┌───────────────────────┐          ┌──────────────────────────┐
│  /api/projects/[id]   │          │  src/lib/editor/          │
│  project.editorData   │          │  types · utils ·          │
└───────────────────────┘          │  ffmpeg-script ·          │
                                   │  browser-render (wasm)    │
                                   └──────────────────────────┘
```

### Data model

`EditorState` (JSON in `project.editorData`):

```typescript
{
  version: 1,
  fps: 30,
  clips: TimelineClip[],   // ordered timeline segments
  shorts: ShortCut[],      // vertical export regions
  playheadMs: number,
  selectedClipId?: string
}
```

Each `TimelineClip` references a project asset URL with trim points (`inMs`, `outMs`, `durationMs`), optional effects, and volume.

### Browser vs offline ffmpeg

| | Browser (ffmpeg.wasm) | Offline (`render.sh`) |
|--|----------------------|------------------------|
| Setup | None | `brew install ffmpeg` |
| Speed | Slower, memory-bound | Full native speed |
| Filters / speed | Basic trim + concat in wasm path | Full filter chain in script |
| Shorts crop | 9:16 scale+crop in wasm | Same via ffmpeg `-vf` |
| Privacy | Clips stay in browser | Downloads source URLs locally |

The wasm renderer focuses on **trim + concat** for reliability. Filters, speed, and fades are applied in the offline script and shown in CSS during preview.

### Key files

| File | Role |
|------|------|
| `src/components/video-editor.tsx` | Main UI |
| `src/lib/editor/types.ts` | EditorState, clips, shorts |
| `src/lib/editor/utils.ts` | Parse, storyboard import, CSS filters |
| `src/lib/editor/ffmpeg-script.ts` | Offline bash render script |
| `src/lib/editor/browser-render.ts` | ffmpeg.wasm render + bundle download |
| `scripts/seed-demo-editor.mjs` | Demo project + admin user |

---

## Demo credentials

After `pnpm run db:seed-demo`:

- **Email:** `admin@studio.local`
- **Password:** `admin1234`
- **Project:** Studio Demo — Neon City Chronicles (~2 min, 12 clips)

Production test user (if seeded separately): `test@studio.local` / `studio1234`

---

## Limitations (v0.3.0)

- Browser render loads ffmpeg core from unpkg (~25MB); first export is slow.
- Cross-origin video URLs must allow fetch (CC0 demo URL works; some CDNs may block wasm fetch).
- Audio tracks are listed in the bin but preview focuses on video/image.
- Multi-track audio mixing not yet implemented.
- Undo/redo not implemented — rely on auto-save and storyboard re-import.
