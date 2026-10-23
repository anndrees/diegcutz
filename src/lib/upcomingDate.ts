/** Local YYYY-MM-DD of the next occurrence (today included) of a weekday. */
export function upcomingDateFor(dow: number, now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + ((dow - now.getDay() + 7) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
