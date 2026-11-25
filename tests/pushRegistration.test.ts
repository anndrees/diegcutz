import { afterEach, describe, expect, test } from "bun:test";
import { getPushRegistration } from "../src/lib/pushRegistration";

const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
const previousLocation = Object.getOwnPropertyDescriptor(globalThis, "location");
afterEach(() => {
  if (previousNavigator) Object.defineProperty(globalThis, "navigator", previousNavigator);
  else Reflect.deleteProperty(globalThis, "navigator");
  if (previousLocation) Object.defineProperty(globalThis, "location", previousLocation);
  else Reflect.deleteProperty(globalThis, "location");
});

function environment(registrations: unknown[], register: (...args: unknown[]) => Promise<unknown>) {
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { serviceWorker: { getRegistrations: async () => registrations, register } } });
  Object.defineProperty(globalThis, "location", { configurable: true, value: { origin: "https://diegcutz.es" } });
}

describe("dedicated messaging registration", () => {
  test("checking status without a worker returns immediately without creating an app-shell worker", async () => {
    let calls = 0;
    environment([], async () => { calls++; });
    expect(await getPushRegistration()).toBeUndefined();
    expect(calls).toBe(0);
  });
  test("retired /sw.js is not used for messaging", async () => {
    environment([{ active: { scriptURL: "https://diegcutz.es/sw.js" } }], async () => {});
    expect(await getPushRegistration()).toBeUndefined();
  });
  test("activation registers /sw-push.js only at /push/ so customer pages are outside its scope", async () => {
    const calls: unknown[][] = [];
    const registration = { active: { scriptURL: "https://diegcutz.es/sw-push.js" } };
    environment([], async (...args) => { calls.push(args); return registration; });
    expect(await getPushRegistration(true)).toBe(registration as never);
    expect(calls).toEqual([["/sw-push.js", { scope: "/push/" }]]);
  });
});