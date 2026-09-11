# Frontend

Angular 21.2.23 (LTS), CLI/build 21.2.24 y TypeScript 5.9. El contenedor usa Node 24 y expone el puerto 4200 con recarga automática.

Desde la raíz: `docker compose up --build --wait`.

El navegador consulta `/api/ready`; `proxy.conf.cjs` lo dirige a `http://back:3000` dentro de Docker. Al ejecutar Angular directamente en el host, el destino predeterminado es `http://localhost:7071`.

Para trabajar sin contenedor del front (Node 24):

```powershell
npm ci
npm start
```

El backend y SQL deben estar activos. Si cambias su puerto, define `API_PROXY_TARGET` con la URL local de la API.

`npm run build` genera `dist/front/browser`, incluyendo `config.js` y `staticwebapp.config.json`. Ese directorio es el artefacto para Azure Static Web Apps. El destino `build` del Dockerfile valida la misma compilación. El servidor `ng serve` es solo de desarrollo.

Antes de publicar, configura la URL HTTPS del backend en `public/config.js` (solo valores públicos) y autoriza el dominio de Static Web Apps en `CORS_ORIGINS` del backend.
