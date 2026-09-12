import { Router } from 'express';
import { actor, confirmedSchema } from '../accounts/router.js';
import { idSchema } from '../publications/router.js';
import type { ContactService } from './service.js';
export function contactRouter(service:ContactService){
  const router=Router();
  router.post('/publications/:id/contact',async(req,res)=>res.json(await service.request(actor(res),idSchema.parse(req.params.id),confirmedSchema.parse(req.body).confirmed)));
  return router;
}
