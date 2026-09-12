import { requireThat } from '../../shared/errors.js';
import { hasRole,type Actor,type Runtime } from '../../shared/ports.js';
import type { CatalogService } from '../catalogs/catalogs.js';
import type { Decision,Report,ReportInput,ReportRepository } from './model.js';
export function moderator(actor:Actor){requireThat(hasRole(actor,'moderator','admin'),403,'Se requiere permiso de moderación');}
export function administrator(actor:Actor){requireThat(hasRole(actor,'admin'),403,'Se requiere permiso de administración');}
function reportView(r:Report){return {id:r.id,targetType:r.targetType,targetId:r.targetId,publicationId:r.publicationId,contributionId:r.contributionId,
  category:r.category,detail:r.detail,status:r.status,version:r.version,createdAt:r.createdAt,summary:r.summary,content:r.content};}
export class ModerationService {
  constructor(private readonly repo:ReportRepository,private readonly catalogs:Pick<CatalogService,'isActive'>,private readonly runtime:Runtime){}
  async report(actor:Actor,input:ReportInput,confirmed:boolean){
    requireThat(confirmed,400,'Confirma el envío del reporte');
    requireThat(await this.catalogs.isActive('reportCategory',input.category),400,'Categoría de reporte no disponible');
    const target=await this.repo.resolve(input.targetType,input.targetId);requireThat(target,404,'Contenido no encontrado');
    const report:Report={...input,...target,id:this.runtime.id(),reporterId:actor.id,status:'pending',version:1,createdAt:this.runtime.now()};
    await this.repo.create(report);return {id:report.id,status:report.status,message:'Reporte recibido para revisión manual. No implica ocultamiento automático.'};
  }
  async list(actor:Actor,page:number){moderator(actor);return {items:(await this.repo.list(page)).map(reportView),page,limit:30};}
  async decide(actor:Actor,id:string,version:number,decision:Decision,reason:string){
    moderator(actor);requireThat(reason.trim().length>=5,400,'Registra un motivo claro para la decisión');
    const report=await this.repo.find(id);requireThat(report,404,'Reporte no encontrado');
    if(report.targetType==='profile'&&['hide','restore'].includes(decision))administrator(actor);
    requireThat(!(report.targetType==='profile'&&report.accountId===actor.id&&decision==='hide'),400,'No puedes desactivar tu propia cuenta desde moderación');
    requireThat(report.version===version&&await this.repo.decide(actor,report,version,decision,reason),409,'El reporte cambió o la cuenta no admite esta acción. Actualiza la lista');
    return {id,status:decision==='escalate'?'escalated':'resolved',version:version+1};
  }
}
