# experiencia-angular Specification

## Purpose
Define el comportamiento verificable de experiencia-angular para el MVP local de Reconstruye, siguiendo el SRS y los controles de privacidad del proyecto.

## Requirements

### Requirement: Navegación y diseño del SRS
La interfaz SHALL usar español, diseño móvil y la identidad visual del mockup (verde bosque, superficies claras y tipografía equivalente). SHALL incluir Muro, Publicar, Mis publicaciones y Seguridad; administración se separa por permisos.

#### Scenario: Navegación y diseño del SRS
- **WHEN** Una persona navega en una pantalla móvil
- **THEN** Accede a las cuatro secciones principales y puede volver sin perder el contexto.

### Requirement: Formularios por pasos
La publicación SHALL ocupar tres pasos principales más autenticación, con etiquetas accesibles, errores junto al campo, borrador y conservación de lo ingresado al fallar. NFR-01–02.

#### Scenario: Formularios por pasos
- **WHEN** Falla el envío de una publicación
- **THEN** Se muestra error accesible y permanecen los datos para reintentar.

### Requirement: Confirmaciones de acciones
La interfaz SHALL solicitar confirmación explícita para contacto externo, reporte, cierre, recepción y desactivación; SHALL mostrar estados de carga, vacío y error.

#### Scenario: Confirmaciones de acciones
- **WHEN** Se inicia un cierre de caso
- **THEN** El estado no cambia hasta que la persona confirma.

### Requirement: Datos reales y módulos
La interfaz SHALL obtener catálogos, muro, detalle, cuenta, historial y moderación de sus APIs; SHALL NOT mostrar ejemplos como datos reales. La pantalla de diagnóstico SHALL mantenerse en ruta secundaria.

#### Scenario: Datos reales y módulos
- **WHEN** Se crea una publicación desde el formulario
- **THEN** Aparece en el muro tras respuesta de la API y sigue existiendo al recargar.
