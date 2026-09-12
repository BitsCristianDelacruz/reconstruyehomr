import express, { type ErrorRequestHandler, type Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ZodError } from 'zod';
import { AppError } from './shared/errors.js';

export interface DatabaseStatus {
  name: string; createdAt: Date; databaseName: string; databaseTime: Date;
}

export function createApp(readStatus: () => Promise<DatabaseStatus>, allowedOrigins: string[] = [], api?: Router) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: allowedOrigins, credentials: true }));
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
  if (api) app.use('/api', (req, _res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      (req.get('X-Requested-With') !== 'ReconstruyeHome' || (req.get('Origin') && !allowedOrigins.includes(req.get('Origin')!)))) {
      next(new AppError(403, 'Origen de la operación no permitido')); return;
    }
    next();
  }, api);
  app.use((_req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));
  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ZodError) {
      res.status(400).json({ message: 'Revisa los campos indicados', fields: error.flatten().fieldErrors }); return;
    }
    if (error instanceof AppError) { res.status(error.status).json({ message: error.message, fields: error.fields }); return; }
    const status = error?.type === 'entity.parse.failed' ? 400 : 500;
    res.status(status).json({ message: status === 400 ? 'JSON inválido' : 'Error interno del servidor' });
  };
  app.use(errorHandler);
  return app;
}
