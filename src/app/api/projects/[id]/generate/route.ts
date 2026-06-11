import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assets, characters, generationJobs, providerConnections, shots } from "@/db/schema";
import { getProjectForUser } from "@/lib/project-service";
import {
  buildCharacterContext,
  generateWithProvider,
  getProvider,
} from "@/lib/providers/registry";
import { simpleDecrypt } from "@/lib/crypto";
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

  const { shotId, providerId, kind } = await req.json();
  const [shot] = await db.select().from(shots).where(eq(shots.id, shotId)).limit(1);
  if (!shot) return NextResponse.json({ error: "Shot not found" }, { status: 404 });

  const provider = getProvider(providerId);
  if (!provider) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

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

  const connections = await db
    .select()
    .from(providerConnections)
    .where(eq(providerConnections.userId, session.user.id));
  const connection = connections.find((c) => c.providerId === providerId);

  let apiKey: string | undefined;
  if (connection?.apiKey && connection.providerId === providerId) {
    try {
      apiKey = simpleDecrypt(connection.apiKey);
    } catch {
      apiKey = undefined;
    }
  }

  const jobId = generateId();
  await db.insert(generationJobs).values({
    id: jobId,
    userId: session.user.id,
    projectId,
    shotId,
    providerId,
    kind: kind ?? provider.kind,
    status: "processing",
    input: JSON.stringify({ prompt: shot.prompt, characterContext }),
  });

  const result = await generateWithProvider(
    providerId,
    {
      prompt: shot.prompt ?? "",
      kind: kind ?? provider.kind,
      characterContext,
    },
    apiKey,
  );

  const assetId = generateId();
  const primary = result.assets?.[0];
  const assetType = primary?.type ?? provider.kind;
  const assetUrl = primary?.type === "text" ? "" : (primary?.url ?? "");
  const assetPrompt =
    primary?.type === "text" ? (primary.text ?? shot.prompt ?? "") : shot.prompt;

  await db.insert(assets).values({
    id: assetId,
    projectId,
    shotId,
    type: assetType,
    providerId,
    prompt: assetPrompt ?? "",
    url: assetUrl,
    status: "completed",
  });

  await db
    .update(shots)
    .set({ assetId, status: "completed", providerId })
    .where(eq(shots.id, shotId));

  await db
    .update(generationJobs)
    .set({
      status: "completed",
      result: JSON.stringify(result),
      updatedAt: new Date(),
    })
    .where(eq(generationJobs.id, jobId));

  return NextResponse.json({ jobId, assetId, result });
}
