import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-8">Política de Privacidad</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Información que Recopilamos</h2>
            <p className="text-muted-foreground">
              Recopilamos información que nos proporcionas directamente, incluyendo:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>Nombre completo y nombre de usuario</li>
              <li>Número de teléfono o dirección de correo electrónico</li>
              <li>Información de las citas reservadas</li>
              <li>Historial de servicios utilizados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Uso de la Información</h2>
            <p className="text-muted-foreground">
              Utilizamos la información recopilada para:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>Gestionar tus reservas y citas</li>
              <li>Comunicarnos contigo sobre tus citas</li>
              <li>Mejorar nuestros servicios</li>
              <li>Administrar tu programa de fidelidad</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Protección de Datos</h2>
            <p className="text-muted-foreground">
              Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal contra acceso no autorizado, pérdida o alteración.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Compartir Información</h2>
            <p className="text-muted-foreground">
              No vendemos ni compartimos tu información personal con terceros, excepto cuando sea necesario para proporcionar nuestros servicios o cuando la ley lo requiera.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Tus Derechos</h2>
            <p className="text-muted-foreground">
              Tienes derecho a:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>Acceder a tu información personal</li>
              <li>Rectificar datos incorrectos</li>
              <li>Solicitar la eliminación de tus datos</li>
              <li>Oponerte al procesamiento de tus datos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Contacto</h2>
            <p className="text-muted-foreground">
              Si tienes preguntas sobre esta política de privacidad, puedes contactarnos directamente en la barbería.
            </p>
          </section>

          <p className="text-sm text-muted-foreground mt-8">
            Última actualización: Enero 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
