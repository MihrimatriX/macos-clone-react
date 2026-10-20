import { useEffect, useRef, useState } from "react";
import type { AppProps } from "../../os/apps";
import { HOME, useFs } from "../../os/fs";
import { useSettings } from "../../os/settings";
import { openNode, useCommand, useWindows } from "../../os/windows";
import { complete, run } from "./commands";

export default function Terminal({ win }: AppProps) {
  const user = useSettings((s) => s.userName.toLowerCase().replace(/\s+/g, "")) || "guest";
  const [cwd, setCwd] = useState(HOME);
  const [lines, setLines] = useState(() => [`Last login: ${new Date().toString().slice(0, 24)} on ttys000`]);
  const [history, setHistory] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  // A deleted working directory falls back to home, as the cwd node no longer resolves.
  const dirName = useFs((s) => s.nodes[cwd]?.name);
  const dir = dirName === undefined ? HOME : cwd;
  const prompt = `${user}@macbook ${dir === HOME ? "~" : dirName} %`;

  // Block body on purpose: newer browsers return a Promise from scrollIntoView, which React would treat as a cleanup.
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll whenever new output is appended
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lines]);
  useCommand(win.id, (command) => command === "clear" && setLines([]));

  // macOS Terminal titles windows with the shell and the grid size in character cells.
  const cols = Math.floor((win.w - 24) / 7.2);
  const rows = Math.floor((win.h - 44) / 17);
  const title = `${user} — -zsh — ${cols}×${rows}`;
  const update = useWindows((s) => s.update);
  useEffect(() => update(win.id, { title }), [update, win.id, title]);

  const submit = () => {
    const output = [`${prompt} ${input}`];
    const nextHistory = input.trim() ? [...history, input] : history;
    let cleared = false;
    run(input, {
      cwd: dir,
      user,
      history: nextHistory,
      setCwd,
      print: (text) => output.push(text),
      clear: () => {
        cleared = true;
      },
      open: openNode,
    });
    setLines((prev) => (cleared ? [] : [...prev, ...output]));
    setHistory(nextHistory);
    setCursor(nextHistory.length);
    setInput("");
  };

  const recall = (index: number) => {
    if (index < 0 || index > history.length) return;
    setCursor(index);
    setInput(history[index] ?? "");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") submit();
    else if (e.key === "ArrowUp") recall(cursor - 1);
    else if (e.key === "ArrowDown") recall(cursor + 1);
    else if (e.key === "Tab") {
      const result = complete(input, dir);
      setInput(result.line);
      if (result.options.length) setLines((prev) => [...prev, `${prompt} ${input}`, result.options.join("  ")]);
    } else if (e.key === "c" && e.ctrlKey) {
      setLines((prev) => [...prev, `${prompt} ${input}^C`]);
      setInput("");
    } else return;
    e.preventDefault();
  };

  return (
    <div
      role="log"
      className="h-full overflow-y-auto bg-[#1e1e1e] px-2.5 py-2 font-mono text-[12px] text-[#e7e7e7] leading-[17px]"
      onMouseUp={() => !getSelection()?.toString() && inputRef.current?.focus()}
    >
      {lines.map((line, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the log is append-only, so positions are stable
        <pre key={i} className="whitespace-pre-wrap break-all">
          {line}
        </pre>
      ))}
      <div ref={endRef} className="flex gap-2">
        <span className="shrink-0">{prompt}</span>
        <input
          ref={inputRef}
          // biome-ignore lint/a11y/noAutofocus: a new terminal window should accept typing immediately
          autoFocus
          aria-label="Command"
          spellCheck={false}
          autoComplete="off"
          className="flex-1 bg-transparent caret-[#e7e7e7] outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
}
