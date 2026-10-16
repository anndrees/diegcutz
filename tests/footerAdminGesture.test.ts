import { describe, expect, test } from "bun:test";
import { FooterAdminGesture, type FooterAdminPart } from "../src/lib/footerAdminGesture";

function tap(gesture: FooterAdminGesture, part: FooterAdminPart | null) {
  gesture.down(part, 1, 10, 10);
  return gesture.up(part, 1, 10, 10);
}

describe("mobile footer admin entry", () => {
  test("year → DIEGCUTZ → Monóvar opens only on the third tap without a timeout", async () => {
    const gesture = new FooterAdminGesture();
    expect(tap(gesture, "year")).toBe(false);
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(tap(gesture, "brand")).toBe(false);
    expect(tap(gesture, "place")).toBe(true);
  });
  test("wrong order never opens", () => {
    const gesture = new FooterAdminGesture();
    expect(tap(gesture, "brand")).toBe(false);
    expect(tap(gesture, "year")).toBe(false);
    expect(tap(gesture, "place")).toBe(false);
  });
  test("an unrelated tap cancels the entire sequence", () => {
    const gesture = new FooterAdminGesture();
    tap(gesture, "year");
    tap(gesture, null);
    tap(gesture, "brand");
    expect(tap(gesture, "place")).toBe(false);
  });
  test("even 1px movement cancels, including returning to the starting point", () => {
    const gesture = new FooterAdminGesture();
    tap(gesture, "year");
    gesture.down("brand", 1, 10, 10);
    gesture.move(1, 10, 11);
    gesture.move(1, 10, 10);
    expect(gesture.up("brand", 1, 10, 10)).toBe(false);
    expect(tap(gesture, "place")).toBe(false);
  });
  test("an intervening scroll or other interruption cancels but allows a fresh sequence", () => {
    const gesture = new FooterAdminGesture();
    tap(gesture, "year");
    tap(gesture, "brand");
    gesture.reset();
    expect(tap(gesture, "place")).toBe(false);
    tap(gesture, "year");
    tap(gesture, "brand");
    expect(tap(gesture, "place")).toBe(true);
  });
  test("multiple simultaneous fingers invalidate the sequence", () => {
    const gesture = new FooterAdminGesture();
    gesture.down("year", 1, 10, 10);
    gesture.down("year", 2, 10, 10);
    gesture.up("year", 1, 10, 10);
    tap(gesture, "brand");
    expect(tap(gesture, "place")).toBe(false);
  });
});