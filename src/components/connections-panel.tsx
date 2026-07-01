"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

interface Provider {
  id: string;
  label: string;
  kind: string;
  origin: string;
  free: boolean;
  status: string;
  connected?: boolean;
  signupUrl?: string;
  description?: string;
  envKey?: string;
}

interface PingState {
  loading?: boolean;
  ok?: boolean;
  status?: string;
  message?: string;
}

export function ConnectionsPanel() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [pings, setPings] = useState<Record<string, PingState>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  async function load() {
    const res = await fetch("/api/connections");
    const data = await res.json();
    setProviders(data.providers ?? []);
    const connected: Record<string, boolean> = {};
    for (const p of data.providers ?? []) {
      if (p.connected) connected[p.id] = true;
    }
    setSaved(connected);
  }

  useEffect(() => {
    load();
  }, []);

  async function testKey(providerId: string) {
    const apiKey = keys[providerId]?.trim();
    if (!apiKey) {
      setPings((p) => ({
        ...p,
        [providerId]: { ok: false, message: "Enter an API key first" },
      }));
      return null;
    }
    setPings((p) => ({ ...p, [providerId]: { loading: true } }));
    const res = await fetch("/api/connections/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerId, apiKey }),
    });
    const data = await res.json();
    setPings((p) => ({ ...p, [providerId]: { ...data, loading: false } }));
    return data;
  }

  async function saveKey(providerId: string) {
    const apiKey = keys[providerId]?.trim();
    if (!apiKey) return;

    const prior = pings[providerId];
    let pingOk = prior?.ok === true;

    if (!pingOk) {
      const result = await testKey(providerId);
      pingOk = result?.ok === true;
    }

    if (!pingOk) return;

    const res = await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerId, apiKey, skipPing: true }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setPings((p) => ({
        ...p,
        [providerId]: {
          ok: false,
          message: data.error ?? "Failed to save connection",
        },
      }));
      return;
    }
    setSaved((s) => ({ ...s, [providerId]: true }));
    if (data.providers) setProviders(data.providers);
    setPings((p) => ({
      ...p,
      [providerId]: { ok: true, message: data.message ?? "Connected & saved" },
    }));
  }

  const cnProviders = providers.filter((p) => p.origin === "cn");
  const globalProviders = providers.filter((p) => p.origin === "global");

  function renderGroup(title: string, items: Provider[]) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((provider) => (
            <Card
              key={provider.id}
              className={
                saved[provider.id] || provider.connected
                  ? "border-green-500/40"
                  : undefined
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {provider.label}
                    {saved[provider.id] || provider.connected ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    ) : null}
                  </CardTitle>
                  <CardDescription>{provider.description}</CardDescription>
                  <p className="mt-2 text-xs text-zinc-500">
                    {provider.kind} · {provider.envKey} ·{" "}
                    <span
                      className={
                        provider.status === "live" || saved[provider.id]
                          ? "text-green-400"
                          : "text-amber-400"
                      }
                    >
                      {saved[provider.id] || provider.connected
                        ? "connected"
                        : provider.status}
                    </span>
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Input
                  className="min-w-[200px] flex-1"
                  placeholder="API key"
                  type="password"
                  value={keys[provider.id] ?? ""}
                  onChange={(e) =>
                    setKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))
                  }
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testKey(provider.id)}
                  disabled={pings[provider.id]?.loading}
                >
                  {pings[provider.id]?.loading ? "Testing..." : "Test"}
                </Button>
                <Button size="sm" onClick={() => saveKey(provider.id)}>
                  Connect
                </Button>
              </div>
              {pings[provider.id] && !pings[provider.id]?.loading ? (
                <p
                  className={`mt-2 text-xs ${
                    pings[provider.id]?.ok ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {pings[provider.id]?.message}
                </p>
              ) : null}
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
        Test your key, then Connect to save it to your account. Server env keys
        (e.g. DeepSeek fallback) also count as live.
      </p>
      {renderGroup("Chinese providers (priority)", cnProviders)}
      {renderGroup("Global providers", globalProviders)}
    </div>
  );
}
