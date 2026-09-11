import { createApp } from './app.js';
import { connectDatabase, migrate, readStatus } from './database.js';

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT inválido');

async function start() {
  const pool = await connectDatabase();
  try {
    if (process.env.DB_MIGRATE === 'true') await migrate(pool);
    const origins = (process.env.CORS_ORIGINS ?? '').split(',').map(value => value.trim()).filter(Boolean);
    const server = createApp(() => readStatus(pool), origins).listen(port, '0.0.0.0', () => {
      console.log('ReconstruyeHome API escuchando en el puerto ' + port);
    });
    const shutdown = () => {
      server.close(() => void pool.close().then(() => process.exit(0)));
      setTimeout(() => process.exit(1), 10000).unref();
    };
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
  } catch (error) { await pool.close(); throw error; }
}

start().catch(error => {
  console.error('No se pudo iniciar el backend:', error instanceof Error ? error.message : 'Error desconocido');
  process.exit(1);
});
