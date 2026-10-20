import { beforeEach, expect, test } from "bun:test";
import {
  addDesktopExtras,
  children,
  DESKTOP,
  findChild,
  HOME,
  mimeOf,
  type Nodes,
  pathOf,
  resolve,
  TRASH,
  uniqueName,
  useFs,
} from "./fs";
import { seedNodes } from "./seed";

beforeEach(() => useFs.setState({ nodes: seedNodes(mimeOf) }));
const fs = () => useFs.getState();

test("resolve handles absolute, home, relative and parent paths", () => {
  const { nodes } = fs();
  const docs = findChild(nodes, HOME, "Documents")?.id ?? "";
  expect(resolve(nodes, DESKTOP, "/Users/guest")).toBe(HOME);
  expect(resolve(nodes, DESKTOP, "~/Documents")).toBe(docs);
  expect(resolve(nodes, DESKTOP, "../Documents/./")).toBe(docs);
  expect(resolve(nodes, DESKTOP, "missing")).toBeNull();
  expect(pathOf(nodes, docs)).toBe("/Users/guest/Documents");
});

test("mime types come from the extension", () => {
  expect(mimeOf("a.md")).toBe("text/markdown");
  expect(mimeOf("photo.JPG")).toBe("image/jpeg");
  expect(mimeOf(".bashrc")).toBe("text/plain");
});

test("create refuses duplicates; uniqueName finds a free name", () => {
  fs().create(HOME, "a.txt", "file");
  expect(() => fs().create(HOME, "a.txt", "file")).toThrow("File exists");
  expect(uniqueName(fs().nodes, HOME, "a.txt")).toBe("a 2.txt");
});

test("a folder cannot be moved into itself", () => {
  const outer = fs().create(HOME, "outer", "dir");
  const inner = fs().create(outer, "inner", "dir");
  expect(() => fs().move(outer, inner)).toThrow();
});

test("copy is deep and independent", () => {
  const dir = fs().create(HOME, "src", "dir");
  const file = fs().create(dir, "x.txt", "file", "hello");
  const copy = fs().copy(dir, DESKTOP);
  fs().write(file, "changed");
  const copied = children(fs().nodes, copy)[0];
  expect(copied?.content).toBe("hello");
});

test("trash, restore and empty trash", () => {
  const id = fs().create(DESKTOP, "note.txt", "file");
  fs().trash(id);
  expect(fs().nodes[id]?.parentId).toBe(TRASH);
  fs().restore(id);
  expect(fs().nodes[id]?.parentId).toBe(DESKTOP);
  fs().trash(id);
  fs().emptyTrash();
  expect(fs().nodes[id]).toBeUndefined();
});

test("remove deletes descendants", () => {
  const dir = fs().create(HOME, "tmp", "dir");
  const file = fs().create(dir, "f.txt", "file");
  fs().remove(dir);
  expect(fs().nodes[file]).toBeUndefined();
});

test("addDesktopExtras adds the new items once and skips names already on the Desktop", () => {
  const names = (nodes: Nodes) => children(nodes, DESKTOP).map((n) => n.name);
  // An older file system: no extras yet, but the user already has their own "Projects" folder.
  const old = Object.fromEntries(
    Object.entries(fs().nodes).filter(
      ([, n]) => n.parentId !== DESKTOP || ["Welcome.md", "Sunset.svg"].includes(n.name),
    ),
  );
  useFs.setState({ nodes: old });
  const mine = fs().create(DESKTOP, "Projects", "dir");

  const migrated = addDesktopExtras(fs().nodes);
  expect(names(migrated)).toContain("Safari.app");
  expect(names(migrated).filter((n) => n === "Projects")).toHaveLength(1);
  expect(findChild(migrated, DESKTOP, "Projects")?.id).toBe(mine);
  expect(findChild(migrated, mine, "Ideas.md")).toBeUndefined();
  const shots = findChild(migrated, DESKTOP, "Screenshots")?.id ?? "";
  expect(children(migrated, shots)).toHaveLength(2);
});
