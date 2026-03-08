import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const MembershipPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen py-8 px-4 pt-safe">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>

        <h1 className="text-3xl font-black mb-8 text-[#D4AF37]">Política de Membresías</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-bold text-foreground">1. Descripción General</h2>
            <p className="text-muted-foreground">
              Las membresías de DiegCutz son planes de suscripción mensual que ofrecen beneficios exclusivos a los clientes.
              Cada membresía tiene una duración de 30 días naturales desde la fecha de activación. Los pagos se gestionan
              exclusivamente en persona con el administrador del establecimiento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">2. Activación y Pago</h2>
            <p className="text-muted-foreground">
              Para activar una membresía, el cliente debe contactar con el administrador a través de WhatsApp o en persona.
              El pago del importe correspondiente se realizará en efectivo antes de la activación de los beneficios.
              La membresía se activará una vez confirmado el pago por parte del administrador.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">3. Beneficios</h2>
            <p className="text-muted-foreground">
              Los beneficios varían según el plan contratado e incluyen, según corresponda: cortes de pelo mensuales,
              servicios de barba, asesoramiento de imagen, descuentos en productos y productos gratuitos periódicos.
              Los beneficios concretos de cada plan se detallan en la página de membresías.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">4. Uso de Beneficios</h2>
            <ul className="text-muted-foreground space-y-2">
              <li>• Los beneficios son de uso exclusivo del titular de la membresía y son intransferibles.</li>
              <li>• Los servicios incluidos que no se utilicen durante el periodo vigente <strong>no son acumulables</strong> al siguiente periodo.</li>
              <li>• Los beneficios no utilizados <strong>no podrán canjearse por dinero</strong>, otros servicios ni ningún otro tipo de compensación.</li>
              <li>• Los descuentos en productos se aplican automáticamente al realizar una reserva a través de la aplicación.</li>
              <li>• Los servicios gratuitos incluidos deben ser reservados a través de la aplicación indicando el uso de la membresía.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">5. Renovación</h2>
            <p className="text-muted-foreground">
              La renovación de la membresía no es automática. El administrador se pondrá en contacto con el titular
              antes del vencimiento para gestionar la renovación. Si no se renueva, la membresía expirará automáticamente
              al cumplirse los 30 días y los beneficios pendientes se perderán.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">6. Cambios de Plan (Upgrade / Downgrade)</h2>
            <p className="text-muted-foreground">
              <strong>Upgrade:</strong> Si el cliente desea cambiar a un plan superior durante el periodo activo, se activará
              el nuevo plan inmediatamente. Los beneficios no consumidos del plan anterior se perderán. El administrador
              gestionará la diferencia de precio en persona.
            </p>
            <p className="text-muted-foreground">
              <strong>Downgrade:</strong> Si el cliente desea cambiar a un plan inferior, el cambio se programará para cuando
              finalice el periodo actual. El cliente conservará todos los beneficios del plan vigente hasta su vencimiento,
              momento en el que se activará automáticamente el nuevo plan con el pago correspondiente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">7. Cancelación</h2>
            <p className="text-muted-foreground">
              La membresía puede ser cancelada en cualquier momento contactando al administrador. No se realizarán
              reembolsos parciales por el periodo restante. Los beneficios se mantendrán hasta la fecha de finalización
              del periodo pagado, salvo cancelación inmediata solicitada por el titular.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">8. Modificaciones</h2>
            <p className="text-muted-foreground">
              DiegCutz se reserva el derecho de modificar los beneficios, precios y condiciones de las membresías.
              Los cambios se comunicarán con antelación y no afectarán a periodos ya pagados. Las nuevas condiciones
              se aplicarán a partir de la siguiente renovación.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">9. Contacto</h2>
            <p className="text-muted-foreground">
              Para cualquier duda o gestión relacionada con las membresías, contacta con nosotros a través de
              WhatsApp al número +34 641 637 576 o en persona en nuestro establecimiento.
            </p>
          </section>
        </div>

        <p className="text-xs text-muted-foreground mt-8">Última actualización: Marzo 2026</p>
      </div>
    </div>
  );
};

export default MembershipPolicy;
