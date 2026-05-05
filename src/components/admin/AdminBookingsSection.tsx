import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, isToday, isThisWeek, parseISO, addHours, isThisMonth } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarIcon, Search, Edit2, Trash2, X, RotateCcw, CheckCircle,
  Music, ExternalLink, Sparkles, Users, TrendingUp, Activity, Flame, Calendar as CalIcon,
  SlidersHorizontal, RotateCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";

export type AdminBooking = {
  id: string;
  booking_date: string;
  booking_time: string;
  client_name: string;
  client_contact: string;
  services: string[];
  total_price: number;
  user_id?: string | null;
  is_cancelled?: boolean;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  playlist_url?: string | null;
  profile?: { full_name: string; username: string; contact_value: string } | null;
};

type Props = {
  bookings: AdminBooking[];
  loading: boolean;
  onReload: () => void;
  onEdit: (b: AdminBooking) => void;
  onCancel: (b: AdminBooking, mode: "cancel" | "reschedule") => void;
  onDelete: (id: string) => void;
  onReactivate: (id: string) => void;
  onSelectDay: (date: Date) => void;
};

const isPastBooking = (b: AdminBooking) => {
  const dt = parseISO(`${b.booking_date}T${b.booking_time}`);
  return new Date() > addHours(dt, 2);
};

const StatTile = ({
  label, value, icon: Icon, color, sub,
}: {
  label: string; value: string | number; icon: any; color: string; sub?: string;
}) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.02 }}
    className="relative overflow-hidden rounded-xl border-2 p-4 backdrop-blur-md bg-card/50"
    style={{ borderColor: `${color}55`, boxShadow: `0 0 30px ${color}22` }}
  >
    <div
      className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-30"
      style={{ background: color }}
    />
    <div className="relative flex items-start justify-between">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</p>
        <p className="text-3xl font-black mt-1 font-mono tabular-nums" style={{ color, textShadow: `0 0 14px ${color}88` }}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
      <div className="rounded-lg p-2" style={{ background: `${color}22`, color }}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </motion.div>
);

const StatusChip = ({ booking }: { booking: AdminBooking }) => {
  if (booking.is_cancelled)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-destructive/20 text-destructive border border-destructive/40">
        ✕ Cancelada
      </span>
    );
  if (isPastBooking(booking))
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
        ✓ Completada
      </span>
    );
  if (isToday(parseISO(booking.booking_date)))
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40 shadow-[0_0_12px_hsl(var(--neon-cyan)/0.5)]">
        <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" /> Hoy
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple border border-neon-purple/40">
      Próxima
    </span>
  );
};

