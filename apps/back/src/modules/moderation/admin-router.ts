import { Router } from 'express';
import { z } from 'zod';
import { actor } from '../accounts/router.js';
import { idSchema } from '../publications/router.js';
import { catalogGroups } from '../catalogs/catalogs.js';
import { publicRoles } from '../../shared/ports.js';
import type { AdminService } from './admin-service.js';
export function adminRouter(service:AdminService){
  const router=Router();
  router.get('/admin/catalogs',async(_req,res)=>res.json(await service.catalogList(actor(res))));
  router.put('/admin/catalogs/:group/:code',async(req,res)=>{
    const group=z.enum(catalogGroups).parse(req.params.group),code=z.string().regex(/^[a-z][a-z0-9_-]{0,63}$/).parse(req.params.code);
    const {reason,...input}=z.object({label:z.string().trim().min(2).max(1000),active:z.boolean(),position:z.number().int().min(0).max(10000),reason:z.string().trim().min(5).max(1000)}).strict().parse(req.body);
    res.json(await service.saveCatalog(actor(res),{group,code,...input},reason));
  });
  router.get('/admin/accounts',async(req,res)=>{
    const query=z.object({q:z.string().trim().max(100).default('')}).strict().parse(req.query);
    res.json(await service.accounts(actor(res),query.q));
  });
  router.put('/admin/accounts/:id',async(req,res)=>{
    const input=z.object({state:z.enum(['active','disabled']),roles:z.array(z.enum([...publicRoles,'moderator','admin'])).min(1).max(6),reason:z.string().trim().min(5).max(1000)}).strict().parse(req.body);
    res.json(await service.updateAccount(actor(res),idSchema.parse(req.params.id),input.state,input.roles,input.reason));
  });
  router.get('/admin/audit',async(req,res)=>{
    const query=z.object({page:z.coerce.number().int().min(1).max(10000).default(1)}).strict().parse(req.query);
    res.json(await service.audit(actor(res),query.page));
  });return router;
}
