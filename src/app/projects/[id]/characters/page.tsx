import { auth } from "@/auth";
import { AppShell, ProjectNav } from "@/components/app-shell";
import { CharacterManager } from "@/components/character-manager";
import { getProjectForUser } from "@/lib/project-service";
import { notFound } from "next/navigation";

export default async function CharactersPage({
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
    <AppShell title={`${project.title} · Characters`}>
      <ProjectNav projectId={id} />
      <CharacterManager projectId={id} />
    </AppShell>
  );
}
