# contacto Specification

## Purpose
Define el comportamiento verificable de contacto para el MVP local de Reconstruye, siguiendo el SRS y los controles de privacidad del proyecto.

## Requirements

### Requirement: Consentimiento antes del canal externo
El sistema SHALL entregar un enlace WhatsApp solo a un usuario autenticado que confirma el aviso, para una publicación publicada y visible cuyo autor habilitó el canal y autorizó compartirlo. FR-30–31, IF-01.

#### Scenario: Consentimiento antes del canal externo
- **WHEN** Se intenta contactar sin consentimiento o con contacto deshabilitado
- **THEN** La API rechaza la solicitud y no revela número ni enlace.

### Requirement: Mensaje y privacidad
El sistema SHALL construir un mensaje editable que identifique la publicación sin dirección ni datos del solicitante; SHALL registrar el consentimiento sin guardar el número en auditoría. SHALL NOT enviar el mensaje automáticamente.

#### Scenario: Mensaje y privacidad
- **WHEN** Se confirma el contacto permitido
- **THEN** Se devuelve un enlace wa.me con texto no sensible y el navegador pide la confirmación antes de abrirlo.
