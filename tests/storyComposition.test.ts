import { expect, test } from "bun:test";
import { storyFitScale } from "../src/lib/storyComposition";

test("composition preserves proportions in editor and tall viewer", () => {
  expect(storyFitScale(360, 640)).toBe(1);
  expect(storyFitScale(180, 320)).toBe(.5);
  expect(storyFitScale(360, 800)).toBe(1);
  expect(storyFitScale(720, 640)).toBe(1);
});
test("zero sized frames never produce negative scale", () => {
  expect(storyFitScale(0, 640)).toBe(0);
  expect(storyFitScale(360, 0)).toBe(0);
});