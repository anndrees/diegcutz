export type AdminLoginAttempt = { email: string } | { phone: string };

/** Same identifier rules as the customer login: email, or Spanish phone with the legacy dummy-email fallback. */
export function adminLoginAttempts(identifier: string): AdminLoginAttempt[] {
  const value = identifier.trim();
  if (!value) return [];
  if (value.includes("@")) return [{ email: value.toLowerCase() }];
  const digits = value.replace(/\s+/g, "");
  const phone = digits.startsWith("+") ? digits : `+34${digits}`;
  return [{ phone }, { email: `${phone.replace("+", "")}@phone.diegcutz.local` }];
}
