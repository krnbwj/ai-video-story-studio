export type ClipEffectType =
  | "fadeIn"
  | "fadeOut"
  | "speed"
  | "filter"
  | "text"
  | "crop";

export type FilterPreset = "vivid" | "cinematic" | "bw" | "warm" | "cool";

export interface ClipEffect {
  type: ClipEffectType;
  durationMs?: number;
  rate?: number;
  preset?: FilterPreset;
  content?: string;
  position?: "top" | "center" | "bottom";
  aspect?: "16:9" | "9:16" | "1:1";
}

export interface TimelineClip {
  id: string;
  assetId?: string;
  url: string;
  label: string;
  type: "video" | "audio" | "image";
  startMs: number;
  inMs: number;
  outMs: number;
  durationMs: number;
  effects: ClipEffect[];
  volume: number;
}

export type ShortPreset = "youtube_short" | "instagram_reel" | "tiktok";

export interface ShortCut {
  id: string;
  name: string;
  preset: ShortPreset;
  startMs: number;
  durationMs: number;
  aspectRatio: "9:16";
}

export interface EditorState {
  version: 1;
  fps: number;
  clips: TimelineClip[];
  shorts: ShortCut[];
  playheadMs: number;
  selectedClipId?: string;
}

export const SHORT_PRESETS: Record<
  ShortPreset,
  { label: string; maxDurationMs: number; aspectRatio: "9:16" }
> = {
  youtube_short: { label: "YouTube Short", maxDurationMs: 60_000, aspectRatio: "9:16" },
  instagram_reel: { label: "Instagram Reel", maxDurationMs: 90_000, aspectRatio: "9:16" },
  tiktok: { label: "TikTok", maxDurationMs: 60_000, aspectRatio: "9:16" },
};

export const DEFAULT_EDITOR_STATE: EditorState = {
  version: 1,
  fps: 30,
  clips: [],
  shorts: [],
  playheadMs: 0,
};
