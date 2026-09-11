import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';

export interface DatabaseStatus {
  name: string; createdAt: Date; databaseName: string; databaseTime: Date;
}

export function createApp(readStatus: () => Promise<DatabaseStatus>, allowedOrigins: string[] = []) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json({ limit: '100kb' }));
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'reconstruyehome-api' });
  });
  app.get('/api/ready', async (_req, res) => {
    try {
      const info = await readStatus();
      res.json({
        status: 'ok', service: 'reconstruyehome-api',
        database: { status: 'connected', name: info.databaseName, time: info.databaseTime },
        application: { name: info.name, initializedAt: info.createdAt }
      });
    } catch {
      res.status(503).json({ status: 'unavailable', message: 'La base de datos no está disponible' });
    }
  });
  app.use((_req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));
  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    const status = error?.type === 'entity.parse.failed' ? 400 : 500;
    res.status(status).json({ message: status === 400 ? 'JSON inválido' : 'Error interno del servidor' });
  };
  app.use(errorHandler);
  return app;
}
