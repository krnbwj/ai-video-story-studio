import Link from "next/link";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Clapperboard, Link2, Library, LayoutDashboard } from "lucide-react";

export function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#1f1147_0%,_#09090b_45%)] text-zinc-100">
      <header className="border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Clapperboard className="h-5 w-5 text-violet-400" />
            AI Story Studio
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/connections">
                <Link2 className="h-4 w-4" />
                Connections
              </Link>
            </Button>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button variant="outline" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">
        {title ? <h1 className="mb-6 text-3xl font-bold">{title}</h1> : null}
        {children}
      </main>
    </div>
  );
}

export function ProjectNav({ projectId }: { projectId: string }) {
  const links = [
    { href: `/projects/${projectId}/create`, label: "Wizard" },
    { href: `/projects/${projectId}/characters`, label: "Characters" },
    { href: `/projects/${projectId}/memory`, label: "Story Bible" },
    { href: `/projects/${projectId}/storyboard`, label: "Storyboard" },
    { href: `/projects/${projectId}/library`, label: "Library", icon: Library },
    { href: `/projects/${projectId}/export`, label: "Export" },
  ];

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {links.map((link) => (
        <Button key={link.href} asChild variant="secondary" size="sm">
          <Link href={link.href}>{link.label}</Link>
        </Button>
      ))}
    </div>
  );
}
