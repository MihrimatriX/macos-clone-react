import { children, isText, pathOf, resolve, useFs } from "../../os/fs";

/** What a command can see and do; the Terminal UI provides it, tests provide a fake. */
export interface Shell {
  cwd: string;
  user: string;
  history: string[];
  setCwd: (id: string) => void;
  print: (text: string) => void;
  clear: () => void;
  open: (id: string) => void;
}

type Command = (args: string[], sh: Shell) => void;

const fs = () => useFs.getState();

function need(sh: Shell, path: string) {
  const id = resolve(fs().nodes, sh.cwd, path);
  if (!id) throw new Error(`${path}: No such file or directory`);
  return id;
}

/** Parent folder and basename for a path that may not exist yet. */
function target(sh: Shell, path: string) {
  const slash = path.lastIndexOf("/");
  const dir = slash < 0 ? "." : path.slice(0, slash) || "/";
  return { parentId: need(sh, dir), name: path.slice(slash + 1) };
}

function parseFlags(args: string[]) {
  const flags = new Set(args.filter((a) => a.startsWith("-")).flatMap((a) => [...a.slice(1)]));
  return { flags, paths: args.filter((a) => !a.startsWith("-")) };
}

/** Shared by mv and cp: into an existing folder, or to a new path/name. */
function transfer(args: string[], sh: Shell, mode: "move" | "copy") {
  const { flags, paths } = parseFlags(args);
  const [src, dest] = paths;
  if (!src || !dest) throw new Error("usage: source target");
  const id = need(sh, src);
  if (mode === "copy" && fs().nodes[id]?.kind === "dir" && !flags.has("r"))
    throw new Error(`${src} is a directory (not copied)`);
  const action = fs()[mode];
  const destId = resolve(fs().nodes, sh.cwd, dest);
  if (destId && fs().nodes[destId]?.kind === "dir") return action(id, destId);
  const { parentId, name } = target(sh, dest);
  action(id, parentId, name);
}

const COMMANDS: Record<string, Command> = {
  help: (_, sh) => sh.print(`Commands: ${Object.keys(COMMANDS).join("  ")}`),
  pwd: (_, sh) => sh.print(pathOf(fs().nodes, sh.cwd)),
  whoami: (_, sh) => sh.print(sh.user),
  date: (_, sh) => sh.print(new Date().toString()),
  echo: (args, sh) => sh.print(args.join(" ")),
  clear: (_, sh) => sh.clear(),
  history: (_, sh) => sh.print(sh.history.map((line, i) => `${String(i + 1).padStart(5)}  ${line}`).join("\n")),
  ls: (args, sh) => {
    const { flags, paths } = parseFlags(args);
    const id = need(sh, paths[0] ?? ".");
    const node = fs().nodes[id];
    if (node?.kind === "file") return sh.print(node.name);
    const names = children(fs().nodes, id)
      .filter((n) => flags.has("a") || !n.name.startsWith("."))
      .map((n) => (n.kind === "dir" ? `${n.name}/` : n.name));
    sh.print(names.join(flags.has("l") ? "\n" : "  "));
  },
  cd: ([path = "~"], sh) => {
    const id = need(sh, path);
    if (fs().nodes[id]?.kind !== "dir") throw new Error(`not a directory: ${path}`);
    sh.setCwd(id);
  },
  mkdir: (args, sh) => {
    for (const path of args) {
      const { parentId, name } = target(sh, path);
      fs().create(parentId, name, "dir");
    }
  },
  touch: (args, sh) => {
    for (const path of args) {
      const id = resolve(fs().nodes, sh.cwd, path);
      const node = id ? fs().nodes[id] : undefined;
      if (node) fs().write(node.id, node.content);
      else {
        const { parentId, name } = target(sh, path);
        fs().create(parentId, name, "file");
      }
    }
  },
  rm: (args, sh) => {
    const { flags, paths } = parseFlags(args);
    for (const path of paths) {
      const id = need(sh, path);
      if (fs().nodes[id]?.kind === "dir" && !flags.has("r")) throw new Error(`${path}: is a directory`);
      fs().remove(id);
    }
  },
  mv: (args, sh) => transfer(args, sh, "move"),
  cp: (args, sh) => transfer(args, sh, "copy"),
  cat: (args, sh) => {
    for (const path of args) {
      const node = fs().nodes[need(sh, path)];
      if (node?.kind === "dir") throw new Error(`${path}: Is a directory`);
      if (node) sh.print(isText(node) ? node.content.replace(/\n$/, "") : `[binary ${node.mime}]`);
    }
  },
  open: (args, sh) => {
    for (const path of args) sh.open(need(sh, path));
  },
  neofetch: (_, sh) => {
    const logo = ["    ____    ", "   /    \\   ", "  /      \\  ", "  \\      /  ", "   \\____/   "];
    const info = [
      `${sh.user}@macbook`,
      "OS: macOS Web 1.0",
      "Shell: zsh (simulated)",
      `Resolution: ${globalThis.screen?.width ?? 0}x${globalThis.screen?.height ?? 0}`,
      `Files: ${Object.keys(fs().nodes).length}`,
    ];
    sh.print(logo.map((line, i) => `${line}  ${info[i] ?? ""}`).join("\n"));
  },
};

