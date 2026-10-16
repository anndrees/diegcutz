import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform, AnimatePresence, type MotionValue } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Gift, Instagram, MapPin, Pause, Play } from "lucide-react";
import { CustomerHeader } from "@/components/customer/CustomerHeader";
import { CustomerFooter } from "@/components/customer/CustomerFooter";
import { supabase } from "@/integrations/supabase/client";
import { ReviewsShowcase } from "@/components/home/ReviewsShowcase";
import { PendingRatingBanner } from "@/components/home/PendingRatingBanner";
import { MembershipExpirationBanner } from "@/components/home/MembershipExpirationBanner";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import type { HomeMediaSlide } from "@/components/home/MediaCarousel";
import Map from "@/components/Map";
import defaultHero from "@/assets/urban-studio.jpg";
import craftDetail from "@/assets/urban-tools.jpg";
import clientEditorial from "@/assets/urban-cut.jpg";
import "./home.css";

type TimeRange = { start: string; end: string };
type BusinessHour = { day_of_week: number; is_closed: boolean; is_24h: boolean; time_ranges: TimeRange[] };
type SpecialHour = { id: string; date: string; is_closed: boolean; time_ranges: TimeRange[]; note: string | null };
type Giveaway = { id: string; title: string; prize: string; end_date: string };
type MarqueeItem = { id: string; text: string; color: string };

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const MANIFESTO = "Un corte no es un trámite. Es cómo entras en una sala, cómo te ves en el reflejo y cómo te recuerdan.";
const fmt = (r: TimeRange[]) => r.map(x => `${x.start.slice(0, 5)}–${x.end.slice(0, 5)}`).join(" · ");

function LetterPhotoTitle({ images }: { images: string[] }) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = "dc-editorial-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Instrument+Serif:ital@0;1&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    images.forEach(url => { const image = new Image(); image.src = url; });
  }, [images]);

  useEffect(() => {
    if (reduce || !images.length) return;
    const timer = window.setInterval(() => setStep(value => value + 1), 3200);
    return () => window.clearInterval(timer);
  }, [reduce, images.length]);

  return (
    <h1 className="dc-hero__title" aria-label="DIEGCUTZ">
      {Array.from("DIEGCUTZ").map((letter, index) => (
        <span key={index} className="dc-hero__letter" aria-hidden="true">
          {letter}
          {index === step % 8 && images.length > 0 && (
            <span key={step} className="dc-hero__letter-photo" style={{ backgroundImage: `url(${JSON.stringify(images[step % images.length])})` }}>
              {letter}
            </span>
          )}
        </span>
      ))}
    </h1>
  );
}

function Word({ word, index, total, progress }: { word: string; index: number; total: number; progress: MotionValue<number> }) {
  const start = index / total;
  const opacity = useTransform(progress, [start, start + 1 / total], [0.12, 1]);
  return <motion.span style={{ opacity }}>{word} </motion.span>;
}

function Manifesto() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = MANIFESTO.split(" ");
  return (
    <section className="dc-manifesto" ref={ref}>
      <span className="dc-label">(01) Filosofía</span>
      <p>{words.map((w, i) => <Word key={i} word={w} index={i} total={words.length} progress={scrollYProgress} />)}</p>
    </section>
  );
}

