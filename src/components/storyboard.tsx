"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { PROVIDER_DEFINITIONS } from "@/lib/providers/config";
import { Play, Sparkles } from "lucide-react";

interface Shot {
  id: string;
  title?: string | null;
  prompt?: string | null;
  providerId?: string | null;
  characterIds?: string | null;
  assetId?: string | null;
  status?: string | null;
}

interface Character {
  id: string;
  name: string;
  frozen?: boolean | null;
}

interface Asset {
  id: string;
  type: string;
  url?: string | null;
  prompt?: string | null;
}

export function Storyboard({ projectId }: { projectId: string }) {
  const [shots, setShots] = useState<Shot[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [autoRoute, setAutoRoute] = useState(true);
  const [routeInfo, setRouteInfo] = useState<Record<string, string>>({});
  const providers = PROVIDER_DEFINITIONS.filter((p) =>
    ["text", "image", "video"].includes(p.kind),
  );

  async function load() {
    const [bundleRes, charsRes] = await Promise.all([
      fetch(`/api/projects/${projectId}`),
      fetch(`/api/projects/${projectId}/characters`),
    ]);
    const bundle = await bundleRes.json();
    setShots(bundle.shots ?? []);
    setAssets(bundle.assets ?? []);
    setCharacters(await charsRes.json());
  }

  useEffect(() => {
    load();
  }, [projectId]);

  async function updateShot(shotId: string, updates: Record<string, unknown>) {
    await fetch(`/api/projects/${projectId}/shots`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shotId, ...updates }),
    });
    load();
  }

  async function generateShot(shot: Shot) {
    setGenerating(shot.id);
    const provider = providers.find((p) => p.id === shot.providerId) ?? providers[0];
    const res = await fetch(`/api/projects/${projectId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shotId: shot.id,
        providerId: shot.providerId ?? provider.id,
        kind: provider.kind,
        autoRoute,
      }),
    });
    const data = await res.json().catch(() => null);
    if (data?.providerId) {
      setRouteInfo((prev) => ({
        ...prev,
        [shot.id]: `${data.providerId} · ${data.mode}`,
      }));
    }
    setGenerating(null);
    load();
  }

  function assetForShot(shot: Shot) {
    return assets.find((a) => a.id === shot.assetId);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoRoute}
            onChange={(e) => setAutoRoute(e.target.checked)}
            className="h-4 w-4 accent-violet-600"
          />
          Smart routing (auto-pick best available free provider, fall back on failure)
        </label>
        <span className="text-xs text-zinc-500">
          Chinese-first · falls back to mock so nothing breaks
        </span>
      </div>
      {shots.map((shot, index) => {
        const asset = assetForShot(shot);
        const selectedChars = shot.characterIds
          ? JSON.parse(shot.characterIds)
          : [];

        return (
          <Card key={shot.id}>
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="flex-1">
                <CardTitle>
                  {shot.title ?? `Shot ${index + 1}`}
                </CardTitle>
                <textarea
                  className="mt-3 min-h-24 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm"
                  value={shot.prompt ?? ""}
                  onChange={(e) =>
                    setShots((prev) =>
                      prev.map((s) =>
                        s.id === shot.id ? { ...s, prompt: e.target.value } : s,
                      ),
                    )
                  }
                  onBlur={() => updateShot(shot.id, { prompt: shot.prompt })}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <select
                    className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
                    value={shot.providerId ?? "deepseek"}
                    onChange={(e) => updateShot(shot.id, { providerId: e.target.value })}
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label} ({p.kind})
                      </option>
                    ))}
                  </select>
                  {characters.map((c) => (
                    <Button
                      key={c.id}
                      size="sm"
                      variant={selectedChars.includes(c.id) ? "default" : "outline"}
                      onClick={() => {
                        const next = selectedChars.includes(c.id)
                          ? selectedChars.filter((id: string) => id !== c.id)
                          : [...selectedChars, c.id];
                        updateShot(shot.id, { characterIds: next });
                      }}
                    >
                      {c.name}
                    </Button>
                  ))}
                </div>
                {routeInfo[shot.id] ? (
                  <p className="mt-3 text-xs text-violet-300">
                    routed → {routeInfo[shot.id]}
                  </p>
                ) : null}
                <Button
                  className="mt-4"
                  onClick={() => generateShot(shot)}
                  disabled={generating === shot.id}
                >
                  <Sparkles className="h-4 w-4" />
                  {generating === shot.id ? "Generating..." : "Generate"}
                </Button>
              </div>
              <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                <CardDescription className="mb-2">Preview</CardDescription>
                {!asset ? (
                  <div className="flex h-40 items-center justify-center rounded-lg bg-zinc-950 text-zinc-500">
                    <Play className="h-8 w-8 opacity-40" />
                  </div>
                ) : asset.type === "image" && asset.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.url} alt="" className="rounded-lg" />
                ) : asset.type === "video" && asset.url ? (
                  <video src={asset.url} controls className="w-full rounded-lg" />
                ) : (
                  <pre className="max-h-40 overflow-auto text-xs text-zinc-300">
                    {asset.prompt}
                  </pre>
                )}
              </div>
            </div>
          </Card>
        );
      })}
      <Button
        variant="outline"
        onClick={async () => {
          const sceneId = shots[0]?.id
            ? (
                await (await fetch(`/api/projects/${projectId}`)).json()
              ).scenes?.[0]?.id
            : null;
          if (!sceneId) return;
          await fetch(`/api/projects/${projectId}/shots`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "create",
              sceneId,
              orderIndex: shots.length,
            }),
          });
          load();
        }}
      >
        Add shot
      </Button>
    </div>
  );
}