export const AdminBookingsSection = ({
  bookings, loading, onReload, onEdit, onCancel, onDelete, onReactivate, onSelectDay,
}: Props) => {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "today" | "past" | "cancelled">("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const allServiceLabels = useMemo(() => {
    const set = new Set<string>();
    bookings.forEach(b => b.services?.forEach(s => {
      // Strip price suffix if present, e.g. "Corte (15€)" -> "Corte"
      const clean = s.replace(/\s*\(.*\)\s*$/, "").trim();
      if (clean) set.add(clean);
    }));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [bookings]);

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (serviceFilter !== "all" ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);

  const resetFilters = () => {
    setStatusFilter("all");
    setServiceFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const stats = useMemo(() => {
    const active = bookings.filter(b => !b.is_cancelled);
    const today = active.filter(b => isToday(parseISO(b.booking_date)));
    const week = active.filter(b => isThisWeek(parseISO(b.booking_date), { weekStartsOn: 1 }));
    const month = active.filter(b => isThisMonth(parseISO(b.booking_date)));
    const cancelled = bookings.filter(b => b.is_cancelled);
    const upcoming = active
      .filter(b => !isPastBooking(b))
      .sort((a, b) => (a.booking_date + a.booking_time).localeCompare(b.booking_date + b.booking_time));
    const next = upcoming[0];
    const uniqueClients = new Set(bookings.map(b => b.user_id || b.client_contact)).size;
    // busiest day-of-week
    const dayCounts: Record<number, number> = {};
    active.forEach(b => {
      const d = parseISO(b.booking_date).getDay();
      dayCounts[d] = (dayCounts[d] || 0) + 1;
    });
    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const busiest = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
    const busiestDay = busiest ? `${dayNames[Number(busiest[0])]} (${busiest[1]})` : "—";
    const cancelRate = bookings.length ? Math.round((cancelled.length / bookings.length) * 100) : 0;
    return {
      todayCount: today.length,
      weekCount: week.length,
      monthCount: month.length,
      next,
      uniqueClients,
      busiestDay,
      cancelRate,
      upcomingCount: upcoming.length,
    };
  }, [bookings]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const currentDates = bookings
    .filter(b => parseISO(b.booking_date) >= today && !b.is_cancelled)
    .map(b => parseISO(b.booking_date));
  const pastDates = bookings
    .filter(b => parseISO(b.booking_date) < today)
    .map(b => parseISO(b.booking_date));

  const matchesFilters = (b: AdminBooking): boolean => {
    const q = searchQuery.toLowerCase();
    const matchesQuery = !q ||
      b.client_name.toLowerCase().includes(q) ||
      b.profile?.full_name?.toLowerCase().includes(q) ||
      b.client_contact.toLowerCase().includes(q) ||
      b.profile?.username?.toLowerCase().includes(q);
    if (!matchesQuery) return false;

    if (dateFrom && b.booking_date < dateFrom) return false;
    if (dateTo && b.booking_date > dateTo) return false;

    if (serviceFilter !== "all") {
      const hasService = b.services?.some(s =>
        s.replace(/\s*\(.*\)\s*$/, "").trim().toLowerCase() === serviceFilter.toLowerCase()
      );
      if (!hasService) return false;
    }

    if (statusFilter !== "all") {
      const past = isPastBooking(b);
      if (statusFilter === "cancelled" && !b.is_cancelled) return false;
      if (statusFilter === "today" && (!isToday(parseISO(b.booking_date)) || b.is_cancelled)) return false;
      if (statusFilter === "upcoming" && (past || b.is_cancelled)) return false;
      if (statusFilter === "past" && (!past || b.is_cancelled)) return false;
    }
    return true;
  };

  const filtered = bookings.filter(matchesFilters);
  const currentBookings = filtered.filter(b => !isPastBooking(b));
  const pastBookings = filtered.filter(b => isPastBooking(b));

  const BookingRow = ({ b }: { b: AdminBooking }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ x: 4 }}
      className={`group relative overflow-hidden rounded-xl border-2 backdrop-blur-md transition-all ${
        b.is_cancelled
          ? "border-destructive/30 bg-destructive/5"
          : isToday(parseISO(b.booking_date))
          ? "border-neon-cyan/40 bg-neon-cyan/5 shadow-[0_0_25px_hsl(var(--neon-cyan)/0.2)]"
          : "border-border/60 bg-card/40 hover:border-neon-purple/60 hover:shadow-[0_0_30px_hsl(var(--neon-purple)/0.25)]"
      }`}
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-neon-purple via-neon-cyan to-neon-purple opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="p-4 flex items-center gap-4">
        {/* Time block */}
        <div className="shrink-0 text-center min-w-[64px]">
          <p className={`text-2xl font-black font-mono tabular-nums ${
            b.is_cancelled ? "text-destructive line-through" : "text-neon-cyan"
          }`} style={!b.is_cancelled ? { textShadow: "0 0 12px hsl(var(--neon-cyan) / 0.6)" } : {}}>
            {b.booking_time.slice(0, 5)}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">
            {format(parseISO(b.booking_date), "d MMM", { locale: es })}
          </p>
        </div>

        {/* Client + services */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className={`font-bold text-base truncate ${b.is_cancelled ? "line-through text-destructive" : ""}`}>
              {b.user_id && b.profile ? (
                <Link to={`/admin/client/${b.user_id}`} className="text-foreground hover:text-neon-cyan transition-colors inline-flex items-center gap-1">
                  {b.profile.full_name}
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </Link>
              ) : b.client_name}
            </p>
            <StatusChip booking={b} />
          </div>
          <p className="text-xs text-muted-foreground mb-1.5">
            📞 {b.user_id && b.profile ? b.profile.contact_value : b.client_contact}
          </p>
          <div className="flex items-center gap-1 flex-wrap">
            {b.services?.slice(0, 4).map((s, i) => (
              <span key={i} className="text-[10px] font-medium bg-neon-purple/10 text-neon-purple border border-neon-purple/30 px-2 py-0.5 rounded-full">
                {s.length > 28 ? s.slice(0, 28) + "…" : s}
              </span>
            ))}
            {b.services && b.services.length > 4 && (
              <span className="text-[10px] text-muted-foreground">+{b.services.length - 4}</span>
            )}
            {b.playlist_url && (
              <a href={b.playlist_url} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1 text-[10px] text-neon-pink border border-neon-pink/30 bg-neon-pink/10 px-2 py-0.5 rounded-full hover:bg-neon-pink/20">
                <Music className="h-2.5 w-2.5" /> Playlist
              </a>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
          {b.is_cancelled ? (
            <>
              <Button size="icon" variant="ghost" onClick={() => onReactivate(b.id)} title="Reactivar" className="h-8 w-8 hover:text-green-500 hover:bg-green-500/10">
                <CheckCircle className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => onCancel(b, "reschedule")} title="Reubicar" className="h-8 w-8 hover:text-neon-cyan hover:bg-neon-cyan/10">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button size="icon" variant="ghost" onClick={() => onEdit(b)} title="Editar" className="h-8 w-8 hover:text-neon-cyan hover:bg-neon-cyan/10">
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => onCancel(b, "cancel")} title="Cancelar" className="h-8 w-8 hover:text-yellow-500 hover:bg-yellow-500/10">
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button size="icon" variant="ghost" onClick={() => onDelete(b.id)} title="Eliminar" className="h-8 w-8 hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );

  const List = ({ items }: { items: AdminBooking[] }) => {
    if (items.length === 0)
      return (
        <div className="text-center py-12">
          <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">
            No hay reservas {searchQuery ? "que coincidan" : "registradas"}
          </p>
        </div>
      );
    return (
      <AnimatePresence initial={false}>
        <div className="space-y-2">
          {items.map((b) => <BookingRow key={b.id} b={b} />)}
        </div>
      </AnimatePresence>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats — neón grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatTile label="Hoy"        value={stats.todayCount}    icon={Flame}      color="hsl(var(--neon-cyan))" />
        <StatTile label="Semana"     value={stats.weekCount}     icon={CalIcon}    color="hsl(var(--neon-purple))" />
        <StatTile label="Mes"        value={stats.monthCount}    icon={TrendingUp} color="hsl(var(--neon-pink))" />
        <StatTile label="Próximas"   value={stats.upcomingCount} icon={Activity}   color="hsl(var(--neon-cyan))" />
        <StatTile label="Clientes"   value={stats.uniqueClients} icon={Users}      color="hsl(var(--neon-purple))" />
        <StatTile label="Cancel."    value={`${stats.cancelRate}%`} icon={X}      color="hsl(var(--destructive))" sub={`${bookings.filter(b => b.is_cancelled).length} totales`} />
      </div>

      {/* Próxima cita destacada + busiest */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="md:col-span-2 relative overflow-hidden rounded-2xl border-2 border-neon-cyan/40 bg-gradient-to-br from-neon-cyan/10 via-card/40 to-neon-purple/10 p-5 backdrop-blur-md shadow-[0_0_40px_hsl(var(--neon-cyan)/0.25)]"
        >
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-neon-cyan/20 blur-3xl" />
          <div className="relative">
            <p className="text-[10px] uppercase tracking-widest text-neon-cyan font-bold mb-1">Próxima cita</p>
            {stats.next ? (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-3xl md:text-4xl font-black font-mono text-neon-cyan" style={{ textShadow: "0 0 18px hsl(var(--neon-cyan) / 0.7)" }}>
                    {stats.next.booking_time.slice(0, 5)}
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {format(parseISO(stats.next.booking_date), "EEEE d 'de' MMMM", { locale: es })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{stats.next.profile?.full_name || stats.next.client_name}</p>
                  <p className="text-xs text-muted-foreground">{stats.next.services?.[0]}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground py-4">Sin citas próximas</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl border-2 border-neon-pink/40 bg-gradient-to-br from-neon-pink/10 to-card/40 p-5 backdrop-blur-md shadow-[0_0_40px_hsl(var(--neon-pink)/0.2)]"
        >
          <div className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full bg-neon-pink/20 blur-3xl" />
          <div className="relative">
            <p className="text-[10px] uppercase tracking-widest text-neon-pink font-bold mb-1">Día más activo</p>
            <p className="text-3xl font-black text-neon-pink" style={{ textShadow: "0 0 16px hsl(var(--neon-pink) / 0.7)" }}>
              {stats.busiestDay}
            </p>
            <p className="text-xs text-muted-foreground mt-1">de los últimos meses</p>
          </div>
        </motion.div>
      </div>

      {/* Calendario */}
      <Card className="bg-card/60 backdrop-blur-xl border-2 border-neon-purple/30 shadow-[0_0_40px_hsl(var(--neon-purple)/0.15)] overflow-hidden">
        <CardHeader className="border-b border-neon-purple/20 bg-gradient-to-r from-neon-purple/10 to-transparent">
          <CardTitle className="flex items-center gap-2 text-neon-purple" style={{ textShadow: "0 0 12px hsl(var(--neon-purple) / 0.5)" }}>
            <CalendarIcon className="h-5 w-5" />
            Calendario de Reservas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center p-4">
          <Calendar
            mode="single"
            onSelect={(d) => d && onSelectDay(d)}
            className="rounded-md pointer-events-auto"
            modifiers={{ currentBooking: currentDates, pastBooking: pastDates }}
            modifiersClassNames={{
              currentBooking: "bg-neon-purple/30 text-neon-cyan font-black rounded-full ring-2 ring-neon-purple/60 shadow-[0_0_10px_hsl(var(--neon-purple)/0.6)]",
              pastBooking: "bg-muted/40 text-muted-foreground rounded-full",
            }}
          />
        </CardContent>
      </Card>

      {/* Lista */}
      <Card className="bg-card/60 backdrop-blur-xl border-2 border-neon-cyan/30 shadow-[0_0_40px_hsl(var(--neon-cyan)/0.15)] overflow-hidden">
        <CardHeader className="border-b border-neon-cyan/20 bg-gradient-to-r from-neon-cyan/10 to-transparent">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="text-neon-cyan font-aggressive tracking-wider" style={{ textShadow: "0 0 12px hsl(var(--neon-cyan) / 0.5)" }}>
              RESERVAS
            </CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neon-cyan" />
                <Input
                  placeholder="Buscar cliente, contacto…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-[280px] bg-background/60 border-neon-cyan/30 focus:border-neon-cyan focus:ring-neon-cyan/30"
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="border-neon-purple/40 text-neon-purple hover:bg-neon-purple/10 relative">
                    <SlidersHorizontal className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Filtros</span>
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-neon-cyan text-background text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_8px_hsl(var(--neon-cyan))]">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-4 bg-card/95 backdrop-blur-xl border-neon-purple/30">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black uppercase tracking-widest text-neon-cyan">Filtros</p>
                      {activeFilterCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs text-muted-foreground hover:text-destructive">
                          <RotateCw className="h-3 w-3 mr-1" /> Limpiar
                        </Button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Estado</Label>
                      <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                        <SelectTrigger className="bg-background/60 border-neon-purple/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas</SelectItem>
                          <SelectItem value="upcoming">Próximas</SelectItem>
                          <SelectItem value="today">Hoy</SelectItem>
                          <SelectItem value="past">Completadas</SelectItem>
                          <SelectItem value="cancelled">Canceladas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Servicio</Label>
                      <Select value={serviceFilter} onValueChange={setServiceFilter}>
                        <SelectTrigger className="bg-background/60 border-neon-purple/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          <SelectItem value="all">Todos</SelectItem>
                          {allServiceLabels.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Desde</Label>
                        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                          className="bg-background/60 border-neon-purple/30" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Hasta</Label>
                        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                          className="bg-background/60 border-neon-purple/30" />
                      </div>
                    </div>

                    <p className="text-[10px] text-muted-foreground italic text-center pt-1">
                      {filtered.length} reserva{filtered.length === 1 ? "" : "s"} coinciden
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
              <Button onClick={onReload} disabled={loading} variant="outline" className="border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/10">
                {loading ? "..." : "Actualizar"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-background/40 border border-border">
              <TabsTrigger value="current" className="data-[state=active]:bg-neon-cyan/20 data-[state=active]:text-neon-cyan font-bold">
                Actuales <span className="ml-2 text-xs opacity-70">({currentBookings.length})</span>
              </TabsTrigger>
              <TabsTrigger value="past" className="data-[state=active]:bg-neon-purple/20 data-[state=active]:text-neon-purple font-bold">
                Pasadas <span className="ml-2 text-xs opacity-70">({pastBookings.length})</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="current" className="mt-4">
              <List items={currentBookings} />
            </TabsContent>
            <TabsContent value="past" className="mt-4">
              <List items={pastBookings} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBookingsSection;