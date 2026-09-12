import { requireThat } from '../../shared/errors.js';
import type { Actor,Runtime } from '../../shared/ports.js';
import type { CatalogService } from '../catalogs/catalogs.js';
import { isPublic,type Publication,type PublicationRepository } from '../publications/model.js';
import type { Contribution,ContributionRepository,ContributionState } from './model.js';
export class ContributionService {
  constructor(private readonly repo:ContributionRepository,private readonly publications:Pick<PublicationRepository,'find'>,
    private readonly catalogs:Pick<CatalogService,'isActive'>,private readonly runtime:Runtime,private readonly digest:(value:string)=>string){}
  private async publication(id:string){const p=await this.publications.find(id);requireThat(p&&isPublic(p),404,'Publicación no encontrada');return p;}
  private view(c:Contribution,p:Publication,actor?:Actor){
    const isContributor=actor?.id===c.contributorId,isOwner=actor?.id===p.authorId;
    return {id:c.id,publicationId:c.publicationId,type:c.type,state:c.state,version:c.version,createdAt:c.createdAt,updatedAt:c.updatedAt,
      isContributor,isOwner,...(isContributor||isOwner?{note:c.note}:{})};
  }
  async create(actor:Actor,publicationId:string,type:string,note:string,key:string){
    const fingerprint=this.digest(JSON.stringify({publicationId,type,note}));
    const previous=await this.repo.findByKey(actor.id,key);
    if(previous){
      requireThat(!previous.hidden,404,'Contribución no encontrada');
      requireThat(previous.fingerprint===fingerprint,409,'La clave de reintento ya corresponde a otra contribución');
      const p=await this.publication(publicationId);return {value:this.view(previous,p,actor),replayed:true};
    }
    const p=await this.publication(publicationId);
    requireThat(p.kind==='need'&&p.state==='published',409,'Solo puedes contribuir a una solicitud abierta');
    requireThat(p.authorId!==actor.id,400,'El autor de la solicitud no puede registrarse como aportante de su propio caso');
    requireThat(await this.catalogs.isActive('category',type),400,'Tipo de contribución no disponible');
    const now=this.runtime.now();
    const c:Contribution={id:this.runtime.id(),publicationId,contributorId:actor.id,type,note,state:'declared',version:1,idempotencyKey:key,fingerprint,createdAt:now,updatedAt:now};
    const result=await this.repo.create(c);
    requireThat(!result.value.hidden,404,'Contribución no encontrada');
    requireThat(result.value.fingerprint===fingerprint,409,'La clave de reintento ya corresponde a otra contribución');
    return {value:this.view(result.value,p,actor),replayed:result.replayed};
  }
  async transition(actor:Actor,id:string,version:number,action:'coordinate'|'cancel'|'receive'|'dispute',confirmed:boolean){
    const c=await this.repo.find(id);requireThat(c&&!c.hidden,404,'Contribución no encontrada');
    const p=await this.publication(c.publicationId);
    requireThat(actor.id===c.contributorId||actor.id===p.authorId,403,'No puedes modificar esta contribución');
    const transitions:Record<typeof action,{from:ContributionState[];to:ContributionState}>={
      coordinate:{from:['declared'],to:'coordinated'},cancel:{from:['declared','coordinated'],to:'cancelled'},
      receive:{from:['declared','coordinated'],to:'received'},dispute:{from:['declared','coordinated','received'],to:'reported'}};
    requireThat(!['receive','dispute'].includes(action)||actor.id===p.authorId,403,'Solo el autor del caso puede confirmar o disputar la recepción');
    requireThat(!['receive','dispute','cancel'].includes(action)||confirmed,400,'Confirma esta acción');
    requireThat(transitions[action].from.includes(c.state),409,'Cambio de estado no permitido');
    const updated={...c,state:transitions[action].to,version:c.version+1,updatedAt:this.runtime.now()};
    requireThat(c.version===version&&await this.repo.update(updated,version,actor.id,'contribution.'+action),409,'La contribución cambió. Recarga antes de continuar');
    return this.view(updated,p,actor);
  }
  async list(publicationId:string,actor?:Actor){
    const p=await this.publication(publicationId);
    return {items:(await this.repo.list(publicationId)).filter(c=>!c.hidden).map(c=>this.view(c,p,actor))};
  }
  async mine(actor:Actor){
    const items=[];
    for(const c of await this.repo.mine(actor.id)){
      const p=await this.publications.find(c.publicationId);
      if(p&&isPublic(p)&&!c.hidden)items.push({...this.view(c,p,actor),publicationTitle:p.title});
    }
    return {items};
  }
  async detail(id:string,actor:Actor){
    const c=await this.repo.find(id);requireThat(c&&!c.hidden,404,'Contribución no encontrada');
    const p=await this.publication(c.publicationId);
    requireThat(c.contributorId===actor.id||p.authorId===actor.id,403,'Historial disponible solo para participantes');
    return {...this.view(c,p,actor),history:await this.repo.history(id)};
  }
}
