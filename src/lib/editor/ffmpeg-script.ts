import type { EditorState, ShortCut } from "./types";
import { timelineDurationMs } from "./utils";

function filterChain(preset?: string) {
  switch (preset) {
    case "vivid":
      return "eq=saturation=1.45:contrast=1.05";
    case "cinematic":
      return "eq=contrast=1.15:saturation=0.85:brightness=0.95";
    case "bw":
      return "hue=s=0";
    case "warm":
      return "colorbalance=rs=0.1:gs=0.05";
    case "cool":
      return "colorbalance=bs=0.1";
    default:
      return null;
  }
}

export function buildEditorFfmpegScript(
  editor: EditorState,
  projectTitle: string,
  mode: "full" | ShortCut["preset"] = "full",
  shortCut?: ShortCut,
) {
  const clips = [...editor.clips].sort((a, b) => a.startMs - b.startMs);
  const lines: string[] = [
    "#!/bin/bash",
    `# AI Story Studio — ${projectTitle}`,
    "# Render timeline with ffmpeg (install: brew install ffmpeg)",
    "set -euo pipefail",
    "mkdir -p output clips",
    "",
  ];

  clips.forEach((clip, i) => {
    const idx = i + 1;
    const inSec = (clip.inMs / 1000).toFixed(3);
    const durSec = (clip.durationMs / 1000).toFixed(3);
    const filter = filterChain(
      clip.effects.find((e) => e.type === "filter")?.preset,
    );
    const speed = clip.effects.find((e) => e.type === "speed")?.rate ?? 1;
    let vf = filter ? `-vf "${filter}"` : "";
    if (speed !== 1) {
      vf = `-filter:v "setpts=PTS/${speed}${filter ? `,${filter}` : ""}"`;
    }
    lines.push(
      `# Clip ${idx}: ${clip.label}`,
      `curl -fsSL "${clip.url}" -o "clips/clip_${idx}.mp4" || cp "${clip.url}" "clips/clip_${idx}.mp4" 2>/dev/null || true`,
      `ffmpeg -y -ss ${inSec} -i "clips/clip_${idx}.mp4" -t ${durSec} ${vf} -an clips/trim_${idx}.mp4`,
      "",
    );
  });

  const concatList = clips.map((_, i) => `file 'trim_${i + 1}.mp4'`).join("\n");
  lines.push(
    "cat > clips/concat.txt <<'EOF'",
    concatList || "file 'trim_1.mp4'",
    "EOF",
    "",
    "ffmpeg -y -f concat -safe 0 -i clips/concat.txt -c copy output/full_timeline.mp4",
    "",
  );

  if (mode !== "full" && shortCut) {
    const start = (shortCut.startMs / 1000).toFixed(3);
    const dur = (shortCut.durationMs / 1000).toFixed(3);
    lines.push(
      `# Short-form export: ${shortCut.name} (${shortCut.preset})`,
      `ffmpeg -y -ss ${start} -i output/full_timeline.mp4 -t ${dur} \\`,
      `  -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" \\`,
      `  -c:v libx264 -preset fast -crf 23 output/${shortCut.preset}_${shortCut.id}.mp4`,
      `echo "Wrote output/${shortCut.preset}_${shortCut.id}.mp4"`,
    );
  } else {
    lines.push('echo "Wrote output/full_timeline.mp4"');
  }

  const totalMin = (timelineDurationMs(clips) / 60_000).toFixed(1);
  lines.unshift(`# Timeline length: ~${totalMin} minutes (${clips.length} clips)`);

  return lines.join("\n");
}
