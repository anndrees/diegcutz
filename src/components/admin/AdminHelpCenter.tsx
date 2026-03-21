import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronRight, BookOpen, HelpCircle, ArrowRight, ExternalLink, Crown, Calendar, Users, Scissors, Clock, Star, Trophy, Ticket, Gift, MessageSquare, Bell, History, BarChart3, Settings, Shield, Smartphone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ─── Types ───
interface HelpSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  subsections: HelpSubsection[];
}

interface HelpSubsection {
  id: string;
  title: string;
  content: string;
  tags: string[];
}

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
}

// ─── Data ───
const helpSections: HelpSection[] = [
  {
    id: "memberships",
    title: "Membresías",
    icon: Crown,
    description: "Gestión completa de planes de membresía, suscripciones, renovaciones y beneficios",
    subsections: [
      {
        id: "mem-overview",
        title: "Visión general del sistema de membresías",
        tags: ["membresía", "plan", "suscripción", "beneficios"],
        content: `## Visión general del sistema de membresías

El sistema de membresías de DiegCutz permite ofrecer planes de suscripción mensual a los clientes con diferentes niveles de beneficios. Los planes disponibles son:

- **Basic** (€14,90/mes): 2 servicios gratuitos, 5% descuento en productos
- **Fresh Look** (€24,90/mes): 3 servicios gratuitos, 10% descuento en productos
- **Barber 360º Premium** (€34,90/mes): 4 servicios gratuitos, 2 arreglos de barba, 10% descuento, producto gratis bimestral
- **VIP Executive** (€49,90/mes): Próximamente

Cada membresía tiene una duración de **30 días** desde su activación. Los beneficios **no son acumulables** de un mes a otro.

### Funcionalidades clave:
- Activación y renovación manual por el admin
- Pausar/reanudar membresías (ej: vacaciones del cliente)
- Upgrade y downgrade de plan
- Seguimiento de beneficios usados/restantes
- Historial completo de cada membresía
- Notas privadas del admin
- Estadísticas y métricas de membresías
- Ranking de miembros más fieles`,
      },
      {
        id: "mem-client-acquisition",
        title: "Paso a paso: Cómo un cliente adquiere una membresía",
        tags: ["adquirir", "comprar", "solicitar", "nuevo miembro", "whatsapp", "activar"],
        content: `## Paso a paso: Cómo un cliente adquiere una membresía

### Desde el lado del CLIENTE:

**Paso 1 — Explorar planes:**
El cliente navega a la página de **Membresías** desde el menú principal o desde el enlace "Ver planes disponibles" en su perfil.

**Paso 2 — Comparar planes:**
En la página de membresías, el cliente puede ver todos los planes disponibles con sus precios y beneficios. También existe un **comparador de planes** interactivo que muestra las diferencias lado a lado.

**Paso 3 — Solicitar membresía:**
El cliente pulsa el botón **"Solicitar por WhatsApp"** en el plan que desea. Esto abre una conversación de WhatsApp preformateada con un mensaje indicando el plan que le interesa.

**Paso 4 — Acuerdo con el barbero:**
El cliente acuerda con el barbero (Diego) los términos de pago. El pago se realiza **en persona** o según lo acordado.

**Paso 5 — Confirmación:**
Una vez que el admin activa la membresía, el cliente recibe un **mensaje de bienvenida automático** en el chat interno explicando sus beneficios.

---

### Desde el lado del ADMINISTRADOR:

**Paso 1 — Recibir la solicitud:**
El admin recibe el mensaje de WhatsApp del cliente solicitando una membresía.

**Paso 2 — Cobrar al cliente:**
El admin confirma el pago en persona (efectivo, Bizum, transferencia, etc.).

**Paso 3 — Activar la membresía:**
1. Ir a **Panel Admin → Clientes**
2. Buscar al cliente y hacer clic en su nombre para abrir su **ficha de cliente**
3. En la sección de **Membresía**, seleccionar el plan deseado
4. Pulsar **"Activar Membresía"**
5. Confirmar que el pago ha sido recibido

**Paso 4 — Verificación:**
- La membresía se activa con fecha de inicio = hoy y fecha fin = hoy + 30 días
- Se envía un mensaje automático al cliente por el chat interno
- Se registra la acción en el historial de membresías
- El cliente aparecerá con un icono de 👑 corona en el listado de clientes`,
      },
      {
        id: "mem-renewal",
        title: "Paso a paso: Renovar una membresía",
        tags: ["renovar", "renovación", "vencimiento", "expiración", "pago"],
        content: `## Paso a paso: Renovar una membresía

### Alertas automáticas:
El sistema genera alertas automáticas cuando una membresía está próxima a vencer:
- **Alerta amarilla** ⚠️: Faltan ≤ 10 días para la expiración
- **Alerta roja** 🔴: Faltan ≤ 4 días para la expiración

Estas alertas son visibles tanto en el **panel de admin** como en el **perfil del cliente** y la **página de inicio**.

### Proceso de renovación:

**Paso 1 — Identificar membresías por vencer:**
- Ir a **Panel Admin → Estadísticas** para ver el dashboard de membresías
- Las alertas aparecen automáticamente en la sección de "Alertas" del dashboard
- También puedes ver la fecha de vencimiento en la ficha de cada cliente

**Paso 2 — Contactar al cliente:**
Contactar al cliente para confirmar que desea renovar y acordar el pago.

**Paso 3 — Cobrar y renovar:**
1. Ir a **Panel Admin → Clientes → [ficha del cliente]**
2. En la sección de Membresía, pulsar **"Renovar"**
3. Confirmar que el pago se ha recibido
4. La membresía se renueva por 30 días más desde la fecha actual

**Paso 4 — Impago:**
Si el admin no renueva la membresía antes de la fecha de vencimiento:
- El estado cambia automáticamente a "pendiente de pago"
- El cliente pierde el acceso a los beneficios
- Se puede reactivar cuando el cliente pague`,
      },
      {
        id: "mem-upgrade-downgrade",
        title: "Paso a paso: Upgrade y Downgrade de plan",
        tags: ["upgrade", "downgrade", "cambiar plan", "mejorar", "reducir"],
        content: `## Paso a paso: Upgrade y Downgrade de plan

### Upgrade (mejorar plan):
El upgrade se aplica de forma **inmediata**.

1. Ir a **Panel Admin → Clientes → [ficha del cliente]**
2. En la sección de Membresía, pulsar **"Cambiar plan"**
3. Seleccionar el nuevo plan superior
4. Confirmar el cambio
5. Los beneficios del nuevo plan se aplican inmediatamente
6. Se cobra la diferencia al cliente (manual)

### Downgrade (reducir plan):
El downgrade se programa para el **próximo ciclo**.

1. Ir a **Panel Admin → Clientes → [ficha del cliente]**
2. En la sección de Membresía, pulsar **"Cambiar plan"**
3. Seleccionar el nuevo plan inferior
4. Confirmar — aparecerá un aviso indicando que el cambio se aplicará en la próxima renovación
5. El cliente mantiene los beneficios actuales hasta que termine el ciclo
6. Al renovar, se aplicará el nuevo plan automáticamente`,
      },
      {
        id: "mem-pause",
        title: "Paso a paso: Pausar y reanudar una membresía",
        tags: ["pausar", "vacaciones", "reanudar", "congelar", "suspender"],
        content: `## Paso a paso: Pausar y reanudar una membresía

La función de pausa permite congelar temporalmente una membresía sin cancelarla. Ideal para cuando un cliente viaja o está ausente temporalmente.

### Pausar:

1. Ir a **Panel Admin → Clientes → [ficha del cliente]**
2. En la sección de Membresía, pulsar **"Pausar membresía"**
3. Confirmar la pausa
4. La membresía se congela:
   - Los beneficios dejan de estar disponibles
   - El contador de días se detiene
   - Se registra la fecha de pausa

### Reanudar:

1. Ir a la misma ficha del cliente
2. Pulsar **"Reanudar membresía"**
3. Confirmar
4. La membresía se reactiva:
   - Se compensan los días de pausa (la fecha de fin se extiende)
   - Los beneficios vuelven a estar disponibles
   - Se registra en el historial

### Ejemplo:
Si un cliente tiene membresía hasta el 20 de marzo y pausa el 10 de marzo (10 días restantes), al reanudar el 17 de marzo, la nueva fecha de fin será 17 de marzo + 10 días = 27 de marzo.`,
      },
      {
        id: "mem-benefits",
        title: "Seguimiento de beneficios y uso",
        tags: ["beneficios", "servicios", "descuento", "productos", "uso", "restantes"],
        content: `## Seguimiento de beneficios y uso

### Beneficios por plan:
Cada plan incluye diferentes beneficios que se resetean cada ciclo de 30 días:

| Beneficio | Basic | Fresh Look | Barber 360º | VIP |
|-----------|-------|------------|-------------|-----|
| Servicios gratis/mes | 2 | 3 | 4 | - |
| Arreglos de barba | 0 | 0 | 2 | - |
| Descuento productos | 5% | 10% | 10% | - |
| Producto gratis | No | No | 1/bimestre | - |
| Asesoría de imagen | No | No | Sí | - |

### Cómo se aplican los beneficios:

**Servicios gratuitos:**
- Se descuentan automáticamente al realizar una reserva si el cliente tiene servicios disponibles
- El contador se ve en la ficha del cliente y en el perfil del usuario

**Descuentos en productos (addons):**
- Se aplican automáticamente durante el proceso de reserva cuando el cliente añade productos opcionales
- El descuento se calcula sobre el precio de los addons

**Producto gratis:**
- Se gestiona manualmente por el admin
- Se indica en la ficha del cliente cuántos productos gratis quedan

### Dónde ver el uso:
- **Admin → Estadísticas**: Dashboard con métricas globales de uso de beneficios
- **Admin → Clientes → [ficha]**: Uso individual de cada cliente
- **Perfil del usuario**: Sección "Mi Membresía" con beneficios usados/restantes`,
      },
      {
        id: "mem-stats",
        title: "Dashboard de estadísticas de membresías",
        tags: ["estadísticas", "dashboard", "métricas", "ingresos", "gráficos"],
        content: `## Dashboard de estadísticas de membresías

Accede al dashboard desde **Panel Admin → Estadísticas**. Debajo de las estadísticas generales de reservas, encontrarás la sección de **Estadísticas de Membresías**.

### KPIs principales:
- **Total miembros activos**: Número actual de clientes con membresía activa
- **Ingresos estimados mensuales**: Suma de los precios de todas las membresías activas
- **Miembros pausados**: Clientes con membresía en pausa
- **Pendientes de pago**: Membresías que han vencido sin renovar

### Gráficos:
- **Distribución por plan**: Gráfico circular mostrando cuántos clientes hay en cada plan
- **Uso de beneficios**: Porcentaje medio de uso de beneficios por plan

### Alertas del dashboard:
- Clientes cuya membresía vence pronto (próximos 10 días)
- Clientes con beneficios sin usar que están a punto de perder
- Membresías con impago

### Exportar datos:
Pulsa el botón **"Exportar CSV"** para descargar un listado completo de todos los miembros activos con:
- Nombre y usuario
- Plan activo
- Fecha de inicio y fin
- Beneficios usados/restantes
- Estado de pago`,
      },
      {
        id: "mem-history",
        title: "Historial de membresía del cliente",
        tags: ["historial", "timeline", "registro", "cambios"],
        content: `## Historial de membresía del cliente

Cada cliente tiene un historial completo de todas las acciones relacionadas con su membresía. Se accede desde **Panel Admin → Clientes → [ficha del cliente] → Historial de membresía**.

### Eventos registrados:
- **Activación**: Cuando se activa una nueva membresía
- **Renovación**: Cada vez que se renueva
- **Upgrade**: Cambio a un plan superior
- **Downgrade**: Cambio a un plan inferior (programado)
- **Pausa**: Cuando se congela la membresía
- **Reanudación**: Cuando se reactiva tras una pausa
- **Cancelación**: Cuando se cancela definitivamente
- **Cambio de pago**: Cuando cambia el estado de pago

### Formato:
El historial se muestra como una **timeline visual** con:
- Fecha y hora de cada evento
- Tipo de acción (con icono y color)
- Detalles del cambio
- Notas del admin (si las hay)`,
      },
      {
        id: "mem-admin-notes",
        title: "Notas privadas del admin en membresías",
        tags: ["notas", "observaciones", "acuerdos", "privado"],
        content: `## Notas privadas del admin en membresías

Las notas privadas permiten al administrador registrar acuerdos especiales, observaciones o información relevante sobre la membresía de un cliente. **Estas notas NO son visibles para el cliente**.

### Cómo añadir notas:

1. Ir a **Panel Admin → Clientes → [ficha del cliente]**
2. En la sección de Membresía, buscar el campo **"Notas privadas"**
3. Escribir la nota o acuerdo
4. Pulsar **"Guardar notas"**

### Ejemplos de uso:
- "Acuerdo: pago el día 5 de cada mes por transferencia"
- "Cliente viaja mucho, pausa frecuente"
- "Descuento especial del 20% acordado por ser cliente desde 2023"
- "Prueba 1 mes gratis como compensación por incidencia"`,
      },
      {
        id: "mem-levels",
        title: "Niveles de miembro y ranking",
        tags: ["nivel", "badge", "bronze", "silver", "gold", "diamond", "ranking", "leaderboard"],
        content: `## Niveles de miembro y ranking

### Niveles automáticos:
Los clientes con membresía obtienen un nivel automático basado en sus meses consecutivos como miembro:

| Nivel | Meses requeridos | Color |
|-------|-----------------|-------|
| 🥉 Bronze | 0-2 meses | Bronce |
| 🥈 Silver | 3-5 meses | Plata |
| 🥇 Gold | 6-11 meses | Dorado |
| 💎 Diamond | 12+ meses | Diamante |

El badge de nivel se muestra en el perfil del cliente y en su tarjeta de miembro digital.

### Ranking de miembros:
El ranking está disponible en **Panel Admin → Membresías**. Muestra un leaderboard de los miembros más fieles ordenados por meses activos consecutivos.

### Tarjeta de miembro digital:
Cada miembro tiene una tarjeta visual digital accesible desde su perfil con:
- Nombre del miembro
- Plan activo
- Nivel (Bronze/Silver/Gold/Diamond)
- Código QR personal
- Fecha de próxima renovación`,
      },
      {
        id: "mem-colors",
        title: "Diferenciación visual de miembros por plan",
        tags: ["colores", "corona", "icono", "visual", "listado"],
        content: `## Diferenciación visual de miembros por plan

En el listado de clientes (**Panel Admin → Clientes**), los miembros se distinguen visualmente:

### Iconos:
- Todos los miembros activos tienen un icono de **👑 corona** junto a su nombre

### Colores por nivel de plan:
El color de fondo/borde cambia según el plan:
- **Basic**: Tonos azules suaves
- **Fresh Look**: Tonos verdes/esmeralda
- **Barber 360º Premium**: Tonos dorados/ámbar
- **VIP Executive**: Tonos morados/púrpura

Esto permite identificar rápidamente qué tipo de membresía tiene cada cliente sin necesidad de entrar en su ficha.`,
      },
    ],
  },
  {
    id: "bookings",
    title: "Reservas",
    icon: Calendar,
    description: "Gestión de citas, cancelaciones, reagendamiento y calendario",
    subsections: [
      {
        id: "book-client-flow",
        title: "Paso a paso: Cómo un cliente hace una reserva",
        tags: ["reserva", "cita", "agendar", "cliente", "booking"],
        content: `## Paso a paso: Cómo un cliente hace una reserva

### Desde el lado del CLIENTE:

**Paso 1 — Acceder a la reserva:**
El cliente entra en la web y pulsa el botón **"Reservar Cita"** desde la página principal o desde el menú de navegación.

**Paso 2 — Seleccionar servicios:**
- Se muestran todos los servicios disponibles organizados por categorías (cortes, packs, etc.)
- El cliente selecciona uno o varios servicios
- Los servicios tipo "pack" ya incluyen otros servicios dentro
- Si el cliente tiene membresía activa, se indica cuántos servicios gratuitos le quedan

**Paso 3 — Seleccionar complementos (addons):**
- Opcionalmente, el cliente puede añadir productos/complementos
- Si tiene membresía, el descuento se aplica automáticamente al precio de los addons

**Paso 4 — Aplicar cupón (opcional):**
- El cliente puede introducir un código de cupón
- El sistema valida el cupón y aplica el descuento correspondiente

**Paso 5 — Seleccionar fecha:**
- Se muestra un calendario con los días disponibles
- Los días cerrados o completos aparecen deshabilitados
- Las fechas especiales (horarios modificados) se indican

**Paso 6 — Seleccionar hora:**
- Se muestran las horas disponibles para el día seleccionado
- Las horas ya ocupadas no aparecen
- Los horarios respetan el horario comercial y los horarios especiales

**Paso 7 — Añadir playlist (opcional):**
- El cliente puede pegar un enlace de Spotify/YouTube/Apple Music
- La playlist se reproducirá durante su cita

**Paso 8 — Confirmar reserva:**
- Se muestra un resumen con todos los detalles: servicios, fecha, hora, precio
- El cliente confirma y la reserva se crea
- Se envía una notificación push de confirmación (si tiene notificaciones activadas)

---

### Desde el lado del ADMINISTRADOR:

**Paso 1 — Ver nueva reserva:**
La reserva aparece automáticamente en **Panel Admin → Reservas** en la pestaña "Actuales".

**Paso 2 — Gestionar la reserva:**
El admin puede:
- **Ver detalles**: Hacer clic en la reserva para expandirla
- **Editar**: Cambiar fecha, hora, nombre o contacto
- **Cancelar**: Cancelar la reserva (notifica al cliente)
- **Reubicar**: Mover a otra fecha/hora si hay cancelación
- **Ver playlist**: Acceder al enlace de música del cliente

**Paso 3 — Durante la cita:**
- Aparece un **banner de cita activa** cuando se acerca la hora
- El admin puede escanear el QR del programa de fidelidad
- Al completar la cita, se puede acreditar el punto de fidelidad`,
      },
      {
        id: "book-admin-create",
        title: "Crear reserva desde el admin",
        tags: ["crear", "nueva", "admin", "manual"],
        content: `## Crear reserva desde el admin

El administrador puede crear reservas manualmente para clientes que llaman por teléfono o que se presentan sin cita.

### Proceso:

1. Ir a **Panel Admin → Reservas**
2. Pulsar el botón **"Nueva Reserva"** (disponible en la barra de herramientas)
3. Rellenar los datos:
   - **Cliente**: Buscar cliente existente o introducir nombre y contacto
   - **Servicios**: Seleccionar los servicios
   - **Fecha y hora**: Elegir día y hora disponibles
4. Confirmar la creación

### Notas:
- Las reservas creadas por el admin se marcan internamente
- Si el cliente tiene cuenta, se vincula a su perfil
- Se puede editar después como cualquier otra reserva`,
      },
      {
        id: "book-cancel-reschedule",
        title: "Paso a paso: Cancelar y reubicar reservas",
        tags: ["cancelar", "reubicar", "reagendar", "mover"],
        content: `## Paso a paso: Cancelar y reubicar reservas

### Cancelar una reserva:

**Desde el admin:**
1. Ir a **Panel Admin → Reservas**
2. Buscar la reserva (usar buscador o calendario)
3. Expandir la reserva haciendo clic
4. Pulsar **"Cancelar"** (botón amarillo)
5. Se muestra un diálogo de confirmación con opción de motivo
6. Confirmar cancelación
7. El cliente recibe notificación de la cancelación

**Desde el cliente:**
1. Ir a **Mi Perfil → Mis Reservas**
2. En la reserva activa, pulsar **"Cancelar"**
3. Confirmar la cancelación

### Reubicar una reserva:
1. En la reserva cancelada, pulsar **"Reubicar"** (botón azul)
2. Se abre un diálogo para seleccionar nueva fecha y hora
3. La reserva se reactiva con los nuevos datos

### Reactivar una reserva cancelada:
1. En la reserva cancelada, pulsar **"Reactivar"** (botón verde)
2. La reserva vuelve a su estado original

### Eliminar una reserva:
1. Pulsar **"Eliminar"** (botón rojo)
2. Confirmar en el diálogo
3. ⚠️ **Acción irreversible**: La reserva se borra permanentemente`,
      },
      {
        id: "book-calendar",
        title: "Calendario de reservas",
        tags: ["calendario", "día", "fecha", "buscar", "horas libres"],
        content: `## Calendario de reservas

El calendario se encuentra en **Panel Admin → Reservas** y permite visualizar rápidamente las reservas por día.

### Funcionalidades:

**Visualización:**
- Los días con reservas futuras se marcan con un **punto verde**
- Los días con reservas pasadas se marcan con un **punto gris**
- El día actual se resalta

**Al hacer clic en un día:**
Se abre un diálogo con dos opciones:
1. **Ver reservas**: Muestra todas las reservas del día seleccionado
2. **Ver horas libres**: Muestra las horas disponibles para ese día

**Búsqueda:**
- Utiliza el buscador en la parte superior para filtrar reservas por nombre de cliente
- El filtro se aplica tanto a reservas actuales como pasadas

**Pestañas:**
- **Actuales**: Reservas futuras o del día actual
- **Pasadas**: Reservas cuya hora ya pasó (2+ horas después de la cita)`,
      },
    ],
  },
  {
    id: "clients",
    title: "Clientes",
    icon: Users,
    description: "Gestión de clientes, perfiles, baneos y fichas individuales",
    subsections: [
      {
        id: "cli-list",
        title: "Listado de clientes",
        tags: ["clientes", "listado", "buscar", "usuarios"],
        content: `## Listado de clientes

Accede al listado desde **Panel Admin → Clientes**. Aquí puedes ver todos los usuarios registrados.

### Información visible:
- **Nombre completo** del cliente
- **Username** (@usuario)
- **Método de contacto** (teléfono, email, Instagram)
- **Iconos especiales**:
  - 📱 = Tiene la PWA instalada
  - 👑 = Tiene membresía activa (con color según el plan)
  - 🚫 = Está baneado

### Búsqueda:
Utiliza el campo de búsqueda para filtrar por nombre, username o contacto.

### Acciones rápidas:
- **Click en el nombre**: Abre la ficha completa del cliente
- Los clientes con membresía se distinguen por el color de su fila según el plan`,
      },
      {
        id: "cli-profile",
        title: "Ficha individual del cliente",
        tags: ["ficha", "perfil", "detalle", "cliente"],
        content: `## Ficha individual del cliente

La ficha completa de un cliente se abre al hacer clic en su nombre en el listado. Ruta: **/admin/client/[id]**

### Secciones de la ficha:

**1. Información personal:**
- Nombre, username, avatar
- Método y valor de contacto
- Fecha de registro
- Fecha de cumpleaños (si la tiene)
- Estado de la PWA

**2. Membresía:**
- Plan activo (si tiene)
- Beneficios usados/restantes
- Fecha de inicio y fin
- Estado de pago
- Botones: Renovar, Pausar/Reanudar, Cambiar plan, Cancelar
- Notas privadas del admin
- Historial de membresía (timeline)

**3. Reservas:**
- Historial completo de reservas del cliente
- Número total de visitas

**4. Programa de fidelidad:**
- Cortes completados
- Cortes gratuitos disponibles

**5. Logros:**
- Achievements obtenidos
- Opción de otorgar nuevos logros

**6. Acciones administrativas:**
- Banear/desbanear cliente
- Restringir temporalmente
- Resetear contraseña`,
      },
      {
        id: "cli-ban",
        title: "Paso a paso: Banear y restringir clientes",
        tags: ["banear", "restringir", "bloquear", "suspender"],
        content: `## Paso a paso: Banear y restringir clientes

### Banear un cliente:
Un ban es **permanente** hasta que el admin lo retire.

1. Ir a **Panel Admin → Clientes → [ficha del cliente]**
2. Buscar la sección de **Acciones administrativas**
3. Pulsar **"Banear cliente"**
4. Introducir el motivo del ban
5. Confirmar
6. El cliente:
   - No puede iniciar sesión
   - No puede hacer reservas
   - Aparece con el icono 🚫 en el listado

### Desbanear:
1. Ir a la ficha del cliente baneado
2. Pulsar **"Desbanear"**
3. Confirmar

### Restricción temporal:
Una restricción es **temporal** con fecha de fin.

1. Ir a la ficha del cliente
2. Pulsar **"Restringir temporalmente"**
3. Seleccionar duración
4. El cliente tiene acceso limitado durante ese periodo`,
      },
    ],
  },
  {
    id: "services",
    title: "Servicios",
    icon: Scissors,
    description: "Gestión de servicios, packs, precios y complementos opcionales",
    subsections: [
      {
        id: "svc-manage",
        title: "Gestión de servicios",
        tags: ["servicio", "precio", "crear", "editar", "eliminar"],
        content: `## Gestión de servicios

Accede desde **Panel Admin → Servicios**. Aquí puedes gestionar todos los servicios ofrecidos.

### Tipos de servicio:
- **Individual**: Un servicio único (ej: Corte de pelo, Barba)
- **Pack/Combo**: Un servicio que incluye otros servicios (ej: Pack Corte + Barba)

### Crear un nuevo servicio:

1. Pulsar **"Nuevo Servicio"**
2. Rellenar:
   - **Nombre**: Nombre del servicio
   - **Descripción**: Descripción opcional
   - **Precio**: Precio en euros
   - **Tipo**: Individual o Pack
   - **Servicios incluidos** (solo packs): Seleccionar qué servicios incluye
   - **Extras personalizados**: Opciones adicionales específicas del servicio
3. Guardar

### Editar un servicio:
1. Hacer clic en el servicio
2. Modificar los campos deseados
3. Guardar cambios

### Marcar como "Próximamente":
Puedes marcar un servicio como "Coming Soon" para que aparezca en la web pero no se pueda reservar.

### Complementos opcionales (Addons):
Los addons se gestionan en una sección separada dentro de Servicios:
- Son productos opcionales que el cliente puede añadir (ej: cera, champú)
- Se aplican descuentos automáticos si el cliente tiene membresía`,
      },
    ],
  },
  {
    id: "hours",
    title: "Horarios",
    icon: Clock,
    description: "Horario comercial, horarios especiales y días festivos",
    subsections: [
      {
        id: "hrs-business",
        title: "Horario comercial",
        tags: ["horario", "apertura", "cierre", "semanal"],
        content: `## Horario comercial

Accede desde **Panel Admin → Horario**. La primera sección es el **horario semanal** regular.

### Configuración:

Para cada día de la semana (Lunes a Domingo) puedes:
- **Abierto/Cerrado**: Toggle para marcar si se trabaja ese día
- **Rangos horarios**: Definir una o varias franjas (ej: 10:00-14:00, 17:00-21:00)
- **24 horas**: Marcar si se trabaja todo el día

### Múltiples franjas:
Si tienes horario partido (mañana y tarde), simplemente añade dos rangos horarios para el mismo día.

### Ejemplo:
- Lunes: 10:00-14:00 y 17:00-21:00
- Sábado: 09:00-15:00
- Domingo: Cerrado`,
      },
      {
        id: "hrs-special",
        title: "Horarios especiales y festivos",
        tags: ["especial", "festivo", "vacaciones", "modificar"],
        content: `## Horarios especiales y festivos

La segunda sección del panel de Horarios son los **horarios especiales**, que permiten modificar el horario de un día concreto.

### Crear horario especial:

1. Ir a **Panel Admin → Horario** (sección Horarios Especiales)
2. Pulsar **"Añadir día especial"**
3. Seleccionar la **fecha**
4. Opciones:
   - **Cerrado**: El día estará completamente cerrado (festivo, vacaciones)
   - **Horario modificado**: Definir franjas horarias diferentes al horario habitual
5. Añadir una **nota** opcional (ej: "Día de Navidad", "Horario reducido por festivo")
6. Guardar

### Usos comunes:
- **Festivos**: Marcar como cerrado con nota "Festivo"
- **Vacaciones**: Marcar rango de días como cerrado
- **Horario especial**: Ej: día de evento, abrir solo por la mañana
- **Apertura extra**: Abrir un día que normalmente está cerrado`,
      },
    ],
  },
  {
    id: "ratings",
    title: "Valoraciones",
    icon: Star,
    description: "Gestión de reseñas y puntuaciones de los clientes",
    subsections: [
      {
        id: "rat-overview",
        title: "Sistema de valoraciones",
        tags: ["valoración", "reseña", "estrella", "puntuación", "rating"],
        content: `## Sistema de valoraciones

### Cómo funciona:

**Desde el cliente:**
1. Después de completar una cita (cuando ya ha pasado la hora), el cliente recibe una solicitud para valorar su experiencia
2. Aparece un banner en la página principal: "Tienes una cita pendiente de valorar"
3. El cliente puede puntuar de 1 a 5 estrellas y dejar un comentario opcional
4. La valoración se vincula a la reserva específica

**Recordatorios automáticos:**
- Si el cliente no valora, se envía un recordatorio por push notification después de un tiempo

### Desde el admin:

Accede a **Panel Admin → Valoraciones** para ver todas las reseñas:
- Puntuación media global
- Listado de todas las valoraciones
- Nombre del cliente (con enlace a su ficha)
- Fecha de la valoración
- Comentario del cliente
- Puntuación (estrellas)

### Reseñas públicas:
Las valoraciones se muestran en la **página principal** en el carrusel de testimonios, mostrando las mejores reseñas a los visitantes.`,
      },
    ],
  },
  {
    id: "achievements",
    title: "Logros",
    icon: Trophy,
    description: "Sistema de logros y reconocimientos para clientes",
    subsections: [
      {
        id: "ach-manage",
        title: "Gestión de logros",
        tags: ["logro", "achievement", "badge", "crear"],
        content: `## Gestión de logros

Accede desde **Panel Admin → Logros**. Los logros son reconocimientos que se pueden otorgar a los clientes.

### Tipos de logros:
- **Manuales**: El admin los otorga manualmente
- **Automáticos**: Se otorgan automáticamente al cumplir una condición

### Triggers automáticos disponibles:
- **Número de reservas**: Se otorga al alcanzar X reservas completadas
- **Primera reserva**: Al hacer la primera cita
- **Membresía**: Logros vinculados a tiempo como miembro (1 mes, 6 meses, 1 año)

### Crear un logro:

1. Ir a **Panel Admin → Logros**
2. Pulsar **"Nuevo Logro"**
3. Configurar:
   - **Nombre**: Nombre del logro
   - **Descripción**: Qué representa
   - **Icono**: Seleccionar de la galería de iconos
   - **Tipo de trigger**: Manual o automático
   - **Valor del trigger** (si es automático): Número necesario
   - **Activo**: Si está habilitado
4. Guardar

### Otorgar manualmente:
1. Ir a **Panel Admin → Clientes → [ficha del cliente]**
2. En la sección de Logros, pulsar **"Otorgar logro"**
3. Seleccionar el logro
4. Confirmar

Los logros aparecen en el perfil público del cliente.`,
      },
    ],
  },
  {
    id: "coupons",
    title: "Cupones",
    icon: Ticket,
    description: "Creación y gestión de códigos de descuento",
    subsections: [
      {
        id: "cup-manage",
        title: "Gestión de cupones",
        tags: ["cupón", "descuento", "código", "crear", "promoción"],
        content: `## Gestión de cupones

Accede desde **Panel Admin → Cupones**. Los cupones permiten ofrecer descuentos a los clientes.

### Crear un cupón:

1. Ir a **Panel Admin → Cupones**
2. Pulsar **"Nuevo Cupón"**
3. Configurar:
   - **Código**: El código que el cliente introducirá (ej: VERANO2025)
   - **Descripción**: Descripción interna del cupón
   - **Tipo de descuento**: Porcentaje (%) o cantidad fija (€)
   - **Valor del descuento**: El porcentaje o euros de descuento
   - **Compra mínima**: Mínimo de gasto para que aplique (opcional)
   - **Usos máximos**: Cuántas veces se puede usar en total (opcional)
   - **Fecha de inicio**: Desde cuándo es válido
   - **Fecha de fin**: Hasta cuándo es válido (opcional)
   - **Activo**: Si está habilitado
4. Guardar

### Cómo usa el cliente un cupón:

1. Durante el proceso de reserva, en el paso de resumen
2. Introduce el código del cupón
3. El sistema valida: código válido, fecha vigente, usos disponibles, mínimo de compra
4. Si es válido, se aplica el descuento al total
5. Se registra el uso del cupón

### Seguimiento:
En el listado de cupones puedes ver:
- Usos actuales vs. usos máximos
- Estado (activo/inactivo)
- Fechas de vigencia
- Importe total descontado`,
      },
    ],
  },
  {
    id: "giveaways",
    title: "Sorteos",
    icon: Gift,
    description: "Creación y gestión de sorteos para clientes",
    subsections: [
      {
        id: "give-create",
        title: "Paso a paso: Crear y gestionar un sorteo",
        tags: ["sorteo", "crear", "premio", "participar", "ganador"],
        content: `## Paso a paso: Crear y gestionar un sorteo

### Crear un sorteo:

1. Ir a **Panel Admin → Sorteos**
2. Pulsar **"Nuevo Sorteo"**
3. Rellenar:
   - **Título**: Nombre del sorteo
   - **Premio**: Descripción del premio
   - **Descripción**: Detalles adicionales (opcional)
   - **Requisitos**: Qué debe cumplir el cliente para participar (opcional)
   - **Fecha de inicio**: Cuándo se abre la participación
   - **Fecha de fin**: Cuándo se cierra
   - **URL de Instagram**: Enlace al post de Instagram del sorteo (opcional)
4. Guardar

### Cómo participa un CLIENTE:

1. El cliente navega a la página de **Sorteos** (/giveaways)
2. Ve los sorteos activos con sus detalles y requisitos
3. Pulsa **"Participar"** en el sorteo deseado
4. Si hay un post de Instagram vinculado, puede verlo con un botón branded
5. La participación queda registrada

### Seleccionar ganador:

1. Ir a **Panel Admin → Sorteos**
2. En el sorteo finalizado (o que deseas cerrar), pulsar **"Seleccionar Ganador"**
3. Opcionalmente, excluir participantes (ej: ganadores anteriores)
4. Se inicia una **animación dramática** de 10 segundos con cuenta atrás
5. El fondo se difumina y se muestra el ganador con confeti 🎉
6. El ganador se muestra como **@username**
7. Se guarda el resultado

### Re-seleccionar ganador:
Si necesitas elegir otro ganador:
1. Pulsar **"Re-seleccionar"**
2. Opcionalmente marcar la casilla "Excluir ganador anterior"
3. Se repite la animación con un nuevo ganador

### Notificaciones:
- Se envían **push notifications** automáticas a todos los usuarios cuando se crea un nuevo sorteo
- El ganador puede ser notificado individualmente`,
      },
    ],
  },
  {
    id: "messages",
    title: "Mensajes",
    icon: MessageSquare,
    description: "Chat interno con clientes",
    subsections: [
      {
        id: "msg-overview",
        title: "Sistema de mensajería interna",
        tags: ["mensaje", "chat", "conversación", "comunicación"],
        content: `## Sistema de mensajería interna

### Desde el CLIENTE:
- El cliente tiene acceso a un **chat flotante** (burbuja en la esquina inferior derecha) disponible en todas las páginas
- Puede enviar mensajes al barbero/admin
- Recibe respuestas en tiempo real
- Las notificaciones push le avisan de nuevos mensajes (si las tiene activadas)

### Desde el ADMIN:

Accede a **Panel Admin → Mensajes** para ver todas las conversaciones.

**Funcionalidades:**
- **Lista de conversaciones**: Ordenadas por último mensaje
- **Indicador de no leídos**: Badge con el número de mensajes sin leer
- **Chat en tiempo real**: Los mensajes se actualizan instantáneamente
- **Archivar conversaciones**: Estilo iOS, deslizar para archivar
- **Enlace al perfil**: Cada conversación tiene un enlace a la ficha del cliente

### Mensajes automáticos:
El sistema envía mensajes automáticos en ciertos eventos:
- **Bienvenida de membresía**: Cuando se activa una nueva membresía
- **Otros eventos**: Según configuración

### Tips:
- Los mensajes no leídos del admin muestran un badge "Chat" en el sidebar
- Las conversaciones archivadas se pueden ver con un toggle
- Se puede enviar mensajes a cualquier cliente desde su ficha`,
      },
    ],
  },
  {
    id: "notifications",
    title: "Notificaciones Push",
    icon: Bell,
    description: "Gestión de notificaciones push y broadcast",
    subsections: [
      {
        id: "notif-system",
        title: "Sistema de notificaciones push",
        tags: ["notificación", "push", "enviar", "broadcast", "pwa"],
        content: `## Sistema de notificaciones push

### Requisitos:
- El cliente debe tener la **PWA instalada** (la app como aplicación en su móvil)
- Debe haber **aceptado las notificaciones** push

### Tipos de notificaciones:

**Automáticas:**
- Confirmación de reserva
- Recordatorio de cita (antes de la hora)
- Cancelación de reserva
- Nuevo sorteo disponible
- Resultado de sorteo
- Recordatorio de valoración
- Beneficios de membresía próximos a vencer
- Bienvenida de membresía

**Manuales (Broadcast):**
- El admin puede enviar notificaciones masivas a todos los usuarios

### Enviar notificación broadcast:

1. Ir a **Panel Admin → Notificaciones**
2. En la sección de "Enviar notificación", rellenar:
   - **Título**: Título de la notificación
   - **Mensaje**: Cuerpo del mensaje
3. Pulsar **"Enviar a todos"**
4. Se envía a todos los usuarios con push habilitado

### Historial:
Todas las notificaciones (automáticas y manuales) se registran en el historial con:
- Tipo de notificación
- Título y contenido
- Fecha de envío
- Estado (enviada/error)
- Número de destinatarios

### Preferencias del usuario:
Los clientes pueden personalizar qué notificaciones reciben desde su perfil:
- Confirmaciones de reserva
- Recordatorios
- Promociones
- Sorteos
- Mensajes de chat`,
      },
    ],
  },
  {
    id: "loyalty",
    title: "Programa de Fidelidad",
    icon: Star,
    description: "Programa de puntos y cortes gratuitos",
    subsections: [
      {
        id: "loy-program",
        title: "Paso a paso: Programa de fidelidad",
        tags: ["fidelidad", "puntos", "QR", "corte gratis", "loyalty"],
        content: `## Paso a paso: Programa de fidelidad

### Cómo funciona:
El programa de fidelidad premia a los clientes por cada visita. Por cada **X cortes completados**, el cliente recibe un **corte gratis**.

### Acumular puntos:

**Método 1 — Escaneo QR (recomendado):**
1. Cuando el cliente termina su cita, abre su **perfil** en la app
2. Muestra su **código QR personal** de fidelidad
3. El admin pulsa el botón **QR** (🔍) en la barra superior del panel admin
4. Escanea el QR del cliente con la cámara
5. Se acredita automáticamente la visita

**Método 2 — Manual desde el admin:**
1. Ir a la ficha del cliente
2. En la sección de Fidelidad, pulsar **"Acreditar visita"**
3. Confirmar

### Canjear corte gratis:
1. Cuando el cliente alcanza el número requerido de visitas, obtiene un corte gratis
2. El corte gratis se descuenta automáticamente en la próxima reserva
3. El admin puede ver y gestionar los cortes gratuitos disponibles en la ficha del cliente

### Desde el cliente:
- La página **Fidelidad** (/loyalty) muestra el progreso del cliente
- Número de cortes completados
- Progreso hacia el próximo corte gratis
- Historial de canjes`,
      },
    ],
  },
  {
    id: "statistics",
    title: "Estadísticas",
    icon: BarChart3,
    description: "Dashboard de métricas, gráficos e informes",
    subsections: [
      {
        id: "stat-dashboard",
        title: "Dashboard de estadísticas",
        tags: ["estadísticas", "métricas", "ingresos", "gráficos", "informes"],
        content: `## Dashboard de estadísticas

Accede desde **Panel Admin → Estadísticas**. El dashboard proporciona una visión completa del negocio.

### Estadísticas de reservas:
- **Total de reservas**: Histórico completo
- **Reservas activas**: Citas pendientes
- **Ingresos totales**: Suma de todas las reservas
- **Tasa de cancelación**: Porcentaje de citas canceladas
- **Servicios más populares**: Ranking de servicios más reservados
- **Días más ocupados**: Qué días de la semana tienen más citas

### Estadísticas de membresías:
- **Miembros activos**: Total actual
- **Ingresos estimados**: Suma mensual de membresías
- **Distribución por plan**: Gráfico circular
- **Uso de beneficios**: Porcentaje medio
- **Alertas**: Membresías por vencer, impagos
- **Exportar CSV**: Descargar listado completo

### Gráficos disponibles:
- Reservas por mes (barras)
- Ingresos por mes (línea)
- Distribución de servicios (circular)
- Distribución de membresías (circular)
- Horas más populares (barras)`,
      },
    ],
  },
  {
    id: "logs",
    title: "Historial de Acciones",
    icon: History,
    description: "Registro de todas las acciones administrativas",
    subsections: [
      {
        id: "log-overview",
        title: "Historial de acciones del admin",
        tags: ["historial", "log", "registro", "acciones", "auditoría"],
        content: `## Historial de acciones del admin

Accede desde **Panel Admin → Historial**. Este registro muestra todas las acciones realizadas desde el panel de administración.

### Eventos registrados:
- Activaciones y cambios de membresía
- Baneos y restricciones
- Reseteos de contraseña
- Acreditación de fidelidad
- Otorgamiento de logros
- Cambios en servicios
- Envío de notificaciones broadcast
- Creación/cierre de sorteos

### Información por evento:
- **Tipo de acción**: Qué se hizo
- **Descripción**: Detalles del cambio
- **Cliente afectado**: Nombre (con enlace a su ficha)
- **Fecha y hora**: Cuándo se realizó
- **Metadata**: Datos adicionales en formato JSON

### Utilidad:
- **Auditoría**: Revisar qué se hizo y cuándo
- **Resolución de problemas**: Si un cliente reporta un problema, revisar el historial
- **Accountability**: Registro completo de todas las decisiones`,
      },
    ],
  },
  {
    id: "settings",
    title: "Configuración General",
    icon: Settings,
    description: "Ajustes globales de la aplicación",
    subsections: [
      {
        id: "set-overview",
        title: "Configuración del panel",
        tags: ["configuración", "ajustes", "settings", "contraseña", "seguridad"],
        content: `## Configuración del panel

### Acceso al admin:
El panel de administración se encuentra en **/admin**. Se accede con credenciales de administrador.

### Menú de configuración:
En la barra superior del panel hay un icono de **engranaje** (⚙️) que abre el modal de configuración con:
- **Resetear contraseñas**: Gestionar solicitudes de reseteo de contraseña de clientes
- **Ajustes de la app**: Configuraciones generales

### Seguridad:
- La sesión del admin se almacena durante la sesión del navegador
- Al cerrar el navegador, se requiere volver a iniciar sesión
- El botón de **cerrar sesión** está en la esquina superior derecha

### Notificaciones del admin:
En la barra superior hay un icono de **campana** (🔔) que muestra:
- Solicitudes de reseteo de contraseña pendientes
- Badge con el número de solicitudes pendientes`,
      },
      {
        id: "set-pwa",
        title: "PWA y notificaciones",
        tags: ["pwa", "instalar", "app", "móvil", "notificaciones"],
        content: `## PWA y notificaciones

### ¿Qué es la PWA?
La Progressive Web App permite que los clientes instalen la web como una app en su móvil, con:
- Icono en la pantalla de inicio
- Experiencia de app nativa
- Notificaciones push
- Funcionalidad offline limitada

### Instalación por el cliente:
1. El cliente visita la web
2. Aparece un banner de instalación
3. También puede ir a **/install** para instrucciones detalladas
4. Al instalar, se registra en el sistema (el admin ve 📱)

### Notificaciones push:
Requieren:
1. PWA instalada
2. Permisos de notificación aceptados
3. El cliente configura qué tipo de notificaciones quiere recibir

### VAPID Keys:
Las notificaciones push requieren claves VAPID configuradas como secretos en el backend (Supabase Edge Functions).`,
      },
    ],
  },
];

