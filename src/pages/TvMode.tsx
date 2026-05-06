import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Scissors,
  Clock,
  Gift,
  Crown,
  Sparkles,
  MapPin,
  Calendar,
  Star,
  Zap,
  Wifi,
  Maximize2,
  TrendingUp,
  MessageCircle,
  Ticket,
  Instagram,
  Flame,
  Quote,
} from "lucide-react";
import heroImage from "@/assets/hero-barber.jpg";
import { TvLockScreen } from "@/components/tv/TvLockScreen";
import type { TvSettings, TvSlideKey } from "@/components/admin/TvModeManagement";

type Booking = {
  id: string;
  booking_time: string;
  client_name: string;
  services: any;
};

type Service = { id: string; name: string; price: number; service_type: string };
type Membership = { id: string; name: string; emoji: string | null; price: number; description: string | null };
type Giveaway = { id: string; title: string; prize: string; end_date: string };
type BusinessHour = { day_of_week: number; is_closed: boolean; is_24h: boolean; time_ranges: any };
type Rating = { id: string; rating: number; comment: string | null; created_at: string; client_name?: string };
type Coupon = { id: string; code: string; description: string | null; discount_type: string; discount_value: number };
type Stats = { totalCuts: number; totalClients: number; ratingsAvg: number; ratingsCount: number };

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const SLIDE_DURATION = 12000;
const TV_UNLOCK_KEY = "tv_unlocked_v1";

const DEFAULT_TV_SETTINGS: TvSettings = {
  passcode: "1234",
  slides: [
    { key: "queue", enabled: true },
    { key: "services", enabled: true },
    { key: "packs", enabled: true },
    { key: "memberships", enabled: true },
    { key: "giveaways", enabled: true },
    { key: "promo", enabled: true },
    { key: "reviews", enabled: true },
    { key: "coupons", enabled: true },
    { key: "stats", enabled: true },
    { key: "social", enabled: true },
    { key: "hours", enabled: true },
    { key: "brand", enabled: true },
  ],
};

