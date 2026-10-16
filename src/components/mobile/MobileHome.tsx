import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, CalendarPlus, ChevronDown, Crown, Gift, Instagram, MapPin, MessageCircle, Scissors, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ReviewsShowcase } from "@/components/home/ReviewsShowcase";
import { PendingRatingBanner } from "@/components/home/PendingRatingBanner";
import { MembershipExpirationBanner } from "@/components/home/MembershipExpirationBanner";
import type { HomeMediaSlide } from "@/components/home/MediaCarousel";
import Map from "@/components/Map";
import "./mobile-app.css";

type TimeRange = { start: string; end: string };
type BusinessHour = { day_of_week: number; is_closed: boolean; is_24h: boolean; time_ranges: TimeRange[] };
type SpecialHour = { id: string; date: string; is_closed: boolean; time_ranges: TimeRange[]; note: string | null };

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const fmt = (r: TimeRange[]) => r.map(x => `${x.start.slice(0, 5)}–${x.end.slice(0, 5)}`).join(" · ");

type Props = {
  title: ReactNode;
  slides: HomeMediaSlide[];
  giveaway: { title: string; prize: string } | null;
  marquee: { id: string; text: string }[];
  businessHours: BusinessHour[];
  specialHours: SpecialHour[];
  igEnabled: boolean;
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 14 ? "Buenos días" : h < 21 ? "Buenas tardes" : "Buenas noches";
};