const faqData: FAQ[] = [
  // Membresías
  { id: "faq-1", category: "Membresías", question: "¿Cómo activo una membresía para un cliente?", answer: "Ve a Panel Admin → Clientes, busca al cliente, haz clic en su nombre para abrir su ficha. En la sección de Membresía, selecciona el plan deseado y pulsa 'Activar Membresía'. Debes confirmar que el pago ha sido recibido.", tags: ["membresía", "activar", "plan"] },
  { id: "faq-2", category: "Membresías", question: "¿Los beneficios de la membresía se acumulan de un mes a otro?", answer: "No. Los beneficios (servicios gratuitos, arreglos de barba, etc.) se reinician cada ciclo de 30 días. Si el cliente no los usa, se pierden al renovar.", tags: ["beneficios", "acumular", "membresía"] },
  { id: "faq-3", category: "Membresías", question: "¿Qué pasa si un cliente no paga a tiempo?", answer: "Si la membresía vence sin renovar, el estado cambia automáticamente a 'pendiente de pago'. El cliente pierde acceso a los beneficios hasta que se renueve. Aparece una alerta en el dashboard de estadísticas.", tags: ["pago", "impago", "vencimiento"] },
  { id: "faq-4", category: "Membresías", question: "¿Puedo pausar la membresía de un cliente que está de vacaciones?", answer: "Sí. En la ficha del cliente, sección Membresía, pulsa 'Pausar membresía'. Los días de pausa se compensan al reanudar, extendiendo la fecha de fin. Los beneficios no están disponibles durante la pausa.", tags: ["pausar", "vacaciones", "congelar"] },
  { id: "faq-5", category: "Membresías", question: "¿Cómo hago un upgrade o downgrade de plan?", answer: "En la ficha del cliente, sección Membresía, pulsa 'Cambiar plan'. Los upgrades se aplican inmediatamente con los nuevos beneficios. Los downgrades se programan para el próximo ciclo de renovación para no perjudicar al cliente.", tags: ["upgrade", "downgrade", "cambiar plan"] },
  { id: "faq-6", category: "Membresías", question: "¿Cómo exporto la lista de miembros activos?", answer: "Ve a Panel Admin → Estadísticas. En la sección de Estadísticas de Membresías, pulsa el botón 'Exportar CSV'. Se descargará un archivo con todos los miembros activos, su plan, fechas y beneficios.", tags: ["exportar", "csv", "listado"] },
  { id: "faq-7", category: "Membresías", question: "¿Qué significan los colores de los clientes en el listado?", answer: "Los clientes con membresía activa tienen un icono de corona (👑) y su fila tiene un color distinto según el plan: azul (Basic), verde (Fresh Look), dorado (Barber 360º), morado (VIP). Esto permite identificar el tier de cada miembro rápidamente.", tags: ["colores", "corona", "visual"] },
  { id: "faq-8", category: "Membresías", question: "¿Puedo añadir notas privadas sobre la membresía de un cliente?", answer: "Sí. En la ficha del cliente, sección Membresía, hay un campo de 'Notas privadas'. Escribe tus notas (acuerdos de pago, descuentos especiales, etc.) y pulsa 'Guardar notas'. Estas notas NO son visibles para el cliente.", tags: ["notas", "privado", "acuerdos"] },
  { id: "faq-9", category: "Membresías", question: "¿Cómo funciona el sistema de niveles (Bronze/Silver/Gold/Diamond)?", answer: "Los niveles se asignan automáticamente según los meses consecutivos como miembro: Bronze (0-2 meses), Silver (3-5), Gold (6-11), Diamond (12+). El badge aparece en el perfil del cliente y en su tarjeta de miembro digital.", tags: ["nivel", "badge", "bronze", "silver", "gold", "diamond"] },
  { id: "faq-10", category: "Membresías", question: "¿Dónde veo el ranking de miembros más fieles?", answer: "Ve a Panel Admin → Membresías. Debajo de la gestión de planes, encontrarás el 'Ranking de Miembros' con un leaderboard ordenado por meses activos consecutivos.", tags: ["ranking", "leaderboard", "fiel"] },

  // Reservas
  { id: "faq-11", category: "Reservas", question: "¿Cómo cancelo una reserva sin eliminarla?", answer: "En Panel Admin → Reservas, expande la reserva haciendo clic, luego pulsa 'Cancelar' (botón amarillo). La reserva queda marcada como cancelada pero no se borra. Luego puedes Reactivarla o Reubicarla.", tags: ["cancelar", "reserva"] },
  { id: "faq-12", category: "Reservas", question: "¿Puedo mover una reserva a otro día/hora?", answer: "Sí. Puedes 'Editar' la reserva para cambiar directamente su fecha/hora, o si está cancelada, usar 'Reubicar' para asignarle una nueva fecha/hora.", tags: ["mover", "reubicar", "editar"] },
  { id: "faq-13", category: "Reservas", question: "¿Cómo veo las horas libres de un día?", answer: "En Panel Admin → Reservas, haz clic en un día del calendario. Se abrirá un diálogo con dos opciones: 'Ver reservas' y 'Ver horas libres'. Selecciona 'Ver horas libres' para ver las franjas disponibles.", tags: ["horas libres", "disponibilidad"] },
  { id: "faq-14", category: "Reservas", question: "¿Qué significa el icono de música en una reserva?", answer: "El icono de nota musical (🎵) indica que el cliente ha añadido una playlist de Spotify/YouTube/Apple Music para su cita. Haz clic en el icono para abrir el enlace.", tags: ["playlist", "música", "spotify"] },
  { id: "faq-15", category: "Reservas", question: "¿Cuándo se considera una reserva como 'pasada'?", answer: "Una reserva se clasifica como 'pasada' cuando han transcurrido 2 horas después de la hora de la cita. Aparecerá en la pestaña 'Pasadas' en lugar de 'Actuales'.", tags: ["pasada", "completada", "historial"] },

  // Clientes
  { id: "faq-16", category: "Clientes", question: "¿Qué significa el icono de móvil (📱) junto a un cliente?", answer: "Indica que el cliente tiene la PWA (Progressive Web App) instalada en su dispositivo. Esto es importante porque las notificaciones push solo funcionan con la PWA instalada.", tags: ["pwa", "móvil", "instalada"] },
  { id: "faq-17", category: "Clientes", question: "¿Cómo reseteo la contraseña de un cliente?", answer: "El cliente puede solicitar un reseteo desde la pantalla de login. La solicitud aparece en las notificaciones del admin (campana). El admin puede entonces resetear la contraseña desde la ficha del cliente o desde el menú de configuración.", tags: ["contraseña", "resetear", "reset"] },
  { id: "faq-18", category: "Clientes", question: "¿Cuál es la diferencia entre banear y restringir?", answer: "El ban es permanente hasta que el admin lo retire: el cliente no puede iniciar sesión ni hacer reservas. La restricción es temporal con fecha de fin: el cliente tiene acceso limitado durante ese periodo.", tags: ["banear", "restringir", "diferencia"] },

  // Sorteos
  { id: "faq-19", category: "Sorteos", question: "¿Puedo re-seleccionar el ganador de un sorteo?", answer: "Sí. En el sorteo finalizado, pulsa 'Re-seleccionar'. Puedes marcar la opción de excluir al ganador anterior. Se repetirá la animación con cuenta atrás y confeti para un nuevo ganador.", tags: ["sorteo", "ganador", "reseleccionar"] },
  { id: "faq-20", category: "Sorteos", question: "¿Se notifica automáticamente a los usuarios de nuevos sorteos?", answer: "Sí. Al crear un nuevo sorteo, se envía automáticamente una notificación push a todos los usuarios con la PWA instalada y notificaciones activadas.", tags: ["sorteo", "notificación", "push"] },
  { id: "faq-21", category: "Sorteos", question: "¿Puedo vincular un sorteo a un post de Instagram?", answer: "Sí. Al crear o editar un sorteo, hay un campo para la URL del post de Instagram. Si se proporciona, aparece un botón branded de Instagram para que los clientes accedan al post directamente.", tags: ["sorteo", "instagram", "post"] },

  // Servicios
  { id: "faq-22", category: "Servicios", question: "¿Cómo creo un pack de servicios?", answer: "En Panel Admin → Servicios, crea un nuevo servicio y selecciona tipo 'Pack'. Luego selecciona los servicios individuales que incluye. El precio del pack suele ser menor que la suma de los servicios individuales.", tags: ["pack", "combo", "servicio"] },
  { id: "faq-23", category: "Servicios", question: "¿Qué son los 'extras personalizados' de un servicio?", answer: "Son opciones adicionales específicas de un servicio que el cliente puede seleccionar durante la reserva. Por ejemplo, para un servicio de corte, podrías añadir extras como 'Degradado', 'Diseño', etc.", tags: ["extras", "personalizar", "opciones"] },
  { id: "faq-24", category: "Servicios", question: "¿Puedo marcar un servicio como 'Próximamente'?", answer: "Sí. Al crear o editar un servicio, activa la opción 'Coming Soon'. El servicio aparecerá en la web pero los clientes no podrán reservarlo. Útil para anunciar nuevos servicios antes de ofrecerlos.", tags: ["próximamente", "coming soon"] },

  // Horarios
  { id: "faq-25", category: "Horarios", question: "¿Puedo tener horario partido (mañana y tarde)?", answer: "Sí. Para cada día, puedes definir múltiples rangos horarios. Por ejemplo: 10:00-14:00 y 17:00-21:00. Simplemente añade dos franjas para el mismo día.", tags: ["horario", "partido", "franjas"] },
  { id: "faq-26", category: "Horarios", question: "¿Cómo marco un día festivo?", answer: "Ve a Panel Admin → Horario → Horarios Especiales. Pulsa 'Añadir día especial', selecciona la fecha, marca 'Cerrado' y opcionalmente añade una nota (ej: 'Día de Navidad'). Los clientes no podrán reservar ese día.", tags: ["festivo", "cerrado", "especial"] },

  // Notificaciones
  { id: "faq-27", category: "Notificaciones", question: "¿Por qué un cliente no recibe notificaciones push?", answer: "Verifica que: 1) El cliente tiene la PWA instalada (icono 📱 en el listado), 2) Ha aceptado los permisos de notificación, 3) No ha desactivado las notificaciones en sus preferencias. Si todo está correcto, puede ser un problema del navegador del cliente.", tags: ["notificaciones", "push", "no recibe"] },
  { id: "faq-28", category: "Notificaciones", question: "¿Cómo envío una notificación a todos los usuarios?", answer: "Ve a Panel Admin → Notificaciones. En la sección 'Enviar notificación', escribe el título y el mensaje, luego pulsa 'Enviar a todos'. Solo la recibirán los usuarios con push habilitado.", tags: ["broadcast", "masiva", "enviar"] },

  // Fidelidad
  { id: "faq-29", category: "Fidelidad", question: "¿Cómo escaneo el QR de fidelidad de un cliente?", answer: "En la barra superior del panel admin, pulsa el botón QR (🔍). Se abrirá el escáner de cámara. Apunta al código QR que el cliente muestra en su perfil. La visita se acredita automáticamente.", tags: ["qr", "escanear", "fidelidad"] },
  { id: "faq-30", category: "Fidelidad", question: "¿Puedo acreditar una visita manualmente sin QR?", answer: "Sí. Ve a la ficha del cliente (Panel Admin → Clientes → click en el nombre) y en la sección de Fidelidad, pulsa 'Acreditar visita' y confirma.", tags: ["fidelidad", "manual", "acreditar"] },

  // General
  { id: "faq-31", category: "General", question: "¿Cómo cierro la sesión del panel admin?", answer: "Pulsa el botón 'Cerrar Sesión' (icono de puerta con flecha) en la esquina superior derecha del panel. La sesión se cierra y tendrás que volver a introducir las credenciales.", tags: ["cerrar sesión", "logout", "salir"] },
  { id: "faq-32", category: "General", question: "¿Por qué la web da error 404 al recargar?", answer: "La web es una SPA (Single Page Application). Si ves un 404 al recargar, asegúrate de que el archivo _redirects está configurado correctamente en la carpeta public/. Debería redirigir todas las rutas a index.html.", tags: ["404", "error", "recargar"] },
  { id: "faq-33", category: "General", question: "¿Puedo acceder al panel admin desde el móvil?", answer: "Sí. El panel admin es totalmente responsive. En móvil, el menú lateral se convierte en un menú hamburguesa desplegable. Todas las funcionalidades están disponibles en móvil.", tags: ["móvil", "responsive", "acceso"] },
  { id: "faq-34", category: "General", question: "¿Dónde veo el historial de todas mis acciones como admin?", answer: "Ve a Panel Admin → Historial. Se registran automáticamente todas las acciones importantes: cambios en membresías, baneos, reseteos de contraseña, logros otorgados, etc.", tags: ["historial", "acciones", "registro"] },
  { id: "faq-35", category: "Membresías", question: "¿Cómo sé si un cliente tiene beneficios sin usar?", answer: "En Panel Admin → Estadísticas, la sección de Estadísticas de Membresías muestra alertas de clientes con beneficios próximos a perderse. También puedes ver el uso individual en la ficha de cada cliente.", tags: ["beneficios", "sin usar", "alerta"] },
  { id: "faq-36", category: "Membresías", question: "¿Qué es la encuesta de satisfacción de membresía?", answer: "Cada 90 días, los clientes con membresía activa reciben una encuesta para valorar su experiencia. Pueden puntuar de 1 a 5 estrellas y dejar un comentario. Esto ayuda a mejorar el servicio de membresía.", tags: ["encuesta", "satisfacción", "feedback"] },
  { id: "faq-37", category: "Membresías", question: "¿Qué es la tarjeta de miembro digital?", answer: "Es una tarjeta visual bonita accesible desde el perfil del cliente que muestra: su nombre, plan activo, nivel (Bronze/Silver/Gold/Diamond), código QR y fecha de renovación. El cliente la puede mostrar en la barbería.", tags: ["tarjeta", "digital", "miembro"] },
  { id: "faq-38", category: "Reservas", question: "¿Cómo creo una reserva manualmente para un cliente?", answer: "En Panel Admin → Reservas, pulsa 'Nueva Reserva'. Busca al cliente existente o introduce los datos manualmente. Selecciona servicios, fecha y hora, y confirma la creación.", tags: ["crear", "reserva", "manual"] },
  { id: "faq-39", category: "General", question: "¿Qué significa el banner de 'Cita Activa'?", answer: "Cuando se acerca la hora de una reserva, aparece un banner destacado en el panel admin indicando que hay una cita en curso o próxima. Facilita el seguimiento en tiempo real de las citas del día.", tags: ["banner", "cita activa", "tiempo real"] },
  { id: "faq-40", category: "Cupones", question: "¿Puedo limitar un cupón a un número de usos?", answer: "Sí. Al crear un cupón, puedes establecer un 'Máximo de usos'. Una vez alcanzado, el cupón deja de funcionar automáticamente. Puedes ver los usos actuales vs máximos en el listado de cupones.", tags: ["cupón", "límite", "usos"] },

  // Casos edge
  { id: "faq-41", category: "Casos especiales", question: "¿Qué pasa si un cliente con membresía usa un cupón de descuento al reservar?", answer: "Los cupones y los beneficios de membresía NO son acumulables. Si el cliente tiene servicios gratuitos de su membresía, debe elegir entre usar el servicio gratis de la membresía O aplicar el cupón de descuento, pero no ambos a la vez. El descuento de membresía en productos (optional addons) sí se aplica automáticamente y es independiente de los cupones de reserva.", tags: ["cupón", "membresía", "acumular", "descuento", "compatibilidad"] },
  { id: "faq-42", category: "Casos especiales", question: "¿Qué pasa con la fidelidad (sellos) si se cancela una reserva?", answer: "Cuando se cancela o elimina una reserva, el sello de fidelidad que se acreditó automáticamente con esa reserva se revierte. Es decir, el contador de visitas del cliente baja en 1. Si esa visita fue la número 10 (que genera un corte gratis), el corte gratis también se descuenta. Todo esto ocurre automáticamente.", tags: ["fidelidad", "cancelar", "sello", "revertir", "corte gratis"] },
  { id: "faq-43", category: "Casos especiales", question: "¿Si un cliente tiene membresía y cortes gratis de fidelidad, cuál se usa primero?", answer: "El cliente elige en cada reserva qué beneficio usar. Puede marcar 'Usar corte gratis de fidelidad' o 'Usar servicio de membresía'. Se recomienda usar primero los de fidelidad ya que los de membresía se pierden al renovar, mientras que los cortes de fidelidad son acumulables y no expiran.", tags: ["membresía", "fidelidad", "prioridad", "corte gratis"] },
  { id: "faq-44", category: "Casos especiales", question: "¿Qué pasa si se cancela una reserva que usó un servicio gratuito de membresía?", answer: "Si el cliente usó un servicio gratuito de su membresía y la reserva se cancela, el servicio gratuito debería ser restaurado manualmente por el admin desde la ficha del cliente, ajustando los servicios restantes de la membresía.", tags: ["membresía", "cancelar", "servicio gratis", "restaurar"] },
  { id: "faq-45", category: "Casos especiales", question: "¿Qué ocurre si la membresía de un cliente vence mientras tiene reservas futuras?", answer: "Las reservas futuras ya confirmadas se mantienen con los precios acordados en el momento de la reserva. Sin embargo, el cliente no podrá hacer nuevas reservas con beneficios de membresía hasta que renueve. Los descuentos en productos tampoco se aplicarán en futuras compras.", tags: ["membresía", "vencer", "reservas futuras", "expirar"] },
  { id: "faq-46", category: "Casos especiales", question: "¿Un cliente baneado o restringido pierde su membresía?", answer: "Un cliente baneado pierde acceso a todo, incluida la membresía, pero esta no se cancela automáticamente. El admin debe cancelarla manualmente si lo considera oportuno. Un cliente restringido temporalmente mantiene su membresía activa pero no puede hacer reservas durante la restricción, lo que puede hacer que pierda beneficios de ese ciclo.", tags: ["ban", "restricción", "membresía", "perder"] },
  { id: "faq-47", category: "Casos especiales", question: "¿Qué pasa si hago un upgrade de membresía y el cliente aún tiene beneficios del plan anterior?", answer: "Al hacer un upgrade inmediato, los beneficios restantes del plan anterior se pierden y se reemplazan por los del nuevo plan. El nuevo ciclo de 30 días comienza desde el momento del upgrade. Por eso es recomendable hacer upgrades cuando el cliente ya ha usado la mayoría de sus beneficios.", tags: ["upgrade", "beneficios", "perder", "reemplazar"] },
  { id: "faq-48", category: "Casos especiales", question: "¿Qué pasa si un cliente con membresía pausada intenta reservar?", answer: "Los beneficios de membresía NO están disponibles mientras la membresía está pausada. El cliente puede reservar normalmente pero pagará el precio completo, sin descuentos ni servicios gratuitos de la membresía.", tags: ["pausar", "reservar", "beneficios", "suspendido"] },
  { id: "faq-49", category: "Casos especiales", question: "¿Puede un cliente usar un cupón de descuento en un corte gratis de fidelidad?", answer: "No. Los cortes gratuitos de fidelidad ya tienen precio 0€, por lo que no es posible aplicar un cupón adicional. Los cupones solo se aplican sobre servicios con precio.", tags: ["cupón", "fidelidad", "corte gratis", "precio cero"] },
  { id: "faq-50", category: "Casos especiales", question: "¿Qué pasa con los sellos de fidelidad si elimino una reserva en vez de cancelarla?", answer: "Eliminar una reserva también revierte el sello de fidelidad, igual que cancelarla. La diferencia es que al eliminar, la reserva desaparece completamente del historial, mientras que al cancelar queda registrada como cancelada.", tags: ["eliminar", "cancelar", "fidelidad", "diferencia"] },
  { id: "faq-51", category: "Casos especiales", question: "¿Se puede tener membresía y participar en sorteos?", answer: "Sí, los clientes con membresía pueden participar en sorteos exactamente igual que los demás clientes. La membresía no excluye ni da ventaja en los sorteos.", tags: ["membresía", "sorteo", "participar"] },
  { id: "faq-52", category: "Casos especiales", question: "¿Qué pasa si el admin no renueva la membresía a tiempo?", answer: "Si la membresía llega a su fecha de fin sin ser renovada, cambia automáticamente a estado 'expirada'. El cliente pierde todos los beneficios. Aparecerán avisos en amarillo (10 días antes) y rojo (4 días antes) para recordarte la renovación. Si se olvida, se puede reactivar la membresía en cualquier momento previo cobro.", tags: ["renovar", "olvidar", "expirar", "aviso", "reactivar"] },
];

