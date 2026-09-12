## 1. Catálogos y arquitectura
- [x] 1.1 Crear puertos compartidos, errores HTTP y adaptador SQL; verificar compilación y pruebas.
- [x] 1.2 Crear migración de catálogos y API GET /api/catalogs; verificar categorías y exclusión de inactivos con pruebas unitarias e integración.

## 2. Cuentas
- [x] 2.1 Crear migración de cuentas, sesiones y consentimiento; implementar registro, login, logout, perfil y solicitud de desactivación; verificar pruebas unitarias por endpoint.
- [x] 2.2 Proteger sesión, roles y operaciones de origen externo; verificar acceso ajeno, privilegios y producción bloqueada con pruebas.

## 3. Solicitudes
- [x] 3.1 Crear modelo y migración de publicaciones/historial; implementar borrador, edición y transiciones con versiones; verificar pruebas de propiedad, validación y concurrencia.

## 4. Ofertas y muro
- [x] 4.1 Implementar ofertas, muro filtrado/paginado, detalle y mis publicaciones; verificar pruebas de filtros, cierre y ausencia de datos privados.

## 5. Contacto
- [x] 5.1 Implementar consentimiento y enlace WhatsApp controlado; verificar pruebas de visibilidad, doble consentimiento y texto no sensible.

## 6. Contribuciones
- [x] 6.1 Implementar migración, creación idempotente, transiciones, confirmación/disputa e historial; verificar pruebas de reintentos, permisos y permanencia del caso abierto.

## 7. Moderación y administración
- [x] 7.1 Implementar reportes y decisiones de moderación con auditoría atómica; verificar pruebas de permisos y contenido oculto.
- [x] 7.2 Implementar administración de catálogos, configuración, cuentas y auditoría; verificar motivos obligatorios y restricciones por rol.
- [x] 7.3 Exponer capacidades pendientes deshabilitadas y mensajes de seguridad; verificar que no se activan validaciones, evidencia ni exportaciones.

## 8. Angular
- [x] 8.1 Crear servicios tipados, rutas lazy y navegación del SRS con el diseño del mockup; verificar build y navegación móvil.
- [x] 8.2 Implementar acceso, perfil y mis publicaciones; verificar flujo con cuentas locales.
- [x] 8.3 Implementar muro, filtros, detalle y publicación en tres pasos con borrador y errores por campo; verificar creación real y persistencia al recargar.
- [x] 8.4 Implementar contacto, contribuciones, historial y reportes con confirmaciones; verificar acciones mediante APIs reales.
- [x] 8.5 Implementar consola separada de reportes, catálogos, cuentas y auditoría; verificar roles y decisiones.

## 9. Integración y cierre
- [x] 9.1 Actualizar Docker, scripts de pruebas y creación explícita de administrador local; verificar tres servicios saludables.
- [x] 9.2 Ejecutar pruebas unitarias de todas las APIs e integración SQL, incluidas privacidad, idempotencia y moderación; registrar resultados.
- [x] 9.3 Verificar navegador, teclado y vista móvil; corregir fallos y documentar limitaciones de políticas pendientes.
- [x] 9.4 Actualizar contratos API, README y trazabilidad; validar y sincronizar las especificaciones OpenSpec.
