import { useEffect, useEffectEvent } from "react";
import { create } from "zustand";
import { appForMime, getApp } from "./apps";
import { useFs } from "./fs";
import { notify } from "./notify";

export interface WinProps {
  fileId?: string;
  dirId?: string;
  pane?: string;
}

export interface Win {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  /** Hidden with its app (Dock menu → Hide); shown again when the app is activated. */
  hidden?: boolean;
  maximized: boolean;
  /** Unsaved changes; an app that sets this must handle the "save-and-close" command. */
  dirty: boolean;
  /** The "save changes?" sheet is showing. */
  confirmClose: boolean;
  props: WinProps;
}

interface WindowsState {
  wins: Win[];
  focusedId: string | null;
  topZ: number;
  open: (appId: string, props?: WinProps) => string;
  focus: (id: string) => void;
  close: (id: string) => void;
  requestClose: (id: string) => void;
  minimize: (id: string) => void;
  hide: (appId: string) => void;
  toggleMax: (id: string) => void;
  update: (id: string, patch: Partial<Win>) => void;
  quit: (appId: string) => void;
  cycle: (appId: string) => void;
}

const topVisible = (wins: Win[]) =>
  wins.filter((w) => !w.minimized && !w.hidden).reduce<Win | null>((top, w) => (top && top.z > w.z ? top : w), null)
    ?.id ?? null;

export const useWindows = create<WindowsState>()((set, get) => {
  const patch = (id: string, change: Partial<Win>) =>
    set((s) => ({ wins: s.wins.map((w) => (w.id === id ? { ...w, ...change } : w)) }));

  return {
    wins: [],
    focusedId: null,
    topZ: 0,

    open: (appId, props = {}) => {
      const app = getApp(appId);
      const existing = get().wins.find((w) => w.appId === appId);
      if (app.singleInstance && existing) {
        patch(existing.id, { props: { ...existing.props, ...props } });
        get().focus(existing.id);
        return existing.id;
      }
      const siblings = get().wins.filter((w) => w.appId === appId).length;
      const screenW = globalThis.innerWidth ?? 1440;
      const screenH = globalThis.innerHeight ?? 900;
      const w = Math.min(app.defaultSize.w, screenW - 40);
      const h = Math.min(app.defaultSize.h, screenH - 140);
      const win: Win = {
        id: crypto.randomUUID(),
        appId,
        title: app.name,
        x: Math.round((screenW - w) / 2) + siblings * 26,
        y: Math.max(36, Math.round((screenH - h) / 2.6)) + siblings * 26,
        w,
        h,
        z: get().topZ + 1,
        minimized: false,
        maximized: false,
        dirty: false,
        confirmClose: false,
        props,
      };
      set((s) => ({ wins: [...s.wins, win], focusedId: win.id, topZ: win.z }));
      return win.id;
    },

    focus: (id) => {
      const z = get().topZ + 1;
      const appId = get().wins.find((w) => w.id === id)?.appId;
      // Bringing any window forward unhides the rest of its app, like macOS.
      set((s) => ({
        topZ: z,
        focusedId: id,
        wins: s.wins.map((w) => {
          if (w.id === id) return { ...w, z, minimized: false, hidden: false };
          return w.appId === appId ? { ...w, hidden: false } : w;
        }),
      }));
    },

    close: (id) =>
      set((s) => {
        const wins = s.wins.filter((w) => w.id !== id);
        return { wins, focusedId: topVisible(wins) };
      }),

    requestClose: (id) => {
      const win = get().wins.find((w) => w.id === id);
      if (win?.dirty) {
        get().focus(id);
        patch(id, { confirmClose: true });
      } else {
        get().close(id);
      }
    },

    minimize: (id) =>
      set((s) => {
        const wins = s.wins.map((w) => (w.id === id ? { ...w, minimized: true } : w));
        return { wins, focusedId: topVisible(wins) };
      }),

    hide: (appId) =>
      set((s) => {
        const wins = s.wins.map((w) => (w.appId === appId ? { ...w, hidden: true } : w));
        return { wins, focusedId: topVisible(wins) };
      }),

    toggleMax: (id) => set((s) => ({ wins: s.wins.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)) })),

    update: patch,

    quit: (appId) => {
      for (const w of get().wins.filter((win) => win.appId === appId)) get().requestClose(w.id);
    },

    cycle: (appId) => {
      const own = get().wins.filter((w) => w.appId === appId);
      if (own.length < 2) return;
      const bottom = own.reduce((low, w) => (w.z < low.z ? w : low));
      get().focus(bottom.id);
    },
  };
});

/** Opens a folder in Finder, launches an .app, or opens a file in the app registered for its type. */
export function openNode(id: string) {
  const node = useFs.getState().nodes[id];
  const { open } = useWindows.getState();
  if (!node) return;
  if (node.kind === "dir") open("finder", { dirId: id });
  else if (node.mime === "application/x-app") open(node.content);
  else {
    const app = appForMime(node.mime);
    if (app) open(app.id, { fileId: id });
    else notify("finder", "No application can open this file", node.name);
  }
}

export const activeAppId = (s: WindowsState) => s.wins.find((w) => w.id === s.focusedId)?.appId ?? "finder";

/** Menu commands that are not window-manager actions are forwarded to the focused window through this bus. */
const bus = new EventTarget();

export function sendCommand(winId: string, command: string) {
  bus.dispatchEvent(new CustomEvent(winId, { detail: command }));
}

export function useCommand(winId: string, handler: (command: string) => void) {
  const onCommand = useEffectEvent((command: string) => handler(command));
  useEffect(() => {
    const listener = (e: Event) => onCommand((e as CustomEvent<string>).detail);
    bus.addEventListener(winId, listener);
    return () => bus.removeEventListener(winId, listener);
  }, [winId]);
}
