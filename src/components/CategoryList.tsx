"use client";

import { DndContext, closestCenter, useDroppable } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import { GripVertical } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Category = {
  id: number;
  name: string;
  parent_id: number | null;
  order: number;
  children?: Category[];
};

function DraggableItem({
  id,
  name,
  level,
}: {
  id: number;
  name: string;
  level: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: String(id) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 border rounded p-2 mb-2 bg-white shadow-sm"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="text-gray-400 cursor-grab" size={18} />
      <span style={{ paddingLeft: level * 20 }}>{name}</span>
    </div>
  );
}

// Droppable zone for a parent
function DroppableParent({
  id,
  children,
}: {
  id: number;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: `parent-${id}` });
  return (
    <div ref={setNodeRef} className="mb-2">
      {children}
    </div>
  );
}

export default function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function load() {
      const res = await apiFetch("/categories", { method: "GET" });
      setCategories(res);
    }
    load();
  }, []);

  async function handleDragEnd(event: any) {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    setCategories((prev) => {
      // flatten for easier lookup
      const all: Category[] = [];
      prev.forEach((p) => {
        all.push(p);
        if (p.children) all.push(...p.children);
      });

      const moved = { ...all.find((c) => c.id === Number(active.id))! };

      // 🔎 Case 1: dropped ON a parent container
      if (String(over.id).startsWith("parent-")) {
        const parentId = Number(String(over.id).replace("parent-", ""));
        moved.parent_id = parentId;
      }
      // 🔎 Case 2: dropped ON another category
      else {
        const target = all.find((c) => c.id === Number(over.id));
        if (target) {
          if (target.parent_id === null) {
            // target is a parent → moved becomes its child
            moved.parent_id = target.id;
          } else {
            // target is a child → moved adopts same parent
            moved.parent_id = target.parent_id;
          }
        }
      }

      // remove from old place & insert into new structure
      let newTree: Category[] = [];
      prev.forEach((p) => {
        // clean children
        const cleanParent: Category = { ...p, children: p.children ? [] : [] };

        if (p.children) {
          p.children.forEach((c) => {
            if (c.id !== moved.id) cleanParent.children!.push(c);
          });
        }
        if (p.id !== moved.id) newTree.push(cleanParent);
      });

      // re-insert moved
      if (moved.parent_id === null) {
        newTree.push(moved);
      } else {
        const parent = newTree.find((p) => p.id === moved.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(moved);
        }
      }

      // re-assign order
      const reassignOrder = (nodes: Category[]) => {
        nodes.forEach((n, idx) => {
          n.order = idx + 1;
          if (n.children) reassignOrder(n.children);
        });
      };
      reassignOrder(newTree);

      // 🔥 API sync async
      (async () => {
        try {
          const payload: any[] = [];
          const collect = (nodes: Category[]) => {
            nodes.forEach((n) => {
              payload.push({
                id: n.id,
                parent_id: n.parent_id,
                order: n.order,
              });
              if (n.children) collect(n.children);
            });
          };
          collect(newTree);

          await apiFetch("/categories/reorder", {
            method: "POST",
            body: JSON.stringify({ items: payload }),
          });
        } catch (err) {
          console.error("Reorder failed", err);
        }
      })();

      return newTree;
    });
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={categories.map((c) => String(c.id))}
        strategy={verticalListSortingStrategy}
      >
        {categories.map((parent) => (
          <DroppableParent key={parent.id} id={parent.id}>
            <DraggableItem id={parent.id} name={parent.name} level={0} />
            {parent.children?.map((child) => (
              <DraggableItem
                key={child.id}
                id={child.id}
                name={child.name}
                level={1}
              />
            ))}
          </DroppableParent>
        ))}
      </SortableContext>
    </DndContext>
  );
}
