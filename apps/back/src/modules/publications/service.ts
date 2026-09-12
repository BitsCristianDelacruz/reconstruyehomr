import { AppError, requireThat } from '../../shared/errors.js';
import type { Actor, Runtime } from '../../shared/ports.js';
import type { CatalogService } from '../catalogs/catalogs.js';
import { isPublic, ownedPublication, publicPublication, type Publication, type PublicationFilter, type PublicationInput, type PublicationKind, type PublicationRepository, type PublicationState } from './model.js';
const defaults: PublicationInput={title:'',description:'',category:'',territory:'',zone:'',urgency:null,damage:'',availability:'',conditions:'',contactEnabled:false,safetyAccepted:false};
export class PublicationService {
  constructor(private readonly repo:PublicationRepository,private readonly catalogs:Pick<CatalogService,'isActive'>,private readonly runtime:Runtime){}
  private async validate(p:PublicationInput,kind:PublicationKind,publishing:boolean) {
    const fields: Record<string,string[]>={};
    for(const field of ['category','territory'] as const) {
      if((publishing||p[field])&&!await this.catalogs.isActive(field,p[field])) fields[field]=['Selecciona una opción disponible'];
    }
    if(kind==='need'&&(publishing||p.urgency)&&!await this.catalogs.isActive('urgency',p.urgency??''))fields.urgency=['Selecciona la urgencia'];
    if(publishing) {
      for(const field of ['title','description','zone',...(kind==='need'?['damage']:['availability','conditions'])] as (keyof PublicationInput)[])
        if(!p[field] || String(p[field]).trim().length<2)fields[field]=['Completa este campo'];
      if(!p.safetyAccepted)fields.safetyAccepted=['Acepta las pautas de seguridad y ausencia de garantías'];
    }
    if(Object.keys(fields).length)throw new AppError(400,'Revisa los campos indicados',fields);
    requireThat(kind==='need'||(!p.damage&&!p.urgency),400,'Una oferta no incluye daño ni urgencia');
    requireThat(kind==='offer'||(!p.availability&&!p.conditions),400,'Una solicitud no incluye disponibilidad ni condiciones de oferta');
  }
  async create(kind:PublicationKind,actor:Actor,input:Partial<PublicationInput>,state:'draft'|'published'='draft') {
    const values={...defaults,...input};
    await this.validate(values,kind,state==='published');
    requireThat(await this.catalogs.isActive(kind+'State',state),400,'Estado no disponible');
    const now=this.runtime.now();
    const p:Publication={...values,id:this.runtime.id(),authorId:actor.id,kind,state,hidden:false,version:1,createdAt:now,updatedAt:now,authorActive:true};
    await this.repo.create(p);return ownedPublication(p);
  }
  async owned(actor:Actor,id:string) {
    const p=await this.repo.find(id);requireThat(p&&p.authorId===actor.id,404,'Publicación no encontrada');
    return p;
  }
  async edit(actor:Actor,id:string,version:number,input:Partial<PublicationInput>) {
    const p=await this.owned(actor,id);
    requireThat(!p.hidden,403,'La publicación está restringida por moderación');
    requireThat(p.state!=='closed',409,'Reabre la publicación antes de editarla');
    const next={...p,...input,version:p.version+1,updatedAt:this.runtime.now()};
    await this.validate(next,p.kind,p.state==='published');
    requireThat(p.version===version&&await this.repo.update(next,version,'publication.edited'),409,'La publicación cambió. Recarga antes de guardar');
    return ownedPublication(next);
  }
  async transition(actor:Actor,id:string,version:number,action:'publish'|'pause'|'close'|'reopen',confirmed:boolean) {
    const p=await this.owned(actor,id);
    requireThat(!p.hidden,403,'La publicación está restringida por moderación');
    const transitions:Record<typeof action,{from:PublicationState[];to:PublicationState}>={
      publish:{from:['draft'],to:'published'},pause:{from:['published'],to:'paused'},
      close:{from:['published','paused'],to:'closed'},reopen:{from:['closed','paused'],to:'published'}};
    const transition=transitions[action];
    requireThat(transition.from.includes(p.state),409,'Cambio de estado no permitido');
    requireThat(action!=='close'||confirmed,400,'Confirma el cierre de la publicación');
    requireThat(await this.catalogs.isActive(p.kind+'State',transition.to),400,'Estado no disponible');
    if(transition.to==='published')await this.validate(p,p.kind,true);
    const next={...p,state:transition.to,version:p.version+1,updatedAt:this.runtime.now()};
    requireThat(p.version===version&&await this.repo.update(next,version,'publication.'+action),409,'La publicación cambió. Recarga antes de guardar');
    return ownedPublication(next);
  }
  async detail(id:string,actor?:Actor) {
    const p=await this.repo.find(id);requireThat(p&&isPublic(p),404,'Publicación no encontrada');
    const timeline=(await this.repo.timeline(id)).map(event=>({action:event.action,state:event.state,createdAt:event.createdAt,contributionId:event.contributionId,contributionType:event.contributionType}));
    return {...publicPublication(p),isOwner:actor?.id===p.authorId,timeline};
  }
  async mine(actor:Actor) {return (await this.repo.mine(actor.id)).map(ownedPublication);}
  async wall(filter:PublicationFilter) {
    const result=await this.repo.wall(filter);
    return {items:result.items.filter(isPublic).map(publicPublication),total:result.total,page:filter.page,limit:filter.limit};
  }
}
export class NeedService {
  constructor(private readonly publications:PublicationService){}
  create(actor:Actor,input:Partial<PublicationInput>,state:'draft'|'published'){return this.publications.create('need',actor,input,state);}
}
export class OfferService {
  constructor(private readonly publications:PublicationService){}
  create(actor:Actor,input:Partial<PublicationInput>,state:'draft'|'published'){return this.publications.create('offer',actor,input,state);}
}
