"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const steps = ["Basics", "References", "Story", "Look", "Generate"];

export function CreateWizard({ projectId }: { projectId?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("Drama");
  const [style, setStyle] = useState("Cinematic");
  const [storyOutline, setStoryOutline] = useState("");
  const [loading, setLoading] = useState(false);

  async function finish() {
    setLoading(true);
    if (!projectId) {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, genre, style }),
      });
      const data = await res.json();
      router.push(`/projects/${data.id}/characters`);
      return;
    }
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: storyOutline || description,
        genre,
        style,
        wizardStep: 5,
      }),
    });
    router.push(`/projects/${projectId}/storyboard`);
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {steps.map((label, i) => (
          <div
            key={label}
            className={`rounded-full px-4 py-1 text-sm ${
              i === step
                ? "bg-violet-600 text-white"
                : i < step
                  ? "bg-violet-900/50 text-violet-200"
                  : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {i + 1}. {label}
          </div>
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
              <Input placeholder="Project title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Input
                placeholder="Short description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Input placeholder="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} />
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <CardTitle>Character references</CardTitle>
            <CardDescription className="mb-4">
              Next you&apos;ll freeze character profiles with images and descriptions.
            </CardDescription>
            <p className="text-sm text-zinc-400">
              After finishing the wizard, open the Characters tab to upload references and lock profiles.
            </p>
          </>
        )}
        {step === 2 && (
          <>
            <CardTitle>Story outline</CardTitle>
            <textarea
              className="mt-3 min-h-40 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm"
              placeholder="Episode arc, scenes, beats..."
              value={storyOutline}
              onChange={(e) => setStoryOutline(e.target.value)}
            />
          </>
        )}
        {step === 3 && (
          <>
            <CardTitle>Look & style</CardTitle>
            <div className="mt-3 space-y-3">
              <Input placeholder="Visual style" value={style} onChange={(e) => setStyle(e.target.value)} />
              <Input placeholder="Aspect ratio" defaultValue="16:9" readOnly />
            </div>
          </>
        )}
        {step === 4 && (
          <>
            <CardTitle>Ready to generate</CardTitle>
            <CardDescription className="mt-2">
              Connect providers on the Connections page, then generate shots from the storyboard.
            </CardDescription>
          </>
        )}

        <div className="mt-6 flex justify-between">
          <Button
            variant="outline"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={step === 0 && !title}>
              Continue
            </Button>
          ) : (
            <Button onClick={finish} disabled={loading || !title}>
              {loading ? "Creating..." : projectId ? "Save & open storyboard" : "Create project"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
