# Portada cinética 3D y navegación ampliada

## Objetivo
Transformar la página de inicio en una experiencia con movimiento continuo y claramente perceptible, sin dificultar la lectura ni cambiar ninguna función existente.

## Cabecera y sesión
- Aumentar altura, presencia visual, marca y tamaño de los enlaces del encabezado.
- Mantenerlo visible al desplazarse, con cambios sutiles de profundidad y transparencia según el scroll.
- Mostrar una acción clara para cerrar sesión cuando el cliente esté identificado, tanto en escritorio como en el menú móvil.
- Conservar acceso a cuenta, reservas, membresías, sorteos e instalación.

## Escena cinética de barbería
- Sustituir las herramientas SVG actuales por una capa 3D WebGL de herramientas cromadas; usar modelos CC0 descargados y guardados localmente cuando exista una fuente verificable, y geometría 3D propia únicamente para las piezas sin modelo fiable.
- Incorporar tijeras con apertura/cierre, máquina, peine y navaja con recorridos distintos por la página.
- Vincular posición, giro, escala, enfoque y reflejos al scroll y al cursor para que los objetos crucen secciones, se acerquen a cámara y desaparezcan detrás del contenido.
- Mantener los objetos decorativos fuera de botones y textos, con menos piezas y detalle en móvil.

## Coreografía de la portada
- Dar al título DIEGCUTZ una entrada más contundente, mayor flotación, reflejos móviles y reacción más amplia al cursor.
- Crear parallax multicapa en fondo, títulos, textos, fotografías y carrusel.
- Animar cada bloque con una secuencia diferente: texto fragmentado, imágenes que se descubren, tarjetas escalonadas, desplazamiento horizontal y cambios de perspectiva.
- Añadir una línea/progreso visual de scroll y transiciones cromadas entre secciones para que siempre haya una respuesta visible al desplazamiento.
- Aplicar movimiento interno lento a imágenes y vídeos del carrusel, además de transiciones más dinámicas entre diapositivas.
- Mantener animaciones ambientales suaves cuando el usuario no mueve el cursor ni hace scroll.

## Rendimiento y accesibilidad
- Suspender o simplificar la escena 3D fuera del área visible y limitar resolución y cantidad de objetos en móvil.
- Respetar `prefers-reduced-motion`, ofreciendo una portada estática pero completa.
- Evitar desplazamiento horizontal, solapes y pérdida de contraste.

## Validación
- Comprobar escritorio y móvil durante todo el recorrido de la portada, no solo la primera pantalla.
- Verificar apertura/cierre de menú, acceso a cuenta y cierre de sesión.
- Confirmar que título, herramientas, parallax, carrusel y entradas responden al scroll sin errores de consola o red.
- Validar tipos y revisar capturas en varios puntos del desplazamiento.

## Detalles técnicos
- React Three Fiber para la capa 3D, Framer Motion para progreso de scroll y animaciones DOM.
- Modelos únicamente CC0 con licencia verificada; archivos GLB locales, sin dependencias externas en producción.
- Movimiento por frame con delta limitado, materiales físicos y luces locales para reflejos cromados.
