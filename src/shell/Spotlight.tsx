import { Calculator, Search, StickyNote } from "lucide-react";
import { motion } from "motion/react";
import { type ReactNode, useState } from "react";
import { noteTitle, useNotes } from "../apps/notes/store";
import { visibleApps } from "../os/apps";
import { prettyPath, TRASH, useFs } from "../os/fs";
import { activateApp } from "../os/hotkeys";
import { evaluate, fuzzyScore, looksLikeMath } from "../os/search";
import { useSystem } from "../os/system";
import { openNode, useWindows } from "../os/windows";
import { AppIcon } from "../ui/AppIcon";
import { NodeGlyph } from "../ui/FileIcon";

interface Result {
  key: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  score: number;
  group: string;
  run: () => void;
}

const LIMIT = 12;
const GROUPS = ["Calculator", "Applications", "Folders", "Documents", "Notes"];

/** Best match first, the rest grouped by kind like Spotlight. */
function arrange(results: Result[]) {
  const [top, ...rest] = results.sort((a, b) => b.score - a.score);
  if (!top) return [];
  return [top, ...GROUPS.flatMap((g) => rest.filter((r) => r.group === g))];
}

function useResults(query: string): Result[] {
  const nodes = useFs((s) => s.nodes);
  const notes = useNotes((s) => s.notes);
  if (!query.trim()) return [];

  const results: Result[] = [];
  if (looksLikeMath(query)) {
    const value = String(evaluate(query));
    results.push({
      key: "calc",
      title: `= ${value}`,
      subtitle: "Calculator · Enter to copy",
      icon: <Calculator className="size-full p-1 text-orange-400" />,
      score: Number.POSITIVE_INFINITY,
      group: "Calculator",
      run: () => navigator.clipboard?.writeText(value),
    });
  }
  for (const app of visibleApps()) {
    const score = fuzzyScore(query, app.name);
    if (score !== null)
      results.push({
        key: app.id,
        title: app.name,
        subtitle: "Application",
        icon: <AppIcon app={app} />,
        score: score + 100,
        group: "Applications",
        run: () => activateApp(app.id),
      });
  }
  for (const node of Object.values(nodes)) {
    const score =
      node.parentId && node.parentId !== TRASH && node.mime !== "application/x-app"
        ? fuzzyScore(query, node.name)
        : null;
    if (score !== null)
      results.push({
        key: node.id,
        title: node.name,
        subtitle: prettyPath(nodes, node.parentId ?? node.id),
        icon: <NodeGlyph node={node} />,
        score,
        group: node.kind === "dir" ? "Folders" : "Documents",
        run: () => openNode(node.id),
      });
  }
  const needle = query.toLowerCase();
  for (const note of notes) {
    const score = fuzzyScore(query, noteTitle(note)) ?? (note.body.toLowerCase().includes(needle) ? 0 : null);
    if (score !== null)
      results.push({
        key: note.id,
        title: noteTitle(note),
        subtitle: "Notes",
        icon: <StickyNote className="size-full p-0.5 text-amber-500" />,
        score,
        group: "Notes",
        run: () => useWindows.getState().open("notes"),
      });
  }
  return arrange(results);
}

/** Category chips under the field; each narrows the results to one kind. */
const FILTERS = ["All", "Applications", "Documents", "Folders", "Notes"];

function Panel() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [filter, setFilter] = useState("All");
  const close = useSystem((s) => s.closeOverlay);
  const results = useResults(query)
    .filter((r) => filter === "All" || r.group === filter)
    .slice(0, LIMIT);

  const runAt = (index: number) => {
    const result = results[index];
    if (!result) return;
    close();
    result.run();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.16, ease: [0.32, 0.72, 0, 1] }}
      // Spotlight is the clearest glass in Tahoe: the wallpaper stays readable through it.
      className="glass fixed top-[22vh] left-1/2 z-[2001] w-[600px] max-w-[90vw] -translate-x-1/2 overflow-hidden rounded-[26px] [--blur:18px] [--tint:var(--glass-regular)]"
    >
      <label className="flex h-[52px] items-center gap-3 px-4">
        <Search size={18} className="shrink-0 text-muted" strokeWidth={2.25} />
        <input
          // biome-ignore lint/a11y/noAutofocus: Spotlight exists to receive typing
          autoFocus
          aria-label="Spotlight Search"
          placeholder="Spotlight Search"
          className="flex-1 bg-transparent text-[20px] outline-none placeholder:text-muted"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setActive((i) => Math.min(results.length - 1, i + 1));
            else if (e.key === "ArrowUp") setActive((i) => Math.max(0, i - 1));
            else if (e.key === "Enter") runAt(active);
            else return;
            e.preventDefault();
          }}
        />
      </label>
      {query.trim() && (
        <div className="flex gap-1 border-line border-b px-3 pb-2">
          {FILTERS.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={filter === name}
              className={`rounded-full px-2.5 py-0.5 text-[12px] ${
                filter === name ? "bg-black/[0.08] text-fg dark:bg-white/15" : "text-muted hover:text-fg"
              }`}
              onClick={() => {
                setFilter(name);
                setActive(0);
              }}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      {results.length > 0 && (
        <ul aria-label="Results" className="max-h-[400px] overflow-y-auto p-1.5">
          {results.map((result, i) => (
            <li key={result.key}>
              <button
                type="button"
                aria-current={i === active}
                className={`flex h-[46px] w-full items-center gap-3 rounded-[12px] px-2.5 text-left ${
                  i === active ? "bg-[color-mix(in_srgb,var(--accent)_20%,transparent)]" : ""
                }`}
                onMouseEnter={() => setActive(i)}
                onClick={() => runAt(i)}
              >
                <span className="size-7 shrink-0">{result.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px]">{result.title}</span>
                  <span className="block truncate text-[12px] text-muted">{result.subtitle}</span>
                </span>
                {i === active && <span className="text-[11px] text-muted">↩</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

export function Spotlight() {
  const open = useSystem((s) => s.overlay === "spotlight");
  const close = useSystem((s) => s.closeOverlay);
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-[2000]" onMouseDown={close} />
      <Panel />
    </>
  );
}
