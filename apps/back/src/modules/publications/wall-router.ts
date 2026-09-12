import { Router } from 'express';
import { z } from 'zod';
import { actor } from '../accounts/router.js';
import { OfferService, type PublicationService } from './service.js';
import { createPublicationSchema, idSchema } from './router.js';
const filterSchema=z.object({
  kind:z.enum(['need','offer']).optional(),category:z.string().max(64).optional(),territory:z.string().max(64).optional(),
  urgency:z.string().max(64).optional(),state:z.enum(['published','closed']).default('published'),
  page:z.coerce.number().int().min(1).max(10000).default(1),limit:z.coerce.number().int().min(1).max(50).default(12)
}).strict();
export function wallRouter(service:PublicationService){
  const router=Router();const offers=new OfferService(service);
  router.post('/offers',async(req,res)=>{const {state,...input}=createPublicationSchema.parse(req.body);res.status(201).json(await offers.create(actor(res),input,state));});
  router.get('/publications',async(req,res)=>res.json(await service.wall(filterSchema.parse(req.query))));
  router.get('/publications/:id',async(req,res)=>res.json(await service.detail(idSchema.parse(req.params.id),res.locals.account)));
  return router;
}
