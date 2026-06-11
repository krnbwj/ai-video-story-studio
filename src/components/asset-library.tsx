"use client";

import { useEffect, useState } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

interface Asset {
  id: string;
  type: string;
  providerId?: string | null;
  prompt?: string | null;
  url?: string | null;
  createdAt?: number;
}

export function AssetLibrary({ projectId }: { projectId: string }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((data) => setAssets(data.assets ?? []));
  }, [projectId]);

  const filtered =
    filter === "all" ? assets : assets.filter((a) => a.type === filter);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {["all", "image", "video", "audio", "text"].map((type) => (
          <button
            key={type}
            className={`rounded-full px-3 py-1 text-sm capitalize ${
              filter === type ? "bg-violet-600" : "bg-zinc-800"
            }`}
            onClick={() => setFilter(type)}
          >
            {type}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((asset) => (
          <Card key={asset.id}>
            <CardTitle className="capitalize">{asset.type}</CardTitle>
            <CardDescription>{asset.providerId}</CardDescription>
            {asset.type === "image" && asset.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={asset.url} alt="" className="mt-3 rounded-lg" />
            ) : asset.type === "video" && asset.url ? (
              <video src={asset.url} controls className="mt-3 w-full rounded-lg" />
            ) : (
              <pre className="mt-3 max-h-32 overflow-auto text-xs text-zinc-400">
                {asset.prompt}
              </pre>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
