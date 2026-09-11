# Verificación local

Ejecutada el 11 de septiembre de 2026 en Windows, Docker Desktop con motor Linux y Docker Compose v5.3.0.

## Resultado

- Las imágenes de desarrollo de front y back se construyeron con sus lockfiles.
- Los servicios `front`, `back` y `database` quedaron en estado `healthy`.
- `node scripts/smoke-test.mjs` comprobó frontend, API directa, proxy `/api`, CORS y lectura real de SQL.
- Las cuatro pruebas de la API pasaron tanto en el host como dentro del contenedor.
- Compilaron TypeScript del backend y Angular en modo producción.
- Se construyeron las etapas `production` del backend y `build` del frontend.
- El navegador mostró «Conexión verificada» y el botón obtuvo una nueva hora desde SQL.
- Al detener SQL, la API devolvió 503 en `/api/ready`, mantuvo 200 en `/api/health` y el frontend mostró el error.
- Al recrear el contenedor de SQL conservando el volumen, el backend se reconectó sin reiniciarlo. La fecha inicial persistida siguió siendo `2026-09-11T21:23:13.835Z`.
- Al actualizar las fechas de modificación de archivos del host, Angular recompiló y nodemon reinició la API. Las migraciones no volvieron a insertar el registro.
- No se modificó material bajo `sources/`.

## Incidencia del equipo resuelta

Docker Desktop no podía iniciar por sockets temporales inaccesibles: `dockerInference` y `engine.sock`. Se detuvo el arranque fallido y se renombraron sus carpetas temporales como respaldo. No se eliminaron imágenes, volúmenes, discos virtuales ni configuraciones del usuario.

Respaldos conservados en este equipo:

- `C:\Users\Byter\AppData\Local\Docker\run-backup-reconstruyehome-20260911`
- `C:\Users\Byter\AppData\Local\Docker\run-backup-reconstruyehome-20260911-2`
- `C:\Users\Byter\AppData\Local\docker-secrets-engine-backup-reconstruyehome-20260911`

Docker regeneró los directorios temporales y el motor arrancó. El entorno del proyecto quedó accesible en http://localhost:4200 y http://localhost:7071/api/ready.

Esta verificación cubre desarrollo local; no prueba despliegue, elegibilidad de tarifas ni configuración de una suscripción Azure.
