import { expect, test } from "bun:test";
import { type CalcState, initial, inputForKey, press } from "./calc";

const type = (keys: string, state: CalcState = initial) =>
  [...keys].reduce((s, key) => {
    const input = inputForKey(key);
    if (!input) throw new Error(`unmapped key ${key}`);
    return press(s, input);
  }, state).display;

test("basic arithmetic with operator precedence left to right", () => {
  expect(type("12+30=")).toBe("42");
  expect(type("2+3*4=")).toBe("20");
  expect(type("9/3-1=")).toBe("2");
});

test("decimal noise is hidden", () => {
  expect(type("0.1+0.2=")).toBe("0.3");
});

test("division by zero shows Error and the next digit recovers", () => {
  expect(type("5/0=")).toBe("Error");
  expect(type("5/0=7")).toBe("7");
});

test("only one decimal point per number", () => {
  expect(type("1..5")).toBe("1.5");
});

test("functions and sign", () => {
  expect(press({ ...initial, display: "9" }, { type: "fn", name: "√x" }).display).toBe("3");
  expect(press({ ...initial, display: "30" }, { type: "fn", name: "sin" }).display).toBe("0.5");
  expect(press({ ...initial, display: "5" }, { type: "fn", name: "x!" }).display).toBe("120");
  expect(press({ ...initial, display: "4" }, { type: "sign" }).display).toBe("-4");
});

test("backspace and clear", () => {
  expect(press(press(initial, { type: "digit", digit: "7" }), { type: "back" }).display).toBe("0");
  expect(press({ ...initial, display: "8", acc: 3, op: "+" }, { type: "clear" })).toEqual(initial);
});
