"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Brain, Trash2 } from "lucide-react";

interface MemoryEntry {
  id: string;
  kind: string;
  key: string;
  value: string;
  importance: number | null;
}

const KINDS = [
  { id: "bible", label: "Story Bible" },
  { id: "continuity", label: "Continuity" },
  { id: "arc", label: "Character Arc" },
  { id: "timeline", label: "Timeline" },
  { id: "style", label: "Style Anchor" },
];

export function MemoryManager({ projectId }: { projectId: string }) {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [kind, setKind] = useState("continuity");
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [importance, setImportance] = useState(5);

  async function load() {
    const res = await fetch(`/api/projects/${projectId}/memory`);
    setEntries(await res.json());
  }

  useEffect(() => {
    load();
  }, [projectId]);

  async function add() {
    if (!key || !value) return;
    await fetch(`/api/projects/${projectId}/memory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, key, value, importance }),
    });
    setKey("");
    setValue("");
    load();
  }

  async function remove(memoryId: string) {
    await fetch(`/api/projects/${projectId}/memory?memoryId=${memoryId}`, {
      method: "DELETE",
    });
    load();
  }

  const grouped = KINDS.map((k) => ({
    ...k,
    items: entries.filter((e) => e.kind === k.id),
  }));

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-violet-400" />
          <CardTitle>Memory layer</CardTitle>
        </div>
        <CardDescription className="mb-4 mt-1">
          Facts stored here are injected into every generation so your story,
          characters, and continuity stay consistent across shots and episodes.
        </CardDescription>
        <div className="grid gap-3 md:grid-cols-[160px_1fr_1fr_120px_auto]">
          <select
            className="h-10 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
          <Input
            placeholder="Key (e.g. Mara's scar)"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <Input
            placeholder="Value (e.g. left cheek, from S1E3 fire)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <Input
            type="number"
            min={1}
            max={10}
            value={importance}
            onChange={(e) => setImportance(Number(e.target.value))}
          />
          <Button onClick={add} disabled={!key || !value}>
            Add
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {grouped.map((group) => (
          <Card key={group.id}>
            <CardTitle className="text-base">{group.label}</CardTitle>
            {group.items.length === 0 ? (
              <CardDescription className="mt-2">No entries yet.</CardDescription>
            ) : (
              <ul className="mt-3 space-y-2">
                {group.items.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{entry.key}</p>
                      <p className="text-sm text-zinc-400">{entry.value}</p>
                      <span className="text-xs text-zinc-600">
                        importance {entry.importance}
                      </span>
                    </div>
                    <button
                      onClick={() => remove(entry.id)}
                      className="text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