const TvMode = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [packs, setPacks] = useState<Service[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<Stats>({ totalCuts: 0, totalClients: 0, ratingsAvg: 0, ratingsCount: 0 });
  const [now, setNow] = useState(new Date());
  const [slideIdx, setSlideIdx] = useState(0);
  const [tvSettings, setTvSettings] = useState<TvSettings>(DEFAULT_TV_SETTINGS);
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(TV_UNLOCK_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch + realtime
  const fetchAll = async (markReconnect = false) => {
    if (markReconnect) setReconnecting(true);
    const today = format(new Date(), "yyyy-MM-dd");
    try {
    const [b, s, m, g, h, settings, r, c, totalCutsRes, totalClientsRes] = await Promise.all([
      supabase.from("bookings").select("id, booking_time, client_name, services").eq("booking_date", today).eq("is_cancelled", false).order("booking_time"),
      supabase.from("services").select("id, name, price, service_type"),
      supabase.from("memberships").select("id, name, emoji, price, description").eq("is_active", true).eq("is_coming_soon", false).order("sort_order"),
      supabase.from("giveaways").select("id, title, prize, end_date").eq("is_finished", false).order("end_date"),
      supabase.from("business_hours").select("*").order("day_of_week"),
      supabase.from("app_settings").select("value").eq("key", "tv_settings").maybeSingle(),
      supabase.from("ratings").select("id, rating, comment, created_at").not("comment", "is", null).order("created_at", { ascending: false }).limit(10),
      supabase.from("coupons").select("id, code, description, discount_type, discount_value").eq("is_active", true).limit(6),
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("is_cancelled", false),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);
    setBookings((b.data as any) || []);
    const allSvc = (s.data as any) || [];
    setServices(allSvc.filter((x: Service) => x.service_type === "service"));
    setPacks(allSvc.filter((x: Service) => x.service_type === "pack"));
    setMemberships((m.data as any) || []);
    setGiveaways((g.data as any) || []);
    setHours((h.data as any) || []);
    if (settings.data?.value) setTvSettings(settings.data.value as any);
    const ratingsArr = (r.data as any) || [];
    setRatings(ratingsArr);
    setCoupons((c.data as any) || []);
    const ratingsAvg = ratingsArr.length
      ? ratingsArr.reduce((acc: number, x: any) => acc + (x.rating || 0), 0) / ratingsArr.length
      : 0;
    setStats({
      totalCuts: totalCutsRes.count || 0,
      totalClients: totalClientsRes.count || 0,
      ratingsAvg,
      ratingsCount: ratingsArr.length,
    });
    } finally {
      setInitialLoading(false);
      setReconnecting(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const t = setInterval(() => fetchAll(true), 60000);
    const ch = supabase
      .channel("tv-mode")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => fetchAll(true))
      .on("postgres_changes", { event: "*", schema: "public", table: "app_settings" }, () => fetchAll())
      .subscribe();
    // Online/offline reconnection state
    const onOffline = () => setReconnecting(true);
    const onOnline = () => fetchAll(true);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      clearInterval(t);
      supabase.removeChannel(ch);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  // Kiosk mode: hide scrollbars on html/body while on /tv
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.classList.add("tv-kiosk");
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      body.classList.remove("tv-kiosk");
    };
  }, []);

  // Build slides
  const slides = useMemo(() => {
    const arr: { key: string; render: () => JSX.Element }[] = [];
    const enabled = new Map<TvSlideKey, boolean>(
      tvSettings.slides.map((s) => [s.key, s.enabled])
    );
    for (const cfg of tvSettings.slides) {
      if (!enabled.get(cfg.key)) continue;
      switch (cfg.key) {
        case "queue":
          arr.push({ key: "queue", render: () => <QueueSlide bookings={bookings} now={now} /> });
          break;
        case "services":
          if (services.length) arr.push({ key: "services", render: () => <ServicesSlide services={services} /> });
          break;
        case "packs":
          if (packs.length) arr.push({ key: "packs", render: () => <PacksSlide packs={packs} /> });
          break;
        case "memberships":
          if (memberships.length) arr.push({ key: "memberships", render: () => <MembershipSlide memberships={memberships} /> });
          break;
        case "giveaways":
          giveaways.forEach((gv) => arr.push({ key: "gv-" + gv.id, render: () => <GiveawaySlide giveaway={gv} /> }));
          break;
        case "hours":
          if (hours.length) arr.push({ key: "hours", render: () => <HoursSlide hours={hours} /> });
          break;
        case "brand":
          arr.push({ key: "brand", render: () => <BrandSlide /> });
          break;
        case "stats":
          if (stats.totalCuts || stats.totalClients) arr.push({ key: "stats", render: () => <StatsSlide stats={stats} /> });
          break;
        case "reviews":
          if (ratings.length) arr.push({ key: "reviews", render: () => <ReviewsSlide ratings={ratings} /> });
          break;
        case "coupons":
          if (coupons.length) arr.push({ key: "coupons", render: () => <CouponsSlide coupons={coupons} /> });
          break;
        case "social":
          arr.push({ key: "social", render: () => <SocialSlide /> });
          break;
        case "promo":
          arr.push({ key: "promo", render: () => <PromoSlide /> });
          break;
      }
    }
    if (!arr.length) arr.push({ key: "brand", render: () => <BrandSlide /> });
    return arr;
  }, [bookings, services, packs, memberships, giveaways, hours, ratings, coupons, stats, now, tvSettings]);

  useEffect(() => {
    if (!slides.length) return;
    const t = setInterval(() => setSlideIdx((i) => (i + 1) % slides.length), SLIDE_DURATION);
    return () => clearInterval(t);
  }, [slides.length]);

  const current = slides[slideIdx % Math.max(1, slides.length)];

  const requestFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
  };

  if (!unlocked) {
    return (
      <TvLockScreen
        expectedCode={tvSettings.passcode || "1234"}
        onUnlock={() => {
          try {
            sessionStorage.setItem(TV_UNLOCK_KEY, "1");
          } catch {}
          setUnlocked(true);
          // Try to enter fullscreen on unlock (gesture context)
          document.documentElement.requestFullscreen?.().catch(() => {});
        }}
      />
    );
  }

  if (initialLoading) {
    return <TvLoadingScreen />;
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white">
      {/* Background */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "hue-rotate(220deg) saturate(1.4) brightness(0.6)",
        }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(76,29,149,.7), rgba(0,0,0,.85), rgba(8,145,178,.7))",
          backgroundSize: "300% 300%",
        }}
        animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      />

      {/* Animated moving grid */}
      <motion.div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,211,238,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.5) 1px,transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse at center,black 25%,transparent 75%)",
        }}
        animate={{ backgroundPosition: ["0px 0px", "80px 80px"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />

      {/* Aurora blobs */}
      <AuroraBlobs />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,.6) 0, rgba(255,255,255,.6) 1px, transparent 1px, transparent 4px)",
        }}
      />
      <motion.div
        className="absolute left-0 right-0 h-40 pointer-events-none bg-gradient-to-b from-transparent via-cyan-300/10 to-transparent"
        animate={{ y: ["-20%", "120%"] }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
      />

      {/* Floating particles */}
      <Particles />

      {/* Reconnecting badge */}
      <AnimatePresence>
        {reconnecting && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-black/70 backdrop-blur-md border border-cyan-400/40 flex items-center gap-2 text-xs uppercase tracking-widest text-cyan-200"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            >
              <Wifi className="w-4 h-4" />
            </motion.div>
            Reconectando…
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen toggle */}
      <button
        onClick={requestFullscreen}
        className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/40 backdrop-blur-md border border-cyan-400/30 text-cyan-300 hover:text-white hover:border-cyan-300 transition-all opacity-30 hover:opacity-100"
        aria-label="Pantalla completa"
        title="Pantalla completa"
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-12 py-6 border-b border-cyan-500/20 backdrop-blur-md bg-black/30">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <div className="relative">
            <Scissors className="w-12 h-12 text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,.8)]" />
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-cyan-400/40 blur-xl"
            />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-transparent">
              DIEGCUTZ
            </h1>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-400/70">Barbería Urbana</p>
          </div>
        </motion.div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-5xl font-mono font-bold text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,.6)] tabular-nums">
              {format(now, "HH:mm")}
            </div>
            <div className="text-xs uppercase tracking-widest text-fuchsia-300/80">
              {format(now, "EEEE d 'de' MMMM", { locale: es })}
            </div>
          </div>
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 border border-red-500/40"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-red-300">EN VIVO</span>
          </motion.div>
        </div>
      </div>

      {/* Slide area */}
      <div className="relative z-10 h-[calc(100vh-180px)] flex items-center justify-center px-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={current?.key}
            initial={{ opacity: 0, scale: 1.06, filter: "blur(28px) saturate(2.2) hue-rotate(60deg)", rotateX: 8 }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px) saturate(1) hue-rotate(0deg)", rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.94, filter: "blur(28px) saturate(2.2) hue-rotate(-60deg)", rotateX: -8 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            style={{ perspective: 1200 }}
            className="w-full max-w-6xl relative"
          >
            {/* neon sweep on enter */}
            <motion.div
              key={(current?.key || "") + "-sweep"}
              initial={{ x: "-110%", opacity: 1 }}
              animate={{ x: "110%", opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none absolute -inset-y-10 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent blur-2xl"
            />
            <motion.div
              key={(current?.key || "") + "-sweep2"}
              initial={{ x: "120%", opacity: 0.8 }}
              animate={{ x: "-120%", opacity: 0 }}
              transition={{ duration: 1.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none absolute -inset-y-10 w-1/3 skew-x-12 bg-gradient-to-r from-transparent via-fuchsia-300/30 to-transparent blur-2xl"
            />
            {current?.render()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer ticker / progress */}
      <div className="absolute bottom-0 left-0 right-0 z-10 backdrop-blur-md bg-black/40 border-t border-cyan-500/20">
        <div className="flex items-center justify-between px-12 py-4">
          <div className="flex items-center gap-2 text-sm uppercase tracking-widest text-cyan-300/80">
            <MapPin className="w-4 h-4" /> Visítanos · Reserva online en diegcutz.es
          </div>
          <div className="flex gap-2">
            {slides.map((s, i) => (
              <div
                key={s.key}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === slideIdx ? "w-12 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,.8)]" : "w-2 bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>
        <motion.div
          key={slideIdx}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: SLIDE_DURATION / 1000, ease: "linear" }}
          className="h-0.5 bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-cyan-400"
        />
      </div>
    </div>
  );
};

// ===== Particles =====
const Particles = () => {
  const items = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 1,
        d: 4 + Math.random() * 6,
        delay: Math.random() * 5,
        color: i % 2 === 0 ? "rgba(34,211,238,.7)" : "rgba(217,70,239,.7)",
      })),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none">
      {items.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
          }}
          animate={{ y: [0, -40, 0], opacity: [0.2, 1, 0.2] }}
          transition={{ duration: p.d, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
};

// ===== Aurora background blobs =====
const AuroraBlobs = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <motion.div
      className="absolute -top-40 -left-40 w-[60vw] h-[60vw] rounded-full blur-3xl"
      style={{ background: "radial-gradient(circle, rgba(34,211,238,.45), transparent 60%)" }}
      animate={{ x: [0, 200, -100, 0], y: [0, 120, 60, 0], scale: [1, 1.2, 0.95, 1] }}
      transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute -bottom-40 -right-40 w-[55vw] h-[55vw] rounded-full blur-3xl"
      style={{ background: "radial-gradient(circle, rgba(217,70,239,.4), transparent 60%)" }}
      animate={{ x: [0, -180, 60, 0], y: [0, -100, -40, 0], scale: [1, 1.15, 0.9, 1] }}
      transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute top-1/3 left-1/2 w-[40vw] h-[40vw] rounded-full blur-3xl -translate-x-1/2"
      style={{ background: "radial-gradient(circle, rgba(168,85,247,.35), transparent 60%)" }}
      animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
    />
  </div>
);

