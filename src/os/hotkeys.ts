import { useEffect } from "react";
import { getApp, menusFor } from "./apps";
import { useSystem } from "./system";
import { activeAppId, sendCommand, useWindows } from "./windows";

const isMac = typeof navigator !== "undefined" && navigator.userAgent.includes("Mac");

interface Combo {
  cmd: boolean;
  ctrl: boolean;
  shift: boolean;
  key: string;
}

/** "⇧⌘N" → { shift, cmd, key: "N" }. ⌥ is treated like ⌃ because both map to Alt outside macOS. */
function parseShortcut(shortcut: string): Combo {
  const combo: Combo = { cmd: false, ctrl: false, shift: false, key: "" };
  for (const [i, char] of [...shortcut].entries()) {
    if (char === "⌘") combo.cmd = true;
    else if (char === "⌃" || char === "⌥") combo.ctrl = true;
    else if (char === "⇧") combo.shift = true;
    else return { ...combo, key: shortcut.slice(i) };
  }
  return combo;
}

const CODES: Record<string, string> = {
  Backquote: "`",
  Comma: ",",
  BracketLeft: "[",
  BracketRight: "]",
  Equal: "=",
  Minus: "-",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Backspace: "⌫",
  Delete: "⌫",
  Space: "Space",
  Enter: "↩",
};

/** Physical key names, so Alt/Shift-modified characters still match the shortcut table. */
const keyName = (e: KeyboardEvent) => CODES[e.code] ?? e.code.replace(/^(Key|Digit)/, "");

// Browsers reserve the Windows key, so ⌘ maps to Ctrl and ⌃ to Alt everywhere except macOS.
export const cmdHeld = (e: { metaKey: boolean; ctrlKey: boolean }) => (isMac ? e.metaKey : e.ctrlKey);
const ctrlHeld = (e: KeyboardEvent) => (isMac ? e.ctrlKey : e.altKey);

export const matches = (e: KeyboardEvent, combo: Combo) =>
  keyName(e) === combo.key && cmdHeld(e) === combo.cmd && ctrlHeld(e) === combo.ctrl && e.shiftKey === combo.shift;

/** Running apps, most recently focused first; the order the ⌘Tab switcher shows. */
export function switcherApps() {
  const byRecency = [...useWindows.getState().wins].sort((a, b) => b.z - a.z);
  return [...new Set(byRecency.map((w) => w.appId))];
}

export function activateApp(appId: string) {
  const top = useWindows
    .getState()
    .wins.filter((w) => w.appId === appId)
    .sort((a, b) => b.z - a.z)[0];
  if (top) useWindows.getState().focus(top.id);
  else useWindows.getState().open(appId);
}

export function runCommand(command: string) {
  const wm = useWindows.getState();
  const appId = activeAppId(wm);
  const id = wm.focusedId;
  if (command === "about") wm.open("about");
  else if (command === "settings") wm.open("settings");
  else if (command === "new-window") wm.open(appId);
  else if (command === "quit") wm.quit(appId);
  else if (command === "cycle") wm.cycle(appId);
  else if (!id) return;
  else if (command === "close") wm.requestClose(id);
  else if (command === "minimize") wm.minimize(id);
  else if (command === "zoom") wm.toggleMax(id);
  else sendCommand(id, command);
}

const isEditable = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA"].includes(el.tagName));

function onKeyDown(e: KeyboardEvent) {
  const system = useSystem.getState();
  if (system.phase !== "desktop") return;
  const key = keyName(e);
  const run = (action: () => void) => {
    e.preventDefault();
    action();
  };

  if (matches(e, parseShortcut("⌃⌘Q"))) return run(() => system.setPhase("login"));
  if (matches(e, parseShortcut("⌘Space"))) return run(() => system.toggle("spotlight"));
  if (key === "F3" || matches(e, parseShortcut("⌃↑"))) return run(() => system.toggle("mission"));
  if (key === "Escape" && system.contextMenu) return run(system.closeContextMenu);
  if (key === "Escape" && system.overlay) return run(system.closeOverlay);
  if (key === "Tab" && cmdHeld(e)) {
    const count = switcherApps().length;
    if (count < 2) return;
    const current = system.switcher ?? 0;
    return run(() => system.setSwitcher((current + (e.shiftKey ? count - 1 : 1)) % count));
  }

  // Text fields own unmodified keys plus Backspace and arrows even with modifiers (word deletion, caret movement).
  if (isEditable(e.target) && (["⌫", "←", "→", "↑", "↓"].includes(key) || !(cmdHeld(e) || ctrlHeld(e)))) return;
  for (const menu of menusFor(getApp(activeAppId(useWindows.getState())))) {
    for (const item of menu.items) {
      if (item !== "sep" && item.shortcut && matches(e, parseShortcut(item.shortcut)))
        return run(() => runCommand(item.command));
    }
  }
}

function onKeyUp(e: KeyboardEvent) {
  const { switcher, setSwitcher } = useSystem.getState();
  if (switcher === null || cmdHeld(e)) return;
  const appId = switcherApps()[switcher];
  setSwitcher(null);
  if (appId) activateApp(appId);
}

export function useHotkeys() {
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);
}
