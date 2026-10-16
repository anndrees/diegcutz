import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Pause, Play, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import "./reviews.css";

type Rating = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profile: { username: string; full_name: string } | null;
  booking: { services: unknown } | null;
};

const DURATION = 7000;

const servicesOf = (r: Rating): string[] => {
  const raw = r.booking?.services;
  if (!Array.isArray(raw)) return [];
  return raw.map((s: any) => (typeof s === "string" ? s : s?.name || "")).filter(Boolean);
};

const reorder = (items: Rating[]) => {
  const rest = [...items];
  const out: Rating[] = [];
  const key = (r: Rating) => r.profile?.username || r.id;
  while (rest.length) {
    const last = out.length ? key(out[out.length - 1]) : null;
    let i = rest.findIndex(r => key(r) !== last);
    if (i === -1) i = 0;
    out.push(rest.splice(i, 1)[0]);
  }
  return out;
};

const Stars = ({ value, size = 14 }: { value: number; size?: number }) => (
  <span className="rv-stars" aria-label={`${value} de 5`}>
    {[1, 2, 3, 4, 5].map(s => <Star key={s} style={{ width: size, height: size }} className={s <= value ? "is-on" : ""} />)}
  </span>
);

export const ReviewsShowcase = () => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const isMobile = useIsMobile();
  const reduce = useReducedMotion();

  useEffect(() => {
    supabase
      .from("ratings")
      .select("id, rating, comment, created_at, profile:profiles(username, full_name), booking:bookings(services)")
      .order("rating", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (!data) return;
        setRatings(reorder(data.map(r => ({
          ...r,
          profile: Array.isArray(r.profile) ? r.profile[0] : r.profile,
          booking: Array.isArray(r.booking) ? r.booking[0] : r.booking,
        })) as Rating[]));
      });
  }, []);

  const go = useCallback((step: number) => {
    if (!ratings.length) return;
    setDir(step);
    setIndex(i => (i + step + ratings.length) % ratings.length);
  }, [ratings.length]);

  const stopped = paused || holding || !!reduce;
  useEffect(() => {
    if (stopped || ratings.length < 2) return;
    const t = window.setTimeout(() => go(1), DURATION);
    return () => window.clearTimeout(t);
  }, [index, stopped, ratings.length, go]);

  if (!ratings.length) return null;

  const current = ratings[index];
  const avg = ratings.reduce((a, r) => a + r.rating, 0) / ratings.length;
  const words = (current.comment || "Cinco estrellas sin necesidad de palabras.").split(" ");
  const upcoming = Array.from({ length: Math.min(4, ratings.length - 1) }, (_, k) => (index + k + 1) % ratings.length);
  const segments = Math.min(ratings.length, 12);
  const seg = index % segments;

  return (
    <section className="rv" aria-label="Reseñas de clientes">
      <header className="rv-head">
        <span className="dc-label">Reseñas</span>
        <div className="rv-score">
          <strong>{avg.toFixed(1)}</strong>
          <div><Stars value={Math.round(avg)} size={16} /><span>{ratings.length} valoraciones reales</span></div>
        </div>
      </header>

      <div className="rv-stage">
        <div
          className="rv-feature"
          onPointerDown={() => isMobile && setHolding(true)}
          onPointerUp={() => setHolding(false)}
          onPointerLeave={() => setHolding(false)}
        >
          <div className="rv-segments" aria-hidden="true">
            {Array.from({ length: segments }).map((_, s) => (
              <span key={s} className={s < seg ? "is-done" : ""}>
                {s === seg && <i key={`${index}-${stopped}`} style={{ animationDuration: `${DURATION}ms`, animationPlayState: stopped ? "paused" : "running" }} />}
              </span>
            ))}
          </div>

          <AnimatePresence mode="wait" custom={dir}>
            <motion.article
              key={current.id + index}
              className="rv-card"
              custom={dir}
              drag={isMobile ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => { if (info.offset.x < -60) go(1); else if (info.offset.x > 60) go(-1); }}
              initial={{ opacity: 0, x: dir * 80, rotate: dir * 3 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              exit={{ opacity: 0, x: dir * -80, rotate: dir * -3 }}
              transition={{ duration: reduce ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="rv-card__top">
                <Stars value={current.rating} />
                <span>{format(new Date(current.created_at), "d MMM yyyy", { locale: es })}</span>
              </div>
              <blockquote className={`rv-quote ${!current.comment ? "is-empty" : ""} ${words.length > 40 ? "is-long" : ""}`}>
                {words.map((w, i) => (
                  <motion.span key={i} initial={{ opacity: 0, y: 14, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ delay: reduce ? 0 : 0.15 + i * 0.035, duration: 0.4 }}>{w} </motion.span>
                ))}
              </blockquote>
              <footer className="rv-author">
                <span className="rv-avatar">{(current.profile?.username || "CL").slice(0, 2).toUpperCase()}</span>
                <div><strong>@{current.profile?.username || "cliente"}</strong>{servicesOf(current).length > 0 && <small>{servicesOf(current).slice(0, 2).join(" · ")}</small>}</div>
                <span className="rv-num">{String(index + 1).padStart(2, "0")}<em>/{String(ratings.length).padStart(2, "0")}</em></span>
              </footer>
            </motion.article>
          </AnimatePresence>

          {isMobile && (
            <>
              <button className="rv-tap rv-tap--prev" onClick={() => go(-1)} aria-label="Reseña anterior" />
              <button className="rv-tap rv-tap--next" onClick={() => go(1)} aria-label="Reseña siguiente" />
            </>
          )}
        </div>

        {!isMobile && (
          <aside className="rv-side">
            <span className="dc-label">A continuación</span>
            {upcoming.map((k, n) => (
              <motion.button layout key={ratings[k].id + k} className="rv-next" onClick={() => { setDir(1); setIndex(k); }} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1 - n * 0.18, x: 0 }} transition={{ delay: n * 0.06 }}>
                <span className="rv-avatar rv-avatar--sm">{(ratings[k].profile?.username || "CL").slice(0, 2).toUpperCase()}</span>
                <span><strong>@{ratings[k].profile?.username || "cliente"}</strong><small>{ratings[k].comment || "Sin comentario"}</small></span>
                <Stars value={ratings[k].rating} size={11} />
              </motion.button>
            ))}
            <div className="rv-controls">
              <button onClick={() => go(-1)} aria-label="Anterior"><ArrowLeft /></button>
              <button onClick={() => setPaused(p => !p)} aria-label={paused ? "Reanudar" : "Pausar"}>{paused ? <Play /> : <Pause />}</button>
              <button onClick={() => go(1)} aria-label="Siguiente"><ArrowRight /></button>
            </div>
          </aside>
        )}
      </div>

      <div className="rv-marquee" aria-hidden="true">
        <div className={reduce ? "" : "is-moving"}>
          {[...ratings, ...ratings].map((r, i) => (
            <span key={r.id + i} className="rv-chip"><Stars value={r.rating} size={11} />{r.comment ? `“${r.comment.length > 70 ? r.comment.slice(0, 70) + "…" : r.comment}”` : "Sin comentario"}<em>@{r.profile?.username || "cliente"}</em></span>
          ))}
        </div>
      </div>
    </section>
  );
};
