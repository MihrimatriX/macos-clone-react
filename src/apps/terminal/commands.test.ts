import { beforeEach, expect, test } from "bun:test";
import { children, findChild, HOME, mimeOf, useFs } from "../../os/fs";
import { seedNodes } from "../../os/seed";
import { complete, run, type Shell, tokenize } from "./commands";

let out: string[];
let sh: Shell;

beforeEach(() => {
  useFs.setState({ nodes: seedNodes(mimeOf) });
  out = [];
  sh = {
    cwd: HOME,
    user: "guest",
    history: [],
    setCwd: (id) => {
      sh.cwd = id;
    },
    print: (text) => out.push(text),
    clear: () => {
      out = [];
    },
    open: () => {},
  };
});

const exec = (line: string) => {
  out = [];
  run(line, sh);
  return out.join("\n");
};

test("tokenize handles quotes and glued redirects", () => {
  expect(tokenize('echo "hello world" >> notes.txt')).toEqual(["echo", "hello world", ">>", "notes.txt"]);
  expect(tokenize("echo hi>a.txt")).toEqual(["echo", "hi", ">", "a.txt"]);
  expect(tokenize("echo ''")).toEqual(["echo", ""]);
});

test("cd, pwd and relative paths", () => {
  expect(exec("pwd")).toBe("/Users/guest");
  exec("cd Documents/Projects");
  expect(exec("pwd")).toBe("/Users/guest/Documents/Projects");
  exec("cd ../..");
  expect(exec("pwd")).toBe("/Users/guest");
  expect(exec("cd nowhere")).toBe("cd: nowhere: No such file or directory");
});

test("echo redirects create, overwrite and append", () => {
  exec("echo one > log.txt");
  exec("echo two >> log.txt");
  expect(exec("cat log.txt")).toBe("one\ntwo");
  exec("echo reset > log.txt");
  expect(exec("cat log.txt")).toBe("reset");
});

test("mkdir, touch, mv, cp and rm change the shared store", () => {
  exec("mkdir box");
  exec("touch box/a.txt");
  exec("cp box/a.txt box/b.txt");
  exec("mv box/b.txt c.txt");
  const nodes = useFs.getState().nodes;
  const box = findChild(nodes, HOME, "box");
  expect(box && children(nodes, box.id).map((n) => n.name)).toEqual(["a.txt"]);
  expect(findChild(nodes, HOME, "c.txt")).toBeDefined();
  expect(exec("rm box")).toBe("rm: box: is a directory");
  exec("rm -r box");
  expect(findChild(useFs.getState().nodes, HOME, "box")).toBeUndefined();
});

test("ls hides dotfiles unless -a", () => {
  expect(exec("ls")).not.toContain(".Trash");
  expect(exec("ls -a")).toContain(".Trash/");
});

test("unknown commands and tab completion", () => {
  expect(exec("frobnicate")).toBe("zsh: command not found: frobnicate");
  expect(complete("ec", HOME).line).toBe("echo ");
  expect(complete("cd Doc", HOME).line).toBe("cd Documents/");
  expect(complete("cd D", HOME).options.sort()).toEqual(["Desktop/", "Documents/", "Downloads/"]);
});
