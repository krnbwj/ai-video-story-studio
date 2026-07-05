"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  downloadEditorBundle,
  renderShortInBrowser,
  renderTimelineInBrowser,
  triggerBlobDownload,
} from "@/lib/editor/browser-render";
import {
  SHORT_PRESETS,
  type ClipEffect,
  type EditorState,
  type FilterPreset,
  type ShortCut,
  type ShortPreset,
  type TimelineClip,
} from "@/lib/editor/types";
import {
  buildTimelineFromShots,
  clipAtPlayhead,
  filterCssForClip,
  parseEditorData,
  speedForClip,
  textOverlayForClip,
  timelineDurationMs,
} from "@/lib/editor/utils";
import { generateId } from "@/lib/utils";
import {
  Download,
  Film,
  GripVertical,
  Import,
  Pause,
  Play,
  Save,
  Scissors,
  Sparkles,
  Trash2,
} from "lucide-react";

interface Asset {
  id: string;
  type: string;
  url?: string | null;
  prompt?: string | null;
  shotId?: string | null;
}

interface Shot {
  id: string;
  title?: string | null;
  durationSec?: number | null;
  orderIndex?: number | null;
  assetId?: string | null;
}

const PX_PER_SEC = 24;
const DEMO_VIDEO =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

function recalcClipStarts(clips: TimelineClip[]): TimelineClip[] {
  let cursor = 0;
  return clips.map((c) => {
    const next = { ...c, startMs: cursor };
    cursor += c.durationMs;
    return next;
  });
}

function SortableClip({
  clip,
  selected,
  onSelect,
}: {
  clip: TimelineClip;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: clip.id });

  const width = Math.max(48, (clip.durationMs / 1000) * PX_PER_SEC);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        width,
      }}
      className={`relative flex h-16 shrink-0 cursor-pointer flex-col justify-end rounded-lg border px-2 py-1 ${
        selected
          ? "border-violet-400 bg-violet-950/50 ring-1 ring-violet-400"
          : "border-zinc-700 bg-zinc-900/80 hover:border-zinc-500"
      }`}
      onClick={onSelect}
    >
      <button
        type="button"
        className="absolute left-1 top-1 cursor-grab text-zinc-500 hover:text-zinc-300 active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Drag clip"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="truncate text-xs font-medium text-zinc-200">
        {clip.label}
      </span>
      <span className="text-[10px] text-zinc-500">
        {(clip.durationMs / 1000).toFixed(1)}s
      </span>
    </div>
  );
}

