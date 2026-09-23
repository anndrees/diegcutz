export function normalizePhoneForWhatsApp(raw?: string | null, defaultCountryCode = "34") {
  if (!raw || raw.includes("@")) return null;
  let digits = raw.trim().replace(/^00/, "").replace(/\D/g, "");
  if (digits.length === 9) digits = `${defaultCountryCode}${digits}`;
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}
export function buildWhatsAppUrl(raw?: string | null, message?: string) {
  const phone = normalizePhoneForWhatsApp(raw);
  if (!phone) return null;
  return `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
