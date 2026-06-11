"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Lock, Unlock } from "lucide-react";

interface Character {
  id: string;
  name: string;
  description?: string | null;
  traits?: string | null;
  gender?: string | null;
  age?: string | null;
  frozen?: boolean | null;
  seed?: string | null;
}

export function CharacterManager({ projectId }: { projectId: string }) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [traits, setTraits] = useState("");

  async function load() {
    const res = await fetch(`/api/projects/${projectId}/characters`);
    setCharacters(await res.json());
  }

  useEffect(() => {
    load();
  }, [projectId]);

  async function addCharacter() {
    await fetch(`/api/projects/${projectId}/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, traits, frozen: true }),
    });
    setName("");
    setDescription("");
    setTraits("");
    load();
  }

  async function toggleFreeze(character: Character) {
    await fetch(`/api/projects/${projectId}/characters`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        characterId: character.id,
        frozen: !character.frozen,
      }),
    });
    load();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Add character</CardTitle>
        <CardDescription className="mb-4">
          Freeze profiles so every shot reuses the same description and references.
        </CardDescription>
        <div className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input placeholder="Traits" value={traits} onChange={(e) => setTraits(e.target.value)} />
        </div>
        <Button className="mt-4" onClick={addCharacter} disabled={!name}>
          Add & freeze character
        </Button>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {characters.map((character) => (
          <Card key={character.id}>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{character.name}</CardTitle>
                <CardDescription className="mt-2">
                  {character.description}
                </CardDescription>
                <p className="mt-2 text-xs text-zinc-500">
                  {character.traits} · seed {character.seed}
                </p>
              </div>
              <Button
                size="sm"
                variant={character.frozen ? "default" : "outline"}
                onClick={() => toggleFreeze(character)}
              >
                {character.frozen ? (
                  <>
                    <Lock className="h-3 w-3" /> Frozen
                  </>
                ) : (
                  <>
                    <Unlock className="h-3 w-3" /> Unlocked
                  </>
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
