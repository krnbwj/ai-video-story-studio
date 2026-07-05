import type { EditorState, TimelineClip } from "./types";
import { DEFAULT_EDITOR_STATE } from "./types";
import { generateId } from "@/lib/utils";

interface ShotLike {
  id: string;
  title?: string | null;
  durationSec?: number | null;
  orderIndex?: number | null;
  assetId?: string | null;
}

interface AssetLike {
  id: string;
  type: string;
  url?: string | null;
  shotId?: string | null;
}

export function parseEditorData(raw: string | null | undefined): EditorState {
  if (!raw) return { ...DEFAULT_EDITOR_STATE };
  try {
    const parsed = JSON.parse(raw) as EditorState;
    if (parsed.version !== 1 || !Array.isArray(parsed.clips)) {
      return { ...DEFAULT_EDITOR_STATE };
    }
    return {
      ...DEFAULT_EDITOR_STATE,
      ...parsed,
      clips: parsed.clips ?? [],
      shorts: parsed.shorts ?? [],
    };
  } catch {
    return { ...DEFAULT_EDITOR_STATE };
  }
}

export function buildTimelineFromShots(
  shots: ShotLike[],
  assets: AssetLike[],
): TimelineClip[] {
  const assetByShot = new Map(
    assets.filter((a) => a.shotId).map((a) => [a.shotId!, a]),
  );
  const assetById = new Map(assets.map((a) => [a.id, a]));

  const ordered = [...shots].sort(
    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
  );

  let cursor = 0;
  const clips: TimelineClip[] = [];

  for (const shot of ordered) {
    const asset =
      (shot.assetId && assetById.get(shot.assetId)) ||
      assetByShot.get(shot.id);
    if (!asset?.url) continue;

    const durationMs = (shot.durationSec ?? 5) * 1000;
    clips.push({
      id: generateId(),
      assetId: asset.id,
      url: asset.url,
      label: shot.title ?? `Shot ${clips.length + 1}`,
      type: asset.type === "audio" ? "audio" : asset.type === "image" ? "image" : "video",
      startMs: cursor,
      inMs: 0,
      outMs: durationMs,
      durationMs,
      effects: [],
      volume: 1,
    });
    cursor += durationMs;
  }

  return clips;
}

export function timelineDurationMs(clips: TimelineClip[]): number {
  if (!clips.length) return 0;
  return Math.max(...clips.map((c) => c.startMs + c.durationMs));
}

export function clipAtPlayhead(
  clips: TimelineClip[],
  playheadMs: number,
): TimelineClip | null {
  return (
    clips.find(
      (c) => playheadMs >= c.startMs && playheadMs < c.startMs + c.durationMs,
    ) ?? null
  );
}

export function filterCssForClip(clip: TimelineClip): string {
  const filter = clip.effects.find((e) => e.type === "filter");
  switch (filter?.preset) {
    case "vivid":
      return "saturate(1.45) contrast(1.05)";
    case "cinematic":
      return "contrast(1.15) saturate(0.85) brightness(0.95)";
    case "bw":
      return "grayscale(1)";
    case "warm":
      return "sepia(0.35) saturate(1.1)";
    case "cool":
      return "hue-rotate(15deg) saturate(1.1)";
    default:
      return "none";
  }
}

export function textOverlayForClip(clip: TimelineClip): string | null {
  const text = clip.effects.find((e) => e.type === "text");
  return text?.content ?? null;
}

export function speedForClip(clip: TimelineClip): number {
  const speed = clip.effects.find((e) => e.type === "speed");
  return speed?.rate && speed.rate > 0 ? speed.rate : 1;
}
