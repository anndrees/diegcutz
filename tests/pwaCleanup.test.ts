import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
const scope = "https://diegcutz.es/";

async function activate(failListing = false) {
  const events: Record<string, (event: { waitUntil: (promise: Promise<void>) => void }) => void> = {};
  const deleted: string[] = [];
  const navigated: string[] = [];
  let unregistered = false;
  let activation = Promise.resolve();
  runInNewContext(source, {
    self: {
      registration: { scope, unregister: async () => { unregistered = true; } },
      skipWaiting: async () => {},
      addEventListener: (name: string, handler: typeof events[string]) => { events[name] = handler; },
      clients: {
        claim: async () => {},
        matchAll: async () => [{ url: `${scope}booking`, navigate: async (url: string) => { navigated.push(url); } }],
      },
    },
    caches: {
      keys: async () => {
        if (failListing) throw new Error("Cache unavailable");
        return [`workbox-precache-v2-${scope}`, `workbox-runtime-${scope}`, "messaging-cache", "unrelated-data", "workbox-precache-v2-https://other.example/"];
      },
      delete: async (name: string) => { deleted.push(name); return true; },
    },
  });
  events.activate({ waitUntil: promise => { activation = promise; } });
  try { await activation; } catch { /* Failure must not strand the old worker. */ }
  return { deleted, navigated, unregistered };
}

describe("retired app-shell cleanup", () => {
  test("deletes only this registration's old Workbox caches and preserves messaging/unrelated caches", async () => {
    expect((await activate()).deleted).toEqual([`workbox-precache-v2-${scope}`, `workbox-runtime-${scope}`]);
  });
  test("returning visitors navigate back to their current page and the worker unregisters", async () => {
    const result = await activate();
    expect(result.navigated).toEqual([`${scope}booking`]);
    expect(result.unregistered).toBe(true);
  });
  test("cache failure still unregisters the retired worker", async () => {
    expect((await activate(true)).unregistered).toBe(true);
  });
});