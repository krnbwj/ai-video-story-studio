import { auth } from "@/auth";
import { AppShell, ProjectNav } from "@/components/app-shell";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getProjectForUser } from "@/lib/project-service";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";

export default async function ExportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const project = session?.user?.id
    ? await getProjectForUser(id, session.user.id)
    : null;
  if (!project) notFound();

  return (
    <AppShell title={`${project.title} · Export`}>
      <ProjectNav projectId={id} />
      <Card>
        <CardTitle>Export for offline editing</CardTitle>
        <CardDescription className="mt-2 max-w-2xl">
          Download a zip with images, clips, audio, scripts, a story.json manifest,
          and an assemble.sh script for ffmpeg / DaVinci Resolve.
        </CardDescription>
        <Button asChild className="mt-6">
          <a href={`/api/projects/${id}/export`}>
            <Download className="h-4 w-4" />
            Download export bundle
          </a>
        </Button>
      </Card>
    </AppShell>
  );
}
