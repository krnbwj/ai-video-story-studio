export type ProviderKind = "text" | "image" | "video" | "audio";
export type ProviderOrigin = "cn" | "global";
export type ProviderStatus = "live" | "mock";

export interface GenerationInput {
  prompt: string;
  kind: ProviderKind;
  characterContext?: string;
  params?: Record<string, unknown>;
  apiKey?: string;
}

export interface GenerationResult {
  status: "completed" | "processing";
  jobId?: string;
  assets?: Array<{
    type: ProviderKind;
    url: string;
    text?: string;
  }>;
}

export interface ProviderDefinition {
  id: string;
  label: string;
  kind: ProviderKind;
  origin: ProviderOrigin;
  free: boolean;
  envKey?: string;
  signupUrl?: string;
  description?: string;
  baseUrl?: string;
  model?: string;
}

export interface ProviderAdapter extends ProviderDefinition {
  getStatus(apiKey?: string): ProviderStatus;
  generate(input: GenerationInput): Promise<GenerationResult>;
  poll?(jobId: string, apiKey?: string): Promise<GenerationResult>;
}
