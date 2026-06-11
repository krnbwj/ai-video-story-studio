import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import { mockGenerate } from "./mock";
import type { GenerationInput, GenerationResult, ProviderDefinition } from "./types";

export function createOpenAICompatibleAdapter(
  def: ProviderDefinition,
): {
  getStatus: (apiKey?: string) => "live" | "mock";
  generate: (input: GenerationInput) => Promise<GenerationResult>;
} {
  return {
    getStatus(apiKey?: string) {
      const key = apiKey ?? (def.envKey ? process.env[def.envKey] : undefined);
      return key ? "live" : "mock";
    },
    async generate(input: GenerationInput) {
      const apiKey =
        input.apiKey ?? (def.envKey ? process.env[def.envKey] : undefined);

      if (!apiKey || !def.baseUrl || !def.model) {
        return mockGenerate(input);
      }

      if (input.kind !== "text") {
        return mockGenerate(input);
      }

      const provider = createOpenAICompatible({
        name: def.id,
        apiKey,
        baseURL: def.baseUrl,
      });

      const prompt = input.characterContext
        ? `Character context (frozen profiles):\n${input.characterContext}\n\nTask:\n${input.prompt}`
        : input.prompt;

      const { text } = await generateText({
        model: provider(def.model),
        prompt,
      });

      return {
        status: "completed" as const,
        assets: [{ type: "text" as const, url: "", text }],
      };
    },
  };
}
