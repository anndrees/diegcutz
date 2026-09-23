import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Clock3, Gift, MapPin, Scissors, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerHeader } from "@/components/customer/CustomerHeader";
import { CustomerFooter } from "@/components/customer/CustomerFooter";
import { supabase } from "@/integrations/supabase/client";
import { NextAvailableSlot } from "@/components/home/NextAvailableSlot";
import { InstagramFeed } from "@/components/home/InstagramFeed";
import { LiveTestimonials } from "@/components/home/LiveTestimonials";
import { ReviewsShowcase } from "@/components/home/ReviewsShowcase";
import { PendingRatingBanner } from "@/components/home/PendingRatingBanner";
import { MembershipExpirationBanner } from "@/components/home/MembershipExpirationBanner";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import Map from "@/components/Map";
import defaultHero from "@/assets/studio-architectural.jpg";
import craftDetail from "@/assets/craft-detail.jpg";
import clientEditorial from "@/assets/client-editorial.jpg";

type TimeRange = { start: string; end: string };
type BusinessHour = { day_of_week: number; is_closed: boolean; is_24h: boolean; time_ranges: TimeRange[] };
type SpecialHour = { id: string; date: string; is_closed: boolean; time_ranges: TimeRange[]; note: string | null };
type Giveaway = { id: string; title: string; prize: string; end_date: string };
type MarqueeItem = { id: string; text: string; color: string };
type HomeSettings = { image: string; filter: boolean; overlay: number };

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function Home() {
  const navigate = useNavigate();
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [specialHours, setSpecialHours] = useState<SpecialHour[]>([]);
  const [activeGiveaway, setActiveGiveaway] = useState<Giveaway | null>(null);
  const [marqueeItems, setMarqueeItems] = useState<MarqueeItem[]>([]);
  const [homeSettings, setHomeSettings] = useState<HomeSettings>({ image: "", filter: false, overlay: 38 });

  useEffect(() => {
    const today = new Date();
    const later = new Date(today);
    later.setDate(later.getDate() + 28);
    const todayString = today.toISOString().split("T")[0];
    const laterString = later.toISOString().split("T")[0];

    Promise.all([
      supabase.from("business_hours").select("*").order("day_of_week"),
      supabase.from("special_hours").select("*").gte("date", todayString).lte("date", laterString).order("date"),
      supabase.from("giveaways").select("id,title,prize,end_date").eq("is_finished", false).lte("start_date", new Date().toISOString()).gte("end_date", new Date().toISOString()).order("end_date").limit(1).maybeSingle(),
      supabase.from("marquee_items").select("id,text,color").eq("is_active", true).order("sort_order"),
      supabase.from("app_settings").select("key,value").in("key", ["home_hero_image_url", "home_hero_color_filter", "home_hero_overlay_intensity"]),
    ]).then(([hours, specials, giveaway, marquee, settings]) => {
      if (hours.data) setBusinessHours(hours.data.map(day => ({ ...day, time_ranges: Array.isArray(day.time_ranges) ? day.time_ranges as TimeRange[] : [] })));
      if (specials.data) setSpecialHours(specials.data.map(day => ({ ...day, time_ranges: Array.isArray(day.time_ranges) ? day.time_ranges as TimeRange[] : [] })));
      if (giveaway.data) setActiveGiveaway(giveaway.data as Giveaway);
      setMarqueeItems((marquee.data as MarqueeItem[] | null) || []);
      const next = { image: "", filter: false, overlay: 38 };
      settings.data?.forEach(setting => {
        if (setting.key === "home_hero_image_url" && typeof setting.value === "string") next.image = setting.value;
        if (setting.key === "home_hero_color_filter") next.filter = setting.value === true;
        if (setting.key === "home_hero_overlay_intensity" && typeof setting.value === "number") next.overlay = setting.value;
      });
      setHomeSettings(next);
    });
  }, []);

  return (
    <div className="customer-shell home-new min-h-screen overflow-x-hidden">
      <InstallBanner />
      <CustomerHeader transparent />

      <section className="home-hero">
        <div className="home-hero__copy">
          <div className="home-hero__eyebrow"><span /> ESTUDIO DE BARBERÍA · MONÓVAR</div>
          <h1><span>DIEG</span><strong>CUTZ</strong></h1>
          <div className="home-hero__intro">
            <p>Precisión contemporánea, criterio personal y un oficio pensado para acompañar tu forma de estar en el mundo.</p>
            <div className="home-hero__actions">
              <Button size="lg" onClick={() => navigate("/booking")}>Reservar experiencia <ArrowUpRight /></Button>
              <a href="#estudio">Conocer el estudio <ArrowDownRight /></a>
            </div>
          </div>
        </div>

        <figure className="home-hero__image">
          <img src={homeSettings.image || defaultHero} alt="Estudio contemporáneo DIEGCUTZ" width={1600} height={1200} className={homeSettings.filter ? "is-filtered" : ""} />
          <span className="home-hero__veil" style={{ opacity: Math.min(homeSettings.overlay / 180, 0.55) }} />
          <figcaption><span><small>01 / ESTUDIO</small>Oficio contemporáneo</span><ArrowUpRight /></figcaption>
        </figure>
      </section>

      {marqueeItems.length > 0 && (
        <div className="editorial-marquee" aria-label="Información destacada">
          <div className="editorial-marquee__track">
            {[...marqueeItems, ...marqueeItems].map((item, index) => (
              <span key={`${item.id}-${index}`}><Scissors aria-hidden="true" />{item.text}</span>
            ))}
          </div>
        </div>
      )}

      <section className="home-status">
        <div className="home-status__notices"><MembershipExpirationBanner /><PendingRatingBanner /></div>
        <NextAvailableSlot />
      </section>

      <section id="estudio" className="home-manifesto">
        <header><span>02 / NUESTRO ENFOQUE</span><h2>Más que seguir tendencias,<br />construimos <em>presencia.</em></h2></header>
        <div className="home-manifesto__grid">
          <figure><img src={craftDetail} alt="Trabajo de precisión con tijera" width={1024} height={1280} loading="lazy" /></figure>
          <div className="home-manifesto__copy">
            <p className="home-manifesto__lead">Cada corte parte de una conversación: tus hábitos, tu imagen y el tiempo que quieres dedicarle después.</p>
            {[
              { icon: Scissors, number: "01", title: "Corte con criterio", text: "Técnica, textura y proporción al servicio de tu estilo." },
              { icon: ShieldCheck, number: "02", title: "Acabado profesional", text: "Un resultado limpio que funciona dentro y fuera del estudio." },
              { icon: Sparkles, number: "03", title: "Asesoramiento personal", text: "Recomendaciones claras, también con nuestro asesor inteligente." },
            ].map(({ icon: FeatureIcon, number, title, text }) => (
              <article key={number}><FeatureIcon /><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>
            ))}
            <Button variant="outline" onClick={() => navigate("/booking")}>Elegir mi cita <ArrowRight /></Button>
          </div>
        </div>
      </section>

      {activeGiveaway && (
        <section className="home-feature-band">
          <span>ACTIVO AHORA</span><Gift />
          <div><h2>{activeGiveaway.title}</h2><p>{activeGiveaway.prize}</p></div>
          <Button variant="outline" onClick={() => navigate("/giveaways")}>Ver sorteo <ArrowUpRight /></Button>
        </section>
      )}

      <section className="home-experience">
        <div className="home-experience__copy"><span>03 / LA EXPERIENCIA</span><h2>Tu tiempo también forma parte del servicio.</h2><p>Reserva online, elige tu música y llega sabiendo que el espacio y el tiempo están preparados para ti.</p><div className="home-experience__rules"><div><Clock3 /><strong>Reserva clara</strong><p>Puedes cancelar o reubicar con 48 horas de antelación.</p></div><div><ShieldCheck /><strong>Pago sencillo</strong><p>El servicio se abona en efectivo antes de comenzar.</p></div></div><Link to="/membership">Explorar membresías <ArrowUpRight /></Link></div>
        <figure><img src={clientEditorial} alt="Cliente con corte contemporáneo" width={1024} height={1280} loading="lazy" /><figcaption>ESTILO QUE PERMANECE / 03</figcaption></figure>
      </section>

      <ReviewsShowcase />

      <section className="home-location">
        <div className="home-location__info">
          <span>04 / VISÍTANOS</span><h2>Un estudio urbano en el centro de Monóvar.</h2><p><MapPin /> Carrer Sant Antoni · 03640 Monóvar, Alicante</p>
          <div className="home-hours">
            {businessHours.length > 0 ? businessHours.map(day => {
              const special = specialHours.find(item => new Date(`${item.date}T00:00:00`).getDay() === day.day_of_week);
              return <div key={day.day_of_week}><span>{DAYS[day.day_of_week]}</span><strong>{special?.is_closed || day.is_closed ? "Cerrado" : special ? special.time_ranges.map(range => `${range.start.slice(0, 5)}–${range.end.slice(0, 5)}`).join(" / ") : day.is_24h ? "24 horas" : day.time_ranges.map(range => `${range.start.slice(0, 5)}–${range.end.slice(0, 5)}`).join(" / ")}</strong></div>;
            }) : <p className="text-muted-foreground">Consulta la disponibilidad al reservar.</p>}
          </div>
        </div>
        <div className="home-location__map"><Map /></div>
      </section>

      <InstagramFeed />
      <CustomerFooter />
      <LiveTestimonials />

      <a href="https://wa.me/34641637576" target="_blank" rel="noopener noreferrer" className="whatsapp-architectural" aria-label="Contactar por WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" /></svg>
      </a>
    </div>
  );
}