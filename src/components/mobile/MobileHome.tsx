import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, CalendarPlus, ChevronDown, Crown, Gift, MapPin, MessageCircle, Scissors, X } from "lucide-react";
import { MobileTopHeader } from "@/components/mobile/MobileTopHeader";
import { useAuth } from "@/hooks/useAuth";
import { ReviewsShowcase } from "@/components/home/ReviewsShowcase";
import { PendingRatingBanner } from "@/components/home/PendingRatingBanner";
import { MembershipExpirationBanner } from "@/components/home/MembershipExpirationBanner";
import type { HomeMediaSlide } from "@/components/home/MediaCarousel";
import Map from "@/components/Map";
import "./mobile-app.css";
import { supabase } from "@/integrations/supabase/client";
import { StoryFrame, type StoryItem } from "@/components/stories/StoryFrame";
import "@/components/stories/stories.css";
import { Button } from "@/components/ui/button";
import { useFooterAdminGesture } from "@/hooks/useFooterAdminGesture";

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
  useFooterAdminGesture();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [story, setStory] = useState<{ g: number; i: number } | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [weekOpen, setWeekOpen] = useState(false);
  const [extra, setExtra] = useState<StoryItem[]>([]);
  const [dur, setDur] = useState(5);
  const todayIdx = new Date().getDay();

  useEffect(() => {
    supabase.from("home_stories" as any).select("*").order("created_at", { ascending: true }).then(({ data }) => {
      const now = Date.now();
      setExtra(((data as any[]) || []).filter(s => !s.expires_at || new Date(s.expires_at).getTime() > now));
    });
  }, []);

  const groups = [
    { key: "estudio", name: "Estudio", items: slides.map<StoryItem>(s => ({ id: s.id, media_url: s.url, media_type: s.type, filter: "none", crop: { scale: 1, x: 0, y: 0 }, overlays: [] })) },
    { key: "novedades", name: "Novedades", items: extra },
  ].filter(g => g.items.length);

  const next = () => setStory(st => {
    if (!st) return null;
    if (st.i + 1 < groups[st.g].items.length) return { g: st.g, i: st.i + 1 };
    if (st.g + 1 < groups.length) return { g: st.g + 1, i: 0 };
    return null;
  });
  const prev = () => setStory(st => (!st ? null : st.i > 0 ? { g: st.g, i: st.i - 1 } : st.g > 0 ? { g: st.g - 1, i: 0 } : st));
  const current = story ? groups[story.g]?.items[story.i] : null;

  useEffect(() => {
    if (!story || !current) return;
    setSeen(s => new Set(s).add(groups[story.g].key));
    if (current.media_type === "video") return; // advances on video end
    setDur(5);
    const t = window.setTimeout(next, 5000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.g, story?.i, current?.id]);

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
      <MobileTopHeader igEnabled={igEnabled} />

      <div className="mh-hello">
        <small>{greeting()}{profile?.username ? `, @${profile.username}` : ""}</small>
        <h1>¿Toca <em>retoque</em>?</h1>
      </div>

      <div className="mh-stories" aria-label="Historias del estudio">
        <button className="mh-story" onClick={() => navigate("/booking")}>
          <span className="mh-story__ring"><span><CalendarPlus /></span></span>
          <small>Reservar</small>
        </button>
        {groups.map((g, gi) => (
          <button key={g.key} className="mh-story" onClick={() => setStory({ g: gi, i: 0 })} aria-label={`Ver historias: ${g.name}`}>
            <span className={`mh-story__ring ${seen.has(g.key) ? "is-seen" : ""}`}>
              {g.items[0].media_type === "video" ? <video src={g.items[0].media_url} muted playsInline preload="metadata" /> : <img src={g.items[0].media_url} alt="" loading="lazy" />}
            </span>
            <small>{g.name}</small>
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
          <a href="https://maps.app.goo.gl/H1wTD6r3dBjsqRHA7" target="_blank" rel="noreferrer" className="mh-tile"><MapPin /><span><strong>Cómo llegar</strong><small>Carrer Sant Antoni</small></span></a>
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
        <nav><Link to="/privacy">Privacidad</Link><Link to="/terms">Condiciones</Link><Link to="/install">App</Link><Link to="/expediente">Expediente DC-0529</Link></nav>
        <div className="mh-end__signature">© <Button variant="ghost" className="mh-end__word" data-footer-admin="year">{new Date().getFullYear()}</Button><span aria-hidden="true"> · </span><Button variant="ghost" className="mh-end__word" data-footer-admin="brand">DIEGCUTZ</Button><span aria-hidden="true"> - </span><Button variant="ghost" className="mh-end__word" data-footer-admin="place">Monóvar</Button></div>
      </footer>

      {createPortal(<AnimatePresence>
        {story && current && (
          <motion.div className="mh-viewer" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} drag="y" dragConstraints={{ top: 0, bottom: 0 }} onDragEnd={(_, i) => { if (i.offset.y > 100) setStory(null); }}>
            <div className="mh-viewer__bars">{groups[story.g].items.map((it, i) => <span key={it.id} className={i < story.i ? "is-done" : ""}>{i === story.i && <i key={`${story.g}-${story.i}`} style={{ animationDuration: `${dur}s` }} />}</span>)}</div>
            <div className="mh-viewer__head"><span>DIEGCUTZ · {groups[story.g].name}</span><button onClick={() => setStory(null)} aria-label="Cerrar"><X /></button></div>
            <StoryFrame key={current.id} item={current} onVideoMeta={d => setDur(Math.min(d || 15, 60))} onVideoEnd={next} />
            <button className="mh-viewer__tap" style={{ left: 0 }} onClick={prev} aria-label="Anterior" />
            <button className="mh-viewer__tap" style={{ right: 0 }} onClick={next} aria-label="Siguiente" />
            {current.link_url
              ? <a href={current.link_url} target={current.link_url.startsWith("/") ? undefined : "_blank"} rel="noopener noreferrer" className="mh-pill mh-viewer__cta">{current.link_label || "Ver más"} <ArrowUpRight /></a>
              : <Link to="/booking" className="mh-pill mh-viewer__cta">Reservar cita <ArrowUpRight /></Link>}
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </div>
  );
}
