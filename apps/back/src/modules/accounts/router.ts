import { Router, type RequestHandler, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { AppError } from '../../shared/errors.js';
import { publicRoles, type Actor } from '../../shared/ports.js';
import { ownProfile } from './model.js';
import type { AccountService } from './service.js';
export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80), territory: z.string().min(1).max(64),
  roles: z.array(z.enum(publicRoles)).min(1).max(4),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/).nullable().default(null), contactConsent: z.boolean().default(false)
}).strict();
const loginSchema = z.object({email:z.email().trim().toLowerCase().max(254),password:z.string().min(1).max(128)}).strict();
const registrationSchema = profileSchema.extend({email:loginSchema.shape.email,password:z.string().min(12).max(128),privacyConsent:z.literal(true)}).strict();
export const confirmedSchema = z.object({confirmed:z.literal(true)}).strict();
export function actor(res: Response): Actor {
  if (!res.locals.account) throw new AppError(401,'Inicia sesión para continuar');
  return res.locals.account;
}
export function cookieToken(cookie: string | undefined) {
  return cookie?.split(';').map(item=>item.trim()).find(item=>item.startsWith('rh_session='))?.slice(11);
}
export function sessionMiddleware(service: AccountService): RequestHandler {
  return async (req,res,next) => { res.locals.account = await service.authenticate(cookieToken(req.headers.cookie)); next(); };
}
export function accountRouter(service: AccountService, secureCookie = false) {
  const router = Router();
  const limited = rateLimit({windowMs:15*60*1000,limit:40,standardHeaders:'draft-8',legacyHeaders:false,
    message:{message:'Demasiados intentos. Espera unos minutos.'}});
  const cookieOptions = {httpOnly:true,secure:secureCookie,sameSite:'lax' as const,path:'/api',maxAge:12*60*60*1000};
  router.post('/auth/register',limited,async(req,res)=>res.status(201).json(await service.register(registrationSchema.parse(req.body))));
  router.post('/auth/login',limited,async(req,res)=>{
    const input=loginSchema.parse(req.body); const result=await service.login(input.email,input.password);
    res.cookie('rh_session',result.token,cookieOptions).json(result.profile);
  });
  router.post('/auth/logout',async(req,res)=>{
    await service.logout(cookieToken(req.headers.cookie)); res.clearCookie('rh_session',{...cookieOptions,maxAge:undefined}).status(204).end();
  });
  router.get('/me',(_req,res)=>{actor(res);res.json(ownProfile(res.locals.account));});
  router.patch('/me',async(req,res)=>res.json(await service.update(actor(res).id,profileSchema.parse(req.body))));
  router.post('/me/deactivation',async(req,res)=>{
    const result=await service.deactivate(actor(res).id,confirmedSchema.parse(req.body).confirmed);
    res.clearCookie('rh_session',{...cookieOptions,maxAge:undefined}).json(result);
  });
  return router;
}
