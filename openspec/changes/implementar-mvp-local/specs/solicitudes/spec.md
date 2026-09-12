## Purpose
Define el comportamiento verificable de solicitudes para el MVP local de Reconstruye, siguiendo el SRS y los controles de privacidad del proyecto.

## ADDED Requirements

### Requirement: Borradores y publicación
El sistema SHALL permitir al autor guardar y editar borradores y publicar solicitudes con categoría, título, descripción, zona, afectación, urgencia, canal habilitado y aceptación del aviso. FR-10, FR-13, BR-01.

#### Scenario: Borradores y publicación
- **WHEN** Una persona publica una solicitud incompleta
- **THEN** Recibe errores asociados a campos y la solicitud no pasa a publicada.

### Requirement: Propiedad y transiciones
El sistema SHALL permitir al autor publicar, pausar, cerrar y reabrir según el estado actual y la configuración. SHALL rechazar modificaciones ajenas, versiones obsoletas y contenido restringido por moderación. FR-14–15.

#### Scenario: Propiedad y transiciones
- **WHEN** Otra persona intenta editar o cerrar la solicitud
- **THEN** Recibe 404 para no revelar publicaciones ajenas; el contenido y el historial no cambian.

### Requirement: Historial de cambios
El sistema SHALL conservar los cambios de estado y la versión de la publicación para evitar sobrescrituras concurrentes. DR-02.

#### Scenario: Historial de cambios
- **WHEN** Dos ediciones usan la misma versión
- **THEN** Solo la primera tiene éxito y la segunda recibe 409.

### Requirement: Privacidad y evidencia condicionada
El sistema SHALL mostrar solo zona aproximada y advertencias; SHALL NOT aceptar imágenes o coordenadas/dirección exacta mediante campos no definidos mientras la política de evidencia esté pendiente. FR-12, FR-16, BR-02.

#### Scenario: Privacidad y evidencia condicionada
- **WHEN** Un cliente envía un campo no admitido de dirección o evidencia
- **THEN** La validación rechaza el campo y no se almacena información sensible adicional.
