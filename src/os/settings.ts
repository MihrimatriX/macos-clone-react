import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Appearance = "light" | "dark" | "auto";
export type DockPosition = "bottom" | "left" | "right";

export interface DockSettings {
  size: number;
  /** Peak scale under the pointer; 1 disables magnification. */
  magnify: number;
  position: DockPosition;
  autohide: boolean;
}

interface SettingsData {
  appearance: Appearance;
  accent: string;
  wallpaper: number;
  dock: DockSettings;
  userName: string;
  avatar: string;
  brightness: number;
  wifi: boolean;
  bluetooth: boolean;
  /** Apps taken out of the Dock (Options → Keep in Dock); they still show while running. */
  unpinned: string[];
  /** Apps opened right after login (Options → Open at Login). */
  loginItems: string[];
}

interface SettingsState extends SettingsData {
  set: (patch: Partial<SettingsData>) => void;
  setDock: (patch: Partial<DockSettings>) => void;
}

export const ACCENTS = ["#007aff", "#a550a7", "#f74f9e", "#ff5257", "#f7821b", "#ffc600", "#62ba46", "#8c8c8c"];

const defaults: SettingsData = {
  appearance: "auto",
  accent: "#007aff",
  wallpaper: 0,
  dock: { size: 52, magnify: 1.6, position: "bottom", autohide: false },
  userName: "Guest",
  avatar: "",
  brightness: 1,
  wifi: true,
  bluetooth: true,
  unpinned: [],
  loginItems: [],
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      set: (patch) => set(patch),
      setDock: (patch) => set((s) => ({ dock: { ...s.dock, ...patch } })),
    }),
    { name: "settings" },
  ),
);

const darkQuery = typeof matchMedia === "undefined" ? null : matchMedia("(prefers-color-scheme: dark)");

function subscribeDark(onChange: () => void) {
  darkQuery?.addEventListener("change", onChange);
  return () => darkQuery?.removeEventListener("change", onChange);
}

export function useIsDark() {
  const appearance = useSettings((s) => s.appearance);
  const systemDark = useSyncExternalStore(subscribeDark, () => darkQuery?.matches ?? false);
  return appearance === "dark" || (appearance === "auto" && systemDark);
}
