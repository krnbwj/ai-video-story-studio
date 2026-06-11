import Link from "next/link";
import { auth } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getUserProjects } from "@/lib/project-service";
import { Plus } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const projects = session?.user?.id
    ? await getUserProjects(session.user.id)
    : [];

  return (
    <AppShell title="Dashboard">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-zinc-400">Your AI story projects</p>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardTitle>No projects yet</CardTitle>
          <CardDescription className="mt-2">
            Start with the creation wizard to build your first show or short-form story.
          </CardDescription>
          <Button asChild className="mt-4">
            <Link href="/projects/new">Create your first project</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}/create`}>
              <Card className="transition hover:border-violet-500/50">
                <CardTitle>{project.title}</CardTitle>
                <CardDescription className="mt-2">
                  {project.description ?? "No description"}
                </CardDescription>
                <p className="mt-4 text-xs text-zinc-500">
                  {project.genre ?? "General"} · {project.status}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
