# Renovación integral DIEGCUTZ — Elegant Urban Noir v4

## Objetivo
Rehacer todas las superficies visibles para clientes con una identidad urbana adulta, elegante y profesional, sin perder ninguna función existente. Después de consolidar esa renovación, incorporar recomendación con IA, repetición rápida de reserva, calendarios y contacto por WhatsApp.

## Dirección aprobada
- **Paleta:** negro carbón y grafito mate, texto piedra/marfil y dorado cepillado como acento. Verde, ámbar y rojo se reservarán para estados funcionales.
- **Tipografía:** Playfair Display para titulares editoriales y marca; Inter para lectura, formularios y controles.
- **Composición:** fotografía cinematográfica protagonista, navegación sobria, secciones amplias sin acumular tarjetas, divisores finos y paneles de vidrio oscuro solo donde aporten jerarquía.
- **Movimiento:** entradas breves por máscara, fundidos y desplazamientos suaves; sin neón dominante, graffiti, glitches, rejillas futuristas, orbes ni cursores especiales. Todo respetará “reducir movimiento”.
- **Sistema visual:** todos los colores, degradados y sombras quedarán definidos como variables semánticas globales y variantes reutilizables; no habrá colores aislados incrustados en las páginas.

## 1. Fundamentos y navegación
- Sustituir el sistema visual antiguo por tokens Noir para fondo, superficies, piedra, dorado, bordes, estados y sombras.
- Actualizar botones, campos, pestañas, diálogos, avisos, calendarios, menús, estados de carga y notificaciones.
- Crear una cabecera y un pie coherentes para cliente, con accesos claros a reservar, cuenta, membresías, sorteos, instalación, legales y TV.
- Renovar transiciones entre páginas, pantalla inicial, formularios obligatorios de cuenta, chat flotante y Konami, conservando su comportamiento.
- Retirar de la experiencia habitual el cursor neón y los efectos que contradicen la nueva identidad.

## 2. Página principal
- Reconstruir la apertura como una escena fotográfica a pantalla amplia con DIEGCUTZ como señal principal, mensaje más profesional, CTA de reserva y acceso de cuenta.
- Mantener la imagen configurable, su filtro y oscurecimiento, reinterpretando el filtro hacia negro, piedra y dorado.
- Convertir la cinta de avisos en una banda dorada editorial y conservar lista vacía, orden, colores y activación por elemento.
- Reorganizar disponibilidad, avisos, reseñas, servicios, normas, membresías, sorteos, Instagram, ubicación y horarios en una narrativa más limpia y menos juvenil.
- Rediseñar las reseñas flotantes con entrada discreta, lectura cómoda y ritmo pausado.

## 3. Reserva
- Conservar íntegramente disponibilidad, horarios especiales, servicios, packs, extras, cupones, membresías, cortes gratis, playlist, restricciones y wizard móvil.
- Reestructurar escritorio como flujo editorial guiado y móvil como asistente a pantalla completa, con resumen persistente y estados de disponibilidad inequívocos.
- Renovar calendario, leyenda, horas ocupadas/libres, preview de playlist, validaciones y confirmaciones con el nuevo lenguaje visual.
- Añadir una confirmación final real tras guardar la cita, sin redirigir inmediatamente al inicio.

## 4. Cuenta, acceso y páginas secundarias
- Rehacer acceso, registro, recuperación de contraseña y conexión con Google mediante la composición visual aprobada, sin modificar su lógica.
- Convertir Mi perfil en un espacio personal más claro: próxima cita, acciones, datos, membresía, notificaciones, logros e historial.
- Renovar membresías, cortes gratis/fidelización, sorteos e instalación PWA con jerarquía editorial y estados vacíos consistentes.
- Aplicar el mismo sistema a privacidad, términos, política de membresías y página no encontrada.
- Renovar avisos de instalación y permisos push sin alterar APIs ni permisos del navegador.

