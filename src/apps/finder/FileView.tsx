import type { DragEvent, KeyboardEvent, MouseEvent } from "react";
import { displayName, type FsNode, formatSize, kindLabel, sizeOf, useFs } from "../../os/fs";
import { cmdHeld } from "../../os/hotkeys";
import { useSystem } from "../../os/system";
import { allowDrop, dropInto, startDrag } from "../../ui/dnd";
import { FileIcon, NodeGlyph, RenameField } from "../../ui/FileIcon";
import type { MenuItem } from "../../ui/Menu";

export type SortKey = "name" | "kind" | "date" | "size";

const byName = (a: FsNode, b: FsNode) => a.name.localeCompare(b.name, undefined, { numeric: true });
export const SORTS: Record<SortKey, (a: FsNode, b: FsNode) => number> = {
  name: byName,
  kind: (a, b) => kindLabel(a).localeCompare(kindLabel(b)) || byName(a, b),
  date: (a, b) => b.modifiedAt - a.modifiedAt,
  size: (a, b) => b.content.length - a.content.length || byName(a, b),
};

interface Props {
  items: FsNode[];
  view: "icons" | "list";
  sort: SortKey;
  onSort: (sort: SortKey) => void;
  selected: string[];
  onSelect: (ids: string[]) => void;
  renaming: string | null;
  onRename: (id: string) => void;
  onRenamed: (id: string, name: string | null) => void;
  onOpen: (id: string) => void;
  onDropBackground: (e: DragEvent) => void;
  itemMenu: (id: string) => MenuItem[];
  backgroundMenu: MenuItem[];
}

const COLUMNS: [SortKey, string][] = [
  ["name", "Name"],
  ["date", "Date Modified"],
  ["size", "Size"],
  ["kind", "Kind"],
];
const GRID = "grid grid-cols-[minmax(0,1fr)_170px_80px_130px] items-center gap-3 px-3";

const modified = (node: FsNode) =>
  new Date(node.modifiedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export function FileView(props: Props) {
  const { items, view, selected, onSelect, renaming, onOpen, itemMenu } = props;
  const nodes = useFs((s) => s.nodes);
  const openContextMenu = useSystem((s) => s.openContextMenu);

  const itemProps = (node: FsNode) => ({
    draggable: renaming !== node.id,
    onClick: (e: MouseEvent) => {
      e.stopPropagation();
      const additive = e.shiftKey || cmdHeld(e);
      onSelect(additive ? [...selected.filter((id) => id !== node.id), node.id] : [node.id]);
    },
    onDoubleClick: () => onOpen(node.id),
    onContextMenu: (e: MouseEvent) => {
      e.stopPropagation();
      if (!selected.includes(node.id)) onSelect([node.id]);
      openContextMenu(e, itemMenu(node.id));
    },
    onDragStart: (e: DragEvent) => startDrag(e, selected.includes(node.id) ? selected : [node.id]),
    onDragOver: node.kind === "dir" ? allowDrop : undefined,
    onDrop: node.kind === "dir" ? (e: DragEvent) => dropInto(e, node.id) : undefined,
  });

  const onKeyDown = (e: KeyboardEvent) => {
    const [first] = selected;
    if (e.key === "Enter" && first) props.onRename(first);
  };

  return (
    <div
      role="listbox"
      tabIndex={-1}
      aria-label="Files"
      className="min-h-0 flex-1 overflow-auto outline-none"
      onClick={() => onSelect([])}
      onKeyDown={onKeyDown}
      onContextMenu={(e) => openContextMenu(e, props.backgroundMenu)}
      onDragOver={allowDrop}
      onDrop={props.onDropBackground}
    >
      {items.length === 0 && <p className="mt-20 text-center text-muted">No items</p>}
      {view === "icons" ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] content-start justify-items-center gap-y-3 p-4">
          {items.map((node) => (
            <div key={node.id} {...itemProps(node)}>
              <FileIcon
                node={node}
                selected={selected.includes(node.id)}
                renaming={renaming === node.id}
                onRenamed={(name) => props.onRenamed(node.id, name)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="pb-2">
          <div className={`${GRID} sticky top-0 z-10 h-7 border-line border-b bg-surface text-[11px] text-muted`}>
            {COLUMNS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`truncate text-left ${props.sort === key ? "font-semibold text-fg" : ""}`}
                onClick={() => props.onSort(key)}
              >
                {label}
              </button>
            ))}
          </div>
          {items.map((node) => {
            const isSelected = selected.includes(node.id);
            return (
              <div
                key={node.id}
                className={`${GRID} mx-1.5 h-6 rounded-[5px] ${isSelected ? "bg-accent text-white" : "odd:bg-black/[0.03] dark:odd:bg-white/[0.04]"}`}
                {...itemProps(node)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="size-4 shrink-0">
                    <NodeGlyph node={node} />
                  </span>
                  {renaming === node.id ? (
                    <RenameField
                      name={node.name}
                      onDone={(name) => props.onRenamed(node.id, name)}
                      className="w-full"
                    />
                  ) : (
                    <span className="truncate">{displayName(node)}</span>
                  )}
                </span>
                <span className={`truncate ${isSelected ? "" : "text-muted"}`}>{modified(node)}</span>
                <span className={`truncate ${isSelected ? "" : "text-muted"}`}>
                  {node.kind === "dir" ? "--" : formatSize(sizeOf(nodes, node.id))}
                </span>
                <span className={`truncate ${isSelected ? "" : "text-muted"}`}>{kindLabel(node)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
