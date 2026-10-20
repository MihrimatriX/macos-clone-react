import { create } from "zustand";
import type { MenuItem } from "../ui/Menu";
import type { DockPosition } from "./settings";

export type Phase = "boot" | "login" | "desktop" | "sleep" | "off";
/** Only one full-screen overlay or panel is visible at a time. */
export type Overlay = "spotlight" | "launchpad" | "mission" | "control" | "notifications" | null;

interface ContextMenuState {
  x: number;
  y: number;
  items: MenuItem[];
  /** Set for Dock menus, which open beside the icon on the side away from the screen edge. */
  dock?: DockPosition;
}

interface SystemState {
  phase: Phase;
  overlay: Overlay;
  /** Index into the ⌘Tab app list while the switcher is held open. */
  switcher: number | null;
  contextMenu: ContextMenuState | null;
  /** App whose windows Mission Control shows alone (App Exposé); null shows every window. */
  expose: string | null;
  setPhase: (phase: Phase) => void;
  toggle: (overlay: Exclude<Overlay, null>) => void;
  showAppWindows: (appId: string) => void;
  closeOverlay: () => void;
  setSwitcher: (index: number | null) => void;
  openContextMenu: (
    e: { clientX: number; clientY: number; preventDefault: () => void },
    items: MenuItem[],
    dock?: DockPosition,
  ) => void;
  closeContextMenu: () => void;
}

export const useSystem = create<SystemState>()((set) => ({
  phase: "boot",
  overlay: null,
  switcher: null,
  contextMenu: null,
  expose: null,
  setPhase: (phase) => set({ phase, overlay: null, contextMenu: null }),
  toggle: (overlay) =>
    set((s) => ({ overlay: s.overlay === overlay ? null : overlay, contextMenu: null, expose: null })),
  showAppWindows: (appId) => set({ overlay: "mission", expose: appId, contextMenu: null }),
  closeOverlay: () => set({ overlay: null, expose: null }),
  setSwitcher: (switcher) => set({ switcher }),
  openContextMenu: (e, items, dock) => {
    e.preventDefault();
    set({ contextMenu: { x: e.clientX, y: e.clientY, items, dock } });
  },
  closeContextMenu: () => set({ contextMenu: null }),
}));
