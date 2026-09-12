# Verificación del MVP local

Validación realizada en el entorno Docker local del proyecto durante la sesión de desarrollo del 11 de septiembre de 2026. Las pruebas usan datos ficticios, sin mensajes externos ni recursos Azure.

## Pruebas de API

13 pruebas automatizadas pasan: disponibilidad/configuración/CORS, catálogos, cuentas, criptografía y bloqueo de producción, solicitudes, ofertas/muro, contacto, contribuciones, moderación y administración. Cada prueba funcional recorre varios endpoints y comprueba entradas, permisos, respuestas y cambios de estado.

Comandos reproducibles desde la raíz:

```powershell
docker compose exec -T back npm test
docker compose exec -T back npm run test:coverage
docker compose exec -T back npm run build
docker compose exec -T front npm run build
node scripts/smoke-test.mjs
node scripts/api-integration.mjs
```

Cobertura observada de los módulos cargados por las pruebas unitarias: **99,68 % líneas, 95,98 % ramas, 100 % funciones**. Esta cifra no representa todo el backend: SQL, servidor/composición y migraciones se cubren por ejecución e integración, no por ese porcentaje.

Regresiones verificadas: impedir autoasignación de privilegios, edición ajena, versiones antiguas, publicación incompleta, acceso a contenido oculto, notas/identidades en cronología pública, repetición de contribuciones ocultas y cierre automático del caso al recibir un aporte.

## SQL y comunicación entre contenedores

- Migraciones 001–007 aplicadas sobre SQL Server real sin borrar el volumen existente.
- Frontend, backend y base saludables.
- Compilación TypeScript y compilación de producción Angular satisfactorias.
- Smoke HTTP: HTML Angular, disponibilidad directa y mediante proxy, CORS y datos de SQL.
- Integración principal: **39 respuestas HTTP verificadas**, incluyendo dos creaciones concurrentes con misma clave, un solo aporte/evento inicial y rechazo de contenido diferente.
- Integración completa, con cuenta administrativa autorizada expresamente: **74 respuestas HTTP verificadas**, incluyendo ocultar/restaurar publicación, aporte y perfil; conflicto de decisión; revocación de sesión; catálogo inactivo con referencia histórica; administración y auditoría.

La integración principal se repitió después de reforzar la actualización de roles públicos y la proyección de cronología. El script crea cuentas .test y solicita su desactivación en finally. La integración administrativa es opcional mediante `API_TEST_ADMIN_EMAIL`/`API_TEST_ADMIN_PASSWORD`; el script no concede privilegios. El permiso administrativo temporal usado en esta sesión fue retirado y sus sesiones revocadas.

## Navegador

Comprobaciones realizadas contra Angular y las APIs reales:

- Registro e inicio de sesión con dos cuentas separadas.
- Mensajes de campos obligatorios, formulario en tres pasos, borrador, recuperación desde Mis publicaciones y persistencia después de recargar.
- Publicación de solicitud, navegación al detalle y datos reales del muro.
- Publicación de oferta con disponibilidad y condiciones; tipo fijo después de guardar el borrador y detalle persistido.
- Contacto con consentimiento requerido; enlace preparado sin abrir ni enviar un mensaje a WhatsApp.
- Contribución declarada, coordinación y recepción por el autor; el caso permanece publicado.
- Reporte manual; consola administrativa; ocultar y restaurar con motivo; detalle inaccesible mientras permanece oculto.
- Auditoría con los motivos de ambas decisiones, alta de catálogo inactivo y búsqueda de cuenta.
- Vista móvil de 390 × 844, sin desbordamiento horizontal observado; navegación y diálogo.
- Teclado Tab/Espacio/Escape: consentimiento, cierre del diálogo y devolución del foco.

La compilación Angular valida plantillas y tipos. La revisión de teclado y móvil es funcional y acotada; no equivale a una auditoría WCAG completa, pruebas de carga ni una batería automatizada de componentes Angular.

## Límites y siguientes condiciones

No se ha desplegado en Azure ni probado equivalencia completa de SQL Server con Azure SQL. La imagen backend de producción sigue bloqueada por la autenticación local hasta integrar verificación de correo.

Evidencias/archivos, aliados y exportaciones están deshabilitados por políticas del SRS pendientes; no se han simulado como funciones terminadas. Retención/eliminación, territorios piloto, operación y SLA requieren decisiones antes del lanzamiento. La recuperación de contraseña y entrega real de correos aún no están implementadas.
