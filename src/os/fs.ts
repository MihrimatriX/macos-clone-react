import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { idbStorage } from "./idb";
import { APPLICATIONS, DESKTOP, desktopExtras, HOME, ROOT, seedNodes, TRASH } from "./seed";

export { APPLICATIONS, DESKTOP, HOME, ROOT, TRASH };

export interface FsNode {
  id: string;
  name: string;
  parentId: string | null;
  kind: "dir" | "file";
  mime: string;
  /** Text for text/SVG files, a data URL for binary files, the app id for application/x-app. */
  content: string;
  createdAt: number;
  modifiedAt: number;
  /** Parent before the node was moved to the Trash; used by restore. */
  origin?: string;
  /** Desktop icon position. */
  pos?: { x: number; y: number };
}

export type Nodes = Record<string, FsNode>;

const MIME: Record<string, string> = {
  txt: "text/plain",
  md: "text/markdown",
  json: "application/json",
  js: "text/javascript",
  ts: "text/typescript",
  html: "text/html",
  css: "text/css",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  app: "application/x-app",
};

export function mimeOf(name: string) {
  const dot = name.lastIndexOf(".");
  return (dot > 0 && MIME[name.slice(dot + 1).toLowerCase()]) || "text/plain";
}

/** Name as Finder shows it: applications drop their ".app". */
export const displayName = (node: FsNode) =>
  node.mime === "application/x-app" ? node.name.replace(/.app$/, "") : node.name;

/** Adds desktopExtras to an existing file system, skipping any whose name is already taken on the Desktop. */
export function addDesktopExtras(nodes: Nodes): Nodes {
  const taken = new Set(children(nodes, DESKTOP).map((n) => n.name));
  const extras = Object.values(desktopExtras(mimeOf));
  const kept = new Set(extras.filter((n) => n.parentId === DESKTOP && !taken.has(n.name)).map((n) => n.id));
  const added = extras.filter((n) => kept.has(n.id) || (n.parentId !== null && kept.has(n.parentId)));
  return { ...nodes, ...Object.fromEntries(added.map((n) => [n.id, n])) };
}

export const isText = (node: FsNode) =>
  node.kind === "file" && !node.content.startsWith("data:") && node.mime !== "application/x-app";

/** A URL usable as <img>/<audio> src. SVG files are stored as text so they stay editable. */
export const fileUrl = (node: FsNode) =>
  node.content.startsWith("data:")
    ? node.content
    : `data:${node.mime};charset=utf-8,${encodeURIComponent(node.content)}`;

export const children = (nodes: Nodes, id: string) =>
  Object.values(nodes)
    .filter((n) => n.parentId === id)
    .sort((a, b) => a.name.localeCompare(b.name));

export const findChild = (nodes: Nodes, parentId: string, name: string) =>
  Object.values(nodes).find((n) => n.parentId === parentId && n.name === name);

export function pathOf(nodes: Nodes, id: string): string {
  const node = nodes[id];
  if (!node?.parentId) return "/";
  const parent = pathOf(nodes, node.parentId);
  return parent === "/" ? `/${node.name}` : `${parent}/${node.name}`;
}

/** Display form of a path with the home folder shortened to "~". */
export function prettyPath(nodes: Nodes, id: string) {
  const home = pathOf(nodes, HOME);
  const path = pathOf(nodes, id);
  return path.startsWith(home) ? `~${path.slice(home.length)}` : path;
}

export function resolve(nodes: Nodes, cwd: string, path: string): string | null {
  let current: string | null = path.startsWith("/") ? ROOT : path.startsWith("~") ? HOME : cwd;
  const parts = path.replace(/^~/, "").split("/").filter(Boolean);
  for (const part of parts) {
    if (!current) return null;
    if (part === ".") continue;
    if (part === "..") current = nodes[current]?.parentId ?? ROOT;
    else current = findChild(nodes, current, part)?.id ?? null;
  }
  return current;
}

export function isInside(nodes: Nodes, id: string, ancestorId: string) {
  for (let cur: string | null = id; cur; cur = nodes[cur]?.parentId ?? null) if (cur === ancestorId) return true;
  return false;
}

/** "untitled folder" → "untitled folder 2"; "a.txt" → "a 2.txt". */
export function uniqueName(nodes: Nodes, parentId: string, name: string) {
  const dot = name.lastIndexOf(".");
  const [base, ext] = dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ""];
  let candidate = name;
  for (let i = 2; findChild(nodes, parentId, candidate); i++) candidate = `${base} ${i}${ext}`;
  return candidate;
}

/** Bytes on "disk": data URLs are base64, so their payload is 3/4 of the encoded length. */
const bytesOf = (content: string) =>
  content.startsWith("data:") ? Math.floor(((content.length - content.indexOf(",") - 1) * 3) / 4) : content.length;

export const sizeOf = (nodes: Nodes, id: string): number => {
  const node = nodes[id];
  if (node?.kind === "file") return bytesOf(node.content);
  return children(nodes, id).reduce((sum, child) => sum + sizeOf(nodes, child.id), 0);
};

export function kindLabel(node: FsNode) {
  if (node.kind === "dir") return "Folder";
  if (node.mime === "application/x-app") return "Application";
  const [type = "", sub = ""] = node.mime.split("/");
  // Short format names are acronyms (PNG, WAV, SVG); longer ones read as words (Markdown).
  const format = sub.replace("+xml", "").replace("plain", "plain text");
  const label = format.length <= 4 ? format.toUpperCase() : format.replace(/\b\w/g, (c) => c.toUpperCase());
  if (type === "image") return `${label} Image`;
  if (type === "audio") return `${label} Audio`;
  return `${label} Document`;
}

