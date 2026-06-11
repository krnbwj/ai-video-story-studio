import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Clapperboard, Film, Users, Zap } from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#2e1065_0%,_#09090b_50%)] text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <div className="mb-10 flex items-center gap-3">
          <Clapperboard className="h-8 w-8 text-violet-400" />
          <span className="text-sm uppercase tracking-[0.2em] text-violet-300">
            AI Video & Story Studio
          </span>
        </div>
        <h1 className="max-w-3xl text-5xl font-bold leading-tight">
          Produce TV shows and short-form stories with frozen characters and 26+
          free AI providers.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-zinc-400">
          Wizard-driven creation, storyboard production, character memory, and
          one-click export for offline DaVinci Resolve editing.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg">
            <Link href={session ? "/dashboard" : "/auth/signup"}>
              {session ? "Open Studio" : "Start Creating"}
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/signin">Sign in</Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          <Card>
            <Film className="mb-3 h-6 w-6 text-violet-400" />
            <CardTitle>Storyboard Production</CardTitle>
            <CardDescription>
              Scene-by-scene shot grid with prompts, providers, and inline previews.
            </CardDescription>
          </Card>
          <Card>
            <Users className="mb-3 h-6 w-6 text-violet-400" />
            <CardTitle>Frozen Characters</CardTitle>
            <CardDescription>
              Lock character descriptions and references so every generation stays consistent.
            </CardDescription>
          </Card>
          <Card>
            <Zap className="mb-3 h-6 w-6 text-violet-400" />
            <CardTitle>26+ Free Providers</CardTitle>
            <CardDescription>
              Chinese models first — DeepSeek, Qwen, GLM, Kling, Wan, and more.
            </CardDescription>
          </Card>
        </div>
      </div>
    </div>
  );
}
