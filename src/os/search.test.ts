import { expect, test } from "bun:test";
import { evaluate, fuzzyScore, looksLikeMath } from "./search";

test("evaluate respects precedence, parentheses and power", () => {
  expect(evaluate("2+3*4")).toBe(14);
  expect(evaluate("(2+3)*4")).toBe(20);
  expect(evaluate("2^3^2")).toBe(512);
  expect(evaluate("-2^2")).toBe(-4);
  expect(evaluate("10 % 4")).toBe(2);
  expect(evaluate("3 × 4 ÷ 2")).toBe(6);
});

test("evaluate supports functions and constants", () => {
  expect(evaluate("sqrt(16)+1")).toBe(5);
  expect(evaluate("2*pi")).toBeCloseTo(6.283, 3);
});

test("evaluate rejects anything that is not arithmetic", () => {
  expect(evaluate("2+")).toBeNull();
  expect(evaluate("(1+2")).toBeNull();
  expect(evaluate("alert(1)")).toBeNull();
  expect(evaluate("1/0")).toBeNull();
});

test("looksLikeMath ignores bare numbers and words", () => {
  expect(looksLikeMath("42")).toBe(false);
  expect(looksLikeMath("notes")).toBe(false);
  expect(looksLikeMath("6*7")).toBe(true);
});

test("fuzzyScore matches subsequences case-insensitively", () => {
  expect(fuzzyScore("fdr", "Finder")).not.toBeNull();
  expect(fuzzyScore("SET", "System Settings")).not.toBeNull();
  expect(fuzzyScore("xyz", "Finder")).toBeNull();
  expect(fuzzyScore("rf", "Finder")).toBeNull();
});
