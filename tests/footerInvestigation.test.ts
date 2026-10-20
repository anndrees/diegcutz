import { describe, expect, test } from "bun:test";
import { FooterAdminGesture } from "../src/lib/footerAdminGesture";

const fresh = () => new FooterAdminGesture(["year", "year", "year"]);
const tap = (g: FooterAdminGesture, target: "year" | null = "year") => {
  g.down(target, 1, 20, 20);
  return g.up(target, 1, 20, 20);
};
describe("temporary investigation footer reveal", () => {
  test("exactly three consecutive taps reveal it", () => {
    const g = fresh();
    expect(tap(g)).toBe(false);
    expect(tap(g)).toBe(false);
    expect(tap(g)).toBe(true);
  });
  test("an unrelated tap interrupts the sequence", () => {
    const g = fresh();
    tap(g); tap(g); tap(g, null);
    expect(tap(g)).toBe(false);
    expect(tap(g)).toBe(false);
    expect(tap(g)).toBe(true);
  });
  test("one pixel of movement interrupts the sequence", () => {
    const g = fresh(); tap(g);
    g.down("year", 1, 20, 20); g.move(1, 21, 20);
    expect(g.up("year", 1, 20, 20)).toBe(false);
    expect(tap(g)).toBe(false);
  });
  test("scroll reset interrupts and reopening starts hidden", () => {
    const g = fresh(); tap(g); tap(g); g.reset();
    expect(tap(g)).toBe(false);
    expect(tap(fresh())).toBe(false);
  });
});