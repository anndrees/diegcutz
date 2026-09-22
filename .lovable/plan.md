# Retirada de fidelización y renovación de la experiencia

## Objetivo
Desactivar el programa de puntos sin perder datos ni romper reservas existentes, conservar los cortes gratis como saldo manual, añadir filtros temporales a las estadísticas y renovar visualmente las páginas que ven los clientes.

## Implementación
1. **Fidelización reversible y segura**
   - Mantener el ajuste global existente, pero convertirlo en una desconexión completa del programa de puntos.
   - Al desactivarlo, ocultar tarjeta, puntos, QR, accesos, mensajes y notificaciones relacionadas.
   - Detener la asignación automática de puntos y premios por visitas.
   - Conservar únicamente el saldo de cortes gratis y la posibilidad de aumentarlo o reducirlo manualmente desde la ficha del cliente.
   - Mantener los datos históricos en la base de datos para evitar pérdidas y permitir una futura reactivación.

2. **Estadísticas con periodo configurable**
   - Añadir filtros: Todo, 12 meses, 6 meses, 3 meses, último mes y rango personalizado.
   - Recalcular tarjetas y gráficos usando solo las reservas del periodo seleccionado.
   - Corregir el cálculo de clientes únicos usando el cliente asociado, no el identificador de la reserva.
   - Mostrar claramente el periodo activo y un estado vacío cuando no haya datos.

3. **Renovación visual para clientes**
   - Mantener la estética urbana oscura con neón rosa, morado y cian.
   - Actualizar los elementos compartidos y las páginas principales del cliente: inicio, acceso/registro, reserva, perfil, sorteos, membresías e instalación.
   - Mejorar jerarquía, fondos, cabeceras, navegación, tarjetas, estados vacíos y transiciones, sin cambiar funciones ni flujos.
   - Respetar móviles, accesibilidad y reducción de movimiento.

4. **Comprobación**
   - Verificar que el ajuste persiste y que oculta/desactiva toda la fidelización automáticamente.
   - Probar la concesión manual y el uso de cortes gratis.
   - Comprobar filtros y cálculos de estadísticas.
   - Revisar las páginas públicas en escritorio y móvil.

## Decisión técnica
Se recomienda **desactivar, no borrar**. La fidelización está conectada con reservas, perfiles, QR, automatizaciones y datos históricos; eliminarla físicamente aumenta el riesgo de regresiones. El interruptor ofrece el mismo resultado visible y operativo, pero es reversible y conserva los cortes gratis.
