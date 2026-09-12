# Preparación para Azure

Este trabajo configura y valida el entorno local. No crea ni publica recursos de Azure.

El MVP funcional ya compila como artefacto estático, pero la autenticación actual exige modo local y rechaza producción. Antes del lanzamiento se debe integrar verificación de correo, recuperación y proveedor definitivo, y resolver las políticas pendientes del SRS. Configurar una URL de backend por sí solo no habilita autenticación pública.

```text
Angular -> Azure Static Web Apps
        -> API Express HTTPS (por ejemplo, Azure Container Apps)
        -> Azure SQL Database
```

## Frontend

- App location: `apps/front`.
- Comando: `npm ci && npm run build`, con Node 24.
- Output location relativa al front: `dist/front/browser`.
- No configures `api_location` apuntando a Express: no es una aplicación de Azure Functions.
- Antes del build, establece en `public/config.js` la URL HTTPS pública del backend, terminada en `/api`.
- Se incluye `staticwebapp.config.json` con fallback de navegación y exclusión de rutas API.

El proxy de Angular existe solo en desarrollo; Static Web Apps no interpreta `proxy.conf.cjs`. Por eso la configuración de la URL pública es obligatoria al usar un backend separado. [Configuración de Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/configuration).

La cookie de desarrollo es SameSite=Lax. Para dominios separados se debe diseñar y probar la integración de sesión con el proveedor definitivo, HTTPS, Secure, protección de solicitudes y, cuando corresponda, SameSite=None. Ese soporte no está implementado como configuración de producción en este MVP. También puede evaluarse un acceso al API bajo el mismo sitio.

## Backend y base

Construir desde la raíz:

```powershell
docker build -f apps/back/Dockerfile --target production -t reconstruyehome-back:production .
```

El contenedor escucha en 3000. Configura `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` mediante secretos de Azure; `DB_ENCRYPT=true`, `DB_TRUST_SERVER_CERTIFICATE=false`, `DB_INITIALIZE=false` y `DB_MIGRATE=false`. En `CORS_ORIGINS`, añade el origen HTTPS exacto de Static Web Apps.

Crea previamente Azure SQL y aplica las migraciones como paso separado mediante `npm run migrate` dentro de la imagen, usando una cuenta con permisos DDL. Después inicia la API con una cuenta restringida al acceso que necesiten sus endpoints. No uses `sa` en Azure.

La oferta gratuita de Azure SQL permite pausar al alcanzar el límite mensual. Verifica esa opción, región y elegibilidad antes de aprovisionar. La cuenta, la infraestructura y la publicación se configurarán en la etapa de despliegue.
