export type AdminAppearance = "light" | "dark";
export const ADMIN_APPEARANCE_KEY = "dc-admin-appearance";

export function readAdminAppearance(storage: Pick<Storage, "getItem">): AdminAppearance {
  try {
    return storage.getItem(ADMIN_APPEARANCE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function saveAdminAppearance(storage: Pick<Storage, "setItem">, appearance: AdminAppearance) {
  try { storage.setItem(ADMIN_APPEARANCE_KEY, appearance); } catch { /* Still usable without storage. */ }
}

export function isAdminAppearanceRoute(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}