import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { once } from 'node:events';
import { createApp } from '../src/app.js';
import { databaseConfig } from '../src/config.js';

let databaseAvailable = true;
const server = createApp(async () => {
  if (!databaseAvailable) throw new Error('Internal credentials must never appear in the HTTP response');
  return { name: 'ReconstruyeHome', databaseName: 'test', createdAt: new Date(0), databaseTime: new Date(0) };
}, ['http://localhost:4200']).listen(0, '127.0.0.1');
await once(server, 'listening');
const address = server.address();
if (!address || typeof address === 'string') throw new Error('No test port');
const base = 'http://127.0.0.1:' + address.port;
after(() => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())));

test('readiness reflects SQL availability; liveness survives an outage', async () => {
  const ready = await fetch(base + '/api/ready');
  assert.equal(ready.status, 200);
  assert.equal((await ready.json()).database.status, 'connected');
  databaseAvailable = false;
  try {
    const unavailable = await fetch(base + '/api/ready');
    assert.equal(unavailable.status, 503);
    assert.deepEqual(await unavailable.json(), { status: 'unavailable', message: 'La base de datos no está disponible' });
    assert.equal((await fetch(base + '/api/health')).status, 200);
  } finally { databaseAvailable = true; }
});

test('CORS allows the configured frontend only', async () => {
  const allowed = await fetch(base + '/api/health', { headers: { Origin: 'http://localhost:4200' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:4200');
  const blocked = await fetch(base + '/api/health', { headers: { Origin: 'https://untrusted.example' } });
  assert.equal(blocked.headers.get('access-control-allow-origin'), null);
});

test('unknown routes return JSON 404', async () => {
  const response = await fetch(base + '/api/missing');
  assert.equal(response.status, 404);
  assert.match(response.headers.get('content-type')!, /application\/json/);
});

test('database configuration validates identifiers and defaults to TLS', () => {
  const env = { DB_HOST: 'localhost', DB_NAME: 'test', DB_USER: 'test', DB_PASSWORD: 'test' };
  assert.equal(databaseConfig(env).options?.encrypt, true);
  assert.equal(databaseConfig(env).options?.trustServerCertificate, false);
  assert.throws(() => databaseConfig({ ...env, DB_NAME: 'bad]; DROP DATABASE test' }));
  assert.throws(() => databaseConfig({ ...env, NODE_ENV: 'production', DB_INITIALIZE: 'true' }));
});
