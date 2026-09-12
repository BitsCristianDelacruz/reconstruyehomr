import { Router } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { actor } from '../accounts/router.js';
import { idSchema } from '../publications/router.js';
import type { ModerationService } from './service.js';
export function moderationRouter(service:ModerationService){
  const router=Router();
  const limited=rateLimit({windowMs:60*60*1000,limit:60,standardHeaders:'draft-8',legacyHeaders:false,message:{message:'Has enviado varios reportes. Intenta más tarde.'}});
  router.post('/reports',limited,async(req,res)=>{
    const {confirmed,...input}=z.object({targetType:z.enum(['publication','profile','contribution']),targetId:idSchema,category:z.string().min(1).max(64),detail:z.string().trim().max(1000).default(''),confirmed:z.literal(true)}).strict().parse(req.body);
    res.status(201).json(await service.report(actor(res),input,confirmed));
  });
  router.get('/moderation/reports',async(req,res)=>{
    const query=z.object({page:z.coerce.number().int().min(1).max(10000).default(1)}).strict().parse(req.query);
    res.json(await service.list(actor(res),query.page));
  });
  router.post('/moderation/reports/:id/decisions',async(req,res)=>{
    const input=z.object({version:z.number().int().positive(),decision:z.enum(['hide','restore','dismiss','escalate']),reason:z.string().trim().min(5).max(1000)}).strict().parse(req.body);
    res.json(await service.decide(actor(res),idSchema.parse(req.params.id),input.version,input.decision,input.reason));
  });return router;
}
