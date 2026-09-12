# Contratos API del MVP local

Base local mediante Angular: `http://localhost:4200/api`. Acceso directo: `http://localhost:7071/api`. JSON UTF-8; fechas ISO 8601; identificadores UUID normalizados a minúsculas. Los esquemas rechazan campos desconocidos.

## Reglas comunes

- Las escrituras POST/PATCH/PUT requieren `X-Requested-With: ReconstruyeHome`. Un `Origin` presente debe coincidir con `CORS_ORIGINS`.
- El login entrega cookie `rh_session`, HttpOnly, SameSite=Lax, Path=/api, duración de 12 horas. Los clientes del navegador envían credenciales; no guardan tokens en localStorage.
- Registro y login tienen límite de 40 solicitudes por 15 minutos; reportes, 60 por hora. Estos límites son locales y en memoria por proceso.
- Los errores devuelven `{ "message": "...", "fields": { "campo": ["motivo"] } }`; `fields` es opcional. 400: entrada inválida; 401: sesión ausente/inválida; 403: permiso o consentimiento insuficiente; 404: recurso ausente/no accesible; 409: conflicto; 429: límite; 500: error interno genérico.
- Crear normalmente devuelve 201, consultar/modificar 200; logout 204. La edición y las transiciones requieren la `version` actual. Ante 409, recarga el recurso y revisa el cambio antes de reenviar.
- La respuesta pública excluye ID de cuenta, correo, teléfono, hash, notas privadas y consentimientos internos. El contenido de texto es declarado por el autor; los formularios advierten contra datos sensibles.

## Diagnóstico y catálogos

| Método y ruta | Acceso | Resultado |
| --- | --- | --- |
| GET /health | Público | Proceso activo |
| GET /ready | Público | Consulta real a ApplicationInfo y hora SQL; 503 si SQL no responde |
| GET /catalogs | Público | `entries` activos y `features` |

Grupos de catálogo: `category`, `territory`, `urgency`, `reportCategory`, `needState`, `offerState`, `safety`. Las opciones inactivas permanecen en referencias históricas. Las capacidades `evidence`, `allyValidation`, `exports` y `payments` están deshabilitadas.

## Cuentas

| Método y ruta | Acceso | Entrada / comportamiento |
| --- | --- | --- |
| POST /auth/register | Público | Perfil, email, password, privacyConsent=true; devuelve perfil propio |
| POST /auth/login | Público | email, password; devuelve perfil y establece cookie |
| POST /auth/logout | Sesión opcional | Revoca la sesión presentada y elimina cookie |
| GET /me | Sesión | Perfil propio |
| PATCH /me | Sesión | Sustituye datos editables del perfil |
| POST /me/deactivation | Sesión | confirmed=true; desactiva acceso, revoca sesiones y retira publicaciones públicas |

Perfil editable: `name` (2–80), `territory` activo, `roles` (uno o varios de `affected`, `donor`, `professional`, `organization`), `phone` opcional/null en formato internacional + y 8–15 dígitos, `contactConsent` booleano. Registro añade correo y contraseña de 12–128 caracteres. El correo y los roles privilegiados no son editables por esta API.

Registro y login son operaciones separadas: Angular realiza login después de registrar. Las cuentas pueden tener varios roles públicos. Ninguno concede moderación o administración. Cambiar preferencias conserva los privilegios existentes en la base sin poder asignarlos.

La desactivación registra `deactivation_requested`; no borra ni anonimiza. La autenticación de desarrollo rechaza producción. Verificar correo y definir recuperación sigue siendo requisito previo al lanzamiento.

## Solicitudes, ofertas y muro

| Método y ruta | Acceso | Entrada / resultado |
| --- | --- | --- |
| POST /needs | Sesión | Crea solicitud en draft (por defecto) o published |
| POST /offers | Sesión | Crea oferta en draft (por defecto) o published |
| PATCH /publications/:id | Autor | Campos parciales y version |
| POST /publications/:id/transitions/:action | Autor | version; confirmed=true para close |
| GET /me/publications | Sesión | `{items}`, hasta 200 publicaciones propias recientes |
| GET /me/publications/:id | Autor | Borrador o publicación propia, incluso restringida |
| GET /publications | Público | Muro `{items,total,page,limit}` |
| GET /publications/:id | Público | Detalle, isOwner y timeline pública |

Campos compartidos: `title` (máximo 120), `description` (3000), `category`, `territory`, `zone` aproximada (120), `contactEnabled`, `safetyAccepted`. Solicitudes añaden `damage` (500) y `urgency`; ofertas añaden `availability` (500) y `conditions` (1000). No mezclar campos específicos de ambos tipos.

El borrador admite campos incompletos. Publicar exige título, descripción, categoría/territorio activos, zona, campos del tipo y aceptación de recomendaciones. Contacto es opcional. No se aceptan archivos, dirección exacta ni campos de ubicación adicionales.

Filtros del muro: `kind=need|offer`, `category`, `territory`, `urgency`, `state=published|closed` (por defecto published), `page` (1–10000), `limit` (1–50, por defecto 12). Orden por actualización más reciente e ID, sin puntuación de personas.

| Acción | Estado inicial | Estado final |
| --- | --- | --- |
| publish | draft | published |
| pause | published | paused |
| close | published, paused | closed |
| reopen | closed, paused | published |

