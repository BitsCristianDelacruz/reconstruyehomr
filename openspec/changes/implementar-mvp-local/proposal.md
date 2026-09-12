## Why
El proyecto solo tiene una pantalla de diagnóstico y endpoints de salud. Se requiere convertir el SRS v0.1 y el mockup móvil en un MVP local de ayuda no monetaria, con privacidad, pruebas y trazabilidad de desarrollo.

## What Changes
- Implementar secuencialmente catálogos, cuentas, solicitudes, ofertas/muro, contacto, contribuciones e historial, reportes y administración.
- Aplicar SOLID mediante servicios de aplicación, interfaces pequeñas de persistencia y adaptadores SQL/HTTP separados.
- Crear migraciones incrementales, pruebas unitarias por API y pruebas de integración contra SQL.
- Sustituir el diagnóstico inicial por módulos Angular con navegación móvil Muro, Publicar, Mis publicaciones y Seguridad, conservando la identidad visual del mockup.
- Mantener verificaciones de aliados, imágenes, exportaciones y políticas definitivas de datos deshabilitadas hasta resolver las decisiones pendientes del SRS. No publicar en Azure.
- Autenticación local por correo/contraseña, confirmada por el usuario. La verificación del correo es obligatoria antes del lanzamiento; el proveedor y la recuperación quedan pendientes para esa etapa.

## Capabilities
### New Capabilities
- `catalogos`: categorías, territorios y mensajes configurables.
- `cuentas`: autenticación local, perfiles, roles de actor y consentimiento.
- `solicitudes`: borradores, publicación y transiciones del caso.
- `ofertas-muro`: ofertas, filtros, paginación y detalle público.
- `contacto`: acceso consentido a WhatsApp sin contacto público.
- `contribuciones`: registro idempotente, confirmación, disputa e historial.
- `moderacion`: reportes, decisiones y auditoría privilegiada.
- `experiencia-angular`: módulos por funcionalidad, formularios y estados accesibles.

### Modified Capabilities
Ninguna; no había especificaciones OpenSpec previas.

## Impact
Cambios en apps/back, apps/front, infra/database/migrations, scripts, documentación y configuración de desarrollo. Se conserva SQL Server/Azure SQL, Express, Angular 21 y los tres contenedores. No se modifica sources/ ni los Word originales. El contenido de output/pdf corresponde a escarapelas y no define requisitos del producto.
