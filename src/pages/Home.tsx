import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDown, ArrowUpRight, Clock3, Gift, MapPin, Scissors, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerHeader } from "@/components/customer/CustomerHeader";
import { CustomerFooter } from "@/components/customer/CustomerFooter";
import { supabase } from "@/integrations/supabase/client";
import { InstagramFeed } from "@/components/home/InstagramFeed";
import { ReviewsShowcase } from "@/components/home/ReviewsShowcase";
import { PendingRatingBanner } from "@/components/home/PendingRatingBanner";
import { MembershipExpirationBanner } from "@/components/home/MembershipExpirationBanner";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { LiquidChromeWordmark } from "@/components/home/LiquidChromeWordmark";
import { MediaCarousel, type HomeMediaSlide } from "@/components/home/MediaCarousel";
import { ScrollBarberObjects } from "@/components/home/ScrollBarberObjects";
import Map from "@/components/Map";
import defaultHero from "@/assets/urban-studio.jpg";
import craftDetail from "@/assets/urban-tools.jpg";
import clientEditorial from "@/assets/urban-cut.jpg";

type TimeRange = { start: string; end: string };
type BusinessHour = { day_of_week: number; is_closed: boolean; is_24h: boolean; time_ranges: TimeRange[] };
type SpecialHour = { id: string; date: string; is_closed: boolean; time_ranges: TimeRange[]; note: string | null };
type Giveaway = { id: string; title: string; prize: string; end_date: string };
type MarqueeItem = { id: string; text: string; color: string };
type HomeSettings = { image: string; slides: HomeMediaSlide[] };

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function HomeMotionLayer() {
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 95, damping: 24, mass: 0.35 });
  const railScale = useTransform(progress, [0, 1], [0, 1]);
  const meshY = useTransform(progress, [0, 1], [0, -360]);
  const haloRotate = useTransform(progress, [0, 1], [0, 220]);
  if (reducedMotion) return null;
  return <div className="home-motion-layer" aria-hidden="true"><motion.div className="home-scroll-rail" style={{ scaleY: railScale }} /><motion.div className="home-parallax-mesh" style={{ y: meshY }} /><motion.div className="home-chrome-halo" style={{ rotate: haloRotate }} /></div>;
}

