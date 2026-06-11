import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assets, characters, generationJobs, shots } from "@/db/schema";
import { getProjectForUser } from "@/lib/project-service";
import { buildCharacterContext, getProvider } from "@/lib/providers/registry";
import { routeGeneration } from "@/lib/providers/router";
import { buildMemoryContext, getMemory } from "@/lib/memory";
import { generateId } from "@/lib/utils";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: projectId } = await params;
  const project = await getProjectForUser(projectId, session.user.id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { shotId, providerId, kind, autoRoute } = await req.json();
  const [shot] = await db.select().from(shots).where(eq(shots.id, shotId)).limit(1);
  if (!shot) return NextResponse.json({ error: "Shot not found" }, { status: 404 });

  const provider = getProvider(providerId);
  const resolvedKind = kind ?? provider?.kind ?? "video";

  const characterIds: string[] = shot.characterIds
    ? JSON.parse(shot.characterIds)
    : [];
  const projectCharacters = characterIds.length
    ? await db
        .select()
        .from(characters)
        .where(eq(characters.projectId, projectId))
    : [];
  const selected = projectCharacters.filter((c) => characterIds.includes(c.id));
  const characterContext = buildCharacterContext(selected);

  const memoryEntries = await getMemory(projectId);
  const memoryContext = buildMemoryContext(memoryEntries);

  const jobId = generateId();
  await db.insert(generationJobs).values({
    id: jobId,
    userId: session.user.id,
    projectId,
    shotId,
    providerId: providerId ?? "auto",
    kind: resolvedKind,
    status: "processing",
    input: JSON.stringify({
      prompt: shot.prompt,
      characterContext,
      memoryContext,
    }),
  });

  const outcome = await routeGeneration({
    userId: session.user.id,
    projectId,
    kind: resolvedKind,
    prompt: shot.prompt ?? "",
    characterContext,
    memoryContext,
    preferredProviderId: autoRoute ? undefined : providerId,
  });

  const assetId = generateId();
  const primary = outcome.assets?.[0];
  const assetType = primary?.type ?? resolvedKind;
  const assetUrl = primary?.type === "text" ? "" : (primary?.url ?? "");
  const assetPrompt =
    primary?.type === "text" ? (primary.text ?? shot.prompt ?? "") : shot.prompt;

  await db.insert(assets).values({
    id: assetId,
    projectId,
    shotId,
    type: assetType,
    providerId: outcome.providerId,
    prompt: assetPrompt ?? "",
    url: assetUrl,
    status: "completed",
  });

  await db
    .update(shots)
    .set({ assetId, status: "completed", providerId: outcome.providerId })
    .where(eq(shots.id, shotId));

  await db
    .update(generationJobs)
    .set({
      status: "completed",
      providerId: outcome.providerId,
      result: JSON.stringify(outcome),
      updatedAt: new Date(),
    })
    .where(eq(generationJobs.id, jobId));

  return NextResponse.json({
    jobId,
    assetId,
    providerId: outcome.providerId,
    mode: outcome.mode,
    attempts: outcome.attempts,
    result: outcome,
  });
}
