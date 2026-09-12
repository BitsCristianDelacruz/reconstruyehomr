import { Router } from 'express';
import { z } from 'zod';
import { actor } from '../accounts/router.js';
import { idSchema } from '../publications/router.js';
import type { ContributionService } from './service.js';
const inputSchema=z.object({type:z.string().min(1).max(64),note:z.string().trim().max(1000).default('')}).strict();
const keySchema=z.string().regex(/^[a-zA-Z0-9_-]{8,80}$/);
export function contributionRouter(service:ContributionService){
  const router=Router();
  router.post('/publications/:id/contributions',async(req,res)=>{
    const input=inputSchema.parse(req.body),key=keySchema.parse(req.get('Idempotency-Key'));
    const result=await service.create(actor(res),idSchema.parse(req.params.id),input.type,input.note,key);
    res.status(result.replayed?200:201).json(result.value);
  });
  router.get('/publications/:id/contributions',async(req,res)=>res.json(await service.list(idSchema.parse(req.params.id),res.locals.account)));
  router.get('/me/contributions',async(_req,res)=>res.json(await service.mine(actor(res))));
  router.get('/contributions/:id',async(req,res)=>res.json(await service.detail(idSchema.parse(req.params.id),actor(res))));
  router.post('/contributions/:id/transitions/:action',async(req,res)=>{
    const input=z.object({version:z.number().int().positive(),confirmed:z.boolean().default(false)}).strict().parse(req.body);
    const action=z.enum(['coordinate','cancel','receive','dispute']).parse(req.params.action);
    res.json(await service.transition(actor(res),idSchema.parse(req.params.id),input.version,action,input.confirmed));
  });return router;
}
