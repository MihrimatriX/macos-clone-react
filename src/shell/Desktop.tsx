import { type DragEvent, type KeyboardEvent, type MouseEvent, type PointerEvent, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { children, DESKTOP, type FsNode, uniqueName, useFs } from "../os/fs";
import { cmdHeld } from "../os/hotkeys";
import { useIsDark, useSettings } from "../os/settings";
import { useSystem } from "../os/system";
import { WALLPAPERS } from "../os/wallpapers";
import { openNode, useWindows } from "../os/windows";
import { allowDrop, attempt, dropInto, readDrag, startDrag } from "../ui/dnd";
import { FileIcon } from "../ui/FileIcon";
import { MENU_H } from "./Window";

const CELL = 104;
const ICON = { w: 92, h: 100 };

/** Default grid slot: columns fill top-to-bottom from the right edge, like Finder's desktop. */
function slot(i: number) {
  const rows = Math.max(1, Math.floor((window.innerHeight - MENU_H - 110) / CELL));
  return { x: window.innerWidth - 104 - Math.floor(i / rows) * CELL, y: MENU_H + 12 + (i % rows) * CELL };
}

type Band = { x0: number; y0: number; x1: number; y1: number };

const inBand = (pos: { x: number; y: number }, b: Band) =>
  pos.x < Math.max(b.x0, b.x1) &&
  pos.x + ICON.w > Math.min(b.x0, b.x1) &&
  pos.y < Math.max(b.y0, b.y1) &&
  pos.y + ICON.h > Math.min(b.y0, b.y1);

const SORTS: Record<string, (a: FsNode, b: FsNode) => number> = {
  Name: (a, b) => a.name.localeCompare(b.name),
  Kind: (a, b) => a.mime.localeCompare(b.mime) || a.name.localeCompare(b.name),
  "Date Modified": (a, b) => b.modifiedAt - a.modifiedAt,
};

export function Desktop() {
  const items = useFs(useShallow((s) => children(s.nodes, DESKTOP)));
  const wallpaper = useSettings((s) => WALLPAPERS[s.wallpaper] ?? WALLPAPERS[0]);
  const dark = useIsDark();
  const [selected, setSelected] = useState<string[]>([]);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [band, setBand] = useState<Band | null>(null);
  const fs = useFs.getState();
  const { openContextMenu } = useSystem.getState();
  const { open } = useWindows.getState();

  let free = 0;
  const placed = items.map((node) => ({ node, pos: node.pos ?? slot(free++) }));

  const newFolder = (at: { x: number; y: number }) => {
    const id = fs.create(DESKTOP, uniqueName(fs.nodes, DESKTOP, "untitled folder"), "dir");
    fs.setPos(id, { x: at.x - ICON.w / 2, y: at.y - 30 });
    setSelected([id]);
    setRenaming(id);
  };

  const sortBy = (key: string) =>
    [...items].sort(SORTS[key]).forEach((node, i) => {
      fs.setPos(node.id, slot(i));
    });

  const backgroundMenu = (e: MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    const at = { x: e.clientX, y: e.clientY };
    openContextMenu(e, [
      { label: "New Folder", onSelect: () => newFolder(at) },
      { label: "Get Info", onSelect: () => open("info", { fileId: DESKTOP }) },
      { label: "Change Wallpaper…", onSelect: () => open("settings", { pane: "Wallpaper" }) },
      "sep",
      ...Object.keys(SORTS).map((key) => ({ label: `Sort by ${key}`, onSelect: () => sortBy(key) })),
    ]);
  };

  const iconMenu = (e: MouseEvent, node: FsNode) => {
    e.stopPropagation();
    if (!selected.includes(node.id)) setSelected([node.id]);
    openContextMenu(e, [
      { label: "Open", onSelect: () => openNode(node.id) },
      { label: "Get Info", onSelect: () => open("info", { fileId: node.id }) },
      { label: "Rename", onSelect: () => setRenaming(node.id) },
      "sep",
      { label: "Move to Trash", onSelect: () => fs.trash(node.id) },
    ]);
  };

  const onDrop = async (e: DragEvent) => {
    const payload = readDrag(e);
    const dropped = (ids: string[]) =>
      ids.forEach((id, k) => {
        fs.setPos(id, { x: e.clientX - ICON.w / 2 + k * 20, y: e.clientY - 30 + k * 20 });
      });
    if (!payload) return dropped(await dropInto(e, DESKTOP));
    e.preventDefault();
    for (const { node, pos } of placed.filter((p) => payload.ids.includes(p.node.id)))
      fs.setPos(node.id, { x: pos.x + e.clientX - payload.x, y: pos.y + e.clientY - payload.y });
    const incoming = payload.ids.filter((id) => fs.nodes[id] && fs.nodes[id]?.parentId !== DESKTOP);
    for (const id of incoming) attempt(() => fs.move(id, DESKTOP));
    dropped(incoming);
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.target !== e.currentTarget || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    // Clicking the desktop deactivates app windows, as on macOS.
    useWindows.setState({ focusedId: null });
    setSelected([]);
    setBand({ x0: e.clientX, y0: e.clientY, x1: e.clientX, y1: e.clientY });
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!band) return;
    const next = { ...band, x1: e.clientX, y1: e.clientY };
    setBand(next);
    setSelected(placed.filter((p) => inBand(p.pos, next)).map((p) => p.node.id));
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const [first] = selected;
    if (e.key === "Enter" && first) setRenaming(first);
    if (e.key === "Backspace" && cmdHeld(e)) for (const id of selected) fs.trash(id);
  };

  return (
    <main
      aria-label="Desktop"
      tabIndex={-1}
      className="absolute inset-0 outline-none"
      style={{ background: dark ? wallpaper?.dark : wallpaper?.light }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => setBand(null)}
      onContextMenu={backgroundMenu}
      onDragOver={allowDrop}
      onDrop={onDrop}
      onKeyDown={onKeyDown}
    >
      {placed.map(({ node, pos }) => (
        <div
          key={node.id}
          draggable={renaming !== node.id}
          className="absolute"
          style={{ left: pos.x, top: pos.y }}
          onClick={(e) => setSelected(e.shiftKey || cmdHeld(e) ? [...selected, node.id] : [node.id])}
          onDoubleClick={() => openNode(node.id)}
          onContextMenu={(e) => iconMenu(e, node)}
          onDragStart={(e) => startDrag(e, selected.includes(node.id) ? selected : [node.id])}
          onDragOver={node.kind === "dir" ? allowDrop : undefined}
          onDrop={node.kind === "dir" ? (e) => dropInto(e, node.id) : undefined}
        >
          <FileIcon
            node={node}
            onDesktop
            selected={selected.includes(node.id)}
            renaming={renaming === node.id}
            onRenamed={(name) => {
              setRenaming(null);
              if (name) attempt(() => fs.rename(node.id, name));
            }}
          />
        </div>
      ))}
      {band && (
        <div
          className="pointer-events-none absolute rounded-[2px] border border-white/60 bg-white/15"
          style={{
            left: Math.min(band.x0, band.x1),
            top: Math.min(band.y0, band.y1),
            width: Math.abs(band.x1 - band.x0),
            height: Math.abs(band.y1 - band.y0),
          }}
        />
      )}
    </main>
  );
}
