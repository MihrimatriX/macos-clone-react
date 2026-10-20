import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Note {
  id: string;
  folder: string;
  body: string;
  pinned: boolean;
  modifiedAt: number;
}

interface NotesState {
  folders: string[];
  notes: Note[];
  add: (folder: string) => string;
  edit: (id: string, body: string) => void;
  togglePin: (id: string) => void;
  remove: (id: string) => void;
  addFolder: (name: string) => void;
}

export const noteTitle = (note: Note) => note.body.trim().split("\n")[0] || "New Note";

const welcome: Note = {
  id: "welcome",
  folder: "Notes",
  body: "Welcome to Notes\nEverything you type is saved automatically.\nPin important notes to keep them on top.",
  pinned: true,
  modifiedAt: Date.now(),
};

export const useNotes = create<NotesState>()(
  persist(
    (set) => {
      const change = (id: string, patch: (n: Note) => Partial<Note>) =>
        set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch(n), modifiedAt: Date.now() } : n)) }));
      return {
        folders: ["Notes"],
        notes: [welcome],
        add: (folder) => {
          const note: Note = { id: crypto.randomUUID(), folder, body: "", pinned: false, modifiedAt: Date.now() };
          set((s) => ({ notes: [note, ...s.notes] }));
          return note.id;
        },
        edit: (id, body) => change(id, () => ({ body })),
        togglePin: (id) => change(id, (n) => ({ pinned: !n.pinned })),
        remove: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
        addFolder: (name) => set((s) => (s.folders.includes(name) ? s : { folders: [...s.folders, name] })),
      };
    },
    { name: "notes" },
  ),
);
