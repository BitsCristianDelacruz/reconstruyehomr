# Despliegue previsto en Azure

```text
Angular (apps/front)  -> Azure Static Web Apps
Azure Functions (apps/back) -> Azure Functions
Migraciones (infra/database) -> Base de datos relacional administrada
```

Cada aplicación tendrá su propia canalización de publicación. Las credenciales, cadenas de conexión y demás secretos se configurarán en Azure, nunca en archivos versionados.