// ===== Slide title helper =====
const SlideTitle = ({ icon: Icon, title, subtitle }: any) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="text-center mb-10"
  >
    <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/30 mb-4">
      <Icon className="w-5 h-5 text-cyan-400" />
      <span className="text-xs uppercase tracking-[0.4em] text-cyan-300">{subtitle}</span>
    </div>
    <h2 className="text-7xl font-black tracking-tight text-white drop-shadow-[0_0_30px_rgba(34,211,238,.5)]">
      {title}
    </h2>
  </motion.div>
);

// ===== QUEUE =====
const QueueSlide = ({ bookings, now }: { bookings: Booking[]; now: Date }) => {
  const upcoming = bookings.filter((b) => {
    const [h, m] = b.booking_time.split(":").map(Number);
    const d = new Date(now);
    d.setHours(h, m + 60, 0, 0);
    return d >= now;
  });
  return (
    <div>
      <SlideTitle icon={Clock} title="COLA DE HOY" subtitle="Próximos turnos" />
      {upcoming.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 rounded-3xl border border-cyan-400/30 bg-black/40 backdrop-blur-xl"
        >
          <Sparkles className="w-20 h-20 text-cyan-400 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(34,211,238,.8)]" />
          <p className="text-3xl font-bold text-white">¡No quedan turnos hoy!</p>
          <p className="text-xl text-cyan-300/80 mt-2">Reserva el tuyo para mañana</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-hidden">
          {upcoming.slice(0, 8).map((b, i) => {
            const isNext = i === 0;
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                className={`relative rounded-2xl p-5 backdrop-blur-xl border overflow-hidden ${
                  isNext
                    ? "bg-gradient-to-r from-cyan-500/30 to-fuchsia-500/30 border-cyan-400/60 shadow-[0_0_40px_rgba(34,211,238,.4)]"
                    : "bg-black/40 border-white/10"
                }`}
              >
                {isNext && (
                  <motion.div
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                  />
                )}
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-cyan-300/80">
                      {isNext ? "SIGUIENTE" : `Turno #${i + 1}`}
                    </div>
                    <div className="text-2xl font-bold mt-1">{maskName(b.client_name)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-mono font-black text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,.6)]">
                      {b.booking_time.slice(0, 5)}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const maskName = (n: string) => {
  const parts = n.trim().split(" ");
  return parts.map((p, i) => (i === 0 ? p : (p[0] || "") + ".")).join(" ");
};

// ===== SERVICES =====
const ServicesSlide = ({ services }: { services: Service[] }) => (
  <div>
    <SlideTitle icon={Scissors} title="SERVICIOS" subtitle="Nuestra carta" />
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {services.slice(0, 9).map((s, i) => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, y: 30, rotateX: -20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: 0.08 * i }}
          className="rounded-2xl p-6 bg-gradient-to-br from-black/60 to-purple-950/40 backdrop-blur-xl border border-cyan-400/20 hover:border-cyan-400/60 transition-all"
        >
          <div className="text-lg font-bold uppercase tracking-wide text-white">{s.name}</div>
          <div className="mt-3 text-4xl font-black bg-gradient-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">
            {Number(s.price).toFixed(2)}€
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

// ===== PACKS =====
const PacksSlide = ({ packs }: { packs: Service[] }) => (
  <div>
    <SlideTitle icon={Zap} title="PACKS" subtitle="Combos exclusivos" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {packs.slice(0, 3).map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 * i }}
          className="relative rounded-3xl p-8 overflow-hidden bg-gradient-to-br from-fuchsia-600/30 via-purple-700/30 to-cyan-600/30 backdrop-blur-xl border-2 border-fuchsia-400/40"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-cyan-400/20 blur-3xl"
          />
          <Sparkles className="w-8 h-8 text-fuchsia-300 mb-3" />
          <div className="text-2xl font-black text-white uppercase">{p.name}</div>
          <div className="mt-4 text-6xl font-black bg-gradient-to-br from-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">
            {Number(p.price).toFixed(2)}€
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

// ===== MEMBERSHIPS =====
const MembershipSlide = ({ memberships }: { memberships: Membership[] }) => (
  <div>
    <SlideTitle icon={Crown} title="MEMBRESÍAS" subtitle="Únete al club" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {memberships.slice(0, 4).map((m, i) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * i }}
          className="relative rounded-2xl p-6 bg-gradient-to-b from-amber-500/20 via-fuchsia-500/20 to-cyan-500/20 backdrop-blur-xl border border-amber-300/30"
        >
          <div className="text-5xl mb-3">{m.emoji || "👑"}</div>
          <div className="text-xl font-black text-white uppercase tracking-wide">{m.name}</div>
          <div className="mt-3 text-3xl font-black text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,.5)]">
            {Number(m.price).toFixed(0)}€<span className="text-sm text-white/60">/mes</span>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

// ===== GIVEAWAY =====
const GiveawaySlide = ({ giveaway }: { giveaway: Giveaway }) => {
  const [diff, setDiff] = useState("");
  useEffect(() => {
    const upd = () => {
      const ms = new Date(giveaway.end_date).getTime() - Date.now();
      if (ms <= 0) return setDiff("¡FINALIZADO!");
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      setDiff(`${d}d ${h}h ${m}m`);
    };
    upd();
    const t = setInterval(upd, 30000);
    return () => clearInterval(t);
  }, [giveaway.end_date]);

  return (
    <div className="text-center">
      <SlideTitle icon={Gift} title="¡SORTEO ACTIVO!" subtitle="Participa ya" />
      <motion.div
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="relative rounded-3xl p-12 bg-gradient-to-br from-fuchsia-600/30 via-pink-500/20 to-cyan-500/30 backdrop-blur-xl border-2 border-fuchsia-400/50 overflow-hidden"
      >
        <Gift className="w-20 h-20 text-fuchsia-300 mx-auto mb-6 drop-shadow-[0_0_30px_rgba(217,70,239,.8)]" />
        <div className="text-4xl font-black text-white mb-4">{giveaway.title}</div>
        <div className="text-2xl text-cyan-200 mb-8">🎁 {giveaway.prize}</div>
        <div className="inline-block px-8 py-4 rounded-2xl bg-black/50 border border-cyan-400/40">
          <div className="text-xs uppercase tracking-widest text-cyan-300/80 mb-1">Termina en</div>
          <div className="text-5xl font-mono font-black text-cyan-300 drop-shadow-[0_0_15px_rgba(34,211,238,.7)]">
            {diff}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ===== HOURS =====
const HoursSlide = ({ hours }: { hours: BusinessHour[] }) => {
  const today = new Date().getDay();
  return (
    <div>
      <SlideTitle icon={Calendar} title="HORARIO" subtitle="Cuándo abrimos" />
      <div className="rounded-3xl bg-black/40 backdrop-blur-xl border border-cyan-400/20 overflow-hidden divide-y divide-cyan-400/10">
        {hours.map((h, i) => {
          const isToday = h.day_of_week === today;
          const ranges = h.is_closed
            ? "CERRADO"
            : h.is_24h
            ? "24H"
            : (h.time_ranges || []).map((r: any) => `${r.start} - ${r.end}`).join(" / ") || "—";
          return (
            <motion.div
              key={h.day_of_week}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center justify-between px-8 py-4 ${
                isToday ? "bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                {isToday && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />}
                <span className={`text-2xl font-bold uppercase ${isToday ? "text-cyan-300" : "text-white/80"}`}>
                  {DAYS[h.day_of_week]}
                </span>
              </div>
              <span
                className={`text-2xl font-mono ${
                  h.is_closed ? "text-red-400" : isToday ? "text-cyan-300" : "text-white"
                }`}
              >
                {ranges}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ===== BRAND =====
const BrandSlide = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="text-center"
  >
    <motion.div
      animate={{ rotateY: [0, 360] }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      className="inline-block mb-8"
    >
      <Scissors className="w-32 h-32 text-cyan-400 drop-shadow-[0_0_40px_rgba(34,211,238,.9)]" />
    </motion.div>
    <h2 className="text-9xl font-black tracking-tighter bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-transparent">
      DIEGCUTZ
    </h2>
    <p className="text-2xl uppercase tracking-[0.6em] text-cyan-300/80 mt-6">Barbería · Estilo · Actitud</p>
    <div className="mt-12 flex justify-center gap-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} className="w-8 h-8 text-amber-300 fill-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,.7)]" />
      ))}
    </div>
    <p className="mt-12 text-3xl font-bold text-white">Reserva en <span className="text-cyan-300">diegcutz.es</span></p>
  </motion.div>
);

export default TvMode;

// ===== LOADING SCREEN =====
const TvLoadingScreen = () => (
  <div className="fixed inset-0 z-40 overflow-hidden bg-black text-white flex items-center justify-center">
    <div className="absolute inset-0 bg-gradient-to-br from-purple-950/70 via-black to-cyan-950/70" />
    <div
      className="absolute inset-0 opacity-20"
      style={{
        backgroundImage:
          "linear-gradient(rgba(34,211,238,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.4) 1px,transparent 1px)",
        backgroundSize: "60px 60px",
        maskImage: "radial-gradient(ellipse at center,black 30%,transparent 75%)",
      }}
    />
    <motion.div
      animate={{ opacity: [0.3, 0.7, 0.3] }}
      transition={{ duration: 3, repeat: Infinity }}
      className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-cyan-500/20 blur-3xl"
    />
    <div className="relative z-10 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="inline-block mb-8"
      >
        <Scissors className="w-20 h-20 text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,.9)]" />
      </motion.div>
      <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-transparent mb-3">
        DIEGCUTZ
      </h1>
      <p className="text-sm uppercase tracking-[0.5em] text-cyan-300/80 mb-10">Sintonizando…</p>
      <div className="mx-auto w-72 h-1 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="h-full w-1/2 bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-cyan-400 shadow-[0_0_20px_rgba(34,211,238,.8)]"
        />
      </div>
    </div>
  </div>
);