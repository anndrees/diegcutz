import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Scissors, Clock, MapPin, MessageCircle, User, Gift } from "lucide-react";
import heroImage from "@/assets/hero-barber.jpg";
import Map from "@/components/Map";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { RatingsCarousel } from "@/components/RatingsCarousel";

// Custom hook for parallax effect
const useParallax = () => {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  return scrollY;
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

type Giveaway = {
  id: string;
  title: string;
  prize: string;
  end_date: string;
};

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const Home = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [activeGiveaway, setActiveGiveaway] = useState<Giveaway | null>(null);
  const scrollY = useParallax();
  
  // Refs for scroll-triggered animations
  const aboutRef = useRef<HTMLDivElement>(null);
  const [aboutVisible, setAboutVisible] = useState(false);

  useEffect(() => {
    loadBusinessHours();
    loadActiveGiveaway();
    
    // Intersection observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setAboutVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    if (aboutRef.current) {
      observer.observe(aboutRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  const loadBusinessHours = async () => {
    const { data } = await supabase
      .from("business_hours")
      .select("*")
      .order("day_of_week", { ascending: true });

    if (data) {
      const formattedData = data.map(d => ({
        ...d,
        time_ranges: Array.isArray(d.time_ranges) ? d.time_ranges as TimeRange[] : []
      }));
      setBusinessHours(formattedData);
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
    <div className="min-h-screen">
      {/* Top Bar with Login/Profile */}
      <div className="absolute top-0 right-0 z-50 p-4">
        {user && profile ? (
          <Button 
            variant="ghost" 
            onClick={() => navigate("/user")}
            className="text-foreground hover:text-neon-cyan transition-colors"
          >
            <User className="mr-2 h-4 w-4" />
            {profile.username}
          </Button>
        ) : (
          <Button 
            variant="outline" 
            onClick={() => navigate("/auth")}
            className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-background transition-all hover:scale-105"
          >
            <User className="mr-2 h-4 w-4" />
            Iniciar Sesión
          </Button>
        )}
      </div>

      {/* Hero Section with Parallax */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center animate-scale-in"
          style={{ 
            backgroundImage: `url(${heroImage})`, 
            animationDuration: "1.5s",
            transform: `translateY(${scrollY * 0.5}px) scale(${1 + scrollY * 0.0002})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background"></div>
        </div>
        
        {/* Animated background particles with parallax */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-purple/10 rounded-full blur-3xl animate-pulse"
            style={{ transform: `translateY(${scrollY * -0.3}px)` }}
          />
          <div 
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s", transform: `translateY(${scrollY * -0.2}px)` }}
          />
          <div 
            className="absolute top-1/2 left-1/2 w-48 h-48 bg-neon-pink/5 rounded-full blur-2xl animate-pulse"
            style={{ animationDelay: "0.5s", transform: `translate(-50%, -50%) translateY(${scrollY * -0.4}px)` }}
          />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 
            className="text-7xl md:text-9xl font-black mb-6 text-neon-purple font-aggressive animate-fade-in"
            style={{ animationDuration: "0.8s" }}
          >
            DIEGCUTZ
          </h1>
          <p 
            className="text-xl md:text-2xl text-neon-cyan mb-8 font-bold uppercase tracking-widest animate-fade-in"
            style={{ 
              animationDelay: "200ms", 
              animationDuration: "0.8s",
              transform: `translateY(${scrollY * 0.1}px)`,
              opacity: Math.max(0, 1 - scrollY / 500)
            }}
          >
            Urban Barbershop · Estilo Callejero
          </p>
          <Button 
            size="lg" 
            variant="neon"
            onClick={() => navigate("/booking")}
            className="text-lg px-12 py-6 h-auto animate-fade-in hover:scale-105 transition-transform"
            style={{ animationDelay: "400ms", animationDuration: "0.8s" }}
          >
            Reserva tu Cita
          </Button>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-neon-cyan/50 rounded-full flex justify-center">
            <div className="w-1.5 h-3 bg-neon-cyan rounded-full mt-2 animate-pulse" />
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
                <p className="text-lg font-black text-background uppercase">
                  🎁 SORTEO ACTIVO: {activeGiveaway.title}
                </p>
                <p className="text-sm text-background/80">
                  Premio: {activeGiveaway.prize} — ¡Participa ahora!
                </p>
              </div>
              <Gift className="h-8 w-8 text-background animate-bounce" />
            </button>
          </div>
        </section>
      )}

      {/* About Section with scroll animations */}
      <section className="py-20 px-4" ref={aboutRef}>
        <div className="max-w-6xl mx-auto">
          <div 
            className={`text-center mb-16 transition-all duration-1000 ${aboutVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-neon-cyan">
              🔥 TU NEXT-LEVEL LOOK ESTÁ AQUÍ
            </h2>
            <p className="text-xl md:text-2xl text-foreground font-bold">
              En nuestro spot de Monóvar, el flow nunca falta.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div 
              className={`bg-card p-8 rounded-lg border-2 border-primary glow-neon-purple transform transition-all hover:scale-105 hover:-translate-y-2 duration-500 ${aboutVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
              style={{ transitionDelay: "100ms" }}
            >
              <Scissors className="w-12 h-12 text-primary mb-4 animate-pulse" />
              <h3 className="text-2xl font-bold mb-4 text-neon-purple">TRENDING CUTS</h3>
              <p className="text-foreground">
                Dominamos el fade que arrasa, los cortes con textura y el estilo que estás buscando.
              </p>
            </div>

            <div 
              className={`bg-card p-8 rounded-lg border-2 border-secondary glow-neon-cyan transform transition-all hover:scale-105 hover:-translate-y-2 duration-500 ${aboutVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
              style={{ transitionDelay: "200ms" }}
            >
              <Clock className="w-12 h-12 text-secondary mb-4 animate-pulse" style={{ animationDelay: "0.3s" }} />
              <h3 className="text-2xl font-bold mb-4 text-neon-cyan">BEARD GAME</h3>
              <p className="text-foreground">
                Diseño de barba profesional y clean shaves a navaja para que salgas impecable.
              </p>
            </div>

            <div 
              className={`bg-card p-8 rounded-lg border-2 border-primary glow-neon-purple transform transition-all hover:scale-105 hover:-translate-y-2 duration-500 ${aboutVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
              style={{ transitionDelay: "300ms" }}
            >
              <MapPin className="w-12 h-12 text-primary mb-4 animate-pulse" style={{ animationDelay: "0.6s" }} />
              <h3 className="text-2xl font-bold mb-4 text-neon-purple">STYLE COACHING</h3>
              <p className="text-foreground">
                Te asesoramos para que el corte le dé el toque a tu vibe. 🚨
              </p>
            </div>
          </div>

          {/* Booking Rules */}
          <div className="bg-gradient-neon p-8 rounded-lg">
            <h3 className="text-3xl font-black mb-6 text-center text-background">
              🚨 BOOKING Y REGLAS CLARAS
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-background">
              <div className="bg-background/20 p-6 rounded-lg backdrop-blur-sm">
                <h4 className="text-xl font-bold mb-3 text-background">Cancelación</h4>
                <p className="text-background font-medium">
                  Tienes 48 horas (2 días) antes de la cita para <a href="https://wa.me/34641637576?text=Cancelar%20mi%20cita" target="_blank">cancelar</a> o <a href="https://wa.me/34641637576?text=Reubicar%20mi%20cita" target="_blank">reubicar</a> tu cita.
                  ¡Máximo respeto por el tiempo!
                </p>
              </div>
              <div className="bg-background/20 p-6 rounded-lg backdrop-blur-sm">
                <h4 className="text-xl font-bold mb-3 text-background">Pago</h4>
                <p className="text-background font-medium">
                  Solo aceptamos efectivo (CASH). Por seguridad, se paga antes de empezar el servicio. 
                  ¡Gracias por elegirnos!
                </p>
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
          <h2 className="text-4xl font-black mb-4 text-neon-purple">
            ¡PARTICIPA EN NUESTROS SORTEOS!
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Gana cortes gratis, productos exclusivos y más premios
          </p>
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

      {/* Location Section */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-black text-center mb-6 text-neon-cyan">
            <MapPin className="inline-block mr-2 mb-2" size={40} />
            UBICACIÓN
          </h2>
          <p className="text-center text-lg mb-8 text-muted-foreground">
            Carrer Sant Antoni, Monóvar, Alicante, España, 03640
          </p>
          <Map />
        </div>
      </section>

      {/* Hours Section */}
      <section className="py-20 px-4 bg-card">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-black text-center mb-16 text-neon-purple">
            HORARIOS
          </h2>
          
          <div className="space-y-4 text-lg">
            {businessHours.length > 0 ? (
              businessHours.map((day) => (
                <div key={day.day_of_week} className="flex justify-between py-4 border-b border-border">
                  <span className="font-bold">{DAYS[day.day_of_week]}</span>
                  <span className="text-muted-foreground">
                    {day.is_closed ? (
                      <span className="text-destructive">Cerrado</span>
                    ) : day.is_24h ? (
                      "Abierto 24h"
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
              ))
            ) : (
              // Fallback si no hay datos
              <>
                <div className="flex justify-between py-4 border-b border-border">
                  <span className="font-bold">Lunes - Martes</span>
                  <span className="text-muted-foreground">11:00 - 21:00</span>
                </div>
                <div className="flex justify-between py-4 border-b border-border">
                  <span className="font-bold">Miércoles - Jueves</span>
                  <span className="text-muted-foreground">12:00 - 21:00</span>
                </div>
                <div className="flex justify-between py-4 border-b border-border">
                  <span className="font-bold">Viernes</span>
                  <span className="text-muted-foreground">11:00 - 16:00</span>
                </div>
                <div className="flex justify-between py-4 border-b border-border">
                  <span className="font-bold">Sábado</span>
                  <span className="text-muted-foreground">11:00 - 17:00</span>
                </div>
                <div className="flex justify-between py-4 border-b border-border">
                  <span className="font-bold">Domingo</span>
                  <span className="text-destructive">Cerrado</span>
                </div>
              </>
            )}
          </div>

          <div className="text-center mt-12">
            <Button 
              size="lg" 
              variant="neonCyan"
              onClick={() => navigate("/booking")}
              className="text-lg px-12 py-6 h-auto"
            >
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
        <MessageCircle className="w-8 h-8" />
      </a>

      {/* Footer */}
      <footer className="py-8 px-4 text-center border-t border-border">
        <p className="text-muted-foreground">© 2025 DIEGCUTZ - Barbería Urbana</p>
        <Button 
          variant="link" 
          onClick={() => navigate("/admin")}
          className="text-muted-foreground hover:text-primary mt-2"
        >
          Admin
        </Button>
        <p>v 1.3.0</p>
      </footer>
    </div>
  );
};

export default Home;
