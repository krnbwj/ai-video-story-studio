"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function AiGenerateButton({
  label = "Generate with AI",
  prompt,
  projectId,
  type = "script",
  onResult,
  disabled,
}: {
  label?: string;
  prompt: string;
  projectId?: string;
  type?: "script" | "outline" | "enhance";
  onResult: (text: string) => void;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState("");

  async function run() {
    if (!prompt.trim()) return;
    setLoading(true);
    setMeta("");
    try {
      const res = await fetch("/api/ai/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, projectId, type }),
      });
      const data = await res.json();
      if (data.text) {
        onResult(data.text);
        setMeta(`${data.providerId} · ${data.mode}`);
      } else {
        setMeta(data.error ?? "Generation failed");
      }
    } catch {
      setMeta("Network error");
    }
    setLoading(false);
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={run}
        disabled={disabled || loading || !prompt.trim()}
      >
        <Sparkles className="h-4 w-4" />
        {loading ? "Generating..." : label}
      </Button>
      {meta ? <span className="text-xs text-violet-300">{meta}</span> : null}
    </div>
  );
}
