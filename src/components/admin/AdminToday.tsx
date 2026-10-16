import { useMemo } from "react";
import { format, isToday, isThisWeek, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, QrCode, Scissors, Wallet, Clock, ChevronRight } from "lucide-react";

type Booking = {
  id: string;
  booking_date: string;
  booking_time: string;
  client_name: string;
  client_contact: string;
  services: string[];
  total_price: number;
  is_cancelled?: boolean;
};

interface AdminTodayProps {
  bookings: Booking[];
  loading: boolean;
  onOpenQr?: () => void;
  onGoBookings: () => void;
}

const greeting = () => {
  const h = new Date().getHours();
  if (h < 8) return "Madrugando";
  if (h < 14) return "Buenos días";
  if (h < 21) return "Buenas tardes";
  return "Buenas noches";
};

export const AdminToday = ({ bookings, loading, onOpenQr, onGoBookings }: AdminTodayProps) => {
  const now = new Date();

  const { todayBookings, todayRevenue, nextBooking, weekCount } = useMemo(() => {
    const active = bookings.filter((b) => !b.is_cancelled);
    const today = active
      .filter((b) => isToday(parseISO(b.booking_date)))
      .sort((a, b) => a.booking_time.localeCompare(b.booking_time));
    const revenue = today.reduce((sum, b) => sum + (b.total_price || 0), 0);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const next = today.find((b) => {
      const [h, m] = b.booking_time.split(":").map(Number);
      return h * 60 + m >= nowMinutes;
    });
    const week = active.filter((b) => {
      const d = parseISO(b.booking_date);
      return isThisWeek(d, { weekStartsOn: 1 }) && d >= new Date(now.toDateString());
    }).length;
    return { todayBookings: today, todayRevenue: revenue, nextBooking: next, weekCount: week };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings]);

  const nextCountdown = useMemo(() => {
    if (!nextBooking) return null;
    const [h, m] = nextBooking.booking_time.split(":").map(Number);
    const diff = h * 60 + m - (now.getHours() * 60 + now.getMinutes());
    if (diff <= 0) return "ahora";
    if (diff < 60) return `en ${diff} min`;
    const hours = Math.floor(diff / 60);
    return `en ${hours}h ${diff % 60 > 0 ? `${diff % 60}m` : ""}`.trim();
  }, [nextBooking, now]);

  return (
    <div className="admin-today">
      <section className="admin-today__hero">
        <p className="admin-today__greeting">{greeting()}, Diego</p>
        <p className="admin-today__date">{format(now, "EEEE d 'de' MMMM", { locale: es })}</p>
      </section>

      <section className="admin-today__stats">
        <div className="admin-today__stat">
          <Calendar className="h-4 w-4" />
          <strong>{loading ? "…" : todayBookings.length}</strong>
          <span>citas hoy</span>
        </div>
        <div className="admin-today__stat">
          <Wallet className="h-4 w-4" />
          <strong>{loading ? "…" : `${todayRevenue}€`}</strong>
          <span>ingresos hoy</span>
        </div>
        <div className="admin-today__stat">
          <Clock className="h-4 w-4" />
          <strong>{nextBooking ? nextBooking.booking_time.slice(0, 5) : "—"}</strong>
          <span>{nextBooking ? `próxima ${nextCountdown}` : "sin más citas"}</span>
        </div>
        <div className="admin-today__stat">
          <Scissors className="h-4 w-4" />
          <strong>{loading ? "…" : weekCount}</strong>
          <span>esta semana</span>
        </div>
      </section>

      <section className="admin-today__actions">
        {onOpenQr && (
          <button type="button" className="admin-today__action admin-today__action--red" onClick={onOpenQr}>
            <QrCode className="h-5 w-5" />
            <span>Escanear QR</span>
          </button>
        )}
        <button type="button" className="admin-today__action" onClick={onGoBookings}>
          <Calendar className="h-5 w-5" />
          <span>Gestionar reservas</span>
        </button>
      </section>

      <section className="admin-today__list">
        <div className="admin-today__list-head">
          <h2>Citas de hoy</h2>
          <button type="button" onClick={onGoBookings} className="admin-today__list-link">
            Ver todas <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {loading ? (
          <p className="admin-today__empty">Cargando…</p>
        ) : todayBookings.length === 0 ? (
          <p className="admin-today__empty">No hay citas para hoy. Día libre.</p>
        ) : (
          todayBookings.map((b) => (
            <article key={b.id} className="admin-today__card">
              <div className="admin-today__card-time">
                <strong>{b.booking_time.slice(0, 5)}</strong>
              </div>
              <div className="admin-today__card-body">
                <p className="admin-today__card-name">{b.client_name}</p>
                <p className="admin-today__card-services">
                  {b.services && b.services.length > 0 ? b.services.join(" · ") : "Sin servicios"}
                </p>
              </div>
              <div className="admin-today__card-price">{b.total_price}€</div>
            </article>
          ))
        )}
      </section>
    </div>
  );
};
