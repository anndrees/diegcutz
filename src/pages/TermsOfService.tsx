import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-8">Condiciones de Servicio</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Aceptación de los Términos</h2>
            <p className="text-muted-foreground">
              Al utilizar nuestra aplicación de reservas, aceptas estos términos y condiciones en su totalidad. Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestros servicios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Reservas y Citas</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Las reservas están sujetas a disponibilidad</li>
              <li>Debes proporcionar información precisa al realizar una reserva</li>
              <li>Las cancelaciones deben realizarse con al menos 48 horas de antelación</li>
              <li>Nos reservamos el derecho de cancelar citas en caso de emergencia</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Cuenta de Usuario</h2>
            <p className="text-muted-foreground">
              Al crear una cuenta, eres responsable de:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>Mantener la confidencialidad de tus credenciales</li>
              <li>Todas las actividades que ocurran bajo tu cuenta</li>
              <li>Notificarnos inmediatamente sobre cualquier uso no autorizado</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Programa de Fidelidad</h2>
            <p className="text-muted-foreground">
              El programa de fidelidad está sujeto a las siguientes condiciones:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>Los puntos o cortes acumulados no son transferibles</li>
              <li>Nos reservamos el derecho de modificar el programa</li>
              <li>Los beneficios pueden variar sin previo aviso</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Sorteos y Promociones</h2>
            <p className="text-muted-foreground">
              La participación en sorteos está sujeta a:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>Cumplir con los requisitos específicos de cada sorteo</li>
              <li>Tener una cuenta activa y en buen estado</li>
              <li>Los premios no son canjeables por dinero</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Restricciones de Uso</h2>
            <p className="text-muted-foreground">
              No está permitido:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>Usar la aplicación para fines ilegales</li>
              <li>Crear múltiples cuentas</li>
              <li>Intentar acceder a cuentas de otros usuarios</li>
              <li>Manipular el sistema de reservas o fidelidad</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Modificaciones</h2>
            <p className="text-muted-foreground">
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Contacto</h2>
            <p className="text-muted-foreground">
              Para cualquier consulta sobre estos términos, puedes contactarnos directamente en la barbería.
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

export default TermsOfService;
