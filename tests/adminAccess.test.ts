import { describe, expect, test } from "bun:test";
import { verifyAdminAccess } from "../src/lib/adminAccess";

const diego = "1aa734f7-e5fe-43f2-bf93-f060a0c31734";
const andres = "ccb9ac4f-18f7-45a1-9923-edef706dfc78";

describe("shared normal-session admin access", () => {
  test("signed-out visitors have no admin access even if a role check would allow it", async () => {
    let calls = 0;
    expect(await verifyAdminAccess(null, async () => { calls++; return true; })).toBe(false);
    expect(calls).toBe(0);
  });
  test("Diego's existing session enters with its verified admin role", async () => {
    expect(await verifyAdminAccess(diego, async id => id === diego)).toBe(true);
  });
  test("Andres's existing session enters with its verified admin role", async () => {
    expect(await verifyAdminAccess(andres, async id => id === andres)).toBe(true);
  });
  test("signed-in customers without an admin role are denied", async () => {
    expect(await verifyAdminAccess("customer", async () => false)).toBe(false);
  });
  test("a named admin without server-confirmed permission is denied", async () => {
    expect(await verifyAdminAccess(andres, async () => false)).toBe(false);
  });
  test("failed role checks deny access", async () => {
    expect(await verifyAdminAccess(diego, async () => { throw new Error("Offline"); })).toBe(false);
  });
});