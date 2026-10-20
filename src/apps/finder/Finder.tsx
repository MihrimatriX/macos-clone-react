import { AppWindow, CircleArrowDown, FileText, House, Image, Monitor, Music, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { AppProps } from "../../os/apps";
import { APPLICATIONS, children, findChild, HOME, isInside, type Nodes, TRASH, uniqueName, useFs } from "../../os/fs";
import { useSystem } from "../../os/system";
import { openNode, useCommand, useWindows } from "../../os/windows";
import { attempt, dropInto } from "../../ui/dnd";
import type { MenuItem } from "../../ui/Menu";
import { Sidebar } from "../../ui/Sidebar";
import { FileView, SORTS, type SortKey } from "./FileView";
import { PathBar, Toolbar } from "./Toolbar";

const FAVORITES = [
  { name: "Applications", icon: <AppWindow /> },
  { name: "Desktop", icon: <Monitor /> },
  { name: "Documents", icon: <FileText /> },
  { name: "Downloads", icon: <CircleArrowDown /> },
  { name: "Pictures", icon: <Image /> },
  { name: "Music", icon: <Music /> },
  { name: "Home", icon: <House /> },
];

/** Resolves a sidebar / Go-menu name to a folder id. */
function placeId(nodes: Nodes, name: string) {
  if (name === "Home") return HOME;
  if (name === "Trash") return TRASH;
  if (name === "Applications") return APPLICATIONS;
  return findChild(nodes, HOME, name)?.id ?? HOME;
}

export default function Finder({ win }: AppProps) {
  const [history, setHistory] = useState({ stack: [win.props.dirId ?? HOME], index: 0 });
  const [view, setView] = useState<"icons" | "list">("icons");
  const [sort, setSort] = useState<SortKey>("name");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [renaming, setRenaming] = useState<string | null>(null);
  const nodes = useFs((s) => s.nodes);
  const fs = useFs.getState();
  const { open, update } = useWindows.getState();
  const dir = history.stack[history.index] ?? HOME;
  const title = dir === HOME ? "Home" : (nodes[dir]?.name ?? "Finder");
  const needle = query.toLowerCase();
  const items = (
    query
      ? Object.values(nodes).filter(
          (n) => n.id !== dir && isInside(nodes, n.id, dir) && n.name.toLowerCase().includes(needle),
        )
      : children(nodes, dir).filter((n) => !n.name.startsWith("."))
  ).sort(SORTS[sort]);

  useEffect(() => update(win.id, { title }), [update, win.id, title]);

  const go = (id: string) => {
    if (id === dir || nodes[id]?.kind !== "dir") return;
    setHistory({ stack: [...history.stack.slice(0, history.index + 1), id], index: history.index + 1 });
    setSelected([]);
    setQuery("");
  };
  const step = (delta: number) => {
    const index = history.index + delta;
    if (index >= 0 && index < history.stack.length) setHistory({ ...history, index });
  };
  const openItem = (id: string) => (nodes[id]?.kind === "dir" ? go(id) : openNode(id));
  const newFolder = () => {
    const id = fs.create(dir, uniqueName(nodes, dir, "untitled folder"), "dir");
    setSelected([id]);
    setRenaming(id);
  };
  const duplicate = () => {
    for (const id of selected) attempt(() => fs.copy(id, dir, uniqueName(nodes, dir, nodes[id]?.name ?? "copy")));
  };
  const trashSelected = () => {
    for (const id of selected) attempt(() => (dir === TRASH ? fs.remove(id) : fs.trash(id)));
    setSelected([]);
  };

  const commands: Record<string, () => void> = {
    "new-folder": newFolder,
    open: () => selected.forEach(openItem),
    "get-info": () => open("info", { fileId: selected[0] ?? dir }),
    rename: () => setRenaming(selected[0] ?? null),
    duplicate,
    trash: trashSelected,
    "empty-trash": fs.emptyTrash,
    "view-icons": () => setView("icons"),
    "view-list": () => setView("list"),
    back: () => step(-1),
    forward: () => step(1),
    up: () => go(nodes[dir]?.parentId ?? dir),
  };
  useCommand(win.id, (command) => {
    if (command.startsWith("sort-")) setSort(command.slice(5) as SortKey);
    else if (command.startsWith("go:")) go(placeId(nodes, command.slice(3)));
    else commands[command]?.();
  });

  const itemMenu = (id: string): MenuItem[] =>
    nodes[id]?.parentId === TRASH
      ? [
          { label: "Put Back", onSelect: () => fs.restore(id) },
          { label: "Delete Immediately", onSelect: () => fs.remove(id) },
        ]
      : [
          { label: "Open", onSelect: () => openItem(id) },
          { label: "Get Info", onSelect: () => open("info", { fileId: id }) },
          { label: "Rename", onSelect: () => setRenaming(id) },
          { label: "Duplicate", onSelect: duplicate },
          "sep",
          { label: "Move to Trash", onSelect: trashSelected },
        ];
  const backgroundMenu: MenuItem[] = [
    { label: "New Folder", onSelect: newFolder, disabled: dir === TRASH },
    { label: "Get Info", onSelect: () => open("info", { fileId: dir }) },
    "sep",
    { label: "as Icons", checked: view === "icons", onSelect: () => setView("icons") },
    { label: "as List", checked: view === "list", onSelect: () => setView("list") },
    ...(dir === TRASH ? ["sep" as const, { label: "Empty Trash", onSelect: fs.emptyTrash }] : []),
  ];

  const sidebar = [
    { title: "Favorites", items: FAVORITES.map((f) => ({ id: placeId(nodes, f.name), label: f.name, icon: f.icon })) },
    { title: "Locations", items: [{ id: TRASH, label: "Trash", icon: <Trash2 /> }] },
  ];

  return (
    <div className="flex h-full">
      <Sidebar
        sections={sidebar}
        active={dir}
        onSelect={go}
        onDrop={(id, e) => dropInto(e, id)}
        onContextMenu={(id, e) =>
          id === TRASH && useSystem.getState().openContextMenu(e, [{ label: "Empty Trash", onSelect: fs.emptyTrash }])
        }
      />
      <div className="flex min-w-0 flex-1 flex-col bg-surface">
        <Toolbar
          dir={dir}
          title={title}
          canBack={history.index > 0}
          canForward={history.index < history.stack.length - 1}
          onStep={step}
          view={view}
          onView={setView}
          query={query}
          onQuery={setQuery}
        />
        <FileView
          items={items}
          view={view}
          sort={sort}
          onSort={setSort}
          selected={selected}
          onSelect={setSelected}
          renaming={renaming}
          onRename={setRenaming}
          onRenamed={(id, name) => {
            setRenaming(null);
            if (name) attempt(() => fs.rename(id, name));
          }}
          onOpen={openItem}
          onDropBackground={(e) => dropInto(e, dir)}
          itemMenu={itemMenu}
          backgroundMenu={backgroundMenu}
        />
        <PathBar dir={dir} count={items.length} onGo={go} />
      </div>
    </div>
  );
}
