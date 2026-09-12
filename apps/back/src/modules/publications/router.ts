import { Router } from 'express';
import { z } from 'zod';
import { actor } from '../accounts/router.js';
import { NeedService, type PublicationService } from './service.js';
export const idSchema=z.uuid().transform(id=>id.toLowerCase());
const fields=z.object({
  title:z.string().trim().max(120),description:z.string().trim().max(3000),category:z.string().max(64),territory:z.string().max(64),
  zone:z.string().trim().max(120),urgency:z.string().max(64).nullable(),damage:z.string().trim().max(500),
  availability:z.string().trim().max(500),conditions:z.string().trim().max(1000),contactEnabled:z.boolean(),safetyAccepted:z.boolean()
}).strict();
export const createPublicationSchema=fields.partial().extend({state:z.enum(['draft','published']).default('draft')}).strict();
const editSchema=fields.partial().extend({version:z.number().int().positive()}).strict();
const transitionSchema=z.object({version:z.number().int().positive(),confirmed:z.boolean().default(false)}).strict();
export function publicationRouter(service:PublicationService){
  const router=Router();const needs=new NeedService(service);
  router.post('/needs',async(req,res)=>{const {state,...input}=createPublicationSchema.parse(req.body);res.status(201).json(await needs.create(actor(res),input,state));});
  router.patch('/publications/:id',async(req,res)=>{const {version,...input}=editSchema.parse(req.body);res.json(await service.edit(actor(res),idSchema.parse(req.params.id),version,input));});
  router.post('/publications/:id/transitions/:action',async(req,res)=>{
    const input=transitionSchema.parse(req.body);const action=z.enum(['publish','pause','close','reopen']).parse(req.params.action);
    res.json(await service.transition(actor(res),idSchema.parse(req.params.id),input.version,action,input.confirmed));
  });
  router.get('/me/publications',async(_req,res)=>res.json({items:await service.mine(actor(res))}));
  router.get('/me/publications/:id',async(req,res)=>{const {ownedPublication}=await import('./model.js');res.json(ownedPublication(await service.owned(actor(res),idSchema.parse(req.params.id))));});
  return router;
}
