import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CatalogService } from '../src/modules/catalogs/catalogs.js';
import { catalogRouter } from '../src/modules/catalogs/router.js';
import { serve } from './helpers.js';
test('GET catalogs excludes inactive entries and keeps conditional capabilities disabled', async () => {
  const service = new CatalogService({ list: async () => [
    { group: 'category', code: 'materials', label: 'Materiales', active: true, position: 1 },
    { group: 'category', code: 'retired', label: 'Antigua', active: false, position: 2 }
  ] });
  const http = await serve(catalogRouter(service));
  try {
    const response = await fetch(http.base + '/catalogs');
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body.entries.map((e: {code:string}) => e.code), ['materials']);
    assert.ok(Object.values(body.features).every(value => value === false));
    assert.equal((await service.all(true)).entries.length, 2);
    assert.equal(await service.isActive('category', 'retired'), false);
  } finally { await http.close(); }
});
