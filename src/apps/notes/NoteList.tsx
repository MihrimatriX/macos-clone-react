import { Pin, Trash2 } from "lucide-react";
import { type Note, noteTitle } from "./store";

interface Props {
  title: string;
  notes: Note[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  onDelete: () => void;
}

/** "Today" shows the time, older notes show the date, as in Notes. */
function stamp(at: number) {
  const date = new Date(at);
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString();
}

export function NoteList({ title, notes, selectedId, onSelect, onDelete }: Props) {
  const groups = [
    { name: "Pinned", items: notes.filter((n) => n.pinned) },
    { name: "Notes", items: notes.filter((n) => !n.pinned) },
  ].filter((g) => g.items.length);

  return (
    <div className="flex w-64 shrink-0 flex-col bg-surface shadow-[0.5px_0_0_var(--line)]">
      <div className="titlebar toolbar">
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-bold text-[15px] leading-tight">{title}</h1>
          <p className="text-[11px] text-muted">{notes.length} notes</p>
        </div>
        <button type="button" aria-label="Delete note" className="tool" disabled={!selectedId} onClick={onDelete}>
          <Trash2 />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-2">
        {notes.length === 0 && <p className="mt-16 text-center text-muted">No Notes</p>}
        {groups.map((group) => (
          <section key={group.name} className="mb-3">
            <h2 className="flex items-center gap-1 px-2.5 pb-1 font-bold text-[13px]">
              {group.name === "Pinned" && <Pin size={12} className="fill-current text-amber-500" />}
              {group.name}
            </h2>
            {group.items.map((note) => {
              const selected = note.id === selectedId;
              return (
                <button
                  key={note.id}
                  type="button"
                  className={`block w-full rounded-[7px] px-2.5 py-2 text-left ${
                    selected ? "bg-amber-300/70 dark:bg-amber-500/45" : "hover:bg-hover"
                  }`}
                  onClick={() => onSelect(note.id)}
                >
                  <span className="block truncate font-semibold">{noteTitle(note)}</span>
                  <span className="mt-0.5 flex gap-2 text-xs">
                    <span className="shrink-0">{stamp(note.modifiedAt)}</span>
                    <span className="truncate text-muted">{note.body.split("\n")[1] || "No additional text"}</span>
                  </span>
                </button>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
