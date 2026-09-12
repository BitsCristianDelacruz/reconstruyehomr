## Purpose
Define el comportamiento verificable de contribuciones para el MVP local de Reconstruye, siguiendo el SRS y los controles de privacidad del proyecto.

## ADDED Requirements

### Requirement: Registro idempotente
El sistema SHALL registrar contribuciones para solicitudes activas con categoría, estado inicial declarada y nota opcional. SHALL exigir Idempotency-Key y rechazar reutilizarla con contenido diferente. FR-32, NFR-07.

#### Scenario: Registro idempotente
- **WHEN** Se repite una solicitud de registro con la misma clave y contenido
- **THEN** Se devuelve la misma contribución y solo existe un evento inicial.

### Requirement: Estados y participantes
El sistema SHALL aplicar transiciones declarada, coordinada, recibida, cancelada o reportada según permisos del participante y versión; SHALL NOT cerrar automáticamente el caso. FR-33, BR-03.

#### Scenario: Estados y participantes
- **WHEN** Se marca una contribución como recibida
- **THEN** La solicitud conserva su estado y el historial registra la transición.

### Requirement: Confirmación y disputa del caso
El sistema SHALL permitir solo al autor del caso confirmar o disputar la recepción con confirmación explícita, conservando quién declaró y quién confirmó. FR-34.

#### Scenario: Confirmación y disputa del caso
- **WHEN** Un tercero intenta confirmar la recepción
- **THEN** Recibe 403 sin alterar la contribución.

### Requirement: Historial público limitado
El sistema SHALL mostrar cronología de estados y contribuciones sin notas privadas, identidades ni contactos; notas y acciones privadas solo son accesibles para los participantes. La constancia SHALL advertir que no es certificación. FR-35–36.

#### Scenario: Historial público limitado
- **WHEN** Un visitante consulta la cronología pública
- **THEN** Ve eventos y fechas sin información privada de las partes.
