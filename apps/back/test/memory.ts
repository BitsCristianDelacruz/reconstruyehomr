import type { Publication, PublicationEvent, PublicationFilter, PublicationRepository } from '../src/modules/publications/model.js';
import { isPublic } from '../src/modules/publications/model.js';
export class MemoryPublications implements PublicationRepository {
  items:Publication[]=[];events=new Map<string,PublicationEvent[]>();
  async create(p:Publication){this.items.push(structuredClone(p));this.events.set(p.id,[{action:'publication.created',state:p.state,createdAt:p.createdAt}]);}
  async find(id:string){const p=this.items.find(p=>p.id===id);return p?structuredClone(p):undefined;}
  async update(p:Publication,version:number,action:string){
    const index=this.items.findIndex(old=>old.id===p.id&&old.version===version&&!old.hidden);
    if(index<0)return false;this.items[index]=structuredClone(p);
    this.events.get(p.id)!.push({action,state:p.state,createdAt:p.updatedAt});return true;
  }
  async wall(filter:PublicationFilter){
    const items=this.items.filter(p=>isPublic(p)&&p.state===filter.state&&(['kind','category','territory','urgency'] as const).every(k=>!filter[k]||p[k]===filter[k]));
    return {items:items.slice((filter.page-1)*filter.limit,filter.page*filter.limit),total:items.length};
  }
  async mine(id:string){return this.items.filter(p=>p.authorId===id);}
  async timeline(id:string){return this.events.get(id)??[];}
}
export const activeCatalogs={isActive:async(group:string,code:string)=>['materials','home','labor','technical','soacha','mocoa','low','medium','high','draft','published','paused','closed','privacy','fraud','money','safety'].includes(code)};
export const needInput={title:'Tejas para una cubierta',description:'Necesitamos materiales para reparar la cubierta.',category:'materials',territory:'soacha',zone:'Zona urbana',urgency:'high',damage:'Daño en la cubierta',contactEnabled:true,safetyAccepted:true};
