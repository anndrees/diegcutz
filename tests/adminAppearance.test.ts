import { describe, expect, test } from "bun:test";
import { ADMIN_APPEARANCE_KEY, isAdminAppearanceRoute, readAdminAppearance, saveAdminAppearance } from "../src/lib/adminAppearance";

describe("admin-only appearance", () => {
  test("selection survives reopening, including switching back to light", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    expect(readAdminAppearance(storage)).toBe("light");
    saveAdminAppearance(storage, "dark");
    expect(values.get(ADMIN_APPEARANCE_KEY)).toBe("dark");
    expect(readAdminAppearance(storage)).toBe("dark");
    saveAdminAppearance(storage, "light");
    expect(readAdminAppearance(storage)).toBe("light");
  });
  test("only admin pages receive the appearance", () => {
    expect(isAdminAppearanceRoute("/admin")).toBe(true);
    expect(isAdminAppearanceRoute("/admin/client/123")).toBe(true);
    for (const path of ["/", "/booking", "/tv", "/tilt-fade", "/administrator"]) expect(isAdminAppearanceRoute(path)).toBe(false);
  });
  test("invalid or unavailable storage falls back safely", () => {
    expect(readAdminAppearance({ getItem: () => "invalid" })).toBe("light");
    expect(readAdminAppearance({ getItem: () => { throw new Error("unavailable"); } })).toBe("light");
    expect(() => saveAdminAppearance({ setItem: () => { throw new Error("unavailable"); } }, "dark")).not.toThrow();
  });
});