export function formatSize(bytes: number) {
  if (bytes < 1000) return `${bytes} bytes`;
  if (bytes < 1e6) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${(bytes / 1e6).toFixed(1)} MB`;
}

interface FsState {
  nodes: Nodes;
  create: (parentId: string, name: string, kind: FsNode["kind"], content?: string) => string;
  write: (id: string, content: string) => void;
  rename: (id: string, name: string) => void;
  move: (id: string, parentId: string, name?: string) => void;
  copy: (id: string, parentId: string, name?: string) => string;
  remove: (id: string) => void;
  trash: (id: string) => void;
  restore: (id: string) => void;
  emptyTrash: () => void;
  setPos: (id: string, pos: FsNode["pos"]) => void;
  importFile: (parentId: string, file: File) => Promise<string>;
}

function assertFree(nodes: Nodes, parentId: string, name: string) {
  if (!name || name.includes("/")) throw new Error(`Invalid name: ${name}`);
  if (nodes[parentId]?.kind !== "dir") throw new Error("Not a directory");
  if (findChild(nodes, parentId, name)) throw new Error(`${name}: File exists`);
}

const readAs = (file: File, asText: boolean) =>
  new Promise<string>((done, fail) => {
    const reader = new FileReader();
    reader.onload = () => done(String(reader.result));
    reader.onerror = () => fail(reader.error);
    if (asText) reader.readAsText(file);
    else reader.readAsDataURL(file);
  });

export const useFs = create<FsState>()(
  persist(
    (set, get) => {
      const edit = (id: string, change: Partial<FsNode>) => {
        const node = get().nodes[id];
        if (!node) throw new Error("No such file or directory");
        set((s) => ({ nodes: { ...s.nodes, [id]: { ...node, ...change, modifiedAt: Date.now() } } }));
      };

      return {
        nodes: seedNodes(mimeOf),

        create: (parentId, name, kind, content = "") => {
          assertFree(get().nodes, parentId, name);
          const now = Date.now();
          const node: FsNode = {
            id: crypto.randomUUID(),
            name,
            parentId,
            kind,
            mime: kind === "dir" ? "inode/directory" : mimeOf(name),
            content,
            createdAt: now,
            modifiedAt: now,
          };
          set((s) => ({ nodes: { ...s.nodes, [node.id]: node } }));
          return node.id;
        },

        write: (id, content) => edit(id, { content }),

        rename: (id, name) => {
          const node = get().nodes[id];
          if (!node?.parentId || node.name === name) return;
          assertFree(get().nodes, node.parentId, name);
          edit(id, { name, mime: node.kind === "dir" ? node.mime : mimeOf(name) });
        },

        move: (id, parentId, name) => {
          const { nodes } = get();
          const node = nodes[id];
          if (!node?.parentId || [ROOT, HOME, TRASH].includes(id)) throw new Error("Operation not permitted");
          if (isInside(nodes, parentId, id)) throw new Error("Cannot move a folder into itself");
          const newName = name ?? node.name;
          if (node.parentId === parentId && newName === node.name) return;
          assertFree(nodes, parentId, newName);
          edit(id, {
            parentId,
            name: newName,
            mime: node.kind === "dir" ? node.mime : mimeOf(newName),
            pos: undefined,
          });
        },

        copy: (id, parentId, name) => {
          const source = get().nodes[id];
          if (!source) throw new Error("No such file or directory");
          if (isInside(get().nodes, parentId, id)) throw new Error("Cannot copy a folder into itself");
          const copyId = get().create(parentId, name ?? source.name, source.kind, source.content);
          for (const child of children(get().nodes, id)) get().copy(child.id, copyId);
          return copyId;
        },

        remove: (id) => {
          const { nodes } = get();
          if ([ROOT, HOME, TRASH, DESKTOP].includes(id)) throw new Error("Operation not permitted");
          const next = { ...nodes };
          for (const node of Object.values(nodes)) if (isInside(nodes, node.id, id)) delete next[node.id];
          set({ nodes: next });
        },

        trash: (id) => {
          const node = get().nodes[id];
          if (!node?.parentId || node.parentId === TRASH) return;
          const origin = node.parentId;
          get().move(id, TRASH, uniqueName(get().nodes, TRASH, node.name));
          edit(id, { origin });
        },

        restore: (id) => {
          const node = get().nodes[id];
          const target = node?.origin && get().nodes[node.origin] ? node.origin : HOME;
          if (!node) return;
          get().move(id, target, uniqueName(get().nodes, target, node.name));
          edit(id, { origin: undefined });
        },

        emptyTrash: () => {
          for (const child of children(get().nodes, TRASH)) get().remove(child.id);
        },

        setPos: (id, pos) => {
          const node = get().nodes[id];
          if (node) set((s) => ({ nodes: { ...s.nodes, [id]: { ...node, pos } } }));
        },

        importFile: async (parentId, file) => {
          const asText = /^text\/|svg|json/.test(file.type || mimeOf(file.name));
          const content = await readAs(file, asText);
          return get().create(parentId, uniqueName(get().nodes, parentId, file.name), "file", content);
        },
      };
    },
    {
      name: "fs",
      storage: createJSONStorage(() => (typeof indexedDB === "undefined" ? localStorage : idbStorage)),
      partialize: (s) => ({ nodes: s.nodes }),
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as { nodes: Nodes };
        return version < 1 ? { nodes: addDesktopExtras(state.nodes) } : state;
      },
    },
  ),
);
