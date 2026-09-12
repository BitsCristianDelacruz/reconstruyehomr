## Context
Ver proposal.md y docs/arquitectura/lectura-y-trazabilidad.md. El repositorio tiene Express/TypeScript, SQL Server con migraciones numeradas y Angular standalone, sin dominio implementado.

## Goals / Non-Goals
**Goals:** API REST por capacidad, persistencia relacional real, privacidad de las proyecciones públicas, pruebas de negocio/HTTP y frontend funcional móvil.
**Non-Goals:** despliegue público, proveedor real de verificación de correo/SMS, pagos, logística, verificación de personas, retención/anonimización definitiva, evidencia sensible y exportaciones.

## Decisions
1. Monolito modular con carpetas por capacidad. Cada servicio tiene responsabilidad de negocio; routers validan y traducen HTTP; repositorios implementan puertos específicos. La composición inyecta SQL, reloj, identificadores y hasher. Se evita un ORM o framework mayor porque la base existente ya usa mssql y los puertos permiten sustituirlo.
2. SOLID: responsabilidad única en servicio/router/adaptador; extensión por interfaces de autenticación/persistencia; dobles de pruebas con los mismos contratos; interfaces por capacidad; negocio sin imports de Express o mssql.
3. Publicaciones comparten un modelo discriminado need/offer y repositorio, con servicios de solicitud/oferta especializados por tipo. Estados de ciclo de vida separados de restricción de moderación. Versiones numéricas evitan pérdidas por concurrencia.
4. SQL usa claves foráneas, índices de consulta, restricciones y transacciones para mutación + historial/auditoría. Las contribuciones tienen unicidad por actor y clave de idempotencia, además de huella del contenido. No se modifican migraciones aplicadas.
5. Autenticación local por correo/contraseña aprobada por el usuario, con scrypt y token opaco aleatorio; solo hash del token persistido. Cookie HttpOnly y SameSite=Lax; Secure configurable. CORS exacto, cabecera obligatoria X-Requested-With y comprobación de Origin en operaciones de escritura. Limitación de intentos. Registro público no concede privilegios. La opción local rechaza ejecución en producción. La verificación de correo es obligatoria antes del lanzamiento; el proveedor definitivo de PD-01 sigue pendiente.
6. Proyecciones públicas explícitas; no serializar filas SQL completas. No mostrar identificadores de cuentas, correos, teléfonos, notas privadas ni ubicación exacta. Los teléfonos se revelan únicamente en la respuesta de contacto tras doble consentimiento.
7. Angular usa rutas lazy por capacidad, servicios HTTP tipados, formularios reactivos y signals. Se mantienen tres pasos de publicación, navegación de cuatro secciones requerida por el SRS y estilo del mockup; se evitan los tamaños demasiado pequeños y el nowrap que desborda en móvil.
8. Catálogos de desarrollo configurables basados en mockup. Evidencia, validación de aliados y exportaciones permanecen deshabilitadas y la UI explica ese estado. No se inventan políticas operativas ni datos reales de hogares.
9. Tests unitarios usan repositorios en memoria; integración usa SQL Docker y cuentas .test creadas para pruebas. Cada grupo de API se implementa y prueba antes del siguiente.

## Risks / Trade-offs
- Políticas aún pendientes → no publicar y deshabilitar capacidades condicionadas.
- API local sin verificación de correo → modo local explícito, sustituible y bloqueado en producción.
- Contenido libre puede incluir datos personales → advertencias en formularios, sin campos de dirección/documentos y sin exponer notas privadas.
- SQL Server no equivale por completo a Azure SQL → validar migraciones y despliegue en Azure en una etapa posterior.
- Cookies entre dominios → configurar HTTPS, SameSite=None y orígenes exactos al integrar un proveedor de producción.

## Migration Plan
Aplicar migraciones 002 en adelante en orden: catálogos/auditoría, cuentas/sesiones, publicaciones/historial, consentimientos de contacto, contribuciones, reportes. Compose ejecuta migraciones locales al reiniciar el backend. Migraciones forward-only; no borrar el volumen ante errores. Antes de producción hacer respaldo y migración supervisada. No sembrar cuentas privilegiadas automáticamente; proporcionar comando explícito de desarrollo.
