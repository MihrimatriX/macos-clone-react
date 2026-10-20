/** Calculator as a pure state machine: every key press maps (state, input) → state. No eval. */

export type Op = "+" | "−" | "×" | "÷" | "^";

export interface CalcState {
  display: string;
  /** Left operand waiting for the pending operator. */
  acc: number | null;
  op: Op | null;
  /** The next digit starts a new number instead of appending. */
  fresh: boolean;
}

const rad = (deg: number) => (deg * Math.PI) / 180;

function factorial(n: number) {
  if (!Number.isInteger(n) || n < 0 || n > 170) return Number.NaN;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

/** Unary scientific functions; trigonometry works in degrees like the macOS default. */
export const FUNCTIONS: Record<string, (x: number) => number> = {
  "x²": (x) => x ** 2,
  "x³": (x) => x ** 3,
  eˣ: Math.exp,
  "10ˣ": (x) => 10 ** x,
  "1/x": (x) => 1 / x,
  "√x": Math.sqrt,
  "∛x": Math.cbrt,
  ln: Math.log,
  log: Math.log10,
  "x!": factorial,
  sin: (x) => Math.sin(rad(x)),
  cos: (x) => Math.cos(rad(x)),
  tan: (x) => Math.tan(rad(x)),
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
};

export type Input =
  | { type: "digit"; digit: string }
  | { type: "dot" }
  | { type: "op"; op: Op }
  | { type: "equals" }
  | { type: "clear" }
  | { type: "back" }
  | { type: "sign" }
  | { type: "percent" }
  | { type: "fn"; name: string }
  | { type: "value"; value: number };

export const initial: CalcState = { display: "0", acc: null, op: null, fresh: true };

function apply(a: number, b: number, op: Op) {
  if (op === "+") return a + b;
  if (op === "−") return a - b;
  if (op === "×") return a * b;
  if (op === "÷") return a / b;
  return a ** b;
}

/** 12 significant digits hides binary float noise (0.1 + 0.2 → 0.3). */
export const format = (n: number) => (Number.isFinite(n) ? String(Number.parseFloat(n.toPrecision(12))) : "Error");

export function press(s: CalcState, input: Input): CalcState {
  const value = Number.parseFloat(s.display);
  switch (input.type) {
    case "digit":
      if (s.fresh) return { ...s, display: input.digit, fresh: false };
      if (s.display.replace(/\D/g, "").length >= 15) return s;
      return { ...s, display: s.display === "0" ? input.digit : s.display + input.digit };
    case "dot":
      if (s.fresh) return { ...s, display: "0.", fresh: false };
      return s.display.includes(".") ? s : { ...s, display: `${s.display}.` };
    case "op":
      if (s.op && s.acc !== null && !s.fresh) {
        const result = apply(s.acc, value, s.op);
        return { display: format(result), acc: result, op: input.op, fresh: true };
      }
      return { ...s, acc: value, op: input.op, fresh: true };
    case "equals":
      if (!s.op || s.acc === null) return { ...s, fresh: true };
      return { display: format(apply(s.acc, value, s.op)), acc: null, op: null, fresh: true };
    case "clear":
      return initial;
    case "back":
      if (s.fresh) return s;
      return { ...s, display: s.display.length > 1 ? s.display.slice(0, -1) : "0" };
    case "sign":
      return { ...s, display: s.display.startsWith("-") ? s.display.slice(1) : `-${s.display}` };
    case "percent":
      return { ...s, display: format(value / 100), fresh: true };
    case "fn":
      return { ...s, display: format(FUNCTIONS[input.name]?.(value) ?? value), fresh: true };
    case "value":
      return { ...s, display: format(input.value), fresh: true };
  }
}

/** Physical keyboard → calculator input. */
export function inputForKey(key: string): Input | null {
  if (/^\d$/.test(key)) return { type: "digit", digit: key };
  const ops: Record<string, Op> = { "+": "+", "-": "−", "*": "×", "/": "÷", "^": "^" };
  if (ops[key]) return { type: "op", op: ops[key] };
  if (key === "." || key === ",") return { type: "dot" };
  if (key === "Enter" || key === "=") return { type: "equals" };
  if (key === "Escape" || key === "Delete") return { type: "clear" };
  if (key === "Backspace") return { type: "back" };
  if (key === "%") return { type: "percent" };
  return null;
}
