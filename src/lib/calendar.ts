type CalendarBooking = { date: string; time: string; services: string[]; id?: string };
const clean = (value: string) => value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
const localStamp = (date: string, time: string) => `${date.replace(/-/g, "")}T${time.slice(0, 8).replace(/:/g, "").padEnd(6, "0")}`;
const endStamp = (date: string, time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  const end = new Date(`${date}T00:00:00`); end.setHours(hours + 1, minutes || 0, 0, 0);
  const yyyy = end.getFullYear(); const mm = String(end.getMonth() + 1).padStart(2, "0"); const dd = String(end.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}T${String(end.getHours()).padStart(2, "0")}${String(end.getMinutes()).padStart(2, "0")}00`;
};
const compactUtc = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
export function getCalendarEvent(booking: CalendarBooking) {
  const start = new Date(`${booking.date}T${booking.time}`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const title = "Cita en DIEGCUTZ";
  const details = `Servicios: ${booking.services.join(", ")}`;
  const location = "Carrer Sant Antoni, Monóvar, Alicante, 03640";
  return { start, end, title, details, location };
}
export function googleCalendarUrl(booking: CalendarBooking) {
  const e = getCalendarEvent(booking);
  const p = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: `${localStamp(booking.date, booking.time)}/${endStamp(booking.date, booking.time)}`, ctz: "Europe/Madrid", details: e.details, location: e.location });
  return `https://calendar.google.com/calendar/render?${p}`;
}
export function downloadIcs(booking: CalendarBooking) {
  const e = getCalendarEvent(booking);
  const body = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//DIEGCUTZ//Reservas//ES","CALSCALE:GREGORIAN","BEGIN:VEVENT",`UID:${booking.id || Date.now()}@diegcutz.es`,`DTSTAMP:${compactUtc(new Date())}`,`DTSTART;TZID=Europe/Madrid:${localStamp(booking.date, booking.time)}`,`DTEND;TZID=Europe/Madrid:${endStamp(booking.date, booking.time)}`,`SUMMARY:${clean(e.title)}`,`DESCRIPTION:${clean(e.details)}`,`LOCATION:${clean(e.location)}`,"END:VEVENT","END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = `diegcutz-${booking.date}.ics`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
