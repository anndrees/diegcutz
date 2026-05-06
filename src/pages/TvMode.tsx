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
  Trophy,
  CalendarClock,
  Activity,
  Timer,
  QrCode,
  Award,
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
type AchievementFeedItem = {
  id: string;
  awarded_at: string;
  achievement_name: string;
  achievement_icon: string;
  user_name: string;
};
type SpecialHour = { id: string; date: string; is_closed: boolean; time_ranges: any; note: string | null };

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const SLIDE_DURATION = 12000;
const TV_UNLOCK_KEY = "tv_unlocked_v1";

const DEFAULT_TV_SETTINGS: TvSettings = {
  passcode: "1234",
  reduceMotion: false,
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
  const [achievementsFeed, setAchievementsFeed] = useState<AchievementFeedItem[]>([]);
  const [specialHours, setSpecialHours] = useState<SpecialHour[]>([]);
  const [cutsToday, setCutsToday] = useState(0);
  const [nextSlot, setNextSlot] = useState<{ date: string; time: string } | null>(null);
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
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const [b, s, m, g, h, settings, r, c, totalCutsRes, totalClientsRes, cutsTodayRes, ach, sh, future] = await Promise.all([
      supabase.from("bookings").select("id, booking_time, client_name, services").eq("booking_date", today).eq("is_cancelled", false).order("booking_time"),
      supabase.from("services").select("id, name, price, service_type"),
      supabase.from("memberships").select("id, name, emoji, price, description").eq("is_active", true).eq("is_coming_soon", false).order("sort_order"),
      supabase.from("giveaways").select("id, title, prize, end_date").eq("is_finished", false).order("end_date"),
      supabase.from("business_hours").select("*").order("day_of_week"),
      supabase.from("app_settings").select("value").eq("key", "tv_settings").maybeSingle(),
      supabase.from("ratings").select("id, rating, comment, created_at").order("created_at", { ascending: false }).limit(10),
      supabase.from("coupons").select("id, code, description, discount_type, discount_value").eq("is_active", true).limit(6),
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("is_cancelled", false),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("booking_date", today).eq("is_cancelled", false),
      supabase.from("user_achievements").select("id, awarded_at, achievement_id, user_id").gte("awarded_at", weekAgo).order("awarded_at", { ascending: false }).limit(20),
      supabase.from("special_hours").select("id, date, is_closed, time_ranges, note").gte("date", today).order("date").limit(6),
      supabase.from("bookings").select("booking_date, booking_time").gte("booking_date", today).eq("is_cancelled", false).order("booking_date").order("booking_time").limit(200),
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
    setCutsToday(cutsTodayRes.count || 0);
    setSpecialHours((sh.data as any) || []);
    // Achievements feed: enrich with names
    const rawAch = (ach.data as any) || [];
    if (rawAch.length) {
      const achIds = [...new Set(rawAch.map((x: any) => x.achievement_id))];
      const userIds = [...new Set(rawAch.map((x: any) => x.user_id))];
      const [achDefs, profs] = await Promise.all([
        supabase.from("achievements").select("id, name, icon").in("id", achIds as string[]),
        supabase.from("profiles").select("id, full_name, username").in("id", userIds as string[]),
      ]);
      const aMap = new Map((achDefs.data || []).map((x: any) => [x.id, x]));
      const pMap = new Map((profs.data || []).map((x: any) => [x.id, x]));
      setAchievementsFeed(
        rawAch.map((x: any) => {
          const a = aMap.get(x.achievement_id) as any;
          const p = pMap.get(x.user_id) as any;
          return {
            id: x.id,
            awarded_at: x.awarded_at,
            achievement_name: a?.name || "Logro",
            achievement_icon: a?.icon || "trophy",
            user_name: p?.username || (p?.full_name ? p.full_name.split(" ")[0] : "Cliente"),
          };
        })
      );
    } else {
      setAchievementsFeed([]);
    }
    // Next free slot: find first hour gap from now
    setNextSlot(computeNextSlot((future.data as any) || [], (h.data as any) || [], (sh.data as any) || []));
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
        case "achievements_feed":
          if (achievementsFeed.length)
            arr.push({ key: "ach_feed", render: () => <AchievementsFeedSlide items={achievementsFeed} /> });
          break;
        case "special_hours_upcoming":
          if (specialHours.length)
            arr.push({ key: "sp_hours", render: () => <SpecialHoursSlide items={specialHours} /> });
          break;
        case "cuts_today":
          arr.push({ key: "cuts_today", render: () => <CutsTodaySlide count={cutsToday} /> });
          break;
        case "next_slot":
          if (nextSlot)
            arr.push({ key: "next_slot", render: () => <NextSlotSlide slot={nextSlot!} /> });
          break;
        case "qr_book":
          arr.push({ key: "qr_book", render: () => <QrBookSlide /> });
          break;
        case "loyalty_program":
          arr.push({ key: "loyalty_program", render: () => <LoyaltyProgramSlide /> });
          break;
      }
    }
    if (!arr.length) arr.push({ key: "brand", render: () => <BrandSlide /> });
    return arr;
  }, [bookings, services, packs, memberships, giveaways, hours, ratings, coupons, stats, now, tvSettings, achievementsFeed, specialHours, cutsToday, nextSlot]);

  useEffect(() => {
    if (!slides.length) return;
    const t = setInterval(() => setSlideIdx((i) => (i + 1) % slides.length), SLIDE_DURATION);
    return () => clearInterval(t);
  }, [slides.length]);

  // Keyboard navigation: ← / → to switch slides (debug & manual control)
  useEffect(() => {
    if (!slides.length) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setSlideIdx((i) => (i + 1) % slides.length);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSlideIdx((i) => (i - 1 + slides.length) % slides.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length]);

  const current = slides[slideIdx % Math.max(1, slides.length)];
  const reduceMotion = !!tvSettings.reduceMotion;

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
      {!reduceMotion ? (
        <>
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
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(76,29,149,.55), rgba(0,0,0,.95), rgba(8,145,178,.55))",
          }}
        />
      )}

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
            <h1 className="text-4xl font-black tracking-tight leading-[1.15] pb-1 bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-transparent">
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
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.06, filter: "blur(28px) saturate(2.2) hue-rotate(60deg)", rotateX: 8 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, filter: "blur(0px) saturate(1) hue-rotate(0deg)", rotateX: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, filter: "blur(28px) saturate(2.2) hue-rotate(-60deg)", rotateX: -8 }}
            transition={{ duration: reduceMotion ? 0.3 : 1.1, ease: [0.22, 1, 0.36, 1] }}
            style={{ perspective: 1200 }}
            className="w-full max-w-6xl relative"
          >
            {!reduceMotion && (
              <>
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
              </>
            )}
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
    <div
      className={`grid gap-4 justify-center ${
        memberships.length === 1
          ? "grid-cols-1 max-w-sm mx-auto"
          : memberships.length === 2
          ? "grid-cols-2 max-w-2xl mx-auto"
          : memberships.length === 3
          ? "grid-cols-3 max-w-4xl mx-auto"
          : "grid-cols-2 lg:grid-cols-4"
      }`}
    >
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
      animate={{ rotateY: [0, 360], scale: [1, 1.1, 1] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="inline-block mb-8"
    >
      <Scissors className="w-32 h-32 text-cyan-400 drop-shadow-[0_0_50px_rgba(34,211,238,1)]" />
    </motion.div>
    <motion.h2
      animate={{
        textShadow: [
          "0 0 30px rgba(34,211,238,.6)",
          "0 0 60px rgba(217,70,239,.8)",
          "0 0 30px rgba(34,211,238,.6)",
        ],
      }}
      transition={{ duration: 3, repeat: Infinity }}
      className="text-9xl font-black tracking-tighter leading-[1.15] pb-4 bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 bg-clip-text text-transparent"
    >
      DIEGCUTZ
    </motion.h2>
    <p className="text-2xl uppercase tracking-[0.6em] text-cyan-300/80 mt-6">Barbería · Estilo · Actitud</p>
    <div className="mt-12 flex justify-center gap-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          animate={{ scale: [1, 1.4, 1], rotate: [0, 15, -15, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
        >
          <Star className="w-8 h-8 text-amber-300 fill-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,.9)]" />
        </motion.div>
      ))}
    </div>
    <p className="mt-12 text-3xl font-bold text-white">Reserva en <span className="text-cyan-300">diegcutz.es</span></p>
  </motion.div>
);