export function MobileHome({ title, slides, giveaway, marquee, businessHours, specialHours, igEnabled }: Props) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [story, setStory] = useState<number | null>(null);
  const [seen, setSeen] = useState<Set<number>>(new Set());
  const [weekOpen, setWeekOpen] = useState(false);
  const todayIdx = new Date().getDay();

  useEffect(() => {
    if (story === null) return;
    setSeen(s => new Set(s).add(story));
    const t = window.setTimeout(() => setStory(i => (i !== null && i + 1 < slides.length ? i + 1 : null)), 5000);
    return () => window.clearTimeout(t);
  }, [story, slides.length]);

  const dayInfo = (dow: number) => {
    const d = businessHours.find(b => b.day_of_week === dow);
    if (!d) return null;
    const special = specialHours.find(s => new Date(`${s.date}T00:00:00`).getDay() === dow);
    const closed = !!(special?.is_closed || d.is_closed);
    return { closed, text: closed ? "Cerrado" : special ? fmt(special.time_ranges) : d.is_24h ? "24 horas" : fmt(d.time_ranges) };
  };
  const today = dayInfo(todayIdx);

  const fade = { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.2 }, transition: { duration: 0.45 } };

  return (
    <div className="mh">
      <header className="mh-top">
        <span className="mh-top__brand">DIEGCUTZ<span>.</span></span>
        <div className="mh-top__actions">
          {igEnabled && <a className="mh-icon" href="https://instagram.com/diegcutz" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram /></a>}
          <a className="mh-icon" href="https://wa.me/34641637576" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><MessageCircle /></a>
        </div>
      </header>

      <div className="mh-hello">
        <small>{greeting()}{profile?.username ? `, @${profile.username}` : ""}</small>
        <h1>¿Toca <em>retoque</em>?</h1>
      </div>

      <div className="mh-stories" aria-label="Historias del estudio">
        <button className="mh-story" onClick={() => navigate("/booking")}>
          <span className="mh-story__ring"><span><CalendarPlus /></span></span>
          <small>Reservar</small>
        </button>
        {slides.map((s, i) => (
          <button key={s.id} className="mh-story" onClick={() => setStory(i)} aria-label={`Ver historia ${i + 1}`}>
            <span className={`mh-story__ring ${seen.has(i) ? "is-seen" : ""}`}>
              {s.type === "video" ? <video src={s.url} muted playsInline preload="metadata" /> : <img src={s.url} alt="" loading="lazy" />}
            </span>
            <small>Estudio {String(i + 1).padStart(2, "0")}</small>
          </button>
        ))}
      </div>

      <motion.section className="mh-hero" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
        {title}
        <div className="mh-hero__row">
          <p>Barbería urbana en Monóvar. Precisión sin prisas.</p>
          <Link to="/booking" className="mh-pill">Cita <ArrowUpRight /></Link>
        </div>
      </motion.section>

      {marquee.length > 0 && (
        <div className="mh-ticker" aria-label="Avisos"><div>{[...marquee, ...marquee, ...marquee].map((m, i) => <span key={m.id + i}>{m.text}</span>)}</div></div>
      )}

      <section className="mh-section" style={{ display: "grid", gap: ".7rem" }}>
        <MembershipExpirationBanner />
        <PendingRatingBanner />
      </section>

      <motion.section className="mh-section" {...fade}>
        <div className="mh-section__head"><h2>Accesos rápidos</h2></div>
        <div className="mh-grid">
          <Link to="/booking" className="mh-tile mh-tile--ink"><Scissors /><span><strong>Reservar</strong><small>Elige día y hora</small></span></Link>
          <Link to="/membership" className="mh-tile"><Crown /><span><strong>Club</strong><small>Membresías</small></span></Link>
          <Link to="/giveaways" className="mh-tile"><Gift /><span><strong>Sorteos</strong><small>Participa gratis</small></span></Link>
          <a href="https://maps.google.com/?q=Carrer+Sant+Antoni+Monovar+Alicante" target="_blank" rel="noreferrer" className="mh-tile"><MapPin /><span><strong>Cómo llegar</strong><small>Carrer Sant Antoni</small></span></a>
        </div>
      </motion.section>

      {giveaway && (
        <motion.section className="mh-section" {...fade}>
          <button className="mh-card" onClick={() => navigate("/giveaways")}>
            <Gift />
            <div><small>Sorteo activo</small><strong>{giveaway.title}</strong><small>{giveaway.prize}</small></div>
            <ArrowUpRight />
          </button>
        </motion.section>
      )}

      <motion.section className="mh-section" {...fade}>
        <div className="mh-section__head"><h2>Hoy</h2><button onClick={() => setWeekOpen(o => !o)} aria-expanded={weekOpen}>{weekOpen ? "Ocultar" : "Semana"}</button></div>
        <div className="mh-today">
          <div className="mh-today__now">
            <span className={`mh-today__dot ${!today || today.closed ? "is-closed" : ""}`} />
            <strong>{DAYS[todayIdx]}</strong>
            <span>{today ? today.text : "Consulta al reservar"}</span>
            <ChevronDown style={{ width: 16, transform: weekOpen ? "rotate(180deg)" : "none", transition: "transform .3s" }} onClick={() => setWeekOpen(o => !o)} />
          </div>
          <AnimatePresence initial={false}>
            {weekOpen && (
              <motion.ul className="mh-week" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                {ORDER.map(dow => { const info = dayInfo(dow); return info && <li key={dow} className={`${dow === todayIdx ? "is-today" : ""} ${info.closed ? "is-closed" : ""}`}><span>{DAYS[dow]}</span><strong>{info.text}</strong></li>; })}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      <motion.section className="mh-section" {...fade}>
        <Link to="/membership" className="mh-tile mh-tile--ink" style={{ minHeight: "9rem" }}>
          <Crown />
          <span><strong style={{ fontSize: "1.5rem" }}>Siempre a punto.</strong><small>Ventajas mensuales del club DIEGCUTZ</small></span>
        </Link>
      </motion.section>

      <ReviewsShowcase />

      <motion.section className="mh-section" {...fade}>
        <div className="mh-section__head"><h2>El estudio</h2></div>
        <div className="mh-map"><Map /></div>
        <p className="mh-addr"><MapPin /> Carrer Sant Antoni · 03640 Monóvar, Alicante</p>
      </motion.section>

      <footer className="mh-end">
        <nav><Link to="/privacy">Privacidad</Link><Link to="/terms">Condiciones</Link><Link to="/install">App</Link></nav>
        <span>© {new Date().getFullYear()} DIEGCUTZ · Monóvar</span>
      </footer>

      <AnimatePresence>
        {story !== null && slides[story] && (
          <motion.div className="mh-viewer" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} drag="y" dragConstraints={{ top: 0, bottom: 0 }} onDragEnd={(_, i) => { if (i.offset.y > 100) setStory(null); }}>
            <div className="mh-viewer__bars">{slides.map((_, i) => <span key={i} className={i < story ? "is-done" : ""}>{i === story && <i key={story} />}</span>)}</div>
            <div className="mh-viewer__head"><span>DIEGCUTZ · Estudio</span><button onClick={() => setStory(null)} aria-label="Cerrar"><X /></button></div>
            {slides[story].type === "video" ? <video src={slides[story].url} autoPlay muted playsInline loop /> : <img src={slides[story].url} alt={`Estudio ${story + 1}`} />}
            <button className="mh-viewer__tap" style={{ left: 0 }} onClick={() => setStory(s => (s ? s - 1 : 0))} aria-label="Anterior" />
            <button className="mh-viewer__tap" style={{ right: 0 }} onClick={() => setStory(s => (s !== null && s + 1 < slides.length ? s + 1 : null))} aria-label="Siguiente" />
            <Link to="/booking" className="mh-pill mh-viewer__cta">Reservar cita <ArrowUpRight /></Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
