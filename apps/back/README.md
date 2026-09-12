# Backend

API REST con Node.js 24, Express 5, TypeScript y `mssql`. Desde la raíz: `docker compose up --build --wait --wait-timeout 240`.

Los módulos de catálogos, cuentas, publicaciones, contacto, contribuciones y moderación separan routers HTTP, servicios de negocio y repositorios. `src/composition.ts` inyecta dependencias; las reglas de negocio se prueban con adaptadores en memoria. SQL aplica las mismas interfaces con transacciones.

Consulta los [contratos API](../../docs/arquitectura/api-mvp-local.md), [modelos/SOLID](../../docs/arquitectura/modelo-y-modulos.md) y [pruebas](../../docs/arquitectura/verificacion-mvp-local.md).

## Variables

| Variable | Uso |
| --- | --- |
| PORT | Puerto interno; 3000 por defecto |
| DB_HOST, DB_NAME, DB_USER, DB_PASSWORD | Conexión obligatoria |
| DB_PORT | 1433 por defecto |
| DB_ENCRYPT | TLS habilitado salvo valor `false` |
| DB_TRUST_SERVER_CERTIFICATE | `true` solo para certificado local autofirmado |
| DB_INITIALIZE | Crea la base local; prohibido en producción |
| DB_MIGRATE | Aplica migraciones al arrancar |
| MIGRATIONS_DIR | En Docker: /workspace/migrations |
| CORS_ORIGINS | Orígenes exactos separados por comas |
| AUTH_MODE | Debe ser `local` en este MVP |
| COOKIE_SECURE | `true` para cookie exclusivamente HTTPS; `false` en Compose local |
| NODE_ENV | `development` local; el modo de autenticación actual rechaza `production` |

Todas las escrituras API requieren `X-Requested-With: ReconstruyeHome`. Si hay `Origin`, debe estar autorizado. La sesión usa cookie HttpOnly, SameSite=Lax y caduca a las 12 horas. Las contraseñas se derivan con scrypt; solo se guarda el hash de los tokens opacos.

## Comandos en apps/back

- `npm run dev`: recarga del servidor.
- `npm run build`: compilación TypeScript.
- `npm test`: pruebas de negocio y contratos HTTP de cada API.
- `npm run test:coverage`: cobertura de módulos ejecutados por esas pruebas.
- `npm run dev:role -- correo@example.test admin`: asignación explícita local.
- `npm run dev:role -- correo@example.test admin --revoke`: retirada y revocación de sesiones.

En Docker, usa los comandos desde la raíz como `docker compose exec -T back npm test`. Los resultados de cobertura unitaria no incluyen los adaptadores SQL, que se verifican mediante integración real.

El destino `production` del Dockerfile contiene dependencias de ejecución, compilación y migraciones, y usa usuario no privilegiado. Su construcción no habilita un lanzamiento público: primero debe implementarse autenticación con verificación de correo. Las migraciones de producción se ejecutarán por separado con una cuenta DDL y `npm run migrate`; la API usará permisos mínimos.
