import type { DragEvent } from "react";
import { TRASH, useFs } from "../os/fs";
import { notify } from "../os/notify";

/** File drag and drop shared by Finder, the Desktop and the Dock's Trash. */
const DRAG_TYPE = "application/x-vfs";

interface DragPayload {
  ids: string[];
  x: number;
  y: number;
}

export function startDrag(e: DragEvent, ids: string[]) {
  e.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ ids, x: e.clientX, y: e.clientY }));
  e.dataTransfer.effectAllowed = "copyMove";
}

export const readDrag = (e: DragEvent): DragPayload | null => {
  const raw = e.dataTransfer.getData(DRAG_TYPE);
  return raw ? (JSON.parse(raw) as DragPayload) : null;
};

export function allowDrop(e: DragEvent) {
  if (e.dataTransfer.types.includes(DRAG_TYPE) || e.dataTransfer.types.includes("Files")) e.preventDefault();
}

/** Runs a file operation, reporting failures (name clashes, invalid moves) as a notification. */
export function attempt(action: () => void) {
  try {
    action();
  } catch (err) {
    notify("finder", "The operation can’t be completed", (err as Error).message);
  }
}

/** Moves dragged VFS nodes into a folder (or the Trash), or imports files dropped from the host OS. */
export async function dropInto(e: DragEvent, folderId: string): Promise<string[]> {
  e.preventDefault();
  e.stopPropagation();
  const fs = useFs.getState();
  const payload = readDrag(e);
  if (!payload) return Promise.all([...e.dataTransfer.files].map((file) => fs.importFile(folderId, file)));
  for (const id of payload.ids) {
    if (folderId === TRASH) attempt(() => fs.trash(id));
    else if (fs.nodes[id]?.parentId !== folderId) attempt(() => fs.move(id, folderId));
  }
  return payload.ids;
}