function Reel({ slides }: { slides: HomeMediaSlide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = window.setInterval(() => setI(v => (v + 1) % slides.length), 6500);
    return () => window.clearInterval(t);
  }, [paused, slides.length]);
  const slide = slides[i % slides.length];
  if (!slide) return null;
  return (
    <section className="dc-reel" aria-label="El estudio">
      <div className="dc-reel__head">
        <span className="dc-label">(02) El estudio</span>
        <div className="dc-reel__count"><strong>{String(i + 1).padStart(2, "0")}</strong> / {String(slides.length).padStart(2, "0")}</div>
      </div>
      <div className="dc-reel__frame">
        <AnimatePresence mode="popLayout">
          <motion.div key={slide.id} className="dc-reel__media" initial={{ clipPath: "inset(0 0 0 100% round 2rem)" }} animate={{ clipPath: "inset(0 0 0 0% round 2rem)" }} exit={{ opacity: 0.4 }} transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}>
            {slide.type === "video"
              ? <video src={slide.url} muted loop autoPlay playsInline />
              : <img src={slide.url} alt={`DIEGCUTZ, escena ${i + 1}`} />}
          </motion.div>
        </AnimatePresence>
        {slides.length > 1 && (
          <div className="dc-reel__controls">
            {slides.map((s, n) => <button key={s.id} className={n === i ? "is-on" : ""} onClick={() => setI(n)} aria-label={`Ver escena ${n + 1}`}><span key={`${i}-${paused}`} /></button>)}
            <button className="dc-reel__pause" onClick={() => setPaused(p => !p)} aria-label={paused ? "Reanudar" : "Pausar"}>{paused ? <Play /> : <Pause />}</button>
          </div>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);

  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [specialHours, setSpecialHours] = useState<SpecialHour[]>([]);
  const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
  const [marquee, setMarquee] = useState<MarqueeItem[]>([]);
  const [heroImage, setHeroImage] = useState("");
  const [configured, setConfigured] = useState<HomeMediaSlide[]>([]);
  const [igEnabled, setIgEnabled] = useState(true);

  useEffect(() => {
    const today = new Date();
    const later = new Date(today);
    later.setDate(later.getDate() + 28);
    const now = new Date().toISOString();
    Promise.all([
      supabase.from("business_hours").select("*").order("day_of_week"),
      supabase.from("special_hours").select("*").gte("date", today.toISOString().split("T")[0]).lte("date", later.toISOString().split("T")[0]).order("date"),
      supabase.from("giveaways").select("id,title,prize,end_date").eq("is_finished", false).lte("start_date", now).gte("end_date", now).order("end_date").limit(1).maybeSingle(),
      supabase.from("marquee_items").select("id,text,color").eq("is_active", true).order("sort_order"),
      supabase.from("app_settings").select("key,value").in("key", ["home_hero_image_url", "home_hero_slides", "instagram_feed_enabled"]),
    ]).then(([hours, specials, gw, mq, settings]) => {
      if (hours.data) setBusinessHours(hours.data.map(d => ({ ...d, time_ranges: Array.isArray(d.time_ranges) ? d.time_ranges as TimeRange[] : [] })));
      if (specials.data) setSpecialHours(specials.data.map(d => ({ ...d, time_ranges: Array.isArray(d.time_ranges) ? d.time_ranges as TimeRange[] : [] })));
      if (gw.data) setGiveaway(gw.data as Giveaway);
      setMarquee((mq.data as MarqueeItem[] | null) || []);
      settings.data?.forEach(s => {
        if (s.key === "home_hero_image_url" && typeof s.value === "string") setHeroImage(s.value);
        if (s.key === "home_hero_slides" && Array.isArray(s.value)) setConfigured(s.value as unknown as HomeMediaSlide[]);
        if (s.key === "instagram_feed_enabled") setIgEnabled(s.value === true);
      });
    });
  }, []);

  const slides = useMemo(() => {
    const list = configured.filter(s => s.active !== false).sort((a, b) => a.order - b.order);
    if (list.length) return list;
    return [
      { id: "studio", url: heroImage || defaultHero, type: "image" as const, order: 0 },
      { id: "craft", url: craftDetail, type: "image" as const, order: 1 },
      { id: "client", url: clientEditorial, type: "image" as const, order: 2 },
    ];
  }, [configured, heroImage]);

  const letterImages = useMemo(() => {
    const photos = slides.filter(s => s.type === "image").map(s => s.url);
    return photos.length ? photos : [defaultHero, craftDetail, clientEditorial];
  }, [slides]);

  const todayIdx = new Date().getDay();

  return (
    <div className="dc-home min-h-screen">
      <InstallBanner />
      <CustomerHeader transparent />

      <section className="dc-hero" ref={heroRef}>
        <div className="dc-hero__meta">
          <span>Barbería urbana</span>
          <span>Monóvar — Alicante</span>
          <span>Est. con criterio</span>
        </div>
        <LetterPhotoTitle images={letterImages} />
        <div className="dc-hero__foot">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            Cortes, degradados y barba con precisión. <em>Sin prisas, sin plantillas.</em>
          </motion.p>
          <motion.button className="dc-badge" onClick={() => navigate("/booking")} initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.9, type: "spring", stiffness: 120 }} aria-label="Reservar cita">
            <svg viewBox="0 0 200 200" aria-hidden="true"><defs><path id="dc-circle" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" /></defs><text><textPath href="#dc-circle">RESERVA TU CITA · RESERVA TU CITA · </textPath></text></svg>
            <ArrowUpRight />
          </motion.button>
        </div>
      </section>

      {marquee.length > 0 && (
        <div className="dc-ticker" aria-label="Información destacada">
          <div>{[...marquee, ...marquee, ...marquee].map((m, i) => <span key={`${m.id}-${i}`}>{m.text}<i aria-hidden="true">✕</i></span>)}</div>
        </div>
      )}

      <section className="dc-notices"><MembershipExpirationBanner /><PendingRatingBanner /></section>

      <Manifesto />
      <Reel slides={slides} />

      <section className="dc-method">
        <span className="dc-label">(03) Método</span>
        {[
          ["Escucha", "Antes de tocar las tijeras, entendemos qué quieres proyectar y cómo vives tu pelo."],
          ["Precisión", "Proporción, textura y líneas limpias. Cada detalle tiene un motivo."],
          ["Acabado", "Sales listo, con el estilo asentado y sabiendo cómo mantenerlo."],
        ].map(([t, d], n) => (
          <motion.button key={t} className="dc-method__row" onClick={() => navigate("/booking")} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: n * 0.08, duration: 0.6 }}>
            <span className="dc-method__n">0{n + 1}</span>
            <strong>{t}</strong>
            <p>{d}</p>
            <ArrowRight />
          </motion.button>
        ))}
      </section>

      {giveaway && (
        <section className="dc-giveaway">
          <Gift />
          <div><span className="dc-label">Ahora mismo</span><h2>{giveaway.title}</h2><p>{giveaway.prize}</p></div>
          <button className="dc-btn dc-btn--light" onClick={() => navigate("/giveaways")}>Participar <ArrowUpRight /></button>
        </section>
      )}

      <section className="dc-membership">
        <motion.div className="dc-membership__card" initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
          <span className="dc-label">(04) Membresías</span>
          <h2>Siempre<br />a punto.</h2>
          <div className="dc-membership__foot">
            <p>Para quienes no esperan a que se note. Ventajas mensuales pensadas para tu ritmo.</p>
            <Link to="/membership" className="dc-btn dc-btn--accent">Ver planes <ArrowUpRight /></Link>
          </div>
        </motion.div>
      </section>

      <div className="dc-reviews"><ReviewsShowcase /></div>

      <section className="dc-visit">
        <div className="dc-visit__info">
          <span className="dc-label">(05) Visítanos</span>
          <h2>Monóvar,<br />centro.</h2>
          <p className="dc-visit__addr"><MapPin /> Carrer Sant Antoni · 03640 Monóvar, Alicante</p>
          <ul className="dc-hours">
            {businessHours.length ? ORDER.map(dow => businessHours.find(d => d.day_of_week === dow)).filter(Boolean).map(day => {
              const d = day as BusinessHour;
              const special = specialHours.find(s => new Date(`${s.date}T00:00:00`).getDay() === d.day_of_week);
              const closed = special?.is_closed || d.is_closed;
              const text = closed ? "Cerrado" : special ? fmt(special.time_ranges) : d.is_24h ? "24 horas" : fmt(d.time_ranges);
              return <li key={d.day_of_week} className={`${d.day_of_week === todayIdx ? "is-today" : ""} ${closed ? "is-closed" : ""}`}><span>{DAYS[d.day_of_week]}</span><strong>{text}</strong></li>;
            }) : <li><span>Consulta la disponibilidad al reservar.</span></li>}
          </ul>
        </div>
        <div className="dc-visit__map"><Map /></div>
      </section>

      <section className="dc-final">
        <button onClick={() => navigate("/booking")} className="dc-final__cta">
          <span>¿Te toca?</span>
          <strong>Reserva<ArrowUpRight /></strong>
        </button>
        {igEnabled && (
          <a className="dc-ig" href="https://instagram.com/diegcutz" target="_blank" rel="noopener noreferrer"><Instagram /> @diegcutz</a>
        )}
      </section>

      <CustomerFooter />
      <a href="https://wa.me/34641637576" target="_blank" rel="noopener noreferrer" className="dc-whatsapp" aria-label="Contactar por WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" /></svg></a>
    </div>
  );
}
