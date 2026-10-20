import { Folder, Inbox, Pin, Plus, Search, SquarePen } from "lucide-react";
import { useRef, useState } from "react";
import type { AppProps } from "../../os/apps";
import { useCommand } from "../../os/windows";
import { Sidebar } from "../../ui/Sidebar";
import { NoteList } from "./NoteList";
import { useNotes } from "./store";

const ALL = "*";

export default function Notes({ win }: AppProps) {
  const folders = useNotes((s) => s.folders);
  const notes = useNotes((s) => s.notes);
  const { add, edit, togglePin, remove, addFolder } = useNotes.getState();
  const [folder, setFolder] = useState(ALL);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(notes[0]?.id ?? null);
  const [newFolder, setNewFolder] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const inFolder = notes.filter((n) => folder === ALL || n.folder === folder);
  const visible = inFolder
    .filter((n) => n.body.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.modifiedAt - a.modifiedAt);
  const selected = notes.find((n) => n.id === selectedId) ?? visible[0];
  const [title = "", ...rest] = selected?.body.split("\n") ?? [];

  const newNote = () => {
    setQuery("");
    setSelectedId(add(folder === ALL ? (folders[0] ?? "Notes") : folder));
  };
  const deleteNote = () => {
    if (!selected) return;
    remove(selected.id);
    setSelectedId(visible.find((n) => n.id !== selected.id)?.id ?? null);
  };

  useCommand(win.id, (command) => {
    if (command === "new-note") newNote();
    if (command === "new-folder") setNewFolder("");
    if (command === "pin" && selected) togglePin(selected.id);
    if (command === "delete") deleteNote();
  });

  const count = (name: string) => notes.filter((n) => name === ALL || n.folder === name).length;
  const sections = [
    {
      title: "On My Mac",
      items: [ALL, ...folders].map((f) => ({
        id: f,
        label: f === ALL ? "All Notes" : f,
        icon: f === ALL ? <Inbox className="text-amber-500!" /> : <Folder className="text-amber-500!" />,
        badge: count(f),
      })),
    },
  ];
  const footer =
    newFolder === null ? (
      <button
        type="button"
        className="flex items-center gap-1.5 px-2 py-1 text-muted hover:text-fg"
        onClick={() => setNewFolder("")}
      >
        <Plus size={15} /> New Folder
      </button>
    ) : (
      <input
        // biome-ignore lint/a11y/noAutofocus: shown only after clicking New Folder
        autoFocus
        aria-label="Folder name"
        placeholder="Folder name"
        className="field w-full"
        value={newFolder}
        onChange={(e) => setNewFolder(e.target.value)}
        onBlur={() => setNewFolder(null)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && newFolder.trim()) addFolder(newFolder.trim());
          if (e.key === "Enter" || e.key === "Escape") setNewFolder(null);
        }}
      />
    );

  return (
    <div className="flex h-full">
      <Sidebar sections={sections} active={folder} onSelect={setFolder} footer={footer} />
      <NoteList
        title={folder === ALL ? "All Notes" : folder}
        notes={visible}
        selectedId={selected?.id}
        onSelect={setSelectedId}
        onDelete={deleteNote}
      />
      <div className="flex min-w-0 flex-1 flex-col bg-surface">
        <div className="titlebar toolbar">
          <div className="flex-1" />
          <button
            type="button"
            aria-label="Pin note"
            className="tool"
            disabled={!selected}
            onClick={() => selected && togglePin(selected.id)}
          >
            <Pin className={selected?.pinned ? "fill-current text-amber-500" : ""} />
          </button>
          <button type="button" aria-label="New note" className="tool" onClick={newNote}>
            <SquarePen />
          </button>
          <label className="search-field w-44">
            <Search size={14} className="shrink-0" />
            <input
              aria-label="Search notes"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        {selected ? (
          <div className="flex min-h-0 flex-1 flex-col px-8 pb-6">
            <p className="pb-3 text-center text-muted text-xs">
              {new Date(selected.modifiedAt).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" })}
            </p>
            <input
              aria-label="Note title"
              placeholder="Title"
              className="bg-transparent font-bold text-[22px] outline-none placeholder:text-muted"
              value={title}
              onChange={(e) => edit(selected.id, [e.target.value, ...rest].join("\n"))}
              onKeyDown={(e) => e.key === "Enter" && bodyRef.current?.focus()}
            />
            <textarea
              ref={bodyRef}
              aria-label="Note"
              className="mt-2 flex-1 resize-none bg-transparent text-[14px] leading-relaxed outline-none placeholder:text-muted"
              value={rest.join("\n")}
              placeholder="Start typing…"
              onChange={(e) => edit(selected.id, [title, e.target.value].join("\n"))}
            />
          </div>
        ) : (
          <p className="grid flex-1 place-items-center text-muted">No Note Selected</p>
        )}
      </div>
    </div>
  );
}
