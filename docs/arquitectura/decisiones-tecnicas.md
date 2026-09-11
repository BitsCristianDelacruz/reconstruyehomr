# Decisiones técnicas

Actualizadas el 11 de septiembre de 2026.

| Área | Decisión |
| --- | --- |
| Frontend | Angular 21.2.23, última rama en fase LTS; CLI 21.2.24 |
| Hosting del frontend | Azure Static Web Apps |
| Backend | Node.js 24 LTS + Express 5 + TypeScript |
| Base de datos objetivo | Azure SQL Database, oferta gratuita serverless para el arranque del MVP |
| Base de datos local | SQL Server 2022 Developer en Docker |
| Desarrollo | Dos Dockerfiles propios y Compose con tres servicios |
| Esquema | Migraciones T-SQL transaccionales, numeradas y con checksum |

## Versiones

Angular 22 está en soporte activo; Angular 21 es la rama LTS más reciente. La rama 21 admite Node 24 y TypeScript 5.9. Se fijaron versiones exactas de Angular y lockfiles de npm para ambas aplicaciones. [Política oficial de Angular](https://angular.dev/reference/releases), [compatibilidad](https://angular.dev/reference/versions), [versiones de Node](https://nodejs.org/en/about/previous-releases).

## Elección relacional y costo

Para una etapa inicial de uso pequeño e intermitente, se elige Azure SQL Database por su oferta gratuita mensual: 100.000 vCore-segundos, 32 GB de datos y 32 GB de respaldos por base, durante la vida de la suscripción elegible. Permite pausar al consumir la cuota para evitar cargos adicionales. No se han aprovisionado recursos ni verificado la elegibilidad de esta cuenta. [Oferta oficial](https://learn.microsoft.com/en-us/azure/azure-sql/database/free-offer?view=azuresql).

Las ofertas gratuitas documentadas de PostgreSQL y MySQL Flexible Server para nuevas cuentas duran 12 meses. Fuera de las cuotas gratuitas, el costo depende de región, horas activas, memoria, almacenamiento y carga; no hay una opción universalmente más barata. Antes de producción hay que comparar ese uso real en la calculadora de Azure. [PostgreSQL](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/how-to-deploy-on-azure-free-account), [MySQL](https://learn.microsoft.com/en-us/azure/mysql/flexible-server/overview).

SQL Server Developer permite trabajar localmente con el dialecto T-SQL y el controlador usados en Azure SQL, sin contratar servicios para desarrollo. No es un emulador idéntico de Azure ni una licencia de producción. Requiere x86-64. [Contenedor oficial](https://learn.microsoft.com/en-us/sql/linux/quickstart-install-connect-docker?view=sql-server-ver16).

## Backend

Express simplifica la API REST y su ejecución local en un contenedor convencional. Sustituye la plantilla de Azure Functions porque todavía no existía implementación y el usuario autorizó elegir framework. El backend se podrá alojar como contenedor en Azure Container Apps; esa elección de hosting y su costo deberán confirmarse al desplegar.

No se necesitan Azurite ni PostgreSQL para este entorno. Los volúmenes anteriores, si existieran en el equipo, no se eliminan automáticamente.