La moderación se mantiene separada del ciclo de vida. `hidden` impide edición y acceso público; la proyección propia añade `moderationState=clear|reported|hidden`. Un reporte pendiente no oculta automáticamente. Borradores, pausadas, ocultas y publicaciones de autores inactivos responden 404 en el detalle público. Para privacidad, editar una publicación ajena también responde 404. Las cerradas siguen consultables, sin contacto nuevo.

Ejemplo para crear una solicitud publicada (con cookie de sesión y cabecera de escritura):

```json
{
  "title": "Materiales para reparar una cubierta",
  "description": "Descripción sin datos personales ni dirección exacta.",
  "category": "materials",
  "territory": "soacha",
  "zone": "Zona urbana",
  "urgency": "medium",
  "damage": "Afectación declarada de la cubierta",
  "contactEnabled": false,
  "safetyAccepted": true,
  "state": "published"
}
```

Usa los códigos activos de /catalogs. Estos territorios son datos de demostración.

## Contacto

`POST /publications/:id/contact`, con sesión y `{"confirmed":true}`, devuelve `{url}` para WhatsApp.

Requiere publicación publicada/visible, autor activo, contacto habilitado en esa publicación y teléfono consentido vigente en el perfil. La transacción vuelve a comprobar esos permisos antes de registrar el consentimiento. Auditoría no guarda el teléfono. El texto identifica la publicación sin dirección ni datos del interesado. La API no envía mensajes; Angular muestra el enlace después de la confirmación y la persona revisa el mensaje en WhatsApp.

## Contribuciones

| Método y ruta | Acceso | Entrada / resultado |
| --- | --- | --- |
| POST /publications/:id/contributions | Sesión; distinto del autor | type activo de categoría, note opcional (1000); requiere Idempotency-Key |
| GET /publications/:id/contributions | Publicación visible | `items`; notas solo a participantes |
| GET /me/contributions | Sesión | Contribuciones en las que participa |
| GET /contributions/:id | Participante | Contribución e historial privado |
| POST /contributions/:id/transitions/:action | Participante autorizado | version y confirmación según acción |

Solo se crea sobre una solicitud publicada activa. Estado inicial `declared`. La cabecera `Idempotency-Key` admite 8–80 caracteres alfanuméricos, guion y guion bajo. Su unicidad es por cuenta: conserva la misma clave y contenido para reintentar; la API devuelve el mismo ID (200 al repetir, 201 al crear). Reutilizarla con otro contenido devuelve 409. Dos transacciones simultáneas producen una sola contribución y evento inicial.

Acciones: `coordinate`, `cancel`, `receive`, `dispute`. Cancelar, recibir y disputar requieren `confirmed=true`. Solo el autor del caso puede recibir/disputar; el contribuyente no puede confirmar su propia entrega como recibida. Se aplican permisos y estado vigente; transiciones no admitidas o versiones antiguas devuelven 409.

Los estados son `declared`, `coordinated`, `received`, `cancelled`, `reported`. El registro no cierra el caso. La cronología pública mezcla cambios de publicación/contribución sin identidades ni notas, y excluye contribuciones ocultas. Una constancia no certifica entrega ni calidad. Una contribución oculta no se recupera por ID ni repitiendo su clave de creación.

## Reportes y moderación

| Método y ruta | Acceso | Entrada / resultado |
| --- | --- | --- |
| POST /reports | Sesión | targetType, targetId, category, detail opcional (1000), confirmed=true |
| GET /moderation/reports?page=1 | Moderador/admin | Reportes; páginas de 30 |
| POST /moderation/reports/:id/decisions | Moderador/admin | version, decision, reason (5–1000) |

`targetType` admite `publication`, `profile`, `contribution`. Para **profile**, `targetId` es el ID público de una publicación: el servidor resuelve su autor sin publicar el ID de cuenta. Para contribution se usa el ID de la contribución visible.

Decisiones: `hide`, `restore`, `dismiss`, `escalate`. El reporte pasa a resuelto o escalado según la acción. Ocultar/restaurar un perfil exige **admin**. Ocultar contenido lo retira también de enlaces directos y contacto. Las decisiones conservan motivo, actor, fecha y auditoría dentro de una transacción, sin reescribir el contenido del autor. Restaurar un perfil no puede revertir una solicitud de desactivación.

## Administración

Todas estas rutas requieren admin.

| Método y ruta | Entrada / resultado |
| --- | --- |
| GET /admin/catalogs | Catálogos activos e inactivos |
| PUT /admin/catalogs/:group/:code | label, active, position (0–10000), reason (5–1000) |
| GET /admin/accounts?q=texto | Busca cuentas; proyección administrativa |
| PUT /admin/accounts/:id | state=active|disabled, roles, reason (5–1000) |
| GET /admin/audit?page=1 | Auditoría; páginas de 50 |

Los estados tienen códigos fijos; no se añaden transiciones arbitrarias mediante catálogos. No se deshabilitan los avisos de seguridad. Los cambios de cuentas revocan sus sesiones; un administrador no modifica sus propios privilegios por esta ruta ni reactiva cuentas con desactivación solicitada.

El alta del primer administrador es un comando local explícito, documentado en el README. Las capacidades de evidencia, aliados y exportación no pueden activarse por modificar catálogos.