## 5. PWA y marca instalada
- Crear un nuevo icono DIEGCUTZ Noir legible en tamaños pequeños, con versiones 192, 512, maskable, Apple y favicons.
- Actualizar nombre descriptivo, colores de sistema, accesos directos y metadatos para abandonar referencias “underground”.
- Mantener el service worker, actualización automática, modo instalado y notificaciones actuales.

## 6. Panel de administración
- Aplicar un tema Noir profesional al panel completo, manteniendo estructura, densidad y todas las funciones.
- Reservar una variante más intensa para el acceso admin, pero alineada con negro/dorado y sin volver al neón multicolor.
- No rediseñar `/tv` dentro de este trabajo: seguirá siendo el modo de señalización independiente ya configurado.

## 7. Nuevas funciones, después de la renovación

### Recomendador de corte con IA
- Añadir en la reserva un asistente breve donde el cliente describa ocasión, estilo, mantenimiento y preferencias.
- Crear una función protegida que consulte el catálogo real y use AI Gateway con `openai/gpt-6-astra`, devolviendo solo servicios existentes con una explicación breve.
- Mostrar carga progresiva, reintento, límites de texto y estados claros para desconexión, límite de uso o catálogo vacío.
- Permitir aplicar la recomendación directamente a la selección, sin reservar automáticamente.

### Repetir última reserva
- Guardar desde ahora una referencia estable de los servicios elegidos, manteniendo compatibilidad con reservas antiguas.
- Mostrar “Repetir mi última visita” solo a clientes con una reserva válida anterior.
- Recuperar servicios todavía disponibles, recalcular precios/beneficios actuales y llevar al cliente a elegir una nueva fecha y hora.
- No trasladar descuentos, cupones, membresías consumidas ni cortes gratis de la reserva anterior.

### Añadir al calendario
- En la nueva confirmación ofrecer Google Calendar, Apple Calendar y descarga `.ics`.
- Generar fecha y hora en `Europe/Madrid`, duración de la cita, servicios, dirección y caracteres escapados correctamente.
- Mantener también estas acciones accesibles desde el detalle de una próxima cita en Mi perfil.

### Contactar por WhatsApp
- Añadir un botón contextual en cada reserva del panel admin, cada fila de clientes y cada ficha individual.
- Normalizar teléfonos españoles e internacionales y generar un mensaje con nombre, fecha y hora cuando exista una reserva.
- Ocultar la acción para emails o teléfonos inválidos y no almacenar datos adicionales innecesarios.

## 8. Datos y servicios
- Añadir de forma compatible el identificador de servicios a nuevas reservas para que “repetir” siga funcionando aunque cambie el texto visible.
- Crear y desplegar la función protegida del recomendador; verificar usuario autenticado y cuenta no bloqueada antes de consumir IA.
- Actualizar los tipos generados y conservar todas las columnas y rutas antiguas.

## 9. Validación
- Comprobar escritorio y móvil en Inicio, Acceso, Reserva, Perfil, Instalación, Sorteos, Membresías, Cortes gratis y páginas legales.
- Probar registro/login, wizard completo, cupón, playlist, corte gratis, membresía, reserva, email/push, cancelación, reubicación y valoración.
- Probar recomendación IA, repetición con servicios eliminados, Google/Apple/ICS y enlaces WhatsApp con teléfonos válidos e inválidos.
- Verificar instalación PWA, iconos, modo standalone, accesibilidad, contraste, foco, reducción de movimiento y ausencia de desbordamientos.
- Ejecutar comprobación de tipos, pruebas disponibles y build de producción.

## Orden de ejecución
1. Sistema visual y superficies globales.
2. Inicio y páginas estáticas.
3. Acceso, perfil, PWA, membresías, sorteos y fidelización/cortes gratis.
4. Reserva completa y confirmación.
5. Tema del panel admin.
6. IA, repetir reserva, calendarios y WhatsApp.
7. Iconos, metadatos y validación transversal.
