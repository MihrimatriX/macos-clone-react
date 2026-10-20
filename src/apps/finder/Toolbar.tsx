import { ChevronLeft, ChevronRight, LayoutGrid, List, Search } from "lucide-react";
import { HOME, TRASH, useFs } from "../../os/fs";
import { NodeGlyph } from "../../ui/FileIcon";
import { Segmented } from "../../ui/Segmented";

interface Props {
  dir: string;
  title: string;
  canBack: boolean;
  canForward: boolean;
  onStep: (delta: number) => void;
  view: "icons" | "list";
  onView: (view: "icons" | "list") => void;
  query: string;
  onQuery: (query: string) => void;
}

export function Toolbar({ dir, title, canBack, canForward, onStep, view, onView, query, onQuery }: Props) {
  return (
    <div className="titlebar toolbar">
      <div className="pill">
        <button type="button" aria-label="Back" className="tool" disabled={!canBack} onClick={() => onStep(-1)}>
          <ChevronLeft />
        </button>
        <button type="button" aria-label="Forward" className="tool" disabled={!canForward} onClick={() => onStep(1)}>
          <ChevronRight />
        </button>
      </div>
      <h1 className="ml-1 min-w-0 flex-1 truncate font-bold text-[15px]">{title}</h1>
      {dir === TRASH && (
        <button type="button" className="btn" onClick={useFs.getState().emptyTrash}>
          Empty
        </button>
      )}
      <Segmented
        value={view}
        onChange={onView}
        options={[
          { value: "icons", label: <LayoutGrid />, title: "Icon view" },
          { value: "list", label: <List />, title: "List view" },
        ]}
      />
      <label className="search-field ml-1 w-44">
        <Search size={14} className="shrink-0" />
        <input aria-label="Search" placeholder="Search" value={query} onChange={(e) => onQuery(e.target.value)} />
      </label>
    </div>
  );
}

/** Bottom path bar: ancestors of the folder from the root down, plus the item count. */
export function PathBar({ dir, count, onGo }: { dir: string; count: number; onGo: (id: string) => void }) {
  const nodes = useFs((s) => s.nodes);
  const crumbs = [];
  for (let id: string | null = dir; id && nodes[id]?.parentId; id = nodes[id]?.parentId ?? null) {
    const node = nodes[id];
    if (node) crumbs.unshift(node);
  }
  return (
    <div className="flex h-[26px] shrink-0 items-center gap-0.5 border-line border-t px-2 text-[11px] text-muted">
      {crumbs.map((node, i) => (
        <button
          key={node.id}
          type="button"
          className="flex shrink-0 items-center gap-1 rounded px-1 hover:bg-hover hover:text-fg"
          onClick={() => onGo(node.id)}
        >
          {i > 0 && <ChevronRight size={10} className="-ml-1 opacity-60" />}
          <span className="size-3.5">
            <NodeGlyph node={node} />
          </span>
          {node.id === HOME ? "Home" : node.name}
        </button>
      ))}
      <span className="ml-auto shrink-0">
        {count} {count === 1 ? "item" : "items"}
      </span>
    </div>
  );
}
