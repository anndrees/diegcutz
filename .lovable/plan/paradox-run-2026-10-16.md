# PARADOX RUN

## Experiencia acordada
Un juego exclusivamente para PC dentro de DIEGCUTZ: una ciudad brutalista amplia y conectada, cielos luminosos, señalización roja y parkour con cambios de gravedad. Primera y tercera persona intercambiables. Las superficies señalizadas pueden convertirse en el nuevo suelo; la ciudad gira ante el jugador mientras conserva su impulso.

El objetivo visual es arquitectura trabajada, materiales creíbles y un corredor animado, no un escenario de cajas ni modelos provisionales. Los menús conservan la identidad editorial de DIEGCUTZ.

## Ciudad y contenido inicial
- Tres zonas conectadas con personalidad: plaza y terrazas para aprender, bloques elevados con pasarelas y un distrito de torres con recorridos verticales.
- Exploración libre, conexiones entre zonas, puntos de reaparición seguros y mapa con ubicación del jugador, carreras y secretos descubiertos.
- Seis carreras integradas físicamente en la ciudad, no seis mapas separados: **Primer impulso**, **Entre terrazas**, **Línea de pared**, **Cambio de eje**, **La ciudad invertida** y **Paradox Run**.
- Dificultad progresiva: movimiento básico, saltos encadenados, deslizamientos, carrera por paredes y combinaciones de gravedad.
- Rutas alternativas y 18 secretos distribuidos por la ciudad. Cada carrera incluye puntos de control y objetivos de bronce, plata y oro ajustados después de jugar el recorrido.
- Un fantasma reproduce la mejor carrera válida del jugador; muestra diferencia de tiempo y puede ocultarse.
- Cuatro skins iniciales para el mismo corredor; selección y vista previa. La tercera persona muestra el personaje animado; la primera persona evita que su cabeza obstruya la cámara.

## Movimiento y controles previstos
- **WASD:** moverse; **ratón:** mirar; **Espacio:** saltar y saltar desde una pared.
- **Mayús:** esprintar; **Ctrl:** deslizarse durante la carrera o agacharse.
- **Botón derecho del ratón:** cambiar gravedad hacia una superficie señalizada, visible y dentro del alcance. La mira indica si es válida; no atraviesa obstáculos.
- **V:** alternar cámaras; **R:** volver al punto de control; **M:** mapa; **Esc:** pausa.
- Carrera por paredes al acercarse lateralmente con velocidad y mantener salto; duración limitada y salto de salida.
- Captura del ratón solo al entrar voluntariamente a jugar. Perder el foco pausa la partida y libera los controles.
- Opciones de sensibilidad, inversión vertical, volumen, calidad gráfica, campo de visión y reducción de balanceo/giro para comodidad.
- Aprendizaje guiado dentro de la plaza, consultable después desde la pausa.

## Pantallas y guardado
- Entrada desde el pie de la portada en ordenador y dirección `/paradox-run`. Sin enlace móvil ni carga del juego en dispositivos táctiles sin controles de PC.
- Menú de juego con ciudad de fondo: explorar, carreras, corredor, opciones y editor.
- Pausa, mapa, llegada con tiempos y medallas, reintento inmediato y regreso a exploración.
- Guardado local de ajustes, secretos, medallas, skins elegida y mejores carreras con sus fantasmas. No requiere cuenta; no es un ranking compartido ni se sincroniza entre dispositivos.
- Carga con progreso y tratamiento claro de errores de recursos o incompatibilidad gráfica.

## Editor y ampliación
- Editor visual para PC con catálogo de módulos arquitectónicos y superficies de gravedad; colocar, seleccionar, mover, rotar, duplicar y eliminar.
- Configurar inicio del jugador, inicio/meta de carreras, puntos de control y secretos.
- Deshacer/rehacer, guardar borradores locales, probar el mapa y exportar/importar archivos de mapa validados.
- El editor monta recorridos usando los módulos disponibles; no es una herramienta para esculpir personajes o modelar edificios desde cero.
- Las nuevas ciudades, módulos y skins pueden añadirse después sin rehacer el movimiento, las carreras o el editor.

## Implementación técnica
- Juego aislado y cargado bajo demanda con React Three Fiber y versiones compatibles con React 18; no modificar reservas, acceso admin ni lógica de clientes.
- Motor de colisiones probado y controlador de cápsula con gravedad propia, pasos de simulación estables y movimiento relativo a la cámara.
- Separar movimiento, cámaras, representación de ciudad, carreras, reproducción fantasma, guardado, catálogo de skins y editor.
- Ciudad y carreras definidas como datos versionados, compartidos por el juego y el editor. Validar identificadores, coordenadas, conexiones y referencias al importar.
- Modelos y texturas locales con licencia CC0 verificada; personaje con esqueleto y animaciones. Detalles arquitectónicos repetidos mediante instancias y carga por zonas cuando corresponda.
- Iluminación ambiental local, sombras, materiales con textura y variación; sin depender de recursos gráficos alojados por terceros durante la partida.
- Pruebas de reglas: bloqueo móvil, gravedad señalizada y alcance, orden de controles de carrera, invalidación de tiempos, persistencia/reproducción de fantasmas y validación de mapas.

## Orden de entrega y comprobaciones
1. Construir y comprobar una sección finalista: correr, saltar, aterrizar en fachada, giro de cámara y regreso al suelo, en ambas cámaras. Esta sección establece el nivel visual del resto.
2. Completar la ciudad conectada y verificar sus seis carreras, rutas alternativas y secretos con el controlador real.
3. Añadir fantasma, progresión local, skins, mapa, opciones y editor funcional.
4. Jugar las carreras de principio a fin, verificar reinicios y guardado tras recargar; probar un mapa creado y reimportado desde el editor.
5. Comprobar escena visible, animación, controles y ausencia de errores en PC; comprobar que el móvil no carga ni permite el juego y que la web existente sigue intacta.
6. Entregar explicación completa de controles, mecánicas, ciudad, carreras, secretos, skins, guardado, editor y cómo ampliar el contenido. Indicar cualquier límite real o apartado no verificado, sin presentar prototipos como terminados.

El alcance es un juego original para navegador, con contenido propio y acabado cuidado; no un port de consola ni una promesa de producción AAA. No se incluye multijugador, ranking online ni sincronización entre dispositivos.