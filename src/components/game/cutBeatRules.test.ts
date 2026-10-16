import { describe, expect, test } from "bun:test";
import { cutPoints, cutTime, finalRank, judgeCut, TOTAL_CUTS } from "./cutBeatRules";

describe("CUT / BEAT timing and scoring", () => {
  test("precision is symmetric with exact grade boundaries", () => {
    expect(judgeCut(70)).toBe("PERFECT");
    expect(judgeCut(-70)).toBe("PERFECT");
    expect(judgeCut(71)).toBe("CLEAN");
    expect(judgeCut(-160)).toBe("CLEAN");
    expect(judgeCut(161)).toBe("MISS");
  });
  test("misses cannot award points and combo multipliers are capped", () => {
    expect(cutPoints("MISS", 24)).toBe(0);
    expect(cutPoints("PERFECT", 0)).toBe(100);
    expect(cutPoints("CLEAN", 6)).toBe(120);
    expect(cutPoints("PERFECT", 100)).toBe(400);
  });
  test("each mode has 24 ordered beat times after the countdown", () => {
    expect(TOTAL_CUTS).toBe(24);
    expect(cutTime(0, "flow")).toBe(3600);
    expect(cutTime(23, "flow")).toBe(17400);
    expect(cutTime(1, "rush")).toBeGreaterThan(cutTime(0, "rush"));
  });
  test("ranks are earned from completed cuts", () => {
    expect(finalRank(22, 24)).toBe("MASTER CUT");
    expect(finalRank(0, 20)).toBe("FRESH CUT");
    expect(finalRank(0, 12)).toBe("BUEN PULSO");
    expect(finalRank(0, 11)).toBe("OTRA RONDA");
  });
});