/** Pure search helpers for Spotlight: fuzzy matching and an inline calculator (recursive descent, no eval). */

const FUNCTIONS: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  log: Math.log10,
  ln: Math.log,
  abs: Math.abs,
};
const CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E };

/** Evaluates arithmetic like "2*(3+4)^2 / sqrt(16)"; returns null for anything that is not a complete expression. */
export function evaluate(input: string): number | null {
  const src = input.replace(/\s+/g, "").replace(/×/g, "*").replace(/÷/g, "/").replace(/,/g, ".").toLowerCase();
  if (!/^[\d.+\-*/^%()a-z]+$/.test(src)) return null;
  let pos = 0;
  const peek = () => src[pos] ?? "";

  const expr = (): number => {
    let value = term();
    while (peek() === "+" || peek() === "-") value = src[pos++] === "+" ? value + term() : value - term();
    return value;
  };
  const term = (): number => {
    let value = unary();
    while (peek() && "*/%".includes(peek())) {
      const op = src[pos++];
      const right = unary();
      if (op === "*") value *= right;
      else if (op === "/") value /= right;
      else value %= right;
    }
    return value;
  };
  // Unary minus binds looser than ^, so -2^2 = -4 as in maths.
  const unary = (): number => {
    if (peek() === "-") {
      pos++;
      return -unary();
    }
    if (peek() === "+") pos++;
    return power();
  };
  const power = (): number => {
    const base = atom();
    if (peek() !== "^") return base;
    pos++;
    return base ** unary();
  };
  const atom = (): number => {
    if (peek() === "(") {
      pos++;
      const value = expr();
      if (src[pos++] !== ")") throw new Error("unbalanced");
      return value;
    }
    const number = /^(\d+\.?\d*|\.\d+)/.exec(src.slice(pos));
    if (number) {
      pos += number[0].length;
      return Number(number[0]);
    }
    const word = /^[a-z]+/.exec(src.slice(pos))?.[0] ?? "";
    pos += word.length;
    const fn = FUNCTIONS[word];
    if (fn && peek() === "(") return fn(atom());
    const constant = CONSTANTS[word];
    if (constant === undefined) throw new Error(`unknown ${word}`);
    return constant;
  };

  try {
    const value = expr();
    return pos === src.length && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

/** True when the query is worth showing as a calculation (a bare number is not). */
export const looksLikeMath = (query: string) => /[-+*/^%×÷(]/.test(query) && evaluate(query) !== null;

/**
 * Scores how well `query` fuzzy-matches `text`; higher is better, null means no match.
 * Every query character must appear in `text` in order (case-insensitive).
 */
export function fuzzyScore(query: string, text: string): number | null {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  const positions: number[] = [];
  let from = 0;
  for (const ch of q) {
    const at = t.indexOf(ch, from);
    if (at < 0) return null;
    positions.push(at);
    from = at + 1;
  }
  // TODO(human): turn `positions` (index in `text` where each query character matched) into a ranking score.
  return 1;
}
