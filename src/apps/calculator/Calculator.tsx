import { useEffect, useRef, useState } from "react";
import type { AppProps } from "../../os/apps";
import { useCommand, useWindows } from "../../os/windows";
import { FUNCTIONS, type Input, initial, inputForKey, type Op, press } from "./calc";

const SCIENTIFIC_MIN_WIDTH = 520;
const SIZES = { basic: { w: 250, h: 390 }, scientific: { w: 620, h: 390 } };

interface Key {
  label: string;
  input: Input;
  tone?: "fn" | "op" | "light";
  wide?: boolean;
}

const op = (o: Op): Key => ({ label: o, input: { type: "op", op: o }, tone: "op" });
const digit = (d: string, wide = false): Key => ({ label: d, input: { type: "digit", digit: d }, wide });

const BASIC: Key[] = [
  { label: "AC", input: { type: "clear" }, tone: "light" },
  { label: "±", input: { type: "sign" }, tone: "light" },
  { label: "%", input: { type: "percent" }, tone: "light" },
  op("÷"),
  ...["7", "8", "9"].map((d) => digit(d)),
  op("×"),
  ...["4", "5", "6"].map((d) => digit(d)),
  op("−"),
  ...["1", "2", "3"].map((d) => digit(d)),
  op("+"),
  digit("0", true),
  { label: ".", input: { type: "dot" } },
  { label: "=", input: { type: "equals" }, tone: "op" },
];

const SCIENTIFIC: Key[] = [
  ...Object.keys(FUNCTIONS).map((name): Key => ({ label: name, input: { type: "fn", name }, tone: "fn" })),
  { label: "xʸ", input: { type: "op", op: "^" }, tone: "fn" },
  { label: "π", input: { type: "value", value: Math.PI }, tone: "fn" },
  { label: "e", input: { type: "value", value: Math.E }, tone: "fn" },
];

// Calculator is always dark, like the macOS app, regardless of system appearance.
const TONES = {
  fn: "bg-[#2c2c2e] text-[13px]",
  op: "bg-[#ff9f0a] text-[22px]",
  light: "bg-[#5c5c5f]",
  digit: "bg-[#3a3a3c]",
};

export default function Calculator({ win }: AppProps) {
  const [state, setState] = useState(initial);
  const ref = useRef<HTMLDivElement>(null);
  const scientific = win.w >= SCIENTIFIC_MIN_WIDTH;
  const send = (input: Input) => setState((s) => press(s, input));

  useEffect(() => ref.current?.focus(), []);
  useCommand(win.id, (command) => {
    if (command === "basic" || command === "scientific") useWindows.getState().update(win.id, SIZES[command]);
  });

  const renderKey = (key: Key) => (
    <button
      key={key.label}
      type="button"
      className={`rounded-full text-[19px] text-white transition-[filter] active:brightness-150 ${TONES[key.tone ?? "digit"]} ${
        key.wide ? "col-span-2" : ""
      } ${state.op === key.label && state.fresh ? "bg-white! text-orange-400" : ""}`}
      onClick={() => send(key.input)}
    >
      {key.label}
    </button>
  );

  return (
    <div
      ref={ref}
      role="application"
      aria-label="Calculator"
      tabIndex={-1}
      className="flex h-full flex-col bg-[#1c1c1e]/95 px-2.5 pb-2.5 text-white outline-none"
      onKeyDown={(e) => {
        const input = inputForKey(e.key);
        if (!input || e.ctrlKey || e.metaKey) return;
        e.preventDefault();
        send(input);
      }}
    >
      <output className="titlebar truncate px-2 pt-9 pb-2 text-right font-light text-[46px] leading-none tabular-nums">
        {state.display}
      </output>
      <div className="flex min-h-0 flex-1 gap-2">
        {scientific && <div className="grid flex-[1.3] grid-cols-4 gap-2">{SCIENTIFIC.map(renderKey)}</div>}
        <div className="grid flex-1 grid-cols-4 gap-2">{BASIC.map(renderKey)}</div>
      </div>
    </div>
  );
}
