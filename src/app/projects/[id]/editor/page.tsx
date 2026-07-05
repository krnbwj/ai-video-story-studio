import { auth } from "@/auth";
import { AppShell, ProjectNav } from "@/components/app-shell";
import { VideoEditor } from "@/components/video-editor";
import { getProjectForUser } from "@/lib/project-service";
import { notFound } from "next/navigation";

export default async function EditorPage({
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
    <AppShell title={`${project.title} · Editor`}>
      <ProjectNav projectId={id} />
      <VideoEditor
        projectId={id}
        projectTitle={project.title}
        initialEditorData={project.editorData}
      />
    </AppShell>
  );
}
