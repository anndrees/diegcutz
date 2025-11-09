import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scissors, Clock, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-barber.jpg";
import Map from "@/components/Map";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-7xl md:text-9xl font-black mb-6 text-neon-purple">
            DIEGCUTZ
          </h1>
          <p className="text-xl md:text-2xl text-neon-cyan mb-8 font-bold uppercase tracking-widest">
            Urban Barbershop · Estilo Callejero
          </p>
          <Button 
            size="lg" 
            variant="neon"
            onClick={() => navigate("/booking")}
            className="text-lg px-12 py-6 h-auto"
          >
            Reserva tu Cita
          </Button>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-neon-cyan">
              🔥 TU NEXT-LEVEL LOOK ESTÁ AQUÍ
            </h2>
            <p className="text-xl md:text-2xl text-foreground font-bold">
              En nuestro spot de Monóvar, el flow nunca falta.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-card p-8 rounded-lg border-2 border-primary glow-neon-purple">
              <Scissors className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-4 text-neon-purple">TRENDING CUTS</h3>
              <p className="text-foreground">
                Dominamos el fade que arrasa, los cortes con textura y el estilo que estás buscando.
              </p>
            </div>

            <div className="bg-card p-8 rounded-lg border-2 border-secondary glow-neon-cyan">
              <Clock className="w-12 h-12 text-secondary mb-4" />
              <h3 className="text-2xl font-bold mb-4 text-neon-cyan">BEARD GAME</h3>
              <p className="text-foreground">
                Diseño de barba profesional y clean shaves a navaja para que salgas impecable.
              </p>
            </div>

            <div className="bg-card p-8 rounded-lg border-2 border-primary glow-neon-purple">
              <MapPin className="w-12 h-12 text-primary mb-4" />
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
                  Tienes 48 horas (2 días) antes de la cita para cancelar o reubicar. 
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
      </footer>
    </div>
  );
};

export default Home;
