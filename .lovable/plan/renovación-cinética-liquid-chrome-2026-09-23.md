# Renovación cinética Liquid Chrome

## Objetivo
Dar más vida y carácter urbano-profesional a la portada y llevar el mismo lenguaje visual al panel de administración, manteniendo intactas todas las funciones.

## Portada y título 3D
- Eliminar por completo los chorretones y cualquier gota independiente del título.
- Reconstruir `DIEGCUTZ` como letras-globo plateadas: formas mucho más redondeadas, extrusión profunda, bordes inflados, reflejos amplios y pequeñas deformaciones suaves que recuerden a foil hinchado, no a metal plano.
- Separar visualmente las letras y equilibrar el ancho para que ninguna se toque.
- Aumentar claramente la respuesta al cursor y al tacto: inclinación, desplazamiento en profundidad y reflejos que recorren cada letra; añadir una flotación ambiental más perceptible cuando no hay interacción.
- Mantener una alternativa ligera y accesible para dispositivos sin WebGL o con reducción de movimiento.

## Movimiento y objetos durante el scroll
- Crear una capa cinética ligada al desplazamiento con objetos de barbería cromados: tijeras que se abren y cierran al atravesar una sección y una máquina que recorre lateralmente otra zona.
- Añadir profundidad con piezas 3D flotantes discretas, reflejos móviles y cambios suaves de escala/parallax entre secciones, sin tapar texto ni controles.
- Animar la entrada de títulos, fotografías, principios, reseñas y ubicación con ritmos distintos para evitar que la página vuelva a sentirse estática.
- Limitar el coste gráfico en móvil, suspender escenas fuera de pantalla y respetar `prefers-reduced-motion`.

## Carrusel más urbano
- Generar un nuevo conjunto coherente de fotografías reales, oscuras y editoriales: interior de barbería urbana, detalle de máquina/tijeras y retrato de corte contemporáneo.
- Mantener el carrusel, su gestión desde administración y las imágenes subidas por el usuario; las nuevas fotografías reemplazarán únicamente los contenidos predeterminados.
- Evitar estética agresiva, grafiti excesivo o imágenes genéricas de stock.

## Aviso de instalación
- Mostrar el aviso de instalación exclusivamente en móvil/tablet táctil y ocultarlo siempre en escritorio.
- Conservar su cierre, persistencia y acceso a la página de instalación.

## Panel de administración Liquid Chrome
- Renovar el acceso de administración: retirar el lenguaje visual antiguo de neón/glitch y sustituirlo por cromo líquido, profundidad 3D, reflejos físicos y movimiento elegante.
- Rehacer la carcasa del panel con navegación redondeada, superficies grafito, bordes de acero, acento azul eléctrico y estados activos cromados.
- Aplicar el sistema a cabecera, sidebar, pestañas, tablas, filtros, formularios, calendarios, diálogos, tarjetas, indicadores y estados vacíos, sin cambiar acciones ni datos.
- Mantener una densidad alta y lectura rápida: la estética 3D decorará la estructura, pero no restará claridad a reservas, clientes o estadísticas.
- Adaptar navegación y controles a móvil sin alterar la organización funcional actual.

## Validación
- Comprobar la portada en escritorio y móvil: letras sin chorretones, separación correcta, volumen de globo, respuesta al cursor/táctil y animaciones de scroll sin solapes.
- Verificar carrusel con imágenes predeterminadas, subidas, vídeo, lista vacía y elementos desactivados.
- Recorrer acceso y principales pestañas de administración en escritorio y móvil.
- Confirmar ausencia de desbordamiento horizontal, errores de consola/red y regresiones de tipos.