export default function Home() {
  const pageRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [specialHours, setSpecialHours] = useState<SpecialHour[]>([]);
  const [activeGiveaway, setActiveGiveaway] = useState<Giveaway | null>(null);
  const [marqueeItems, setMarqueeItems] = useState<MarqueeItem[]>([]);
  const [homeSettings, setHomeSettings] = useState<HomeSettings>({ image: "", slides: [] });

  useEffect(() => {
    const today = new Date();
    const later = new Date(today);
    later.setDate(later.getDate() + 28);
    Promise.all([
      supabase.from("business_hours").select("*").order("day_of_week"),
      supabase.from("special_hours").select("*").gte("date", today.toISOString().split("T")[0]).lte("date", later.toISOString().split("T")[0]).order("date"),
      supabase.from("giveaways").select("id,title,prize,end_date").eq("is_finished", false).lte("start_date", new Date().toISOString()).gte("end_date", new Date().toISOString()).order("end_date").limit(1).maybeSingle(),
      supabase.from("marquee_items").select("id,text,color").eq("is_active", true).order("sort_order"),
      supabase.from("app_settings").select("key,value").in("key", ["home_hero_image_url", "home_hero_slides"]),
    ]).then(([hours, specials, giveaway, marquee, settings]) => {
      if (hours.data) setBusinessHours(hours.data.map(day => ({ ...day, time_ranges: Array.isArray(day.time_ranges) ? day.time_ranges as TimeRange[] : [] })));
      if (specials.data) setSpecialHours(specials.data.map(day => ({ ...day, time_ranges: Array.isArray(day.time_ranges) ? day.time_ranges as TimeRange[] : [] })));
      if (giveaway.data) setActiveGiveaway(giveaway.data as Giveaway);
      setMarqueeItems((marquee.data as MarqueeItem[] | null) || []);
      const next: HomeSettings = { image: "", slides: [] };
      settings.data?.forEach(setting => {
        if (setting.key === "home_hero_image_url" && typeof setting.value === "string") next.image = setting.value;
        if (setting.key === "home_hero_slides" && Array.isArray(setting.value)) next.slides = setting.value as unknown as HomeMediaSlide[];
      });
      setHomeSettings(next);
    });
  }, []);

  const slides = useMemo(() => {
    const configured = homeSettings.slides.filter(slide => slide.active !== false).sort((a, b) => a.order - b.order);
    if (configured.length) return configured;
    return [
      { id: "studio", url: homeSettings.image || defaultHero, type: "image" as const, order: 0 },
      { id: "craft", url: craftDetail, type: "image" as const, order: 1 },
      { id: "client", url: clientEditorial, type: "image" as const, order: 2 },
    ];
  }, [homeSettings]);

  return (
    <div ref={pageRef} className="customer-shell liquid-home min-h-screen overflow-x-hidden">
      <div className="customer-ambient" aria-hidden="true" />
      <HomeMotionLayer />
      <ScrollBarberObjects />
      <InstallBanner />
      <CustomerHeader transparent />

      <motion.section className="liquid-hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
        <div className="liquid-hero__meta"><span>ESTUDIO DE BARBERÍA</span><span>MONÓVAR · ALICANTE</span></div>
        <LiquidChromeWordmark />
        <div className="liquid-hero__bottom">
          <p>Barbería urbana para gente que busca criterio, precisión y una imagen que se sienta propia.</p>
          <div><Button size="lg" onClick={() => navigate("/booking")}>Reservar cita <ArrowUpRight /></Button><a href="#estudio">Descubrir el estudio <ArrowDown /></a></div>
        </div>
      </motion.section>

      {marqueeItems.length > 0 && <div className="liquid-marquee" aria-label="Información destacada"><div>{[...marqueeItems, ...marqueeItems].map((item, index) => <span key={`${item.id}-${index}`}><Scissors />{item.text}</span>)}</div></div>}

      <section className="customer-notices"><MembershipExpirationBanner /><PendingRatingBanner /></section>

      <motion.section id="estudio" className="liquid-intro" initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.25 }} variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.14 } } }}>
        <motion.div className="liquid-intro__heading" variants={{ hidden: { opacity: 0, x: -90, rotateY: -12 }, visible: { opacity: 1, x: 0, rotateY: 0, transition: { duration: 0.75 } } }}><span className="customer-kicker">EL ESTUDIO</span><h2>Menos ruido.<br />Más <em>presencia.</em></h2></motion.div>
        <motion.div className="liquid-intro__copy" variants={{ hidden: { opacity: 0, y: 70 }, visible: { opacity: 1, y: 0, transition: { duration: 0.75 } } }}><p>El corte empieza escuchando. Construimos una forma que encaje contigo, con tu día a día y con lo que quieres proyectar.</p><Button variant="outline" onClick={() => navigate("/booking")}>Encontrar mi estilo <Sparkles /></Button></motion.div>
      </motion.section>

      <MediaCarousel slides={slides} />

      <motion.section className="liquid-principles" initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.18 }} variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.13 } } }}>
        {[
          { icon: Scissors, number: "01", title: "Técnica con intención", text: "Proporción, textura y detalle al servicio de tu imagen." },
          { icon: ShieldCheck, number: "02", title: "Sin improvisar", text: "Cada cita tiene su tiempo, su preparación y su acabado." },
          { icon: Clock3, number: "03", title: "Tu tiempo cuenta", text: "Reserva clara, horario definido y todo listo cuando llegas." },
        ].map(({ icon: Icon, number, title, text }) => <motion.article variants={{ hidden: { opacity: 0, y: 90, rotateX: 12 }, visible: { opacity: 1, y: 0, rotateX: 0, transition: { type: "spring", stiffness: 90, damping: 18 } } }} key={number}><span>{number}</span><Icon /><h3>{title}</h3><p>{text}</p></motion.article>)}
      </motion.section>

      {activeGiveaway && <section className="liquid-feature"><Gift /><div><span className="customer-kicker">AHORA EN DIEGCUTZ</span><h2>{activeGiveaway.title}</h2><p>{activeGiveaway.prize}</p></div><Button variant="secondary" onClick={() => navigate("/giveaways")}>Participar <ArrowUpRight /></Button></section>}

      <section className="liquid-membership"><div><span className="customer-kicker">MEMBRESÍAS</span><h2>Siempre a punto,<br />sin volver a empezar.</h2></div><div><p>Ventajas pensadas para quienes hacen del cuidado personal una rutina, no una excepción.</p><Link to="/membership">Ver membresías <ArrowUpRight /></Link></div></section>

      <ReviewsShowcase />

      <section className="liquid-location">
        <div className="liquid-location__map"><Map /></div>
        <div className="liquid-location__info"><span className="customer-kicker">VEN A VERNOS</span><h2>En el centro<br />de Monóvar.</h2><p><MapPin /> Carrer Sant Antoni · 03640 Monóvar, Alicante</p><div className="liquid-hours">{businessHours.length ? businessHours.map(day => { const special = specialHours.find(item => new Date(`${item.date}T00:00:00`).getDay() === day.day_of_week); return <div key={day.day_of_week}><span>{DAYS[day.day_of_week]}</span><strong>{special?.is_closed || day.is_closed ? "Cerrado" : special ? special.time_ranges.map(range => `${range.start.slice(0, 5)}–${range.end.slice(0, 5)}`).join(" / ") : day.is_24h ? "24 horas" : day.time_ranges.map(range => `${range.start.slice(0, 5)}–${range.end.slice(0, 5)}`).join(" / ")}</strong></div>; }) : <p>Consulta la disponibilidad al reservar.</p>}</div></div>
      </section>

      <InstagramFeed />
      <CustomerFooter />
      <a href="https://wa.me/34641637576" target="_blank" rel="noopener noreferrer" className="liquid-whatsapp" aria-label="Contactar por WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" /></svg></a>
    </div>
  );
}