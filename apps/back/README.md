# Backend

API REST con Node.js 24, Express 5, TypeScript y el controlador `mssql`. Reemplaza la plantilla vacía de Azure Functions.

Desde la raíz: `docker compose up --build --wait`.

| Endpoint | Comportamiento |
| --- | --- |
| GET /api/health | 200 si el proceso está activo |
| GET /api/ready | 200 con datos consultados en SQL; 503 si falla la consulta |

La respuesta de disponibilidad lee `dbo.ApplicationInfo`; incluye la fecha persistida de inicialización y la hora actual del motor SQL. Las rutas desconocidas devuelven JSON 404. Los errores HTTP no incluyen credenciales ni detalles internos de SQL.

## Variables

| Variable | Uso |
| --- | --- |
| PORT | Puerto interno; 3000 por defecto |
| DB_HOST, DB_NAME, DB_USER, DB_PASSWORD | Conexión, obligatorios |
| DB_PORT | Puerto SQL; 1433 por defecto |
| DB_ENCRYPT | TLS habilitado salvo valor `false` |
| DB_TRUST_SERVER_CERTIFICATE | `true` solo para certificado local autofirmado; por defecto `false` |
| DB_INITIALIZE | `true` crea la base local; prohibido con NODE_ENV=production |
| DB_MIGRATE | `true` ejecuta migraciones al arrancar; por defecto deshabilitado |
| MIGRATIONS_DIR | En Docker: /workspace/migrations |
| CORS_ORIGINS | Orígenes exactos separados por comas |

`npm run dev` recarga el código. `npm run build` compila a `dist`; `npm start` ejecuta la compilación. `npm test` comprueba disponibilidad, errores, CORS y validación de configuración.

El destino `production` del Dockerfile incluye solo dependencias de ejecución, código compilado y migraciones; corre como usuario no privilegiado. Antes de iniciar producción, ejecuta `npm run migrate` como paso separado de despliegue con una cuenta autorizada para DDL. La cuenta de la API no necesita permisos para crear bases ni modificar el esquema.
