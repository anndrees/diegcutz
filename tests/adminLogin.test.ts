import { describe, expect, test } from "bun:test";
import { adminLoginAttempts } from "@/lib/adminLogin";

describe("admin login identifiers", () => {
  test("an email signs in by email only", () => {
    expect(adminLoginAttempts(" Diego@Example.com ")).toEqual([{ email: "diego@example.com" }]);
  });
  test("a Spanish phone tries the phone and the legacy phone account", () => {
    expect(adminLoginAttempts("600 123 456")).toEqual([
      { phone: "+34600123456" },
      { email: "34600123456@phone.diegcutz.local" },
    ]);
  });
  test("an empty identifier never attempts a sign-in", () => {
    expect(adminLoginAttempts("   ")).toEqual([]);
  });
});
