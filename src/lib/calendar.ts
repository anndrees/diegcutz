type CalendarBooking = { date: string; time: string; services: string[]; id?: string };
const clean = (value: string) => value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
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
  const p = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates: `${compactUtc(e.start)}/${compactUtc(e.end)}`, details: e.details, location: e.location });
  return `https://calendar.google.com/calendar/render?${p}`;
}
export function downloadIcs(booking: CalendarBooking) {
  const e = getCalendarEvent(booking);
  const body = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//DIEGCUTZ//Reservas//ES","BEGIN:VEVENT",`UID:${booking.id || Date.now()}@diegcutz.es`,`DTSTAMP:${compactUtc(new Date())}`,`DTSTART:${compactUtc(e.start)}`,`DTEND:${compactUtc(e.end)}`,`SUMMARY:${clean(e.title)}`,`DESCRIPTION:${clean(e.details)}`,`LOCATION:${clean(e.location)}`,"END:VEVENT","END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = `diegcutz-${booking.date}.ics`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
