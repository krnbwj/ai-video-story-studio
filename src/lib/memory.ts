import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { storyMemory } from "@/db/schema";
import { generateId } from "@/lib/utils";

export type MemoryKind =
  | "bible" // world/setting facts, tone, rules
  | "continuity" // established facts that must persist (e.g. "Mara lost her arm in S1")
  | "arc" // character arc / development notes
  | "timeline" // chronological events
  | "style"; // visual / narrative style anchors

export interface MemoryEntry {
  id: string;
  kind: string;
  key: string;
  value: string;
  importance: number | null;
  sceneId?: string | null;
  characterId?: string | null;
}

export async function getMemory(projectId: string): Promise<MemoryEntry[]> {
  return db
    .select()
    .from(storyMemory)
    .where(eq(storyMemory.projectId, projectId))
    .orderBy(desc(storyMemory.importance), desc(storyMemory.updatedAt));
}

export async function addMemory(
  projectId: string,
  entry: {
    kind: MemoryKind | string;
    key: string;
    value: string;
    importance?: number;
    sceneId?: string;
    characterId?: string;
  },
) {
  const id = generateId();
  await db.insert(storyMemory).values({
    id,
    projectId,
    kind: entry.kind,
    key: entry.key,
    value: entry.value,
    importance: entry.importance ?? 5,
    sceneId: entry.sceneId,
    characterId: entry.characterId,
  });
  return id;
}

export async function updateMemory(
  id: string,
  updates: { key?: string; value?: string; importance?: number },
) {
  await db
    .update(storyMemory)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(storyMemory.id, id));
}

export async function deleteMemory(id: string) {
  await db.delete(storyMemory).where(eq(storyMemory.id, id));
}

export async function getCharacterMemory(
  projectId: string,
  characterId: string,
) {
  return db
    .select()
    .from(storyMemory)
    .where(
      and(
        eq(storyMemory.projectId, projectId),
        eq(storyMemory.characterId, characterId),
      ),
    );
}

/**
 * Builds a compact, prompt-ready continuity context from the project's memory.
 * Highest-importance entries first; budgeted to avoid blowing the token window.
 */
export function buildMemoryContext(
  entries: MemoryEntry[],
  opts: { maxEntries?: number; maxChars?: number } = {},
): string {
  const maxEntries = opts.maxEntries ?? 24;
  const maxChars = opts.maxChars ?? 2400;

  const ordered = [...entries].sort(
    (a, b) => (b.importance ?? 0) - (a.importance ?? 0),
  );

  const grouped: Record<string, string[]> = {};
  let used = 0;
  let count = 0;

  for (const e of ordered) {
    if (count >= maxEntries) break;
    const line = `- ${e.key}: ${e.value}`;
    if (used + line.length > maxChars) continue;
    grouped[e.kind] = grouped[e.kind] ?? [];
    grouped[e.kind].push(line);
    used += line.length;
    count += 1;
  }

  const sectionTitles: Record<string, string> = {
    bible: "STORY BIBLE",
    continuity: "CONTINUITY (must remain true)",
    arc: "CHARACTER ARCS",
    timeline: "TIMELINE",
    style: "STYLE ANCHORS",
  };

  const sections = Object.entries(grouped).map(
    ([kind, lines]) =>
      `${sectionTitles[kind] ?? kind.toUpperCase()}:\n${lines.join("\n")}`,
  );

  return sections.join("\n\n");
}
