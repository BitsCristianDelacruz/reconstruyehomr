import { Router } from 'express';
import type { CatalogService } from './catalogs.js';
export function catalogRouter(service: CatalogService) {
  const router = Router();
  router.get('/catalogs', async (_req, res) => res.json(await service.all()));
  return router;
}
