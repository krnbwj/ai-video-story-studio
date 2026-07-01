import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { routeGeneration } from "@/lib/providers/router";
import { getProjectForUser } from "@/lib/project-service";
import { buildMemoryContext, getMemory } from "@/lib/memory";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    prompt,
    projectId,
    type = "script",
    preferredProviderId = "deepseek",
  } = body;

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "prompt required" }, { status: 400 });
  }

  let memoryContext = "";
  let characterContext = "";
  if (projectId) {
    const project = await getProjectForUser(projectId, session.user.id);
    if (project) {
      const memory = await getMemory(projectId);
      memoryContext = buildMemoryContext(memory);
    }
  }

  const systemPrompts: Record<string, string> = {
    script: `You are a professional screenwriter. Write vivid, production-ready scene descriptions and dialogue beats for AI video generation. Output clear shot-by-shot beats.`,
    outline: `You are a story architect. Write a compelling episode outline with acts, scenes, and emotional beats.`,
    enhance: `You are a prompt engineer for AI video. Rewrite the user's shot prompt to be more cinematic, specific, and consistent with character profiles.`,
  };

  const fullPrompt = `${systemPrompts[type] ?? systemPrompts.script}\n\nUser request:\n${prompt}`;

  const outcome = await routeGeneration({
    userId: session.user.id,
    projectId,
    kind: "text",
    prompt: fullPrompt,
    memoryContext,
    characterContext,
    preferredProviderId,
  });

  const text = outcome.assets?.[0]?.text ?? "";
  if (!text && outcome.mode === "mock") {
    return NextResponse.json({
      text: `[Mock ${type}]\n\n${prompt}\n\n— Connect DeepSeek on /connections or set DEEPSEEK_API_KEY for live AI output.`,
      mode: "mock",
      providerId: outcome.providerId,
    });
  }

  return NextResponse.json({
    text,
    mode: outcome.mode,
    providerId: outcome.providerId,
    attempts: outcome.attempts,
  });
}