// ─── Component ───
export const AdminHelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedSubsection, setExpandedSubsection] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"tutorials" | "faq">("tutorials");

  // Search logic
  const normalizeText = (text: string) =>
    text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const query = normalizeText(searchQuery);

  const filteredSections = useMemo(() => {
    if (!query) return helpSections;
    return helpSections
      .map((section) => ({
        ...section,
        subsections: section.subsections.filter(
          (sub) =>
            normalizeText(sub.title).includes(query) ||
            normalizeText(sub.content).includes(query) ||
            sub.tags.some((t) => normalizeText(t).includes(query))
        ),
      }))
      .filter(
        (section) =>
          section.subsections.length > 0 ||
          normalizeText(section.title).includes(query) ||
          normalizeText(section.description).includes(query)
      );
  }, [query]);

  const filteredFaqs = useMemo(() => {
    if (!query) return faqData;
    return faqData.filter(
      (faq) =>
        normalizeText(faq.question).includes(query) ||
        normalizeText(faq.answer).includes(query) ||
        faq.tags.some((t) => normalizeText(t).includes(query)) ||
        normalizeText(faq.category).includes(query)
    );
  }, [query]);

  const faqCategories = useMemo(() => {
    const cats = new Map<string, FAQ[]>();
    filteredFaqs.forEach((faq) => {
      if (!cats.has(faq.category)) cats.set(faq.category, []);
      cats.get(faq.category)!.push(faq);
    });
    return cats;
  }, [filteredFaqs]);

  const totalResults = filteredSections.reduce((a, s) => a + s.subsections.length, 0) + filteredFaqs.length;

  // Render markdown-like content with basic formatting
  const renderContent = (content: string) => {
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: string[][] = [];
    let tableHeader: string[] = [];

    const flushTable = () => {
      if (tableRows.length === 0) return;
      elements.push(
        <div key={`table-${elements.length}`} className="overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {tableHeader.map((h, i) => (
                  <th key={i} className="border border-border px-3 py-2 bg-muted text-left font-semibold text-foreground">
                    {h.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="border border-border px-3 py-2 text-muted-foreground">
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      tableHeader = [];
      inTable = false;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Table detection
      if (line.startsWith("|") && line.endsWith("|")) {
        const cells = line.split("|").filter(Boolean);
        if (!inTable) {
          inTable = true;
          tableHeader = cells;
          // skip separator line
          if (i + 1 < lines.length && lines[i + 1].includes("---")) i++;
          continue;
        }
        tableRows.push(cells);
        continue;
      } else if (inTable) {
        flushTable();
      }

      // Headers
      if (line.startsWith("## ")) {
        elements.push(
          <h2 key={i} className="text-xl font-bold text-foreground mt-6 mb-3">
            {line.replace("## ", "")}
          </h2>
        );
      } else if (line.startsWith("### ")) {
        elements.push(
          <h3 key={i} className="text-lg font-semibold text-foreground mt-5 mb-2">
            {line.replace("### ", "")}
          </h3>
        );
      } else if (line.startsWith("---")) {
        elements.push(<Separator key={i} className="my-4" />);
      } else if (line.startsWith("- **") || line.startsWith("  - ")) {
        const indent = line.startsWith("  ") ? "ml-4" : "";
        const formatted = line.replace(/^[\s-]+/, "").replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        elements.push(
          <div key={i} className={cn("flex items-start gap-2 py-0.5", indent)}>
            <span className="text-primary mt-1.5 shrink-0">•</span>
            <span className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: formatted }} />
          </div>
        );
      } else if (/^\*\*Paso \d+/.test(line) || /^\*\*Método \d+/.test(line)) {
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>');
        elements.push(
          <div key={i} className="flex items-start gap-2 py-1 mt-2">
            <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: formatted }} />
          </div>
        );
      } else if (line.match(/^\d+\.\s/)) {
        const num = line.match(/^(\d+)\./)?.[1];
        const rest = line.replace(/^\d+\.\s*/, "").replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>');
        elements.push(
          <div key={i} className="flex items-start gap-3 py-0.5 ml-2">
            <span className="text-primary font-bold shrink-0 w-5 text-right">{num}.</span>
            <span className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: rest }} />
          </div>
        );
      } else if (line.trim() === "") {
        elements.push(<div key={i} className="h-2" />);
      } else {
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>');
        elements.push(
          <p key={i} className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />
        );
      }
    }
    if (inTable) flushTable();

    return <div className="space-y-0.5">{elements}</div>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Centro de Ayuda</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Guía completa del panel de administración — tutoriales, procesos paso a paso y preguntas frecuentes
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en toda la guía... (ej: membresía, cancelar reserva, sorteo, QR)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background"
            />
            {searchQuery && (
              <Badge variant="secondary" className="absolute right-3 top-1/2 -translate-y-1/2">
                {totalResults} resultado{totalResults !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {/* View toggle */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveView("tutorials")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeView === "tutorials"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <BookOpen className="h-4 w-4" />
              Tutoriales y Guías
            </button>
            <button
              onClick={() => setActiveView("faq")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeView === "faq"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <HelpCircle className="h-4 w-4" />
              Preguntas Frecuentes ({filteredFaqs.length})
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tutorials View */}
      {activeView === "tutorials" && (
        <div className="space-y-3">
          {filteredSections.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No se encontraron resultados para "{searchQuery}"</p>
                <p className="text-sm text-muted-foreground mt-1">Prueba con otros términos de búsqueda</p>
              </CardContent>
            </Card>
          )}

          {filteredSections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSection === section.id;

            return (
              <Card key={section.id} className={cn("transition-all", isExpanded && "border-primary/30")}>
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                  className="w-full text-left"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", isExpanded ? "bg-primary/20" : "bg-muted")}>
                          <Icon className={cn("h-5 w-5", isExpanded ? "text-primary" : "text-muted-foreground")} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{section.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-0.5">{section.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {section.subsections.length} artículo{section.subsections.length !== 1 ? "s" : ""}
                        </Badge>
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {isExpanded && (
                  <CardContent className="pt-0">
                    <Separator className="mb-4" />
                    <div className="space-y-2">
                      {section.subsections.map((sub) => {
                        const isSubExpanded = expandedSubsection === sub.id;
                        return (
                          <div key={sub.id} className={cn("rounded-lg border transition-all", isSubExpanded ? "border-primary/20 bg-primary/5" : "border-border")}>
                            <button
                              onClick={() => setExpandedSubsection(isSubExpanded ? null : sub.id)}
                              className="w-full text-left px-4 py-3 flex items-center justify-between"
                            >
                              <span className={cn("font-medium text-sm", isSubExpanded ? "text-primary" : "text-foreground")}>
                                {sub.title}
                              </span>
                              {isSubExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                            </button>
                            {isSubExpanded && (
                              <div className="px-4 pb-4">
                                <Separator className="mb-4" />
                                {renderContent(sub.content)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* FAQ View */}
      {activeView === "faq" && (
        <div className="space-y-6">
          {filteredFaqs.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No se encontraron preguntas para "{searchQuery}"</p>
              </CardContent>
            </Card>
          )}

          {Array.from(faqCategories.entries()).map(([category, faqs]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  {category}
                  <Badge variant="secondary" className="text-xs">{faqs.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {faqs.map((faq) => {
                    const isOpen = expandedFaq === faq.id;
                    return (
                      <div key={faq.id} className={cn("rounded-lg border transition-all", isOpen ? "border-primary/20 bg-primary/5" : "border-transparent hover:bg-muted/50")}>
                        <button
                          onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                          className="w-full text-left px-4 py-3 flex items-start justify-between gap-3"
                        >
                          <span className={cn("font-medium text-sm", isOpen ? "text-primary" : "text-foreground")}>
                            {faq.question}
                          </span>
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4">
                            <Separator className="mb-3" />
                            <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                            <div className="flex flex-wrap gap-1 mt-3">
                              {faq.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="text-[10px] cursor-pointer hover:bg-primary/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSearchQuery(tag);
                                  }}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
