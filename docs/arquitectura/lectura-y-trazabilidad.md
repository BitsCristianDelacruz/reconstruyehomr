# Revisión documental y trazabilidad del MVP local

Se revisaron Visión del Producto v0.1 (167 párrafos), SRS IEEE 29148 v0.1 (344 párrafos), index.html/app.js/styles.css del mockup, README y documentos de decisiones/despliegue/verificación. Los Word originales se conservaron sin modificaciones. sources/ estaba vacío. Los artefactos de escarapelas de output/ no pertenecen a los requisitos del producto.

## Precedencia y decisiones

La solicitud actual exige OpenSpec, SOLID y pruebas unitarias por API. El SRS concreta la visión; el mockup guía colores, tipografía y flujos. La navegación implementada sigue SRS 3.1: Muro, Publicar, Mis publicaciones y Seguridad, con administración separada.

Se mantuvo Angular 21 LTS, Node 24, Express y SQL Server/Azure SQL del entorno previo. El usuario confirmó correo y contraseña para desarrollo local y verificación de correo antes del lanzamiento.

## Implementación por capacidad

| Orden | Capacidad / requisitos | Código | Pruebas | Especificación |
| --- | --- | --- | --- | --- |
| 1 | Catálogos: FR-11, FR-50, DR-05 | back/src/modules/catalogs | catalogs.test.ts, admin.test.ts | catalogos |
| 2 | Cuentas/roles/consentimiento: FR-01–05, DR-01, BR-01, NFR-05–06 | back/src/modules/accounts | accounts.test.ts | cuentas |
| 3 | Solicitudes/borradores: FR-10, 13–16, DR-02 | back/src/modules/publications | publications.test.ts | solicitudes |
| 4 | Ofertas/muro/filtros/detalle: FR-20–24, BR-02, BR-06 | back/src/modules/publications | wall.test.ts | ofertas-muro |
| 5 | Contacto: FR-30–31, IF-01 | back/src/modules/contact | contact.test.ts | contacto |
| 6 | Contribuciones/historial: FR-32–36, BR-03, DR-03, NFR-07 | back/src/modules/contributions | contributions.test.ts | contribuciones |
| 7 | Reportes/moderación/configuración/auditoría: FR-40–43, 45, 50–51, 53, IF-02, DR-04–05, BR-04–07 | back/src/modules/moderation | moderation.test.ts, admin.test.ts | moderacion |
| 8 | Experiencia Angular: SRS 3.1, NFR-01–02, 09–10 | front/src/app/features | build y recorrido real de navegador | experiencia-angular |

Las rutas de código son relativas a apps/; las pruebas están en apps/back/test/. Las ocho especificaciones viven en [openspec/specs](../../openspec/specs); el cambio conserva propuesta, diseño y tareas. El script [api-integration.mjs](../../scripts/api-integration.mjs) cubre persistencia y comunicación por proxy. Los resultados y límites están en [verificación](verificacion-mvp-local.md), y los contratos en [API](api-mvp-local.md).

## Capacidades condicionadas

| Requisito | Estado local |
| --- | --- |
| FR-12: evidencia | Carga deshabilitada; no se aceptan campos de imagen o ubicación exacta |
| FR-44: validación de aliados | Deshabilitada; información etiquetada como declarada |
| FR-52: exportación | Deshabilitada hasta aprobar política |
| DR-06: retención/eliminación | Solicitud de desactivación y revocación; sin borrado/anonimización automática |
| PD-01: autenticación definitiva | Correo/contraseña local aprobado; falta proveedor y verificación/recuperación para lanzamiento |
| Políticas de piloto, riesgos, evidencia y operación | Pendientes según PD-02 a PD-07; no se adoptan como definitivas |

Los controles condicionados se representan como capacidades deshabilitadas, no como funciones concluidas. Soacha y Mocoa siguen siendo opciones de demostración, no pilotos aprobados.

Los reportes no ocultan automáticamente; cada decisión exige rol y motivo. No se guardan campos de dirección exacta ni documentos de identidad. No hay pagos, transporte garantizado, certificación técnica ni mensajes externos automáticos. El contacto requiere autorización vigente del autor y confirmación del interesado.
