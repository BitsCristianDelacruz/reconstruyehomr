# ReconstruyeHome

MVP local de ayuda no monetaria con Angular 21 LTS, Node.js 24 + Express 5 + TypeScript y SQL Server 2022 Developer, compatible con Azure SQL Database. Incluye cuentas, solicitudes, ofertas, contribuciones, contacto consentido y administración. Las especificaciones y escenarios están en [OpenSpec](openspec/specs).

## Iniciar

Requisitos: Docker Desktop con motor Linux y Docker Compose v2.20 o superior. SQL Server requiere x86-64 y al menos 2 GB para el motor; se recomiendan 6 GB de RAM disponibles para el conjunto. Node no es obligatorio para iniciar con Docker.

Desde la raíz, **solo la primera vez**:

```powershell
Copy-Item .env.example .env
```

Configura la contraseña de desarrollo en `.env` y arranca:

```powershell
docker compose up --build --wait --wait-timeout 240
```

Se construyen dos imágenes propias, front y back, y se inicia un tercer contenedor con SQL Server oficial. Las migraciones pendientes se aplican automáticamente, sin borrar datos existentes.

| Servicio | Dirección |
| --- | --- |
| Aplicación | http://localhost:4200 |
| Diagnóstico visual | http://localhost:4200/estado |
| API: proceso activo | http://localhost:7071/api/health |
| API: consulta real a SQL | http://localhost:7071/api/ready |
| API mediante proxy Angular | http://localhost:4200/api/ready |
| SQL Server | localhost,1433; base `reconstruyehome`; usuario local `sa`; contraseña en `.env` |

## Primer recorrido

1. Abre la aplicación y crea una cuenta con correo y contraseña de al menos 12 caracteres.
2. En **Publicar**, selecciona solicitud u oferta, completa sus datos y acepta las recomendaciones. Puedes guardar un borrador.
3. Reanuda borradores y gestiona estados desde **Mis publicaciones**.
4. Con otra cuenta puedes declarar una contribución a una solicitud. El autor del caso confirma la recepción; esto no cierra automáticamente el caso.
5. Para habilitar WhatsApp, registra el teléfono y autoriza compartirlo en tu perfil, y habilita el contacto en la publicación. La persona interesada debe confirmar antes de obtener el enlace.

El entorno utiliza cuentas de desarrollo sin verificación de correo. No incluye publicaciones ficticias sembradas como contenido real. Soacha y Mocoa son opciones de catálogo de demostración.

## Administración local explícita

Registra primero tu propia cuenta desde la interfaz. Para concederle un rol de desarrollo:

```powershell
docker compose exec -T back npm run dev:role -- tu-correo@example.test admin
```

Recarga la página y abre **Administración**. El comando también admite `moderator`. La consola separa reportes, catálogos, cuentas y auditoría; las decisiones requieren un motivo. El registro y la edición pública del perfil no conceden privilegios.

Para retirar un rol temporal y revocar las sesiones de esa cuenta:

```powershell
docker compose exec -T back npm run dev:role -- tu-correo@example.test admin --revoke
```

Estos comandos solo funcionan en modo local. No se crean administradores automáticamente.

## Trabajo diario

```powershell
docker compose ps
docker compose logs -f front back
docker compose down
```

`down` conserva el volumen `sqlserver_data`. `down -v` borra los datos locales. Cambiar la contraseña en `.env` no cambia la contraseña de una base ya inicializada.

- Edita `apps/front/src` para recarga automática de Angular y `apps/back/src` para reinicio automático de la API.
- Los montajes de código son de solo lectura dentro del contenedor; se edita desde el host.
- Al cambiar dependencias, actualiza el lockfile y reconstruye las imágenes.
- Al cambiar configuración de Angular, TypeScript o Docker, reconstruye/reinicia el servicio correspondiente.
- Los puertos externos se configuran en `.env`; el proxy interno usa `back:3000`.
- Los puertos se publican únicamente en `127.0.0.1`.

Con Node 24 en el host puedes usar los atajos `npm run dev`, `npm run down` y `npm run logs`.

## Verificación

```powershell
docker compose exec -T back npm test
docker compose exec -T back npm run test:coverage
docker compose exec -T back npm run build
docker compose exec -T front npm run build
node scripts/smoke-test.mjs
node scripts/api-integration.mjs
```

Los dos últimos comandos requieren Node 24 en el host. La integración comprueba SQL mediante el proxy del front y crea cuentas ficticias que solicita desactivar al terminar. Por defecto omite la integración administrativa; para incluirla, configura `API_TEST_ADMIN_EMAIL` y `API_TEST_ADMIN_PASSWORD` con una cuenta local preparada explícitamente. El script no asigna privilegios.

Consulta los [resultados y límites de verificación](docs/arquitectura/verificacion-mvp-local.md).

## Desarrollo con OpenSpec

```powershell
npm ci
$env:OPENSPEC_TELEMETRY = '0'
npx openspec status --change implementar-mvp-local
npm run spec:validate
```

El cambio [implementar-mvp-local](openspec/changes/implementar-mvp-local) contiene propuesta, diseño, tareas y escenarios. `openspec/specs` contiene las ocho especificaciones principales sincronizadas. Para siguientes cambios, redacta primero la especificación, implementa una API/capacidad por vez y ejecuta sus pruebas antes de continuar.

## Documentación

- [Contratos API y ejemplos](docs/arquitectura/api-mvp-local.md)
- [Modelos, migraciones y SOLID](docs/arquitectura/modelo-y-modulos.md)
- [Requisitos y trazabilidad](docs/arquitectura/lectura-y-trazabilidad.md)
- [Frontend Angular](apps/front/README.md) y [backend](apps/back/README.md)
- [Preparación para Azure](docs/arquitectura/despliegue-azure.md)

Las migraciones `001` a `007` están versionadas en `infra/database/migrations`. Añade nuevas migraciones numeradas a partir de `008`; no modifiques las ya aplicadas. Se ejecutan en transacciones, con checksum y bloqueo de concurrencia. `DB_INITIALIZE=true` crea la base únicamente en desarrollo. No uses `sa` ni confianza de certificado local en Azure.

## Alcance pendiente antes del lanzamiento

La autenticación local está bloqueada en producción. Falta integrar verificación/recuperación de correo y resolver las políticas pendientes del SRS para evidencia, validación de aliados, exportaciones y retención/eliminación. Estas capacidades están deshabilitadas. La solicitud de desactivación revoca acceso y retira publicaciones del muro, sin inventar una política de borrado.

No se realizan pagos, logística ni envíos automáticos a WhatsApp. La información es declarada por sus autores; una constancia no certifica entrega ni idoneidad técnica. Esta implementación no aprovisiona ni publica recursos de Azure.

## Problemas de inicio

- Motor no disponible: abre Docker Desktop y espera al motor Linux.
- Puerto ocupado: cambia el puerto correspondiente en `.env` y vuelve a iniciar.
- Base no saludable: revisa los registros de `database`, memoria y contraseña.
- API no saludable: revisa `back`; un checksum distinto indica que se editó una migración aplicada.
- SQL detenido: `/api/health` sigue respondiendo; `/api/ready` devuelve 503 y `/estado` muestra el error.
