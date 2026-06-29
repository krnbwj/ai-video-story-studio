"use client";

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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

function SortableShot({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <button
        type="button"
        className="absolute left-2 top-4 z-10 cursor-grab text-zinc-500 hover:text-zinc-300 active:cursor-grabbing"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="pl-8">{children}</div>
    </div>
  );
}

export function StoryboardDnd({
  shotIds,
  onReorder,
  children,
}: {
  shotIds: string[];
  onReorder: (orderedIds: string[]) => void;
  children: (shotId: string, index: number) => React.ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = shotIds.indexOf(String(active.id));
    const newIndex = shotIds.indexOf(String(over.id));
    onReorder(arrayMove(shotIds, oldIndex, newIndex));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={shotIds} strategy={verticalListSortingStrategy}>
        {shotIds.map((id, index) => (
          <SortableShot key={id} id={id}>
            {children(id, index)}
          </SortableShot>
        ))}
      </SortableContext>
    </DndContext>
  );
}
