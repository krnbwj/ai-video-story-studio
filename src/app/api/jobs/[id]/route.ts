import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { generationJobs } from "@/db/schema";
import { getProvider } from "@/lib/providers/registry";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [job] = await db
    .select()
    .from(generationJobs)
    .where(eq(generationJobs.id, id))
    .limit(1);

  if (!job || job.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (job.status === "processing" && job.externalId && job.providerId) {
    const provider = getProvider(job.providerId);
    if (provider?.poll) {
      try {
        const polled = await provider.poll(job.externalId);
        if (polled.status === "completed") {
          await db
            .update(generationJobs)
            .set({
              status: "completed",
              result: JSON.stringify(polled),
              updatedAt: new Date(),
            })
            .where(eq(generationJobs.id, id));
          return NextResponse.json({
            id: job.id,
            status: "completed",
            result: polled,
          });
        }
      } catch {
        // keep processing status
      }
    }
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    providerId: job.providerId,
    kind: job.kind,
    shotId: job.shotId,
    result: job.result ? JSON.parse(job.result) : null,
    error: job.error,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  });
}
