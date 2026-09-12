# catalogos Specification

## Purpose
Define el comportamiento verificable de catalogos para el MVP local de Reconstruye, siguiendo el SRS y los controles de privacidad del proyecto.

## Requirements

### Requirement: Catálogos públicos activos
El sistema SHALL exponer categorías de ayuda y reporte, territorios activos, urgencias, estados habilitados y mensajes de seguridad. Los catálogos inactivos SHALL conservarse para referencias históricas. FR-11, FR-50.

#### Scenario: Catálogos públicos activos
- **WHEN** Un visitante consulta GET /api/catalogs
- **THEN** Recibe los catálogos activos y las capacidades condicionadas deshabilitadas, sin datos de cuentas.

### Requirement: Administración con auditoría
El sistema SHALL restringir las modificaciones de catálogos y configuración a administradores, exigir motivo y registrar la modificación de forma atómica con su auditoría.

#### Scenario: Administración con auditoría
- **WHEN** Un usuario sin rol administrador modifica un catálogo
- **THEN** Recibe 403 y no se altera el catálogo ni se crea un cambio parcial.
