import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');
const front = 'http://localhost:' + (process.env.FRONTEND_PORT || 4200);
const back = 'http://localhost:' + (process.env.BACKEND_PORT || 7071);

async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 200, url + ': HTTP ' + response.status);
  return response;
}
const html = await (await get(front)).text();
assert.match(html, /<app-root>/);
const direct = await (await get(back + '/api/ready')).json();
const proxied = await (await get(front + '/api/ready')).json();
assert.equal(direct.service, 'reconstruyehome-api');
assert.equal(proxied.status, 'ok');
assert.equal(proxied.database.status, 'connected');
assert.equal(proxied.database.name, process.env.DATABASE_NAME || 'reconstruyehome');
assert.equal(proxied.application.name, 'ReconstruyeHome');
assert.equal(proxied.application.initializedAt, direct.application.initializedAt);
assert.ok(Number.isFinite(Date.parse(proxied.database.time)));
const cors = await fetch(back + '/api/health', { headers: { Origin: front }, signal: AbortSignal.timeout(15000) });
assert.equal(cors.headers.get('access-control-allow-origin'), front);
console.log('OK: Angular sirve la página; el proxy llega al backend; SQL responde con datos persistidos; CORS permite el frontend.');
console.log(JSON.stringify(proxied, null, 2));
