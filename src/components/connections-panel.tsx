"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

interface Provider {
  id: string;
  label: string;
  kind: string;
  origin: string;
  free: boolean;
  status: string;
  signupUrl?: string;
  description?: string;
  envKey?: string;
}

export function ConnectionsPanel() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [keys, setKeys] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/connections")
      .then((r) => r.json())
      .then((data) => setProviders(data.providers ?? []));
  }, []);

  async function saveKey(providerId: string) {
    await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerId, apiKey: keys[providerId] }),
    });
    const res = await fetch("/api/connections");
    const data = await res.json();
    setProviders(data.providers ?? []);
  }

  const cnProviders = providers.filter((p) => p.origin === "cn");
  const globalProviders = providers.filter((p) => p.origin === "global");

  function renderGroup(title: string, items: Provider[]) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((provider) => (
            <Card key={provider.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{provider.label}</CardTitle>
                  <CardDescription>{provider.description}</CardDescription>
                  <p className="mt-2 text-xs text-zinc-500">
                    {provider.kind} · {provider.envKey} ·{" "}
                    <span
                      className={
                        provider.status === "live"
                          ? "text-green-400"
                          : "text-amber-400"
                      }
                    >
                      {provider.status}
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Input
                  placeholder="API key"
                  value={keys[provider.id] ?? ""}
                  onChange={(e) =>
                    setKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))
                  }
                />
                <Button size="sm" onClick={() => saveKey(provider.id)}>
                  Connect
                </Button>
              </div>
              {provider.signupUrl ? (
                <a
                  href={provider.signupUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs text-violet-400 hover:underline"
                >
                  Get free key →
                </a>
              ) : null}
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <p className="text-zinc-400">
        Without keys, all providers run in mock mode so you can test the full flow locally.
      </p>
      {renderGroup("Chinese providers (priority)", cnProviders)}
      {renderGroup("Global providers", globalProviders)}
    </div>
  );
}
