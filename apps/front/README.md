# Frontend

Angular 21.2.23 LTS, CLI/build 21.2.24 y TypeScript 5.9, ejecutado sobre Node 24. Componentes standalone y rutas lazy por capacidad.

Desde la raíz: `docker compose up --build --wait --wait-timeout 240`. Abre http://localhost:4200.

| Ruta | Función |
| --- | --- |
| / | Muro con filtros y paginación |
| /cuenta | Registro, acceso, perfil, consentimiento y desactivación |
| /publicar | Solicitud/oferta en tres pasos y borradores |
| /editar/:id | Continuar o editar una publicación propia |
| /publicacion/:id | Detalle, contacto, contribuciones, cronología y reporte |
| /mis-publicaciones | Publicaciones y contribuciones propias |
| /seguridad | Recomendaciones y capacidades pendientes |
| /administracion | Reportes; catálogos, cuentas y auditoría según permisos |
| /estado | Diagnóstico de comunicación con API y SQL |

`core` contiene modelos y servicios HTTP tipados, estado de sesión y guards. `features` organiza las pantallas; `shared` contiene diálogo, etiquetas de estados y mensajes de error. Los guards orientan la navegación; el backend vuelve a comprobar todos los permisos.

El diseño sigue el SRS y el mockup: navegación Muro/Publicar/Mis publicaciones/Seguridad, verde bosque, fondos claros y tipografía equivalente Georgia/sistema. Los formularios conservan sus datos ante fallos, muestran errores junto al campo y las acciones sensibles requieren confirmación.

Las llamadas usan credenciales, cabecera de protección, timeout y errores comunes. `proxy.conf.cjs` dirige `/api` a `http://back:3000` en Docker; al ejecutar Angular en el host usa `http://localhost:7071`.

Para desarrollar sin contenedor del front (Node 24), ejecuta `npm ci` y `npm start` en esta carpeta, con backend/SQL activos. `API_PROXY_TARGET` permite cambiar el destino.

`npm run build` genera `dist/front/browser`, incluido `config.js` y el fallback de `staticwebapp.config.json`. Este es el artefacto para Azure Static Web Apps. `ng serve` y su proxy son exclusivos de desarrollo.

El despliegue público requiere la integración de autenticación descrita en [preparación Azure](../../docs/arquitectura/despliegue-azure.md). La URL pública del backend se configura en `public/config.js`; ese archivo nunca contiene secretos. Consulta las [verificaciones de navegador realizadas](../../docs/arquitectura/verificacion-mvp-local.md).
