import { test, expect } from "bun:test";
import { upcomingDateFor } from "../src/lib/upcomingDate";
const fri = new Date(2026, 9, 23);
test("today maps to today's date", () => expect(upcomingDateFor(5, fri)).toBe("2026-10-23"));
test("next Monday, not one weeks away", () => expect(upcomingDateFor(1, fri)).toBe("2026-10-26"));
