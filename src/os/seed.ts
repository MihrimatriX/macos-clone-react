import { APPS } from "./apps";
import type { FsNode, Nodes } from "./fs";

// Well-known folder ids live here (re-exported by fs.ts) so this module never imports fs.ts at runtime:
// fs.ts calls seedNodes while it is still initialising.
export const ROOT = "root";
export const HOME = "home";
export const DESKTOP = "desktop";
export const TRASH = "trash";
export const APPLICATIONS = "applications";

type MimeOf = (name: string) => string;

/** Returns an add(parent, name, content?) that writes into `nodes`; no content means a folder. */
function adder(nodes: Nodes, mimeOf: MimeOf) {
  const now = Date.now();
  return (parentId: string | null, name: string, content?: string, id: string = crypto.randomUUID()) => {
    const kind: FsNode["kind"] = content === undefined ? "dir" : "file";
    const mime = kind === "dir" ? "inode/directory" : mimeOf(name);
    nodes[id] = { id, name, parentId, kind, mime, content: content ?? "", createdAt: now, modifiedAt: now };
    return id;
  };
}

/** Initial file system shown on first launch. Everything is generated so no external assets are needed. */
export function seedNodes(mimeOf: MimeOf): Nodes {
  const nodes: Nodes = {};
  const add = adder(nodes, mimeOf);

  add(null, "", undefined, ROOT);
  add(ROOT, "Applications", undefined, APPLICATIONS);
  for (const app of APPS.filter((a) => !a.hidden)) add(APPLICATIONS, `${app.name}.app`, app.id);
  add(add(ROOT, "Users"), "guest", undefined, HOME);
  add(HOME, ".Trash", undefined, TRASH);

  add(HOME, "Desktop", undefined, DESKTOP);
  add(DESKTOP, "Welcome.md", welcome());
  add(DESKTOP, "Sunset.svg", art("#ff7e5f", "#feb47b", sunset()));
  Object.assign(nodes, desktopExtras(mimeOf));

  const documents = add(HOME, "Documents");
  add(
    documents,
    "Todo.md",
    "# Todo\n\n- [x] Boot the machine\n- [ ] Try the Terminal (`help`)\n- [ ] Drag a file to the Desktop\n",
  );
  add(documents, "Haiku.txt", "Window opens wide\nlight falls on an empty desk\nthe cursor blinks on\n");
  add(add(documents, "Projects"), "readme.txt", "Project files live here.\n");

  add(HOME, "Downloads");
  const pictures = add(HOME, "Pictures");
  add(pictures, "Mountains.svg", art("#4facfe", "#00f2fe", mountains()));
  add(pictures, "Sunset.svg", art("#ff7e5f", "#feb47b", sunset()));
  add(pictures, "Waves.svg", art("#43cea2", "#185a9d", waves()));
  add(pictures, "Bubbles.svg", art("#8e2de2", "#4a00e0", bubbles()));

  const music = add(HOME, "Music");
  add(music, "Arcade.wav", chiptune([60, 64, 67, 72, 67, 64, 62, 65, 69, 74, 69, 65, 59, 62, 67, 71], 0.22));
  add(music, "Lullaby.wav", chiptune([72, 71, 69, 67, 69, 71, 72, 72, 74, 72, 71, 69, 67, 67, 64, 67], 0.4));
  return nodes;
}

/** A few apps and folders on the Desktop. Added in fs store version 1, so older file systems get them too. */
export function desktopExtras(mimeOf: MimeOf): Nodes {
  const nodes: Nodes = {};
  const add = adder(nodes, mimeOf);
  add(DESKTOP, "Safari.app", "safari");
  add(DESKTOP, "Notes.app", "notes");
  add(DESKTOP, "Music.app", "music");
  const shots = add(DESKTOP, "Screenshots");
  add(shots, "Screenshot 2026-10-04 at 09.41.svg", art("#43cea2", "#185a9d", waves()));
  add(shots, "Screenshot 2026-10-04 at 10.12.svg", art("#8e2de2", "#4a00e0", bubbles()));
  const projects = add(DESKTOP, "Projects");
  add(projects, "Ideas.md", "# Ideas\n\n- A widget for the Dock\n- Dark mode wallpapers that follow the sunset\n");
  add(DESKTOP, "Meeting Notes.txt", "Agenda\n\n1. Liquid Glass review\n2. Dock polish\n3. Ship it\n");
  return nodes;
}

function welcome() {
  return [
    "# Welcome",
    "",
    "Shortcuts (⌘ is Ctrl outside macOS):",
    "",
    "- ⌘Space — Spotlight",
    "- ⌘Tab — switch apps",
    "- ⌃↑ or F3 — Mission Control",
    "- ⌘W / ⌘Q / ⌘M — close, quit, minimize",
    "- ⌃⌘Q — lock screen",
    "",
    "Drop files from your computer onto the Desktop or a Finder window to import them.",
  ].join("\n");
}

function art(from: string, to: string, shapes: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/>${shapes}</svg>`;
}

function mountains() {
  return '<polygon points="0,600 220,260 400,600" fill="#1e3a5f" opacity=".7"/><polygon points="250,600 520,180 800,600" fill="#0f2747" opacity=".85"/><circle cx="640" cy="130" r="50" fill="#fff" opacity=".8"/>';
}

function sunset() {
  return '<circle cx="400" cy="380" r="140" fill="#fff3b0" opacity=".9"/><rect y="400" width="800" height="200" fill="#2d1b4e" opacity=".85"/>';
}

function waves() {
  return [0, 1, 2, 3]
    .map(
      (i) =>
        `<path d="M0 ${300 + i * 70} Q200 ${240 + i * 70} 400 ${300 + i * 70} T800 ${300 + i * 70} V600 H0Z" fill="#fff" opacity="${0.1 + i * 0.08}"/>`,
    )
    .join("");
}

function bubbles() {
  return [120, 260, 420, 560, 680]
    .map((x, i) => `<circle cx="${x}" cy="${180 + ((i * 97) % 280)}" r="${40 + i * 14}" fill="#fff" opacity=".18"/>`)
    .join("");
}

/** 8-bit mono WAV of square-wave notes (MIDI numbers), played twice. */
function chiptune(notes: number[], noteSeconds: number) {
  const rate = 11025;
  const noteLen = Math.floor(rate * noteSeconds);
  const length = notes.length * noteLen * 2;
  const view = new DataView(new ArrayBuffer(44 + length));
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + length, true);
  text(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  text(36, "data");
  view.setUint32(40, length, true);
  for (let i = 0; i < length; i++) {
    const note = notes[Math.floor(i / noteLen) % notes.length] ?? 60;
    const freq = 440 * 2 ** ((note - 69) / 12);
    const envelope = 1 - (i % noteLen) / noteLen;
    const square = Math.sin((2 * Math.PI * freq * i) / rate) > 0 ? 1 : -1;
    view.setUint8(44 + i, 128 + Math.round(square * envelope * 36));
  }
  let binary = "";
  for (const byte of new Uint8Array(view.buffer)) binary += String.fromCharCode(byte);
  return `data:audio/wav;base64,${btoa(binary)}`;
}
