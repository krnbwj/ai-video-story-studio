"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { AiGenerateButton } from "@/components/ai-generate-button";

const steps = ["Basics", "References", "Story", "Look", "Generate"];
const DRAFT_KEY = "studio-wizard-draft";

export interface WizardInitial {
  title?: string;
  description?: string | null;
  genre?: string | null;
  style?: string | null;
  wizardStep?: number | null;
  wizardData?: string | null;
}

export function CreateWizard({
  projectId: initialProjectId,
  initial,
}: {
  projectId?: string;
  initial?: WizardInitial;
}) {
  const router = useRouter();
  const [projectId, setProjectId] = useState(initialProjectId);
  const [step, setStep] = useState((initial?.wizardStep ?? 1) - 1);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [genre, setGenre] = useState(initial?.genre ?? "Drama");
  const [style, setStyle] = useState(initial?.style ?? "Cinematic");
  const [storyOutline, setStoryOutline] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveNote, setSaveNote] = useState("");

  useEffect(() => {
    if (initial?.wizardData) {
      try {
        const data = JSON.parse(initial.wizardData);
        if (data.storyOutline) setStoryOutline(data.storyOutline);
        if (data.description) setDescription(data.description);
      } catch {
        // ignore
      }
    } else if (!initialProjectId) {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        try {
          const d = JSON.parse(raw);
          setTitle(d.title ?? "");
          setDescription(d.description ?? "");
          setGenre(d.genre ?? "Drama");
          setStyle(d.style ?? "Cinematic");
          setStoryOutline(d.storyOutline ?? "");
          setStep(d.step ?? 0);
        } catch {
          // ignore
        }
      }
    }
  }, [initial?.wizardData, initialProjectId]);

  const sessionPayload = useCallback(
    () => ({
      title,
      description,
      genre,
      style,
      storyOutline,
      step,
    }),
    [title, description, genre, style, storyOutline, step],
  );

  const persistSession = useCallback(async () => {
    const payload = sessionPayload();
    if (!projectId) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      setSaveNote("Draft saved locally");
      return;
    }
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        genre,
        style,
        wizardStep: step + 1,
        wizardData: JSON.stringify({ storyOutline, description }),
        updatedAt: new Date().toISOString(),
      }),
    });
    setSaveNote("Session saved");
  }, [projectId, sessionPayload, title, description, genre, style, step, storyOutline]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (title || storyOutline) persistSession();
    }, 800);
    return () => clearTimeout(t);
  }, [title, description, genre, style, storyOutline, step, persistSession]);

  async function ensureProject(): Promise<string | undefined> {
    if (projectId) return projectId;
    if (!title.trim()) return undefined;
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, genre, style }),
    });
    const data = await res.json();
    if (data.id) {
      setProjectId(data.id);
      localStorage.removeItem(DRAFT_KEY);
      router.replace(`/projects/${data.id}/create`);
      return data.id;
    }
    return undefined;
  }

  async function goToStep(index: number) {
    if (index > 0 && !projectId && title.trim()) {
      await ensureProject();
    }
    setStep(index);
  }

  async function finish() {
    setLoading(true);
    const id = projectId ?? (await ensureProject());
    if (!id) {
      setLoading(false);
      return;
    }
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: storyOutline || description,
        genre,
        style,
        wizardStep: 5,
        wizardData: JSON.stringify({ storyOutline, description }),
      }),
    });
    router.push(`/projects/${id}/storyboard`);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          Click any step to jump · auto-saves as you type
        </p>
        {saveNote ? (
          <span className="text-xs text-green-400">{saveNote}</span>
        ) : null}
      </div>
      <div className="mb-8 flex flex-wrap gap-2">
        {steps.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => goToStep(i)}
            className={`rounded-full px-4 py-1 text-sm transition ${
              i === step
                ? "bg-violet-600 text-white"
                : i < step
                  ? "bg-violet-900/50 text-violet-200 hover:bg-violet-800/60"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      <Card>
        {step === 0 && (
          <>
            <CardTitle>Name your show</CardTitle>
            <CardDescription className="mb-4">
              Start with the basics — you can always refine later.
            </CardDescription>
            <div className="space-y-3">
              <Input
                placeholder="Project title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Input
                placeholder="Short description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Input
                placeholder="Genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              />
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <CardTitle>Character references</CardTitle>
            <CardDescription className="mb-4">
              Freeze character profiles with images and descriptions for consistent
              video generations.
            </CardDescription>
            {projectId ? (
              <Button asChild variant="outline">
                <a href={`/projects/${projectId}/characters`}>Open Characters →</a>
              </Button>
            ) : (
              <p className="text-sm text-zinc-400">
                Enter a title on Basics first — a project will be created automatically.
              </p>
            )}
          </>
        )}
        {step === 2 && (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Story outline</CardTitle>
              <AiGenerateButton
                label="AI: Write outline"
                type="outline"
                projectId={projectId}
                prompt={`Title: ${title}\nGenre: ${genre}\nDescription: ${description}\n\nWrite a detailed episode outline with scenes and beats.`}
                onResult={setStoryOutline}
              />
            </div>
            <textarea
              className="mt-3 min-h-48 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm"
              placeholder="Episode arc, scenes, beats..."
              value={storyOutline}
              onChange={(e) => setStoryOutline(e.target.value)}
            />
            <div className="mt-3">
              <AiGenerateButton
                label="AI: Expand to full script beats"
                type="script"
                projectId={projectId}
                prompt={storyOutline || description}
                onResult={(text) =>
                  setStoryOutline((prev) => (prev ? `${prev}\n\n${text}` : text))
                }
                disabled={!storyOutline && !description}
              />
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <CardTitle>Look & style</CardTitle>
            <div className="mt-3 space-y-3">
              <Input
                placeholder="Visual style"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              />
              <Input placeholder="Aspect ratio" defaultValue="16:9" readOnly />
            </div>
            <div className="mt-4">
              <AiGenerateButton
                label="AI: Suggest visual style"
                type="enhance"
                projectId={projectId}
                prompt={`Genre: ${genre}\nStory: ${storyOutline || description}\nSuggest a cinematic visual style bible.`}
                onResult={setStyle}
              />
            </div>
          </>
        )}
        {step === 4 && (
          <>
            <CardTitle>Ready to generate</CardTitle>
            <CardDescription className="mt-2">
              Connect providers on the Connections page, then generate shots from the
              storyboard. DeepSeek is used for scripts; video providers route
              automatically.
            </CardDescription>
            {projectId ? (
              <div className="mt-4 flex gap-2">
                <Button asChild>
                  <a href={`/projects/${projectId}/storyboard`}>Open Storyboard →</a>
                </Button>
                <Button asChild variant="outline">
                  <a href="/connections">Connect providers →</a>
                </Button>
              </div>
            ) : null}
          </>
        )}

        <div className="mt-6 flex justify-between">
          <Button
            variant="outline"
            disabled={step === 0}
            onClick={() => goToStep(step - 1)}
          >
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button
              onClick={async () => {
                if (step === 0 && title.trim()) await ensureProject();
                goToStep(step + 1);
              }}
              disabled={step === 0 && !title}
            >
              Continue
            </Button>
          ) : (
            <Button onClick={finish} disabled={loading || !title}>
              {loading ? "Saving..." : "Save & open storyboard"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
