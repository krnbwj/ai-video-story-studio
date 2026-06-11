import { createRequire } from "module";
import { PassThrough } from "stream";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const archiver = require("archiver") as typeof import("archiver");
import type { InferSelectModel } from "drizzle-orm";
import type { assets, characters, projects, scenes, shots } from "@/db/schema";

type Project = InferSelectModel<typeof projects>;
type Scene = InferSelectModel<typeof scenes>;
type Shot = InferSelectModel<typeof shots>;
type Character = InferSelectModel<typeof characters>;
type Asset = InferSelectModel<typeof assets>;

export interface ExportPayload {
  project: Project;
  scenes: Scene[];
  shots: Shot[];
  characters: Character[];
  assets: Asset[];
}

export function buildManifest(payload: ExportPayload) {
  return {
    project: {
      id: payload.project.id,
      title: payload.project.title,
      description: payload.project.description,
      style: payload.project.style,
      aspectRatio: payload.project.aspectRatio,
    },
    characters: payload.characters.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      traits: c.traits,
      frozen: c.frozen,
      referenceImages: c.referenceImages ? JSON.parse(c.referenceImages) : [],
      referenceVideos: c.referenceVideos ? JSON.parse(c.referenceVideos) : [],
    })),
    scenes: payload.scenes.map((scene) => ({
      id: scene.id,
      title: scene.title,
      description: scene.description,
      shots: payload.shots
        .filter((s) => s.sceneId === scene.id)
        .map((shot) => ({
          id: shot.id,
          title: shot.title,
          prompt: shot.prompt,
          providerId: shot.providerId,
          durationSec: shot.durationSec,
          characterIds: shot.characterIds ? JSON.parse(shot.characterIds) : [],
          assetId: shot.assetId,
        })),
    })),
    assets: payload.assets.map((a) => ({
      id: a.id,
      type: a.type,
      providerId: a.providerId,
      prompt: a.prompt,
      url: a.url,
      shotId: a.shotId,
      characterId: a.characterId,
    })),
    exportedAt: new Date().toISOString(),
  };
}

export function buildFfmpegScript(manifest: ReturnType<typeof buildManifest>) {
  const clips = manifest.assets
    .filter((a) => a.type === "video" && a.url)
    .map((a, i) => `file 'clips/clip_${i + 1}.mp4'`);

  return `#!/bin/bash
# Offline assembly script for DaVinci Resolve / ffmpeg
# 1. Place downloaded clips into ./clips/
# 2. Run: bash assemble.sh

set -e
mkdir -p output clips audio images scripts

cat > concat.txt <<'EOF'
${clips.join("\n") || "file 'clips/clip_1.mp4'"}
EOF

if command -v ffmpeg >/dev/null; then
  ffmpeg -f concat -safe 0 -i concat.txt -c copy output/story_cut.mp4 || true
  echo "Wrote output/story_cut.mp4"
else
  echo "ffmpeg not found. Import clips manually into DaVinci Resolve."
fi
`;
}

export async function createExportZip(
  payload: ExportPayload,
): Promise<Buffer> {
  const manifest = buildManifest(payload);
  const assemble = buildFfmpegScript(manifest);

  const archive = archiver("zip", { zlib: { level: 9 } });
  const stream = new PassThrough();
  const chunks: Buffer[] = [];

  const done = new Promise<Buffer>((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
    archive.on("error", reject);
  });

  archive.pipe(stream);
  archive.append(JSON.stringify(manifest, null, 2), { name: "story.json" });
  archive.append(assemble, { name: "assemble.sh", mode: 0o755 });

  for (const asset of payload.assets) {
    if (!asset.url) continue;
    const folder =
      asset.type === "image"
        ? "images"
        : asset.type === "video"
          ? "clips"
          : asset.type === "audio"
            ? "audio"
            : "scripts";

    if (asset.type === "text" || asset.url === "") {
      archive.append(asset.prompt ?? "Generated script", {
        name: `${folder}/${asset.id}.txt`,
      });
      continue;
    }

    try {
      const res = await fetch(asset.url);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        const ext = asset.type === "image" ? "jpg" : asset.type === "video" ? "mp4" : "mp3";
        archive.append(buf, { name: `${folder}/${asset.id}.${ext}` });
      }
    } catch {
      archive.append(asset.url, { name: `${folder}/${asset.id}.url.txt` });
    }
  }

  for (const shot of payload.shots) {
    if (shot.prompt) {
      archive.append(shot.prompt, { name: `scripts/shot_${shot.id}.txt` });
    }
  }

  await archive.finalize();
  return done;
}
