import { requireThat } from '../../shared/errors.js';
import type { Actor } from '../../shared/ports.js';
import type { CatalogEntry,CatalogRepository } from '../catalogs/catalogs.js';
import { features } from '../catalogs/catalogs.js';
import { administrator } from './service.js';
export interface ManagedAccount {id:string;email:string;name:string;state:string;roles:string[]}
export interface AuditEntry {id:string;actorId:string;action:string;targetId:string;reason:string|null;createdAt:Date}
export interface AdminRepository {
  saveCatalog(actorId:string,entry:CatalogEntry,reason:string):Promise<void>;
  accounts(query:string):Promise<ManagedAccount[]>;
  updateAccount(actorId:string,id:string,state:'active'|'disabled',roles:string[],reason:string):Promise<boolean>;
  audit(page:number):Promise<AuditEntry[]>;
}
export class AdminService {
  constructor(private readonly repo:AdminRepository,private readonly catalogs:CatalogRepository){}
  async catalogList(actor:Actor){administrator(actor);return {entries:await this.catalogs.list(),features};}
  async saveCatalog(actor:Actor,entry:CatalogEntry,reason:string){
    administrator(actor);requireThat(reason.trim().length>=5,400,'Escribe el motivo de la modificación');
    if(['needState','offerState'].includes(entry.group))requireThat(['draft','published','paused','closed'].includes(entry.code),400,'El motor no admite ese estado');
    if(entry.group==='safety')requireThat(entry.active,400,'Los mensajes de seguridad deben permanecer activos');
    await this.repo.saveCatalog(actor.id,entry,reason);return entry;
  }
  async accounts(actor:Actor,query:string){administrator(actor);return {items:await this.repo.accounts(query),limit:100};}
  async updateAccount(actor:Actor,id:string,state:'active'|'disabled',roles:string[],reason:string){
    administrator(actor);requireThat(actor.id!==id,400,'Usa tu perfil para gestionar tu propia cuenta');
    requireThat(reason.trim().length>=5,400,'Escribe el motivo de la modificación');
    requireThat(await this.repo.updateAccount(actor.id,id,state,[...new Set(roles)],reason),409,'Cuenta inexistente o con solicitud de desactivación pendiente');
    return {id,state,roles:[...new Set(roles)]};
  }
  async audit(actor:Actor,page:number){administrator(actor);return {items:await this.repo.audit(page),page,limit:50};}
}
