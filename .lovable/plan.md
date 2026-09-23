# Reconstrucción total DIEGCUTZ — Liquid Chrome

## Objetivo
Crear una experiencia cliente completamente nueva, minimalista, moderna, urbana y profesional. Se conservarán datos, reglas y funciones, pero no la estructura visual, textos, composiciones ni patrones de navegación actuales.

## Dirección aprobada
- Paleta fija: negro `#07090C`, grafito `#20252B`, plata `#D7DCE0`, blanco mineral `#F7F7F4` y azul eléctrico `#26D9FF` como acento medido.
- Tipografía: Space Grotesk en titulares y DM Sans en lectura y controles.
- Apertura inmersiva a pantalla completa, seguida de bandas fluidas y módulos redondeados fáciles de recorrer.
- Fondos oscuros dinámicos, movimiento ambiental lento, transiciones suaves y profundidad contenida; sin estética sci‑fi genérica ni exceso de neón.
- Botones, formularios, tablas, avisos y paneles con esquinas redondeadas consistentes.

## Portada nueva
- Sustituir por completo la portada actual y eliminar definitivamente el bloque de “próxima cita disponible”.
- Crear una escena WebGL real para `DIEGCUTZ`: letras extruidas, infladas, cromadas y con gotas tridimensionales, material metálico reflectante, iluminación física local y reacción suave al cursor/táctil.
- Añadir una alternativa ligera y accesible para dispositivos sin WebGL o con movimiento reducido.
- Construir una navegación flotante redondeada y una acción principal clara para reservar.
- Crear un carrusel panorámico automático para fotos y vídeos, con controles manuales, pausa accesible, indicadores, carga progresiva y fallback.
- Conservar en composiciones nuevas: servicios, enfoque profesional, membresías, sorteos activos, reseñas, ubicación, horarios, Instagram y contacto.
- Mantener la cinta informativa cuando haya elementos activos; ocultarla sin dejar huecos cuando esté vacía.

## Gestión del carrusel
- Ampliar “Página principal” en administración para subir fotos y vídeos, previsualizarlos, activarlos, ordenarlos y eliminarlos.
- Reutilizar de forma compatible el almacenamiento y los ajustes existentes, migrando la imagen actual como fallback sin romper la portada.
- Ajustar límites y validación por tipo/tamaño, y mostrar claramente los estados de subida y guardado.

## Sistema visual compartido
- Sustituir cabecera, menú móvil, pie, fondos, botones, tarjetas, formularios, modales, avisos, loaders, vacíos y transiciones visibles al cliente.
- Crear una cabecera compacta que se adapte a la escena inmersiva y un menú móvil de pantalla completa, ambos con navegación y cuenta intactas.
- Crear fondos ambientales reutilizables, transiciones entre páginas y una gramática de módulos redondeados sin anidar cajas innecesarias.
- Actualizar icono PWA y metadatos visuales para que coincidan con la nueva identidad.

## Reconstrucción de todas las páginas cliente
- `/booking`: conservar disponibilidad, wizard, varios servicios, packs, extras, IA, playlist, cupones, corte gratis, repetición, login y calendario; rehacer completamente navegación, selector de fecha/hora, tarjetas y resumen.
- `/auth` y `/forgot-password`: rehacer acceso, registro, Google, recuperación y estados de error/éxito con una composición nueva.
- `/user` y `/admin/client/:id` solo en su superficie cliente: conservar perfil, citas, membresía, logros, notificaciones y acciones; reorganizar en módulos claros.
- `/membership` y `/membership-policy`: nueva comparación, jerarquía de planes, diálogo y condiciones.
- `/giveaways`: nueva presentación para activos, participación, Instagram, resultados e histórico.
- `/loyalty`: conservar únicamente las funciones actualmente habilitadas y cortes gratis, respetando la configuración global.
- `/install`: rehacer instalación PWA, instrucciones por dispositivo y notificaciones push.
- `/privacy`, `/terms` y estados `/404`: nuevo sistema de lectura y navegación coherente.
- Superficies globales: chat, banners, toasts, diálogos de valoración, cancelación/reprogramación, confirmación de reserva, playlist y calendario.
- `/admin` y `/tv` conservan su estructura y funciones; solo recibirán los tokens globales estrictamente necesarios para no romper controles compartidos.

## Implementación técnica
- Instalar React Three Fiber 8.18, Drei 9.122 y Three.js compatibles con React 18.
- Construir el wordmark con geometría 3D local, bisel profundo y elementos de goteo, `MeshPhysicalMaterial`, Lightformers locales y reflejos sin depender de recursos externos en tiempo de ejecución.
- Limitar resolución, geometría y efectos para móvil; suspender animación fuera de pantalla y respetar `prefers-reduced-motion`.
- Definir todos los colores, radios, sombras y superficies como tokens semánticos; evitar colores sueltos en las páginas.
- Mantener intactas consultas, permisos, validaciones y flujos de negocio salvo los cambios necesarios para el carrusel.

## Validación
- Verificar la escena 3D encendida, reflectante, reactiva y correctamente encuadrada en escritorio y móvil.
- Recorrer todas las rutas cliente y comprobar navegación, formularios, overlays, estados vacíos, carga, errores y ausencia de desbordamiento horizontal.
- Probar carrusel con imagen, vídeo, lista vacía y contenido desactivado.
- Validar los flujos críticos de reserva, acceso, perfil, membresías, sorteos, instalación y notificaciones.
- Revisar consola, red y pruebas existentes antes de dar la reconstrucción por terminada.
