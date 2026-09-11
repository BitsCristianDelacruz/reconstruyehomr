# Backend

Este directorio se reserva para la API de ReconstruyeHome, implementada como Azure Functions con Node/TypeScript.

La aplicación deberá usar `DATABASE_URL` para conectarse a la base de datos local mediante Docker y deberá excluir `local.settings.json` del control de versiones. El contenedor incluye el runtime de Azure Functions y se expone localmente a través del puerto `7071` configurado en `docker-compose.yml`.
