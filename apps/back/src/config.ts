import type { config as SqlConfig } from 'mssql';

export function databaseConfig(env = process.env): SqlConfig {
  for (const key of ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']) {
    if (!env[key]) throw new Error('Falta la variable ' + key);
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_]{0,127}$/.test(env.DB_NAME!)) {
    throw new Error('DB_NAME debe empezar con una letra y contener solo letras, números o guiones bajos');
  }
  const port = Number(env.DB_PORT ?? 1433);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('DB_PORT inválido');
  if (env.NODE_ENV === 'production' && env.DB_INITIALIZE === 'true') {
    throw new Error('DB_INITIALIZE solo se permite para desarrollo local');
  }
  return {
    server: env.DB_HOST!, database: env.DB_NAME!,
    user: env.DB_USER!, password: env.DB_PASSWORD!, port,
    connectionTimeout: 10000, requestTimeout: 5000,
    pool: { min: 0, max: 5, idleTimeoutMillis: 30000 },
    options: {
      encrypt: env.DB_ENCRYPT !== 'false',
      trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE === 'true',
      enableArithAbort: true
    }
  };
}