export function VideoEditor({
  projectId,
  projectTitle,
  initialEditorData,
}: {
  projectId: string;
  projectTitle: string;
  initialEditorData?: string | null;
}) {
  const [editor, setEditor] = useState<EditorState>(() =>
    parseEditorData(initialEditorData),
  );
  const [assets, setAssets] = useState<Asset[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [playing, setPlaying] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [renderProgress, setRenderProgress] = useState<{
    pct: number;
    label: string;
  } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalMs = timelineDurationMs(editor.clips);
  const activeClip = clipAtPlayhead(editor.clips, editor.playheadMs);
  const selectedClip = editor.clips.find((c) => c.id === editor.selectedClipId);

  const loadBundle = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}`);
    const bundle = await res.json();
    setAssets(bundle.assets ?? []);
    setShots(bundle.shots ?? []);
    if (bundle.project?.editorData) {
      setEditor(parseEditorData(bundle.project.editorData));
    }
  }, [projectId]);

  useEffect(() => {
    loadBundle();
  }, [loadBundle]);

  const persist = useCallback(
    (state: EditorState) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveState("saving");
      saveTimer.current = setTimeout(async () => {
        await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ editorData: state }),
        });
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
      }, 600);
    },
    [projectId],
  );

  const updateEditor = useCallback(
    (updater: (prev: EditorState) => EditorState) => {
      setEditor((prev) => {
        const next = updater(prev);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  useEffect(() => {
    if (!playing || totalMs === 0) return;
    const id = setInterval(() => {
      updateEditor((prev) => {
        const nextMs = prev.playheadMs + 100;
        if (nextMs >= totalMs) {
          setPlaying(false);
          return { ...prev, playheadMs: 0 };
        }
        return { ...prev, playheadMs: nextMs };
      });
    }, 100);
    return () => clearInterval(id);
  }, [playing, totalMs, updateEditor]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeClip) return;
    const localMs = editor.playheadMs - activeClip.startMs + activeClip.inMs;
    const targetSec = (localMs / 1000) / speedForClip(activeClip);
    if (Math.abs(video.currentTime - targetSec) > 0.25) {
      video.currentTime = targetSec;
    }
    video.playbackRate = speedForClip(activeClip);
  }, [activeClip, editor.playheadMs]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing && activeClip?.type === "video") {
      void video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
  }, [playing, activeClip]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleClipReorder(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    updateEditor((prev) => {
      const ids = prev.clips.map((c) => c.id);
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      const reordered = arrayMove(prev.clips, oldIndex, newIndex);
      return {
        ...prev,
        clips: recalcClipStarts(reordered),
      };
    });
  }

  function addAssetToTimeline(asset: Asset) {
    if (!asset.url) return;
    const durationMs = 10_000;
    updateEditor((prev) => {
      const clip: TimelineClip = {
        id: generateId(),
        assetId: asset.id,
        url: asset.url!,
        label: asset.prompt?.slice(0, 40) || `${asset.type} clip`,
        type:
          asset.type === "audio"
            ? "audio"
            : asset.type === "image"
              ? "image"
              : "video",
        startMs: timelineDurationMs(prev.clips),
        inMs: 0,
        outMs: durationMs,
        durationMs,
        effects: [],
        volume: 1,
      };
      return {
        ...prev,
        clips: [...prev.clips, clip],
        selectedClipId: clip.id,
      };
    });
  }

  function importFromStoryboard() {
    const clips = buildTimelineFromShots(shots, assets);
    if (!clips.length) return;
    updateEditor((prev) => ({
      ...prev,
      clips,
      playheadMs: 0,
      selectedClipId: clips[0]?.id,
    }));
  }

  function updateSelectedClip(patch: Partial<TimelineClip>) {
    if (!editor.selectedClipId) return;
    updateEditor((prev) => ({
      ...prev,
      clips: recalcClipStarts(
        prev.clips.map((c) =>
          c.id === prev.selectedClipId ? { ...c, ...patch } : c,
        ),
      ),
    }));
  }

  function setClipEffect(effect: ClipEffect) {
    if (!editor.selectedClipId) return;
    updateEditor((prev) => ({
      ...prev,
      clips: prev.clips.map((c) => {
        if (c.id !== prev.selectedClipId) return c;
        const without = c.effects.filter((e) => e.type !== effect.type);
        return { ...c, effects: [...without, effect] };
      }),
    }));
  }

  function removeClipEffect(type: ClipEffect["type"]) {
    if (!editor.selectedClipId) return;
    updateEditor((prev) => ({
      ...prev,
      clips: prev.clips.map((c) =>
        c.id === prev.selectedClipId
          ? { ...c, effects: c.effects.filter((e) => e.type !== type) }
          : c,
      ),
    }));
  }

  function deleteSelectedClip() {
    if (!editor.selectedClipId) return;
    updateEditor((prev) => ({
      ...prev,
      clips: recalcClipStarts(
        prev.clips.filter((c) => c.id !== prev.selectedClipId),
      ),
      selectedClipId: undefined,
    }));
  }

  function addShort(preset: ShortPreset) {
    const maxDur = SHORT_PRESETS[preset].maxDurationMs;
    const durationMs = Math.min(60_000, maxDur, totalMs - editor.playheadMs);
    if (durationMs < 5_000) return;
    const cut: ShortCut = {
      id: generateId(),
      name: `${SHORT_PRESETS[preset].label} ${editor.shorts.length + 1}`,
      preset,
      startMs: editor.playheadMs,
      durationMs,
      aspectRatio: "9:16",
    };
    updateEditor((prev) => ({
      ...prev,
      shorts: [...prev.shorts, cut],
    }));
  }

  async function exportFullTimeline() {
    setRenderProgress({ pct: 0, label: "Starting…" });
    try {
      const blob = await renderTimelineInBrowser(
        editor,
        projectTitle,
        (pct, label) => setRenderProgress({ pct, label }),
      );
      triggerBlobDownload(blob, `${projectTitle.replace(/\s+/g, "_")}_timeline.mp4`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Render failed");
    } finally {
      setRenderProgress(null);
    }
  }

  async function exportShort(short: ShortCut) {
    setRenderProgress({ pct: 0, label: `Rendering ${short.name}…` });
    try {
      const blob = await renderShortInBrowser(
        editor,
        short.startMs,
        short.durationMs,
        (pct, label) => setRenderProgress({ pct, label }),
      );
      triggerBlobDownload(blob, `${short.preset}_${short.id}.mp4`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Short render failed");
    } finally {
      setRenderProgress(null);
    }
  }

  const previewUrl =
    activeClip?.type === "image"
      ? activeClip.url
      : activeClip?.type === "video"
        ? activeClip.url
        : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Film className="h-4 w-4 text-violet-400" />
          Timeline · {(totalMs / 1000).toFixed(1)}s · {editor.clips.length} clips
          {saveState === "saving" && (
            <span className="text-violet-400">Saving…</span>
          )}
          {saveState === "saved" && (
            <span className="flex items-center gap-1 text-emerald-400">
              <Save className="h-3 w-3" /> Saved
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={importFromStoryboard}>
            <Import className="h-4 w-4" />
            Import storyboard
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadEditorBundle(editor, projectTitle)}
          >
            <Download className="h-4 w-4" />
            Bundle (JSON + sh)
          </Button>
          <Button size="sm" onClick={exportFullTimeline} disabled={!editor.clips.length}>
            <Sparkles className="h-4 w-4" />
            Render in browser
          </Button>
        </div>
      </div>

      {renderProgress && (
        <div className="rounded-lg border border-violet-800/50 bg-violet-950/30 px-4 py-2 text-sm">
          <div className="mb-1 flex justify-between text-zinc-300">
            <span>{renderProgress.label}</span>
            <span>{Math.round(renderProgress.pct)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full bg-violet-500 transition-all"
              style={{ width: `${renderProgress.pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[220px_1fr_260px]">
        {/* Media bin */}
        <Card className="max-h-[520px] overflow-y-auto p-4">
          <CardTitle className="mb-1 text-base">Media bin</CardTitle>
          <CardDescription className="mb-3">
            Project assets — click to add
          </CardDescription>
          <div className="space-y-2">
            {assets.filter((a) => a.url).length === 0 && (
              <p className="text-xs text-zinc-500">
                No assets yet. Generate on storyboard or use demo URL below.
              </p>
            )}
            {assets
              .filter((a) => a.url)
              .map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => addAssetToTimeline(asset)}
                  className="flex w-full items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-2 py-2 text-left text-xs hover:border-violet-700"
                >
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 uppercase text-zinc-400">
                    {asset.type}
                  </span>
                  <span className="truncate text-zinc-200">
                    {asset.prompt?.slice(0, 36) || asset.id.slice(0, 8)}
                  </span>
                </button>
              ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() =>
                addAssetToTimeline({
                  id: generateId(),
                  type: "video",
                  url: DEMO_VIDEO,
                  prompt: "CC0 demo clip",
                })
              }
            >
              + Demo CC0 clip
            </Button>
          </div>
        </Card>

        {/* Preview + timeline */}
        <div className="space-y-3">
          <Card className="overflow-hidden p-0">
            <div className="relative aspect-video bg-black">
              {previewUrl && activeClip?.type === "video" ? (
                <video
                  ref={videoRef}
                  src={previewUrl}
                  className="h-full w-full object-contain"
                  style={{ filter: activeClip ? filterCssForClip(activeClip) : undefined }}
                  muted
                  playsInline
                />
              ) : previewUrl && activeClip?.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt={activeClip.label}
                  className="h-full w-full object-contain"
                  style={{ filter: filterCssForClip(activeClip) }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                  Add clips to preview
                </div>
              )}
              {activeClip && textOverlayForClip(activeClip) && (
                <div className="pointer-events-none absolute inset-x-0 bottom-8 text-center text-lg font-bold text-white drop-shadow-lg">
                  {textOverlayForClip(activeClip)}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 border-t border-zinc-800 px-4 py-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPlaying((p) => !p)}
                disabled={!editor.clips.length}
              >
                {playing ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <input
                type="range"
                min={0}
                max={Math.max(totalMs, 1)}
                value={editor.playheadMs}
                onChange={(e) =>
                  updateEditor((prev) => ({
                    ...prev,
                    playheadMs: Number(e.target.value),
                  }))
                }
                className="h-1.5 flex-1 accent-violet-500"
              />
              <span className="w-24 text-right font-mono text-xs text-zinc-400">
                {(editor.playheadMs / 1000).toFixed(1)} /{" "}
                {(totalMs / 1000).toFixed(1)}s
              </span>
            </div>
          </Card>

          <Card className="p-4">
            <CardTitle className="mb-3 text-base">Timeline</CardTitle>
            <div className="overflow-x-auto pb-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleClipReorder}
              >
                <SortableContext
                  items={editor.clips.map((c) => c.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  <div className="flex min-w-full gap-1">
                    {editor.clips.length === 0 ? (
                      <p className="text-sm text-zinc-500">
                        Drag clips from media bin or import storyboard shots.
                      </p>
                    ) : (
                      editor.clips.map((clip) => (
                        <SortableClip
                          key={clip.id}
                          clip={clip}
                          selected={clip.id === editor.selectedClipId}
                          onSelect={() =>
                            updateEditor((prev) => ({
                              ...prev,
                              selectedClipId: clip.id,
                            }))
                          }
                        />
                      ))
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            {selectedClip && (
              <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-200">
                    Trim · {selectedClip.label}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={deleteSelectedClip}
                    aria-label="Delete clip"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <label className="space-y-1">
                    <span className="text-zinc-500">In (ms)</span>
                    <Input
                      type="number"
                      min={0}
                      value={selectedClip.inMs}
                      onChange={(e) => {
                        const inMs = Math.max(0, Number(e.target.value));
                        const durationMs = Math.max(
                          500,
                          selectedClip.outMs - inMs,
                        );
                        updateSelectedClip({ inMs, durationMs });
                      }}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-zinc-500">Out (ms)</span>
                    <Input
                      type="number"
                      min={selectedClip.inMs + 500}
                      value={selectedClip.outMs}
                      onChange={(e) => {
                        const outMs = Number(e.target.value);
                        const durationMs = Math.max(500, outMs - selectedClip.inMs);
                        updateSelectedClip({ outMs, durationMs });
                      }}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-zinc-500">Duration (ms)</span>
                    <Input
                      type="number"
                      min={500}
                      value={selectedClip.durationMs}
                      onChange={(e) => {
                        const durationMs = Math.max(500, Number(e.target.value));
                        updateSelectedClip({
                          durationMs,
                          outMs: selectedClip.inMs + durationMs,
                        });
                      }}
                    />
                  </label>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Effects + Shorts */}
        <div className="space-y-4">
          <Card className="p-4">
            <CardTitle className="mb-1 text-base">Effects</CardTitle>
            <CardDescription className="mb-3">
              {selectedClip ? selectedClip.label : "Select a clip"}
            </CardDescription>
            {!selectedClip ? (
              <p className="text-xs text-zinc-500">Click a timeline clip.</p>
            ) : (
              <div className="space-y-3 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedClip.effects.some((e) => e.type === "fadeIn")}
                    onChange={(e) =>
                      e.target.checked
                        ? setClipEffect({ type: "fadeIn", durationMs: 500 })
                        : removeClipEffect("fadeIn")
                    }
                    className="accent-violet-600"
                  />
                  Fade in (500ms)
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedClip.effects.some((e) => e.type === "fadeOut")}
                    onChange={(e) =>
                      e.target.checked
                        ? setClipEffect({ type: "fadeOut", durationMs: 500 })
                        : removeClipEffect("fadeOut")
                    }
                    className="accent-violet-600"
                  />
                  Fade out (500ms)
                </label>
                <label className="block space-y-1">
                  <span className="text-zinc-400">Speed</span>
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={
                      selectedClip.effects.find((e) => e.type === "speed")?.rate ??
                      1
                    }
                    onChange={(e) =>
                      setClipEffect({
                        type: "speed",
                        rate: Number(e.target.value),
                      })
                    }
                    className="w-full accent-violet-500"
                  />
                  <span className="text-xs text-zinc-500">
                    {(
                      selectedClip.effects.find((e) => e.type === "speed")?.rate ?? 1
                    ).toFixed(1)}
                    x
                  </span>
                </label>
                <label className="block space-y-1">
                  <span className="text-zinc-400">Filter</span>
                  <select
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm"
                    value={
                      selectedClip.effects.find((e) => e.type === "filter")
                        ?.preset ?? ""
                    }
                    onChange={(e) => {
                      const v = e.target.value as FilterPreset | "";
                      if (v) setClipEffect({ type: "filter", preset: v });
                      else removeClipEffect("filter");
                    }}
                  >
                    <option value="">None</option>
                    <option value="vivid">Vivid</option>
                    <option value="cinematic">Cinematic</option>
                    <option value="bw">Black & white</option>
                    <option value="warm">Warm</option>
                    <option value="cool">Cool</option>
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-zinc-400">Text overlay</span>
                  <Input
                    placeholder="Title text…"
                    value={
                      selectedClip.effects.find((e) => e.type === "text")
                        ?.content ?? ""
                    }
                    onChange={(e) => {
                      const content = e.target.value;
                      if (content)
                        setClipEffect({
                          type: "text",
                          content,
                          position: "bottom",
                        });
                      else removeClipEffect("text");
                    }}
                  />
                </label>
              </div>
            )}
          </Card>

          <Card className="p-4">
            <CardTitle className="mb-1 flex items-center gap-2 text-base">
              <Scissors className="h-4 w-4 text-violet-400" />
              Shorts / Reels
            </CardTitle>
            <CardDescription className="mb-3">
              9:16 cuts from playhead (30–60s)
            </CardDescription>
            <div className="mb-3 flex flex-wrap gap-1">
              {(Object.keys(SHORT_PRESETS) as ShortPreset[]).map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => addShort(preset)}
                  disabled={totalMs < 5_000}
                >
                  + {SHORT_PRESETS[preset].label}
                </Button>
              ))}
            </div>
            <div className="space-y-2">
              {editor.shorts.length === 0 && (
                <p className="text-xs text-zinc-500">No shorts yet.</p>
              )}
              {editor.shorts.map((short) => (
                <div
                  key={short.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-2 py-2 text-xs"
                >
                  <div className="font-medium text-zinc-200">{short.name}</div>
                  <div className="text-zinc-500">
                    {(short.startMs / 1000).toFixed(0)}s ·{" "}
                    {(short.durationMs / 1000).toFixed(0)}s · {short.preset}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => exportShort(short)}
                  >
                    Render short
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
