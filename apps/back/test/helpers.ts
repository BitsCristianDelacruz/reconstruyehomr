import { once } from 'node:events';
import type { Router } from 'express';
import { createApp } from '../src/app.js';
export async function serve(router: Router) {
  const server = createApp(async () => ({ name: 'test', databaseName: 'test', createdAt: new Date(0), databaseTime: new Date(0) }),
    ['http://localhost:4200'], router).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No test port');
  const base = 'http://127.0.0.1:' + address.port + '/api';
  return { base, close: () => new Promise<void>(resolve => server.close(() => resolve())) };
}
