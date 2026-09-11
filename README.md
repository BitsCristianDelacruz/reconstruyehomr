# ReconstruyeHome

Entorno local con Angular 21 LTS, Node.js 24 LTS + Express 5 + TypeScript y SQL Server 2022 Developer, compatible con el destino Azure SQL Database. La pantalla inicial comprueba una consulta real a la base de datos.

## Iniciar

Requisitos: Docker Desktop iniciado con contenedores Linux y Docker Compose v2.20+ (v5 también sirve). SQL Server requiere x86-64 y al menos 2 GB para el motor; se recomiendan 6 GB de RAM disponibles para el conjunto. Node no es obligatorio si se usan los comandos Docker.

Desde la raíz, en PowerShell, **solo la primera vez**:

```powershell
Copy-Item .env.example .env
```

Ajusta la contraseña de desarrollo en `.env` y arranca:

```powershell
docker compose up --build --wait --wait-timeout 240
```

La primera ejecución descarga las imágenes e instala dependencias. Inicia automáticamente la base, aplica las migraciones y espera a que los servicios estén saludables.

| Servicio | Dirección |
| --- | --- |
| Frontend | http://localhost:4200 |
| API: proceso activo | http://localhost:7071/api/health |
| API: consulta real a SQL | http://localhost:7071/api/ready |
| API a través del frontend | http://localhost:4200/api/ready |
| SQL Server | localhost,1433; base `reconstruyehome`; usuario local `sa`; contraseña en `.env` |

Hay **dos imágenes propias**, una para front y otra para back, y un tercer contenedor con la imagen oficial de la base de datos. No es necesario crear recursos en Azure para desarrollar.

## Trabajo diario

```powershell
docker compose ps
docker compose logs -f front back
docker compose down
```

`down` conserva el volumen `sqlserver_data`. No uses `down -v` salvo que quieras borrar intencionalmente los datos locales. Cambiar la contraseña en `.env` no cambia la de una base ya inicializada: actualízala primero en SQL Server con la contraseña anterior.

- Edita `apps/front/src` para recarga automática de Angular.
- Edita `apps/back/src` para reinicio automático de la API.
- El sondeo de archivos permite detectar cambios en Windows/Docker Desktop.
- Si modificas dependencias, actualiza el lockfile y reconstruye la imagen; no se montan `node_modules` del host ni se reutilizan volúmenes de dependencias obsoletas.
- Si modificas `angular.json`, los archivos `tsconfig` o el proxy, reconstruye/reinicia el front.
- Los puertos externos se cambian en `.env`; el proxy interno continúa usando `back:3000`.
- Todas las publicaciones de puertos se limitan a `127.0.0.1`.

Con Node 24 instalado también puedes usar `npm run dev`, `npm run down`, `npm run logs` y `npm run dev:database` desde la raíz.

## Verificar

```powershell
docker compose exec -T back npm test
docker compose exec -T back npm run build
docker compose exec -T front npm run build
node scripts/smoke-test.mjs
```

La última comprobación requiere Node 24 en el host y valida HTTP, proxy, CORS y datos leídos desde SQL. En el navegador, la tarjeta debe mostrar «Conexión verificada». El botón realiza una nueva consulta, con hora devuelta por SQL.

## Estructura

- `apps/front`: Angular, Dockerfile de desarrollo y compilación estática.
- `apps/back`: API Express, Dockerfile de desarrollo y producción, pruebas.
- `infra/database/migrations`: migraciones T-SQL numeradas y versionadas.
- `scripts/smoke-test.mjs`: comprobación de comunicación local.
- `docs/arquitectura`: decisiones de stack y preparación para Azure.
- `sources/`: referencias sincronizadas de solo lectura.

## Base de datos y migraciones

El backend crea la base automáticamente **solo en desarrollo**, por medio de `DB_INITIALIZE=true`. `DB_MIGRATE=true` aplica las migraciones pendientes dentro de una transacción. `SchemaMigrations` registra nombre, checksum y fecha, y un bloqueo impide ejecuciones simultáneas.

Para ampliar el esquema, añade `002_descripcion.sql`, `003_descripcion.sql`, etc. No modifiques una migración aplicada. Los archivos son lotes T-SQL sin separadores `GO`. Luego:

```powershell
docker compose restart back
```

La primera migración crea un registro de identificación de la aplicación; no implementa todavía los módulos funcionales del producto. La cuenta `sa` y el certificado autofirmado son exclusivos del entorno local. En Azure se usarán credenciales específicas, permisos mínimos y validación de certificado.

## Problemas de inicio

- Motor no disponible: abre Docker Desktop y espera a que esté listo con el motor Linux.
- Puerto ocupado: cambia el puerto correspondiente en `.env` y vuelve a ejecutar `up`.
- Base no saludable: consulta `docker compose logs database`; comprueba memoria y complejidad de contraseña.
- API no saludable: consulta `docker compose logs back`; un checksum distinto indica una migración ya aplicada que fue editada.
- SQL detenido: `/api/health` continúa respondiendo, pero `/api/ready` devuelve 503 y la pantalla muestra el error al comprobar.

El despliegue en Azure está documentado en [despliegue-azure.md](docs/arquitectura/despliegue-azure.md); esta configuración Compose es para desarrollo local.
