# Panel de administración como app nativa (móvil)

## Objetivo
En móvil, el panel de administración deja de ser la versión de escritorio encogida y pasa a comportarse como una app nativa, con la estética editorial papel/tinta/rojo ya aprobada. En escritorio no cambia nada.

## Estructura móvil nueva

1. **Barra inferior tipo app** (como la de la web pública), exclusiva del admin:
   - 5 pestañas fijas: **Hoy** (nuevo), **Reservas**, **Escanear QR** (botón central rojo destacado, abre el escáner directamente), **Clientes**, **Más**.
   - **Más** abre una hoja inferior (bottom sheet) con el resto de secciones en lista nativa: Estadísticas, Servicios, Horario, Valoraciones, Logros, Cupones, Membresías, Sorteos, Marquee, Página principal, Modo TV, Mensajes, Notificaciones, Historial, Ayuda — con icono, título y chevron, agrupadas (Gestión / Contenido / Sistema).
   - Si el programa de fidelización está desactivado, el botón central pasa a ser **Estadísticas** y el QR va a la hoja "Más".

2. **Pantalla "Hoy" (nueva, solo móvil)**: cabecera con saludo y fecha, tarjetas con las cifras del día (citas de hoy, próxima cita con cuenta atrás, ingresos del día, valoraciones pendientes), lista de las citas de hoy en tarjetas y accesos rápidos (escanear QR, nueva reserva, horarios disponibles para historia de IG). Reutiliza datos ya cargados; no añade lógica de negocio nueva.

3. **Cabecera nativa por sección**: barra superior fija estilo app con título de la sección, botón de notificaciones, ajustes y cerrar sesión en un menú; sin el encabezado gigante de escritorio.

4. **Contenido**: cada sección se renderiza igual que ahora (mismos componentes, misma funcionalidad), pero envuelta en el marco de app: tarjetas a pantalla completa, sin márgenes de página de escritorio, con safe-areas y espacio para la barra inferior. Los diálogos pasan a hojas inferiores en móvil donde sea razonable (sin tocar su lógica).

5. **Transiciones**: cambio de sección con deslizamiento suave lateral (framer-motion, respetando reduce-motion), scroll siempre arriba al cambiar de pestaña.

## Implementación
- Nuevo `src/components/admin/AdminMobileShell.tsx`: barra inferior + hoja "Más" + cabecera nativa.
- Nuevo `src/components/admin/AdminToday.tsx`: pantalla "Hoy".
- `Admin.tsx`: si `isMobile`, usa el shell nuevo en lugar de sidebar + encabezado; el contenido de cada sección se reutiliza tal cual.
- CSS en `src/styles/editorial.css` (bloque `admin-app`): barra inferior con safe-area, hoja inferior, cabecera fija.
- Escritorio: sin cambios. Funcionalidad: intacta (mismos componentes de gestión).

## Verificación
- Playwright en 390x844: navegar todas las pestañas y la hoja "Más", abrir escáner QR, comprobar que cada sección carga y no hay desbordes.
- Escritorio 1280: confirmar que el panel sigue igual.
- `bunx tsgo --noEmit` + build OK.

## Después: lista de ideas "wow"
Al terminar, propongo en chat una lista de ideas llamativas (sin implementar) para que elijas.
