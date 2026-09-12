# cuentas Specification

## Purpose
Define el comportamiento verificable de cuentas para el MVP local de Reconstruye, siguiendo el SRS y los controles de privacidad del proyecto.

## Requirements

### Requirement: Autenticación y sesión local
El sistema SHALL permitir registro y acceso por correo y contraseña en el modo local aprobado, exigir consentimiento, almacenar contraseña derivada y usar sesiones revocables. La autenticación local SHALL estar deshabilitada en producción; el lanzamiento SHALL requerir verificación de correo. FR-01, FR-04, NFR-05.

#### Scenario: Autenticación y sesión local
- **WHEN** Una persona registra una cuenta con datos válidos y consentimiento
- **THEN** Obtiene un perfil sin hash de contraseña y puede iniciar sesión protegida; Angular inicia sesión después del registro. Un correo duplicado se rechaza sin duplicar cuenta.

### Requirement: Perfiles con roles limitados
El sistema SHALL permitir consultar y editar el perfil propio, roles de actor y preferencias de contacto; el registro público SHALL NOT asignar permisos de administrador, moderador ni aliado. FR-02–03.

#### Scenario: Perfiles con roles limitados
- **WHEN** Un usuario intenta asignarse el rol administrador en su perfil
- **THEN** Se rechaza la petición y se conservan sus permisos.

### Requirement: Desactivación sin política de borrado inventada
El sistema SHALL registrar la solicitud de desactivación, revocar sesiones y retirar del acceso público sus publicaciones; SHALL NOT borrar o anonimizar automáticamente datos mientras PD-04 siga pendiente. FR-05.

#### Scenario: Desactivación sin política de borrado inventada
- **WHEN** Una persona confirma la desactivación de su cuenta
- **THEN** La cuenta deja de autenticar y sus publicaciones dejan de ser públicas.

### Requirement: Privacidad y protección de sesión
El sistema SHALL proteger operaciones autenticadas frente a sesiones caducadas y solicitudes de origen no autorizado, y limitar intentos de acceso.

#### Scenario: Privacidad y protección de sesión
- **WHEN** Un navegador intenta modificar un perfil desde un origen no permitido
- **THEN** La solicitud se rechaza sin cambiar datos.
