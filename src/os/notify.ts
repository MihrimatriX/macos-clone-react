import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Notice {
  id: string;
  appId: string;
  title: string;
  body: string;
  at: number;
}

interface NotifyState {
  history: Notice[];
  /** Ids currently shown as toasts; not persisted. */
  toasts: string[];
  push: (notice: Omit<Notice, "id" | "at">) => void;
  dismissToast: (id: string) => void;
  clear: () => void;
}

const TOAST_MS = 5000;

export const useNotify = create<NotifyState>()(
  persist(
    (set) => ({
      history: [],
      toasts: [],
      push: (notice) => {
        const id = crypto.randomUUID();
        set((s) => ({
          history: [{ ...notice, id, at: Date.now() }, ...s.history].slice(0, 50),
          toasts: [...s.toasts, id],
        }));
        setTimeout(() => useNotify.getState().dismissToast(id), TOAST_MS);
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t !== id) })),
      clear: () => set({ history: [] }),
    }),
    { name: "notifications", partialize: (s) => ({ history: s.history }) },
  ),
);

export const notify = (appId: string, title: string, body = "") => useNotify.getState().push({ appId, title, body });
