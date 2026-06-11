import type { GenerationInput, GenerationResult } from "./types";

const PLACEHOLDER_IMAGE =
  "https://placehold.co/1280x720/1a1a2e/eee?text=AI+Generated+Image";
const PLACEHOLDER_VIDEO =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
const PLACEHOLDER_AUDIO =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3";

export async function mockGenerate(
  input: GenerationInput,
): Promise<GenerationResult> {
  await new Promise((r) => setTimeout(r, 400));

  const prompt = input.characterContext
    ? `${input.characterContext}\n\n${input.prompt}`
    : input.prompt;

  switch (input.kind) {
    case "text":
      return {
        status: "completed",
        assets: [
          {
            type: "text",
            url: "",
            text: `[Mock script]\n${prompt}\n\nScene unfolds with cinematic pacing. Characters maintain frozen profiles across shots.`,
          },
        ],
      };
    case "image":
      return {
        status: "completed",
        assets: [{ type: "image", url: PLACEHOLDER_IMAGE }],
      };
    case "video":
      return {
        status: "completed",
        assets: [{ type: "video", url: PLACEHOLDER_VIDEO }],
      };
    case "audio":
      return {
        status: "completed",
        assets: [{ type: "audio", url: PLACEHOLDER_AUDIO }],
      };
    default:
      return { status: "completed", assets: [] };
  }
}
