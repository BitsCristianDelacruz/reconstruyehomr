# ReconstruyeHome

Monorepositorio para la plataforma ReconstruyeHome. Contiene el frontend Angular, la API basada en Azure Functions, documentación funcional y la infraestructura de desarrollo local.

## Estructura

- `apps/front`: futura aplicación Angular, desplegable en Azure Static Web Apps.
- `apps/back`: futura API de Azure Functions.
- `docs`: visión de producto, requisitos, arquitectura y mockups de referencia.
- `infra/database`: migraciones y datos de prueba para el motor relacional local.

Los directorios bajo `sources/` son material sincronizado de referencia y no se modifican.

## Desarrollo local

1. Copia `.env.example` como `.env` y reemplaza la contraseña local.
2. Para iniciar solo la base de datos local, ejecuta `npm run dev:database`.
3. Cuando se hayan inicializado las aplicaciones Angular y Azure Functions, inicia el conjunto con `npm run dev`.
4. Para detener los contenedores, ejecuta `npm run down`.

La base local usa PostgreSQL exclusivamente para desarrollo. El proveedor relacional administrado para producción se decidirá antes del primer despliegue; las migraciones de `infra/database/migrations` mantendrán el esquema versionado.

## Próxima etapa

Inicializar el proyecto Angular dentro de `apps/front` y la aplicación de Azure Functions con Node/TypeScript dentro de `apps/back`. Los Dockerfiles y la composición local ya están preparados para recibir esas estructuras generadas por sus herramientas oficiales.
