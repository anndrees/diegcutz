import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Scissors, Clock, MapPin, MessageCircle, User, Gift, Sparkles, Zap } from "lucide-react";
import heroImage from "@/assets/hero-barber.jpg";
import Map from "@/components/Map";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { RatingsCarousel } from "@/components/RatingsCarousel";

// Custom hook for parallax effect with smooth interpolation
const useParallax = () => {
  const [scrollY, setScrollY] = useState(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    const handleScroll = () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return scrollY;
};

// Custom hook for mouse parallax
const useMouseParallax = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return mousePos;
};

type TimeRange = {
  start: string;
  end: string;
};

type BusinessHour = {
  day_of_week: number;
  is_closed: boolean;
  is_24h: boolean;
  time_ranges: TimeRange[];
};

type SpecialHour = {
  id: string;
  date: string;
  is_closed: boolean;
  time_ranges: TimeRange[];
  note: string | null;
};

type Giveaway = {
  id: string;
  title: string;
  prize: string;
  end_date: string;
};

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// Floating particles component
const FloatingParticles = ({ scrollY }: { scrollY: number }) => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 6 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 4,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-neon-cyan/30"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            transform: `translateY(${scrollY * (0.1 + p.id * 0.02)}px)`,
            animation: `float ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
            boxShadow: `0 0 ${p.size * 2}px ${p.size / 2}px rgba(0, 245, 255, 0.3)`,
          }}
        />
      ))}
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [specialHours, setSpecialHours] = useState<SpecialHour[]>([]);
  const [activeGiveaway, setActiveGiveaway] = useState<Giveaway | null>(null);
  const scrollY = useParallax();
  const mousePos = useMouseParallax();

  // Refs for scroll-triggered animations
  const aboutRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const hoursRef = useRef<HTMLDivElement>(null);

  const [aboutVisible, setAboutVisible] = useState(false);
  const [servicesVisible, setServicesVisible] = useState(false);
  const [locationVisible, setLocationVisible] = useState(false);
  const [hoursVisible, setHoursVisible] = useState(false);

  useEffect(() => {
    loadBusinessHours();
    loadSpecialHours();
    loadActiveGiveaway();

    // Intersection observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === aboutRef.current) setAboutVisible(true);
            if (entry.target === servicesRef.current) setServicesVisible(true);
            if (entry.target === locationRef.current) setLocationVisible(true);
            if (entry.target === hoursRef.current) setHoursVisible(true);
          }
        });
      },
      { threshold: 0.1, rootMargin: "-50px" },
    );

    [aboutRef, servicesRef, locationRef, hoursRef].forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  const loadBusinessHours = async () => {
    const { data } = await supabase.from("business_hours").select("*").order("day_of_week", { ascending: true });

    if (data) {
      const formattedData = data.map((d) => ({
        ...d,
        time_ranges: Array.isArray(d.time_ranges) ? (d.time_ranges as TimeRange[]) : [],
      }));
      setBusinessHours(formattedData);
    }
  };

  const loadSpecialHours = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];
    
    // Get special hours for the next 4 weeks
    const fourWeeksLater = new Date(today);
    fourWeeksLater.setDate(fourWeeksLater.getDate() + 28);
    const fourWeeksStr = fourWeeksLater.toISOString().split("T")[0];

    const { data } = await supabase
      .from("special_hours")
      .select("*")
      .gte("date", todayStr)
      .lte("date", fourWeeksStr)
      .order("date", { ascending: true });

    if (data) {
      setSpecialHours(
        data.map((d) => ({
          ...d,
          time_ranges: Array.isArray(d.time_ranges) ? (d.time_ranges as TimeRange[]) : [],
        }))
      );
    }
  };

  const loadActiveGiveaway = async () => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("giveaways")
      .select("id, title, prize, end_date")
      .eq("is_finished", false)
      .lte("start_date", now)
      .gte("end_date", now)
      .order("end_date", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (data) {
      setActiveGiveaway(data as Giveaway);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* CSS for custom animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes glow-pulse {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(139, 92, 246, 0.5)); }
          50% { filter: drop-shadow(0 0 40px rgba(139, 92, 246, 0.8)); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(60px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes text-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-text {
          background: linear-gradient(90deg, #8B5CF6 0%, #00F5FF 25%, #8B5CF6 50%, #00F5FF 75%, #8B5CF6 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: text-shimmer 28s linear infinite;
        }
        .magnetic-button:hover {
          transform: scale(1.05) translateY(-2px);
          box-shadow: 0 20px 40px -10px rgba(139, 92, 246, 0.5);
        }
      `}</style>

      {/* Top Bar with Login/Profile */}
      <div className="fixed top-0 right-0 z-50 p-4">
        {user && profile ? (
          <Button
            variant="ghost"
            onClick={() => navigate("/user")}
            className="text-foreground hover:text-neon-cyan transition-all duration-300 backdrop-blur-sm bg-background/30 hover:bg-background/50"
          >
            <User className="mr-2 h-4 w-4" />
            {profile.username}
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={() => navigate("/auth")}
            className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-background transition-all duration-300 magnetic-button backdrop-blur-sm bg-background/30"
          >
            <User className="mr-2 h-4 w-4" />
            Iniciar Sesión
          </Button>
        )}
      </div>

      {/* Hero Section with Advanced Parallax */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Main background with deep parallax */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${heroImage})`,
            transform: `translateY(${scrollY * 0.4}px) scale(${1.1 + scrollY * 0.0003})`,
            filter: `brightness(${Math.max(0.3, 0.6 - scrollY * 0.0005)})`,
          }}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/50 to-background" />
        <div
          className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background/80"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }}
        />

        {/* Floating particles */}
        <FloatingParticles scrollY={scrollY} />

        {/* Animated orbs with mouse parallax */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-purple/20 rounded-full blur-[100px]"
            style={{
              transform: `translate(${mousePos.x * 30}px, ${mousePos.y * 30 + scrollY * -0.3}px)`,
              animation: "glow-pulse 4s ease-in-out infinite",
            }}
          />
          <div
            className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-neon-cyan/15 rounded-full blur-[120px]"
            style={{
              transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20 + scrollY * -0.2}px)`,
              animation: "glow-pulse 5s ease-in-out infinite",
              animationDelay: "1s",
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-72 h-72 bg-neon-pink/10 rounded-full blur-[80px]"
            style={{
              transform: `translate(-50%, -50%) translate(${mousePos.x * 40}px, ${mousePos.y * 40 + scrollY * -0.4}px)`,
              animation: "glow-pulse 3s ease-in-out infinite",
              animationDelay: "0.5s",
            }}
          />
        </div>

        {/* Content */}
        <div
          className="relative z-10 text-center px-4 max-w-5xl mx-auto"
          style={{
            transform: `translateY(${scrollY * 0.15}px)`,
            opacity: Math.max(0, 1 - scrollY / 400),
          }}
        >
          {/* Decorative elements */}
          <div className="flex justify-center gap-4 mb-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
            <Sparkles className="w-6 h-6 text-neon-cyan animate-pulse" />
            <Zap className="w-6 h-6 text-neon-purple animate-pulse" style={{ animationDelay: "0.3s" }} />
            <Sparkles className="w-6 h-6 text-neon-cyan animate-pulse" style={{ animationDelay: "0.6s" }} />
          </div>

          <h1
            className="text-7xl md:text-9xl font-black mb-6 font-aggressive animate-fade-in text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.8)]"
            style={{ animationDuration: "1s" }}
          >
            DIEGCUTZ
          </h1>

          <p
            className="text-xl md:text-3xl text-neon-cyan mb-10 font-bold uppercase tracking-[0.2em] animate-fade-in"
            style={{
              animationDelay: "300ms",
              animationDuration: "1s",
            }}
          >
            Urban Barbershop · Estilo Callejero
          </p>

          <Button
            size="lg"
            variant="neon"
            onClick={() => navigate("/booking")}
            className="text-xl px-16 py-8 h-auto animate-fade-in magnetic-button transition-all duration-300"
            style={{ animationDelay: "500ms", animationDuration: "1s" }}
          >
            <Scissors className="mr-3 h-6 w-6" />
            Reserva tu Cita
          </Button>
        </div>

        {/* Enhanced scroll indicator */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ opacity: Math.max(0, 1 - scrollY / 200) }}
        >
          <span className="text-xs uppercase tracking-widest text-muted-foreground animate-pulse">Scroll</span>
          <div className="w-6 h-10 border-2 border-neon-cyan/50 rounded-full flex justify-center relative overflow-hidden">
            <div className="w-1.5 h-3 bg-neon-cyan rounded-full mt-2 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Active Giveaway Banner */}
      {activeGiveaway && (
        <section className="py-6 px-4 bg-gradient-neon">
          <div className="max-w-4xl mx-auto text-center">
            <button
              onClick={() => navigate("/giveaways")}
              className="flex items-center justify-center gap-4 w-full group"
            >
              <Gift className="h-8 w-8 text-background animate-bounce" />
              <div>
                <p className="text-lg font-black text-background uppercase">🎁 SORTEO ACTIVO: {activeGiveaway.title}</p>
                <p className="text-sm text-background/80">Premio: {activeGiveaway.prize} — ¡Participa ahora!</p>
              </div>
              <Gift className="h-8 w-8 text-background animate-bounce" />
            </button>
          </div>
        </section>
      )}

      {/* About Section with staggered scroll animations */}
      <section className="py-24 px-4 relative" ref={aboutRef}>
        <div className="max-w-6xl mx-auto">
          <div
            className={`text-center mb-20 transition-all duration-1000 ${aboutVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"}`}
          >
            <h2 className="text-5xl md:text-7xl font-black mb-6 text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)] inline-block">
              🔥 TU NEXT-LEVEL LOOK ESTÁ AQUÍ
            </h2>
            <p className="text-xl md:text-2xl text-foreground font-bold mt-4">
              En nuestro spot de Monóvar, el flow nunca falta.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20" ref={servicesRef}>
            <div
              className={`bg-card p-8 rounded-2xl border-2 border-primary glow-neon-purple transform transition-all duration-700 hover:scale-105 hover:-translate-y-4 ${servicesVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}`}
              style={{ transitionDelay: "100ms" }}
            >
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                <Scissors className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-neon-purple">TRENDING CUTS</h3>
              <p className="text-foreground">
                Dominamos el fade que arrasa, los cortes con textura y el estilo que estás buscando.
              </p>
            </div>

            <div
              className={`bg-card p-8 rounded-2xl border-2 border-secondary glow-neon-cyan transform transition-all duration-700 hover:scale-105 hover:-translate-y-4 ${servicesVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}`}
              style={{ transitionDelay: "250ms" }}
            >
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mb-6">
                <Clock className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-neon-cyan">BEARD GAME</h3>
              <p className="text-foreground">
                Diseño de barba profesional y clean shaves a navaja para que salgas impecable.
              </p>
            </div>

            <div
              className={`bg-card p-8 rounded-2xl border-2 border-primary glow-neon-purple transform transition-all duration-700 hover:scale-105 hover:-translate-y-4 ${servicesVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"}`}
              style={{ transitionDelay: "400ms" }}
            >
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-neon-purple">STYLE COACHING</h3>
              <p className="text-foreground">Te asesoramos para que el corte le dé el toque a tu vibe. 🚨</p>
            </div>
          </div>

          {/* Booking Rules with animated border */}
          <div
            className={`relative p-1 rounded-2xl bg-gradient-to-r from-neon-purple via-neon-cyan to-neon-purple bg-[length:200%_100%] transition-all duration-1000 ${aboutVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            style={{
              animation: aboutVisible ? "text-shimmer 4s linear infinite" : "none",
              transitionDelay: "500ms",
            }}
          >
            <div className="bg-card p-8 rounded-xl">
              <h3 className="text-3xl font-black mb-6 text-center text-foreground">🚨 BOOKING Y REGLAS CLARAS</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-background/50 p-6 rounded-lg border border-border">
                  <h4 className="text-xl font-bold mb-3 text-neon-cyan">Cancelación</h4>
                  <p className="text-muted-foreground">
                    Tienes 48 horas (2 días) antes de la cita para{" "}
                    <a
                      href="https://wa.me/34641637576?text=Cancelar%20mi%20cita"
                      target="_blank"
                      className="text-neon-cyan hover:underline"
                    >
                      cancelar
                    </a>{" "}
                    o{" "}
                    <a
                      href="https://wa.me/34641637576?text=Reubicar%20mi%20cita"
                      target="_blank"
                      className="text-neon-cyan hover:underline"
                    >
                      reubicar
                    </a>{" "}
                    tu cita. ¡Máximo respeto por el tiempo!
                  </p>
                </div>
                <div className="bg-background/50 p-6 rounded-lg border border-border">
                  <h4 className="text-xl font-bold mb-3 text-neon-purple">Pago</h4>
                  <p className="text-muted-foreground">
                    Solo aceptamos efectivo (CASH). Por seguridad, se paga antes de empezar el servicio. ¡Gracias por
                    elegirnos!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ratings Carousel */}
      <RatingsCarousel />

      {/* Giveaways CTA */}
      <section className="py-16 px-4 bg-card/50">
        <div className="max-w-4xl mx-auto text-center">
          <Gift className="h-16 w-16 mx-auto text-neon-purple mb-4" />
          <h2 className="text-4xl font-black mb-4 text-neon-purple">¡PARTICIPA EN NUESTROS SORTEOS!</h2>
          <p className="text-xl text-muted-foreground mb-8">Gana cortes gratis, productos exclusivos y más premios</p>
          <Button
            size="lg"
            variant="neonCyan"
            onClick={() => navigate("/giveaways")}
            className="text-lg px-12 py-6 h-auto"
          >
            <Gift className="mr-2 h-5 w-5" />
            Ver Sorteos
          </Button>
        </div>
      </section>

      {/* Location Section with parallax */}
      <section className="py-24 px-4 bg-background relative overflow-hidden" ref={locationRef}>
        {/* Background decoration */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ transform: `translateY(${(scrollY - 1500) * 0.1}px)` }}
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-neon-cyan/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-neon-purple/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div
            className={`transition-all duration-1000 ${locationVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <h2 className="text-5xl md:text-6xl font-black text-center mb-6 text-neon-cyan">
              <MapPin className="inline-block mr-2 mb-2 animate-bounce" size={48} />
              UBICACIÓN
            </h2>
            <p className="text-center text-lg mb-10 text-muted-foreground">
              Carrer Sant Antoni, Monóvar, Alicante, España, 03640
            </p>
          </div>
          <div
            className={`transition-all duration-1000 delay-300 ${locationVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
          >
            <Map />
          </div>
        </div>
      </section>

      {/* Hours Section with staggered animation */}
      <section className="py-24 px-4 bg-card relative" ref={hoursRef}>
        <div className="max-w-4xl mx-auto">
          <h2
            className={`text-5xl md:text-6xl font-black text-center mb-16 text-neon-purple transition-all duration-1000 ${hoursVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            HORARIOS
          </h2>

          <div className="space-y-4 text-lg">
            {businessHours.length > 0 ? (
              businessHours.map((day, index) => {
                // Get special hours for this day of week in the next 4 weeks
                const daySpecialHours = specialHours.filter((sh) => {
                  const shDate = new Date(sh.date + "T00:00:00");
                  return shDate.getDay() === day.day_of_week;
                });

                return (
                  <div
                    key={day.day_of_week}
                    className={`py-4 border-b border-border transition-all duration-500 hover:bg-primary/5 hover:px-4 rounded ${hoursVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className="flex justify-between">
                      <span className="font-bold">{DAYS[day.day_of_week]}</span>
                      <span className="text-muted-foreground">
                        {day.is_closed ? (
                          <span className="text-destructive font-semibold">Cerrado</span>
                        ) : day.is_24h ? (
                          <span className="text-neon-cyan">Abierto 24h</span>
                        ) : (
                          day.time_ranges.map((range, i) => (
                            <span key={i}>
                              {range.start.slice(0, 5)} - {range.end.slice(0, 5)}
                              {i < day.time_ranges.length - 1 && ", "}
                            </span>
                          ))
                        )}
                      </span>
                    </div>
                    {/* Special hours for this day */}
                    {daySpecialHours.length > 0 && (
                      <div className="mt-2 pl-4 border-l-2 border-neon-cyan/50">
                        <p className="text-xs text-neon-cyan font-semibold mb-1">Horarios Especiales:</p>
                        {daySpecialHours.map((sh) => {
                          const shDate = new Date(sh.date + "T00:00:00");
                          const dayNum = shDate.getDate();
                          const monthName = shDate.toLocaleDateString("es-ES", { month: "short" });
                          return (
                            <div key={sh.id} className="text-xs text-muted-foreground flex justify-between">
                              <span>{dayNum} {monthName}{sh.note ? ` - ${sh.note}` : ""}</span>
                              <span>
                                {sh.is_closed ? (
                                  <span className="text-destructive">Cerrado</span>
                                ) : (
                                  sh.time_ranges.map((r, i) => (
                                    <span key={i}>
                                      {r.start.slice(0, 5)}-{r.end.slice(0, 5)}
                                      {i < sh.time_ranges.length - 1 && ", "}
                                    </span>
                                  ))
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <>
                {[
                  { day: "Lunes - Martes", hours: "11:00 - 21:00" },
                  { day: "Miércoles - Jueves", hours: "12:00 - 21:00" },
                  { day: "Viernes", hours: "11:00 - 16:00" },
                  { day: "Sábado", hours: "11:00 - 17:00" },
                  { day: "Domingo", hours: null },
                ].map((item, index) => (
                  <div
                    key={item.day}
                    className={`flex justify-between py-4 border-b border-border transition-all duration-500 ${hoursVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <span className="font-bold">{item.day}</span>
                    <span className={item.hours ? "text-muted-foreground" : "text-destructive"}>
                      {item.hours || "Cerrado"}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>

          <div
            className={`text-center mt-16 transition-all duration-1000 delay-700 ${hoursVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <Button
              size="lg"
              variant="neonCyan"
              onClick={() => navigate("/booking")}
              className="text-xl px-16 py-8 h-auto magnetic-button"
            >
              <Scissors className="mr-3 h-6 w-6" />
              Reserva Ahora
            </Button>
          </div>
        </div>
      </section>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/34641637576"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BA5A] text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 glow-neon-cyan"
        aria-label="Contactar por WhatsApp"
      >
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* Footer */}
      <footer className="py-8 px-4 text-center border-t border-border">
        <p className="text-muted-foreground/40 text-xs mb-3">Sistema de reservas online para barbería</p>
        <p className="text-muted-foreground">© 2025 DIEGCUTZ - Barbería Urbana</p>
        <div className="flex justify-center gap-4 mt-3">
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary text-sm underline-offset-4 hover:underline"
          >
            Política de Privacidad
          </a>
          <span className="text-muted-foreground">|</span>
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary text-sm underline-offset-4 hover:underline"
          >
            Términos de Servicio
          </a>
        </div>
        <Button
          variant="link"
          onClick={() => navigate("/admin")}
          className="text-muted-foreground hover:text-primary mt-2"
        >
          Admin
        </Button>
        <p className="text-muted-foreground text-xs mt-2">v 1.3.0</p>
      </footer>
    </div>
  );
};

export default Home;