// ===== STATS =====
const StatsSlide = ({ stats }: { stats: Stats }) => {
  const items = [
    { label: "Cortes realizados", value: stats.totalCuts, icon: Scissors, color: "from-cyan-400 to-blue-500" },
    { label: "Clientes felices", value: stats.totalClients, icon: Crown, color: "from-fuchsia-400 to-purple-500" },
    { label: "Valoración media", value: stats.ratingsAvg.toFixed(1) + "★", icon: Star, color: "from-amber-400 to-orange-500" },
    { label: "Reseñas", value: stats.ratingsCount, icon: MessageCircle, color: "from-emerald-400 to-cyan-500" },
  ];
  return (
    <div>
      <SlideTitle icon={TrendingUp} title="EN NÚMEROS" subtitle="La barbería en datos" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {items.map((it, i) => (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, y: 60, rotateY: 20 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{ delay: i * 0.12, type: "spring", stiffness: 80 }}
            className="relative rounded-3xl p-7 bg-black/50 backdrop-blur-xl border border-white/10 overflow-hidden"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
              className={`absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl bg-gradient-to-br ${it.color} opacity-50`}
            />
            <it.icon className="w-10 h-10 text-white/90 mb-3" />
            <CountUp value={typeof it.value === "number" ? it.value : it.value} />
            <div className="mt-2 text-xs uppercase tracking-widest text-white/60">{it.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const CountUp = ({ value }: { value: number | string }) => {
  const [v, setV] = useState<number | string>(typeof value === "number" ? 0 : value);
  useEffect(() => {
    if (typeof value !== "number") {
      setV(value);
      return;
    }
    let start = 0;
    const duration = 1400;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setV(Math.floor(start + (value - start) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <div className="text-6xl font-black bg-gradient-to-r from-cyan-200 to-fuchsia-200 bg-clip-text text-transparent tabular-nums">
      {v}
    </div>
  );
};

// ===== REVIEWS =====
const ReviewsSlide = ({ ratings }: { ratings: Rating[] }) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % ratings.length), 3500);
    return () => clearInterval(t);
  }, [ratings.length]);
  const r = ratings[idx];
  if (!r) return null;
  return (
    <div className="text-center">
      <SlideTitle icon={Quote} title="LO QUE DICEN" subtitle="Reseñas reales" />
      <AnimatePresence mode="wait">
        <motion.div
          key={r.id}
          initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -40, filter: "blur(10px)" }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto max-w-4xl rounded-3xl p-12 bg-gradient-to-br from-amber-500/10 via-fuchsia-500/10 to-cyan-500/10 backdrop-blur-xl border border-amber-300/30"
        >
          <Quote className="absolute top-4 left-4 w-12 h-12 text-amber-300/40" />
          <div className="flex justify-center gap-1 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1 }}
              >
                <Star
                  className={`w-9 h-9 ${
                    i < r.rating
                      ? "text-amber-300 fill-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,.8)]"
                      : "text-white/15"
                  }`}
                />
              </motion.div>
            ))}
          </div>
          <p className="text-3xl font-medium leading-relaxed text-white italic">
            “{r.comment}”
          </p>
          <p className="mt-6 text-sm uppercase tracking-[0.4em] text-cyan-300/70">
            — Cliente DIEGCUTZ ·{" "}
            {format(new Date(r.created_at), "MMM yyyy", { locale: es })}
          </p>
        </motion.div>
      </AnimatePresence>
      <div className="mt-6 flex justify-center gap-1.5">
        {ratings.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all ${
              i === idx ? "w-8 bg-amber-300" : "w-2 bg-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// ===== COUPONS =====
const CouponsSlide = ({ coupons }: { coupons: Coupon[] }) => (
  <div>
    <SlideTitle icon={Ticket} title="CUPONES ACTIVOS" subtitle="Aprovecha el descuento" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {coupons.slice(0, 4).map((c, i) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 0, x: i % 2 === 0 ? -80 : 80, rotate: i % 2 === 0 ? -3 : 3 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          transition={{ delay: i * 0.12, type: "spring", stiffness: 70 }}
          className="relative rounded-3xl p-7 overflow-hidden border-2 border-dashed border-fuchsia-400/50 bg-gradient-to-br from-fuchsia-600/20 via-pink-500/15 to-amber-500/20 backdrop-blur-xl"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -right-20 w-52 h-52 rounded-full bg-amber-300/20 blur-3xl"
          />
          <div className="relative flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-widest text-fuchsia-200/80">Código</div>
              <motion.div
                animate={{
                  textShadow: [
                    "0 0 10px rgba(217,70,239,.6)",
                    "0 0 25px rgba(251,191,36,.8)",
                    "0 0 10px rgba(217,70,239,.6)",
                  ],
                }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="text-4xl font-black font-mono text-white tracking-wider"
              >
                {c.code}
              </motion.div>
              {c.description && (
                <div className="mt-2 text-sm text-white/70 line-clamp-1">{c.description}</div>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="text-5xl font-black bg-gradient-to-br from-amber-300 to-fuchsia-300 bg-clip-text text-transparent">
                {c.discount_type === "percentage"
                  ? `${c.discount_value}%`
                  : `${c.discount_value}€`}
              </div>
              <div className="text-xs uppercase tracking-widest text-amber-200/80">DTO</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

// ===== SOCIAL =====
const SocialSlide = () => (
  <div className="text-center">
    <SlideTitle icon={Instagram} title="@DIEGCUTZ" subtitle="Síguenos en redes" />
    <motion.div
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 4, repeat: Infinity }}
      className="relative inline-block rounded-3xl p-12 bg-gradient-to-br from-fuchsia-600/30 via-pink-500/30 to-amber-500/30 backdrop-blur-xl border-2 border-fuchsia-400/40 overflow-hidden"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className="absolute -inset-10 bg-[conic-gradient(from_0deg,rgba(217,70,239,.3),rgba(251,191,36,.3),rgba(34,211,238,.3),rgba(217,70,239,.3))] blur-3xl"
      />
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="relative inline-block mb-6"
      >
        <Instagram className="w-32 h-32 text-white drop-shadow-[0_0_30px_rgba(217,70,239,.9)]" />
      </motion.div>
      <div className="relative text-7xl font-black leading-[1.2] pb-3 bg-gradient-to-r from-amber-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
        @diegcutz
      </div>
      <p className="relative mt-6 text-2xl text-white/80 uppercase tracking-[0.3em]">
        Cortes · Reels · Sorteos
      </p>
    </motion.div>
  </div>
);

// ===== PROMO =====
const PromoSlide = () => (
  <div className="text-center">
    <SlideTitle icon={Flame} title="¡RESERVA YA!" subtitle="No esperes más" />
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      className="relative mx-auto max-w-4xl rounded-3xl p-14 overflow-hidden bg-gradient-to-br from-cyan-600/30 via-purple-700/30 to-fuchsia-600/30 backdrop-blur-xl border-2 border-cyan-400/50"
    >
      <motion.div
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
      />
      <motion.div
        animate={{ rotate: [0, -20, 20, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="inline-block mb-6"
      >
        <Flame className="w-24 h-24 text-amber-300 drop-shadow-[0_0_30px_rgba(251,191,36,1)]" />
      </motion.div>
      <div className="text-6xl font-black text-white mb-4 leading-tight">
        Tu próximo corte<br />
        te está esperando
      </div>
      <div className="mt-8 inline-block px-10 py-5 rounded-2xl bg-black/50 border border-cyan-400/50 shadow-[0_0_40px_rgba(34,211,238,.5)]">
        <div className="text-xs uppercase tracking-widest text-cyan-300/80">Reserva online</div>
        <div className="text-5xl font-black leading-[1.2] pb-2 bg-gradient-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">
          diegcutz.es
        </div>
      </div>
    </motion.div>
  </div>
);

export default TvMode;

// ===== Helpers =====
const computeNextSlot = (
  futureBookings: { booking_date: string; booking_time: string }[],
  hours: BusinessHour[],
  special: SpecialHour[]
): { date: string; time: string } | null => {
  const now = new Date();
  const spMap = new Map(special.map((s) => [s.date, s]));
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dateStr = format(d, "yyyy-MM-dd");
    const sp = spMap.get(dateStr);
    let ranges: { start: string; end: string }[] = [];
    let closed = false;
    let h24 = false;
    if (sp) {
      closed = sp.is_closed;
      ranges = (sp.time_ranges as any) || [];
    } else {
      const bh = hours.find((x) => x.day_of_week === d.getDay());
      if (!bh) continue;
      closed = bh.is_closed;
      h24 = bh.is_24h;
      ranges = (bh.time_ranges as any) || [];
    }
    if (closed) continue;
    if (h24) ranges = [{ start: "00:00", end: "23:59" }];
    if (!ranges.length) continue;
    const taken = new Set(
      futureBookings.filter((b) => b.booking_date === dateStr).map((b) => b.booking_time.slice(0, 5))
    );
    for (const r of ranges) {
      const [sh, sm] = r.start.split(":").map(Number);
      const [eh, em] = r.end.split(":").map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em - 60; // last hour excluded
      for (let t = startMin; t <= endMin; t += 60) {
        const hh = String(Math.floor(t / 60)).padStart(2, "0");
        const mm = String(t % 60).padStart(2, "0");
        const time = `${hh}:${mm}`;
        const slotDate = new Date(d);
        slotDate.setHours(Math.floor(t / 60), t % 60, 0, 0);
        if (slotDate <= now) continue;
        if (!taken.has(time)) return { date: dateStr, time };
      }
    }
  }
  return null;
};

// ===== ACHIEVEMENTS FEED =====
const AchievementsFeedSlide = ({ items }: { items: AchievementFeedItem[] }) => (
  <div>
    <SlideTitle icon={Trophy} title="LOGROS DESBLOQUEADOS" subtitle="Esta semana" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-hidden">
      {items.slice(0, 8).map((it, i) => (
        <motion.div
          key={it.id}
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07 }}
          className="rounded-2xl p-4 bg-gradient-to-r from-amber-500/15 to-fuchsia-500/15 backdrop-blur-xl border border-amber-300/30 flex items-center gap-4"
        >
          <div className="w-14 h-14 rounded-full bg-amber-400/20 border border-amber-300/40 flex items-center justify-center shrink-0">
            <Trophy className="w-7 h-7 text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,.7)]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-black text-white truncate">{it.achievement_name}</div>
            <div className="text-sm text-cyan-200/80 truncate">@{it.user_name}</div>
          </div>
          <div className="text-xs uppercase tracking-widest text-amber-200/70 shrink-0">
            {format(new Date(it.awarded_at), "d MMM", { locale: es })}
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

// ===== SPECIAL HOURS UPCOMING =====
const SpecialHoursSlide = ({ items }: { items: SpecialHour[] }) => (
  <div>
    <SlideTitle icon={CalendarClock} title="PRÓXIMOS EVENTOS" subtitle="Horarios especiales" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.slice(0, 4).map((it, i) => {
        const ranges = it.is_closed
          ? "CERRADO"
          : (it.time_ranges || []).map((r: any) => `${r.start} - ${r.end}`).join(" / ") || "—";
        return (
          <motion.div
            key={it.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-2xl p-6 backdrop-blur-xl border ${
              it.is_closed
                ? "bg-red-500/10 border-red-400/40"
                : "bg-gradient-to-br from-cyan-500/15 to-fuchsia-500/15 border-cyan-400/40"
            }`}
          >
            <div className="text-xs uppercase tracking-widest text-cyan-300/80">
              {format(parseISO(it.date), "EEEE", { locale: es })}
            </div>
            <div className="text-3xl font-black text-white mt-1">
              {format(parseISO(it.date), "d 'de' MMMM", { locale: es })}
            </div>
            <div className={`mt-3 text-2xl font-mono ${it.is_closed ? "text-red-300" : "text-cyan-300"}`}>
              {ranges}
            </div>
            {it.note && <div className="mt-2 text-sm text-white/70 italic">“{it.note}”</div>}
          </motion.div>
        );
      })}
    </div>
  </div>
);

// ===== CUTS TODAY =====
const CutsTodaySlide = ({ count }: { count: number }) => (
  <div className="text-center">
    <SlideTitle icon={Activity} title="CORTES HOY" subtitle="En directo" />
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 90 }}
      className="relative mx-auto max-w-3xl rounded-3xl p-16 bg-gradient-to-br from-cyan-600/30 via-purple-700/30 to-fuchsia-600/30 backdrop-blur-xl border-2 border-cyan-400/50 overflow-hidden"
    >
      <Activity className="w-20 h-20 text-cyan-300 mx-auto mb-6 drop-shadow-[0_0_25px_rgba(34,211,238,.9)]" />
      <div className="text-2xl text-white/80 uppercase tracking-[0.4em] mb-4">Ya llevamos</div>
      <CountUp value={count} />
      <div className="mt-4 text-3xl font-bold text-white">corte{count === 1 ? "" : "s"} hoy</div>
      <div className="mt-2 text-sm uppercase tracking-widest text-fuchsia-200/80">¡Y los que quedan!</div>
    </motion.div>
  </div>
);

// ===== NEXT SLOT =====
const NextSlotSlide = ({ slot }: { slot: { date: string; time: string } }) => {
  const isToday = slot.date === format(new Date(), "yyyy-MM-dd");
  return (
    <div className="text-center">
      <SlideTitle icon={Timer} title="PRÓXIMO HUECO" subtitle="Reserva ahora" />
      <motion.div
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="relative mx-auto max-w-3xl rounded-3xl p-14 bg-gradient-to-br from-emerald-500/25 via-cyan-500/25 to-fuchsia-500/25 backdrop-blur-xl border-2 border-emerald-400/50 overflow-hidden"
      >
        <Timer className="w-20 h-20 text-emerald-300 mx-auto mb-6 drop-shadow-[0_0_25px_rgba(52,211,153,.9)]" />
        <div className="text-xs uppercase tracking-[0.4em] text-emerald-200/80">
          {isToday ? "Hoy" : format(parseISO(slot.date), "EEEE d 'de' MMMM", { locale: es })}
        </div>
        <div className="mt-3 text-9xl font-mono font-black text-white drop-shadow-[0_0_30px_rgba(52,211,153,.7)] tabular-nums">
          {slot.time}
        </div>
        <div className="mt-6 text-2xl font-bold text-white">
          ¡Reserva en <span className="text-emerald-300">diegcutz.es</span>!
        </div>
      </motion.div>
    </div>
  );
};

// ===== QR BOOK =====
const QrBookSlide = () => {
  const url = "https://diegcutz.es/booking";
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&margin=10&data=${encodeURIComponent(url)}`;
  return (
    <div className="text-center">
      <SlideTitle icon={QrCode} title="ESCANEA Y RESERVA" subtitle="Desde el sillón" />
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative mx-auto inline-block rounded-3xl p-8 bg-white border-4 border-cyan-400/70 shadow-[0_0_60px_rgba(34,211,238,.6)]"
      >
        <img src={qr} alt="QR diegcutz.es/booking" className="w-[360px] h-[360px] block" />
      </motion.div>
      <div className="mt-8 text-3xl font-black text-white">
        diegcutz.es/<span className="text-cyan-300">booking</span>
      </div>
      <p className="mt-3 text-sm uppercase tracking-[0.4em] text-cyan-300/80">Apunta con tu cámara</p>
    </div>
  );
};

// ===== LOYALTY PROGRAM =====
const LoyaltyProgramSlide = () => (
  <div className="text-center">
    <SlideTitle icon={Award} title="PROGRAMA DE FIDELIDAD" subtitle="Cada corte cuenta" />
    <motion.div
      initial={{ opacity: 0, rotateY: -25 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ type: "spring", stiffness: 60 }}
      className="relative mx-auto max-w-3xl rounded-3xl p-12 bg-gradient-to-br from-amber-500/25 via-fuchsia-500/20 to-cyan-500/25 backdrop-blur-xl border-2 border-amber-300/50 overflow-hidden"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-amber-300/20 blur-3xl"
      />
      <Award className="w-24 h-24 text-amber-300 mx-auto mb-6 drop-shadow-[0_0_30px_rgba(251,191,36,.9)]" />
      <div className="text-5xl font-black text-white mb-4">GANA CORTES GRATIS</div>
      <p className="text-2xl text-white/80 mb-8">
        Acumula puntos en cada visita y consigue recompensas exclusivas
      </p>
      <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
        {[
          { n: "1", t: "Reserva", c: "from-cyan-400 to-blue-500" },
          { n: "2", t: "Escanea QR", c: "from-fuchsia-400 to-purple-500" },
          { n: "3", t: "Suma puntos", c: "from-amber-400 to-orange-500" },
        ].map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.15 }}
            className="rounded-2xl p-5 bg-black/40 border border-white/10"
          >
            <div className={`text-4xl font-black bg-gradient-to-br ${s.c} bg-clip-text text-transparent`}>
              {s.n}
            </div>
            <div className="mt-2 text-sm uppercase tracking-widest text-white/80">{s.t}</div>
          </motion.div>
        ))}
      </div>
      <p className="mt-8 text-lg text-amber-200/90">
        ¡Cada <span className="font-black">5 cortes</span> = 1 corte <span className="font-black">GRATIS</span>!
      </p>
    </motion.div>
  </div>
);

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