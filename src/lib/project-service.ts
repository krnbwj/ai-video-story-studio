import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  assets,
  characters,
  episodes,
  projects,
  scenes,
  shots,
} from "@/db/schema";
import { generateId } from "@/lib/utils";

export async function getUserProjects(userId: string) {
  return db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt));
}

export async function getProjectForUser(projectId: string, userId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1);
  return project;
}

export async function createProject(
  userId: string,
  data: { title: string; description?: string; genre?: string; style?: string },
) {
  const id = generateId();
  const episodeId = generateId();
  const sceneId = generateId();

  await db.insert(projects).values({
    id,
    userId,
    title: data.title,
    description: data.description,
    genre: data.genre,
    style: data.style,
  });

  await db.insert(episodes).values({
    id: episodeId,
    projectId: id,
    title: "Episode 1",
    orderIndex: 0,
  });

  await db.insert(scenes).values({
    id: sceneId,
    episodeId,
    title: "Scene 1",
    description: "Opening scene",
    orderIndex: 0,
  });

  await db.insert(shots).values({
    id: generateId(),
    sceneId,
    title: "Shot 1",
    prompt: "Establishing shot of the story world.",
    providerId: "deepseek",
    orderIndex: 0,
  });

  return id;
}

export async function getProjectBundle(projectId: string, userId: string) {
  const project = await getProjectForUser(projectId, userId);
  if (!project) return null;

  const projectEpisodes = await db
    .select()
    .from(episodes)
    .where(eq(episodes.projectId, projectId))
    .orderBy(asc(episodes.orderIndex));

  const episodeIds = projectEpisodes.map((e) => e.id);
  const projectScenes =
    episodeIds.length === 0
      ? []
      : await db
          .select()
          .from(scenes)
          .where(eq(scenes.episodeId, episodeIds[0]))
          .orderBy(asc(scenes.orderIndex));

  const sceneIds = projectScenes.map((s) => s.id);
  const projectShots =
    sceneIds.length === 0
      ? []
      : await db
          .select()
          .from(shots)
          .where(eq(shots.sceneId, sceneIds[0]))
          .orderBy(asc(shots.orderIndex));

  const projectCharacters = await db
    .select()
    .from(characters)
    .where(eq(characters.projectId, projectId));

  const projectAssets = await db
    .select()
    .from(assets)
    .where(eq(assets.projectId, projectId))
    .orderBy(desc(assets.createdAt));

  return {
    project,
    episodes: projectEpisodes,
    scenes: projectScenes,
    shots: projectShots,
    characters: projectCharacters,
    assets: projectAssets,
  };
}
