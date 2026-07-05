"use client";

import type { EditorState } from "./types";
import { buildEditorFfmpegScript } from "./ffmpeg-script";
import { timelineDurationMs } from "./utils";

export async function renderTimelineInBrowser(
  editor: EditorState,
  projectTitle: string,
  onProgress?: (pct: number, label: string) => void,
): Promise<Blob> {
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { fetchFile, toBlobURL } = await import("@ffmpeg/util");

  const ffmpeg = new FFmpeg();
  onProgress?.(5, "Loading ffmpeg…");

  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  const clips = [...editor.clips].sort((a, b) => a.startMs - b.startMs);
  if (!clips.length) throw new Error("Add at least one clip to the timeline.");

  const trimmed: string[] = [];
  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const idx = i + 1;
    onProgress?.(10 + (i / clips.length) * 60, `Processing ${clip.label}…`);

    const data = await fetchFile(clip.url);
    await ffmpeg.writeFile(`in_${idx}.mp4`, data);

    const inSec = (clip.inMs / 1000).toFixed(3);
    const durSec = (clip.durationMs / 1000).toFixed(3);
    await ffmpeg.exec([
      "-ss",
      inSec,
      "-i",
      `in_${idx}.mp4`,
      "-t",
      durSec,
      "-an",
      `trim_${idx}.mp4`,
    ]);
    trimmed.push(`trim_${idx}.mp4`);
  }

  onProgress?.(75, "Concatenating…");
  const concatBody = trimmed.map((f) => `file '${f}'`).join("\n");
  await ffmpeg.writeFile("concat.txt", concatBody);
  await ffmpeg.exec([
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    "concat.txt",
    "-c",
    "copy",
    "output.mp4",
  ]);

  onProgress?.(95, "Finalizing…");
  const out = await ffmpeg.readFile("output.mp4");
  onProgress?.(100, "Done");
  const bytes = out instanceof Uint8Array ? out : new TextEncoder().encode(String(out));
  return new Blob([bytes], { type: "video/mp4" });
}

export function downloadEditorBundle(
  editor: EditorState,
  projectTitle: string,
) {
  const script = buildEditorFfmpegScript(editor, projectTitle);
  const manifest = {
    projectTitle,
    exportedAt: new Date().toISOString(),
    durationMs: timelineDurationMs(editor.clips),
    clipCount: editor.clips.length,
    shorts: editor.shorts,
    editor,
  };

  const zipParts = [
    { name: "timeline.json", content: JSON.stringify(manifest, null, 2) },
    { name: "render.sh", content: script },
  ];

  for (const part of zipParts) {
    const blob = new Blob([part.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = part.name;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export async function renderShortInBrowser(
  editor: EditorState,
  startMs: number,
  durationMs: number,
  onProgress?: (pct: number, label: string) => void,
): Promise<Blob> {
  const full = await renderTimelineInBrowser(editor, "short", onProgress);
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { fetchFile, toBlobURL } = await import("@ffmpeg/util");

  const ffmpeg = new FFmpeg();
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  await ffmpeg.writeFile("full.mp4", await fetchFile(full));
  const start = (startMs / 1000).toFixed(3);
  const dur = (durationMs / 1000).toFixed(3);
  await ffmpeg.exec([
    "-ss",
    start,
    "-i",
    "full.mp4",
    "-t",
    dur,
    "-vf",
    "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "short.mp4",
  ]);
  const out = await ffmpeg.readFile("short.mp4");
  const bytes = out instanceof Uint8Array ? out : new TextEncoder().encode(String(out));
  return new Blob([bytes], { type: "video/mp4" });
}

export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
