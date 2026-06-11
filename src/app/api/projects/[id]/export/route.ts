import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getProjectBundle } from "@/lib/project-service";
import { createExportZip } from "@/lib/export";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const bundle = await getProjectBundle(id, session.user.id);
  if (!bundle) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const zip = await createExportZip(bundle);
  return new NextResponse(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${bundle.project.title.replace(/\s+/g, "_")}_export.zip"`,
    },
  });
}
