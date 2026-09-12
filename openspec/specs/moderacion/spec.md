# moderacion Specification

## Purpose
Define el comportamiento verificable de moderacion para el MVP local de Reconstruye, siguiendo el SRS y los controles de privacidad del proyecto.

## Requirements

### Requirement: Reporte autenticado
El sistema SHALL permitir reportar publicación visible, perfil accesible o contribución pública con categoría y detalle opcional, y exigir confirmación. Los reportes SHALL NOT ocultar automáticamente mientras no exista política de riesgo aprobada. FR-41–42.

#### Scenario: Reporte autenticado
- **WHEN** Un usuario reporta una publicación
- **THEN** Se crea un reporte abierto para revisión; la publicación sigue visible con información declarada.

### Requirement: Decisión trazable
El sistema SHALL permitir a moderadores y administradores revisar, ocultar, restaurar, resolver o escalar reportes con motivo, sin reescribir el contenido sustantivo del autor. FR-43, BR-05.

#### Scenario: Decisión trazable
- **WHEN** Un moderador oculta la publicación reportada
- **THEN** Desaparece de todos los accesos públicos y la acción queda auditada de forma atómica.

### Requirement: Administración restringida
El sistema SHALL separar reportes, configuración, cuentas y auditoría; solo administradores pueden asignar privilegios o desactivar cuentas por seguridad con motivo. FR-50–51, FR-53, IF-02.

#### Scenario: Administración restringida
- **WHEN** Un moderador intenta asignar permisos
- **THEN** Recibe 403 sin cambios.

### Requirement: Políticas pendientes
El sistema SHALL declarar deshabilitadas validaciones de aliados, evidencias y exportaciones mientras PD-02, PD-04 y PD-07 estén pendientes. SHALL distinguir información declarada de constancia y remitir peligro inmediato a canales oficiales sin prometer atención. FR-40, FR-44–45, FR-52.

#### Scenario: Políticas pendientes
- **WHEN** Se solicita activar una validación o exportación no configurada
- **THEN** Se informa que requiere la política pendiente; no se simula una validación ni se exportan datos.
