import { PROVIDER_DEFINITIONS } from "./config";
import { createOpenAICompatibleAdapter } from "./openai-compatible";
import { mockGenerate } from "./mock";
import type { GenerationInput, GenerationResult, ProviderAdapter } from "./types";

function buildAdapter(def: (typeof PROVIDER_DEFINITIONS)[number]): ProviderAdapter {
  if (def.baseUrl && def.model && def.kind === "text") {
    const compat = createOpenAICompatibleAdapter(def);
    return {
      ...def,
      getStatus: compat.getStatus,
      generate: compat.generate,
    };
  }

  return {
    ...def,
    getStatus(apiKey?: string) {
      const key = apiKey ?? (def.envKey ? process.env[def.envKey] : undefined);
      return key ? "live" : "mock";
    },
    async generate(input: GenerationInput): Promise<GenerationResult> {
      const key =
        input.apiKey ?? (def.envKey ? process.env[def.envKey] : undefined);
      if (!key) return mockGenerate({ ...input, kind: def.kind });
      return mockGenerate({ ...input, kind: def.kind });
    },
  };
}

const adapters = new Map(
  PROVIDER_DEFINITIONS.map((def) => [def.id, buildAdapter(def)]),
);

export function getProvider(id: string): ProviderAdapter | undefined {
  return adapters.get(id);
}

export function listProviders() {
  return PROVIDER_DEFINITIONS.map((def) => {
    const adapter = adapters.get(def.id)!;
    return {
      ...def,
      status: adapter.getStatus(),
    };
  });
}

export async function generateWithProvider(
  providerId: string,
  input: GenerationInput,
  apiKey?: string,
): Promise<GenerationResult> {
  const provider = getProvider(providerId);
  if (!provider) throw new Error(`Unknown provider: ${providerId}`);
  return provider.generate({ ...input, apiKey });
}

export function buildCharacterContext(
  characters: Array<{
    name: string;
    description?: string | null;
    traits?: string | null;
    frozen?: boolean | null;
  }>,
) {
  if (!characters.length) return "";
  return characters
    .map(
      (c) =>
        `- ${c.name}${c.frozen ? " [FROZEN]" : ""}: ${c.description ?? ""}${c.traits ? ` Traits: ${c.traits}` : ""}`,
    )
    .join("\n");
}
