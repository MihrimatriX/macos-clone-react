import { beforeEach, expect, test } from "bun:test";
import { activeAppId, useWindows } from "./windows";

beforeEach(() => useWindows.setState({ wins: [], focusedId: null, topZ: 0 }));
const wm = () => useWindows.getState();

test("open focuses the new window and stacks it on top", () => {
  const a = wm().open("finder");
  const b = wm().open("terminal");
  expect(wm().focusedId).toBe(b);
  wm().focus(a);
  const [winA, winB] = wm().wins;
  expect(winA && winB && winA.z > winB.z).toBe(true);
  expect(activeAppId(wm())).toBe("finder");
});

test("single-instance apps reuse their window", () => {
  const first = wm().open("settings");
  const second = wm().open("settings", { pane: "Dock" });
  expect(second).toBe(first);
  expect(wm().wins).toHaveLength(1);
  expect(wm().wins[0]?.props.pane).toBe("Dock");
});

test("minimize and close move focus to the next visible window", () => {
  const a = wm().open("finder");
  const b = wm().open("finder");
  wm().minimize(b);
  expect(wm().focusedId).toBe(a);
  wm().close(a);
  expect(wm().focusedId).toBeNull();
  wm().focus(b);
  expect(wm().wins[0]?.minimized).toBe(false);
});

test("dirty windows ask before closing", () => {
  const id = wm().open("textedit");
  wm().update(id, { dirty: true });
  wm().requestClose(id);
  expect(wm().wins[0]?.confirmClose).toBe(true);
});

test("cycle brings the app's bottom window to the front", () => {
  const a = wm().open("finder");
  wm().open("finder");
  wm().cycle("finder");
  expect(wm().focusedId).toBe(a);
});

test("quit closes every window of the app", () => {
  wm().open("finder");
  wm().open("finder");
  wm().open("terminal");
  wm().quit("finder");
  expect(wm().wins.map((w) => w.appId)).toEqual(["terminal"]);
});
