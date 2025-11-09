import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Scissors, Clock, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-barber.jpg";

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

      {/* Services Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-black text-center mb-16 text-neon-cyan">
            SERVICIOS
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-lg border border-border hover:border-primary transition-colors">
              <Scissors className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-4">CORTES</h3>
              <p className="text-muted-foreground">
                Cortes modernos y clásicos adaptados a tu estilo. Desde fades hasta diseños personalizados.
              </p>
            </div>

            <div className="bg-card p-8 rounded-lg border border-border hover:border-primary transition-colors">
              <Clock className="w-12 h-12 text-secondary mb-4" />
              <h3 className="text-2xl font-bold mb-4">BARBAS</h3>
              <p className="text-muted-foreground">
                Perfilado y cuidado de barba profesional. Tu barba siempre impecable.
              </p>
            </div>

            <div className="bg-card p-8 rounded-lg border border-border hover:border-primary transition-colors">
              <MapPin className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-2xl font-bold mb-4">DISEÑOS</h3>
              <p className="text-muted-foreground">
                Diseños únicos y creativos. Dale personalidad a tu look.
              </p>
            </div>
          </div>
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