/** Splits on spaces, honouring quotes; ">" and ">>" become their own tokens even without spaces. */
export function tokenize(line: string) {
  const tokens: string[] = [];
  let current = "";
  let quote: string | null = null;
  let started = false;
  const flush = () => {
    if (current || started) tokens.push(current);
    current = "";
    started = false;
  };
  for (const [i, ch] of [...line].entries()) {
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      started = true;
    } else if (ch === " ") flush();
    else if (ch === ">") {
      flush();
      if (line[i - 1] === ">") tokens[tokens.length - 1] = ">>";
      else tokens.push(">");
    } else current += ch;
  }
  flush();
  return tokens;
}

export function run(line: string, sh: Shell) {
  const tokens = tokenize(line);
  const redirect = tokens.findIndex((t) => t === ">" || t === ">>");
  const [name, ...args] = redirect < 0 ? tokens : tokens.slice(0, redirect);
  if (!name) return;
  const command = COMMANDS[name];
  if (!command) return sh.print(`zsh: command not found: ${name}`);
  const captured: string[] = [];
  try {
    command(args, redirect < 0 ? sh : { ...sh, print: (text) => captured.push(text) });
    if (redirect >= 0) {
      const file = tokens[redirect + 1];
      if (!file) throw new Error("parse error near `\\n`");
      const text = captured.map((t) => `${t}\n`).join("");
      const existing = resolve(fs().nodes, sh.cwd, file);
      const node = existing ? fs().nodes[existing] : undefined;
      if (node) fs().write(node.id, tokens[redirect] === ">>" ? node.content + text : text);
      else {
        const { parentId, name: fileName } = target(sh, file);
        fs().create(parentId, fileName, "file", text);
      }
    }
  } catch (err) {
    sh.print(`${name}: ${(err as Error).message}`);
  }
}

/** Tab completion: command names first, then paths relative to the cwd. */
export function complete(line: string, cwd: string): { line: string; options: string[] } {
  const tokens = line.split(" ");
  const last = tokens.pop() ?? "";
  const base = last.slice(0, last.lastIndexOf("/") + 1);
  const dirId = resolve(fs().nodes, cwd, base || ".");
  const candidates =
    tokens.length === 0
      ? Object.keys(COMMANDS)
      : (dirId ? children(fs().nodes, dirId) : []).map((n) => (n.kind === "dir" ? `${n.name}/` : n.name));
  const partial = last.slice(base.length);
  const matches = candidates.filter((c) => c.startsWith(partial));
  if (matches.length === 0) return { line, options: [] };
  const common = matches.reduce((a, b) => {
    let i = 0;
    while (i < a.length && a[i] === b[i]) i++;
    return a.slice(0, i);
  });
  const finished = matches.length === 1 && !common.endsWith("/") ? " " : "";
  return { line: [...tokens, base + common + finished].join(" "), options: matches.length > 1 ? matches : [] };
}
