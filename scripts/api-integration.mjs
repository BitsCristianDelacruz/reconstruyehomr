import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
if (existsSync('.env')) process.loadEnvFile('.env');
const base = process.env.API_TEST_URL ?? 'http://localhost:' + (process.env.FRONTEND_PORT ?? '4200') + '/api';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Estas pruebas solo permiten el entorno local');
const run = randomUUID().slice(0, 8);
const password = 'Development-test-' + randomUUID();
const cleanups = [];
let assertions = 0;
function client() {
  let cookie = '';
  return async (path, method = 'GET', body, expected = 200, extraHeaders = {}) => {
    const response = await fetch(base + path, { method, headers: {
      'Content-Type': 'application/json', 'X-Requested-With': 'ReconstruyeHome', Cookie: cookie, ...extraHeaders
    }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15000) });
    const accepted = Array.isArray(expected) ? expected.includes(response.status) : response.status === expected;
    assert.ok(accepted, method + ' ' + path + ': HTTP ' + response.status + (accepted ? '' : ' ' + await response.text()));
    assertions++;
    const session = response.headers.get('set-cookie'); if (session) cookie = session.split(';')[0];
    return response.status === 204 ? undefined : response.json();
  };
}
async function account(kind, roles) {
  const request = client(), email = 'integration-' + kind + '-' + run + '@example.test';
  await request('/auth/register', 'POST', { email, password, name: 'Prueba local ' + kind, territory: 'soacha', roles, privacyConsent: true }, 201);
  await request('/auth/login', 'POST', { email, password });
  cleanups.push(async () => {
    await request('/auth/login', 'POST', { email, password });
    await request('/me/deactivation', 'POST', { confirmed: true });
    await request('/me', 'GET', undefined, 401);
  });
  return { request, email };
}
try {
  const { request: owner, email: ownerEmail } = await account('owner', ['affected']);
  const { request: donor, email: donorEmail } = await account('donor', ['donor']);
  const anonymous = client();
  const catalogs = await anonymous('/catalogs'); assert.ok(catalogs.entries.length >= 20);
  const profile = await owner('/me'); assert.equal(profile.email, ownerEmail); assert.equal(profile.passwordHash, undefined);
  const ownerProfile = { name: 'Prueba de integración', territory: 'soacha', roles: ['affected'], phone: '+573000000000', contactConsent: true };
  await owner('/me', 'PATCH', ownerProfile);
  const needInput = { title: 'Prueba de cubierta ' + run, description: 'Materiales ficticios para comprobar el flujo local.', category: 'materials', territory: 'soacha', zone: 'Zona de demostración', urgency: 'high', damage: 'Cubierta de prueba', contactEnabled: true, safetyAccepted: true };
  await owner('/needs', 'POST', { ...needInput, exactAddress: 'Campo prohibido' }, 400);
  const draft = await owner('/needs', 'POST', {}, 201);
  await owner('/publications/' + draft.id, 'PATCH', { ...needInput, version: 1 });
  const need = await owner('/publications/' + draft.id + '/transitions/publish', 'POST', { version: 2 });
  assert.equal(need.state, 'published');
  await owner('/publications/' + need.id, 'PATCH', { title: 'Cambio obsoleto', version: 1 }, 409);
  await donor('/publications/' + need.id, 'PATCH', { title: 'Cambio ajeno', version: 3 }, 404);
  assert.ok((await owner('/me/publications')).items.some(p => p.id === need.id));
  const offer = await owner('/offers', 'POST', { title: 'Puertas de prueba ' + run, description: 'Oferta ficticia para pruebas.', category: 'home', territory: 'mocoa', zone: 'Centro de prueba', availability: 'Con cita', conditions: 'Coordinar recogida', safetyAccepted: true, state: 'published' }, 201);
  const detail = await anonymous('/publications/' + need.id.toUpperCase());
  assert.equal(detail.id, need.id);
  for (const key of ['authorId', 'email', 'phone', 'passwordHash', 'safetyAccepted']) assert.equal(detail[key], undefined);
  assert.ok((await anonymous('/publications?kind=offer&territory=mocoa')).items.some(p => p.id === offer.id));
  await owner('/publications/' + offer.id + '/transitions/close', 'POST', { version: 1, confirmed: true });
  await donor('/publications/' + need.id + '/contact', 'POST', { confirmed: false }, 400);
  const contact = await donor('/publications/' + need.id + '/contact', 'POST', { confirmed: true });
  assert.equal(new URL(contact.url).hostname, 'wa.me');
  await owner('/me', 'PATCH', { ...ownerProfile, contactConsent: false });
  await donor('/publications/' + need.id + '/contact', 'POST', { confirmed: true }, 404);
  assert.equal((await anonymous('/publications/' + need.id)).contactAvailable, false);
  await owner('/me', 'PATCH', ownerProfile);
  await donor('/publications/' + offer.id + '/contact', 'POST', { confirmed: true }, 404);

  const path = '/publications/' + need.id + '/contributions';
  const input = { type: 'materials', note: 'Nota privada de prueba' };
  const headers = { 'Idempotency-Key': 'integration-' + run };
  // Two real SQL transactions race; the unique actor/key constraint must produce one row and one initial event.
  const [contribution, simultaneous] = await Promise.all([
    donor(path, 'POST', input, [200, 201], headers),
    donor(path, 'POST', input, [200, 201], headers)
  ]);
  assert.equal(contribution.id, simultaneous.id);
  assert.equal((await donor('/contributions/' + contribution.id)).history.length, 1);
  await donor(path, 'POST', { ...input, note: 'Contenido diferente' }, 409, headers);
  await donor('/contributions/' + contribution.id + '/transitions/receive', 'POST', { version: 1, confirmed: true }, 403);
  await donor('/contributions/' + contribution.id + '/transitions/coordinate', 'POST', { version: 1 });
  await owner('/contributions/' + contribution.id + '/transitions/receive', 'POST', { version: 2, confirmed: true });
  assert.equal((await anonymous('/publications/' + need.id)).state, 'published');
  assert.equal((await owner('/contributions/' + contribution.id)).history.length, 3);
  assert.equal((await anonymous(path)).items[0].note, undefined);
  const timeline = (await anonymous('/publications/' + need.id)).timeline;
  assert.equal(timeline.filter(e => e.contributionId === contribution.id).length, 3);
  for (const event of timeline) for (const key of ['note', 'actorId', 'contributorId', 'phone']) assert.equal(event[key], undefined);
  const report = await donor('/reports', 'POST', { targetType: 'publication', targetId: need.id, category: 'privacy', detail: 'Prueba de moderación', confirmed: true }, 201);
  await anonymous('/publications/' + need.id);
  await donor('/moderation/reports', 'GET', undefined, 403);

  // Full admin integration uses an explicitly prepared account; this script never grants roles.
  const adminEmail = process.env.API_TEST_ADMIN_EMAIL;
  const adminPassword = process.env.API_TEST_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const admin = client();
    await admin('/auth/login', 'POST', { email: adminEmail, password: adminPassword });
    const adminProfile = await admin('/me');
    assert.ok(adminProfile.roles.includes('admin'), 'La cuenta de pruebas debe tener admin');
    await admin('/admin/accounts/' + adminProfile.id.toUpperCase(), 'PUT', { state: 'disabled', roles: ['admin'], reason: 'Autodesactivación administrativa prohibida' }, 400);
    await admin('/moderation/reports/' + report.id + '/decisions', 'POST', { version: 1, decision: 'hide', reason: 'Ocultamiento de integración' });
    await anonymous('/publications/' + need.id, 'GET', undefined, 404);
    await owner('/publications/' + need.id + '/contact', 'POST', { confirmed: true }, 404);
    await owner('/publications/' + need.id, 'PATCH', { title: 'Edición restringida', version: 4 }, 403);
    await admin('/moderation/reports/' + report.id + '/decisions', 'POST', { version: 1, decision: 'restore', reason: 'Versión obsoleta de reporte' }, 409);
    await admin('/moderation/reports/' + report.id + '/decisions', 'POST', { version: 2, decision: 'restore', reason: 'Restauración de integración' });
    await anonymous('/publications/' + need.id);
    const contributionReport = await donor('/reports', 'POST', { targetType: 'contribution', targetId: contribution.id, category: 'privacy', confirmed: true }, 201);
    await admin('/moderation/reports/' + contributionReport.id + '/decisions', 'POST', { version: 1, decision: 'hide', reason: 'Restringir aporte de prueba' });
    assert.equal((await anonymous(path)).items.length, 0);
    await donor(path, 'POST', input, 404, headers);
    assert.equal((await anonymous('/publications/' + need.id)).timeline.filter(e => e.contributionId === contribution.id).length, 0);
    await admin('/moderation/reports/' + contributionReport.id + '/decisions', 'POST', { version: 2, decision: 'restore', reason: 'Restaurar aporte de prueba' });
    const profileReport = await donor('/reports', 'POST', { targetType: 'profile', targetId: need.id, category: 'fraud', confirmed: true }, 201);
    await admin('/moderation/reports/' + profileReport.id + '/decisions', 'POST', { version: 1, decision: 'hide', reason: 'Desactivar responsable de prueba' });
    await owner('/me', 'GET', undefined, 401);
    await anonymous('/publications/' + need.id, 'GET', undefined, 404);
    await admin('/moderation/reports/' + profileReport.id + '/decisions', 'POST', { version: 2, decision: 'restore', reason: 'Restaurar responsable de prueba' });
    await owner('/auth/login', 'POST', { email: ownerEmail, password });
    const code = 'test-' + run;
    await admin('/admin/catalogs/territory/' + code, 'PUT', { label: 'Territorio de prueba ' + run, active: true, position: 999, reason: 'Comprobar referencia histórica' });
    const historic = await owner('/needs', 'POST', { ...needInput, territory: code, state: 'published' }, 201);
    await admin('/admin/catalogs/territory/' + code, 'PUT', { label: 'Territorio de prueba ' + run, active: false, position: 999, reason: 'Retirar sin perder el historial' });
    assert.ok((await admin('/admin/catalogs')).entries.some(e => e.code === code));
    assert.ok(!(await anonymous('/catalogs')).entries.some(e => e.code === code));
    assert.equal((await anonymous('/publications/' + historic.id)).territoryLabel, 'Territorio de prueba ' + run);
    const donorAccount = (await admin('/admin/accounts?q=' + encodeURIComponent(donorEmail))).items[0];
    await admin('/admin/accounts/' + donorAccount.id, 'PUT', { state: 'disabled', roles: ['donor'], reason: 'Prueba de desactivación administrativa' });
    await donor('/me', 'GET', undefined, 401);
    await admin('/admin/accounts/' + donorAccount.id, 'PUT', { state: 'active', roles: ['donor'], reason: 'Restauración de cuenta de prueba' });
    await donor('/auth/login', 'POST', { email: donorEmail, password });
    assert.ok((await admin('/admin/audit')).items.some(e => e.action === 'moderation.hide' && e.targetId.toLowerCase() === need.id));
    await admin('/auth/logout', 'POST', {}, 204);
    console.log('Integración administrativa completa: permisos, catálogos, perfiles, moderación de casos/aportes y auditoría correctos.');
  } else {
    console.log('Integración administrativa omitida: configura API_TEST_ADMIN_EMAIL y API_TEST_ADMIN_PASSWORD para incluirla. Las pruebas unitarias sí cubren estas APIs.');
  }
  console.log('Integración SQL + proxy Angular: flujos principales, concurrencia, privacidad e historial correctos (' + assertions + ' respuestas verificadas).');
} finally {
  for (const cleanup of cleanups.reverse()) {
    try { await cleanup(); } catch (error) { console.error('No se pudo desactivar una cuenta ficticia de esta ejecución:', error.message); process.exitCode = 1; }
  }
}

