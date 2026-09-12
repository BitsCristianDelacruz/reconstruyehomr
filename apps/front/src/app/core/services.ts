import { Injectable,inject,signal } from '@angular/core';
import { ApiClient,UiError } from './api';
import type { Catalogs,CatalogEntry,Profile,ProfileInput,Publication,PublicationInput,Wall,Contribution,Report,ManagedAccount,AuditEntry,Ready } from './models';
@Injectable({providedIn:'root'})
export class CatalogService {
  private readonly api=inject(ApiClient);readonly data=signal<Catalogs|null>(null);
  async load(){const data=await this.api.request<Catalogs>('GET','/catalogs');this.data.set(data);return data;}
  entries(group:string){return this.data()?.entries.filter(e=>e.group===group)??[];}
  label(group:string,code:string|null|undefined){return this.entries(group).find(e=>e.code===code)?.label??code??'';}
}
@Injectable({providedIn:'root'})
export class AuthStore {
  private readonly api=inject(ApiClient);readonly profile=signal<Profile|null>(null);readonly ready=this.refresh();
  async refresh(){try{this.profile.set(await this.api.request<Profile>('GET','/me'));}catch(error){if(!(error instanceof UiError)||error.status!==401)throw error;this.profile.set(null);}}
  async login(email:string,password:string){const profile=await this.api.request<Profile>('POST','/auth/login',{email,password});this.profile.set(profile);}
  register(input:ProfileInput&{email:string;password:string;privacyConsent:boolean}){return this.api.request<Profile>('POST','/auth/register',input);}
  async logout(){await this.api.request<void>('POST','/auth/logout',{});this.profile.set(null);}
  async update(input:ProfileInput){this.profile.set(await this.api.request<Profile>('PATCH','/me',input));}
  async deactivate(){await this.api.request('POST','/me/deactivation',{confirmed:true});this.profile.set(null);}
  hasRole(...roles:string[]){return this.profile()?.roles.some(role=>roles.includes(role))??false;}
}
@Injectable({providedIn:'root'})
export class PublicationService {
  private readonly api=inject(ApiClient);
  wall(filter:Record<string,string|number>){return this.api.request<Wall>('GET','/publications?'+new URLSearchParams(Object.entries(filter).filter(([,v])=>v!=='').map(([k,v])=>[k,String(v)])));}
  detail(id:string){return this.api.request<Publication>('GET','/publications/'+id);}
  own(id:string){return this.api.request<Publication>('GET','/me/publications/'+id);}
  mine(){return this.api.request<{items:Publication[]}>('GET','/me/publications');}
  create(kind:'need'|'offer',input:Partial<PublicationInput>,state:'draft'|'published'){return this.api.request<Publication>('POST',kind==='need'?'/needs':'/offers',{...input,state});}
  edit(id:string,version:number,input:Partial<PublicationInput>){return this.api.request<Publication>('PATCH','/publications/'+id,{...input,version});}
  transition(p:Publication,action:string){return this.api.request<Publication>('POST','/publications/'+p.id+'/transitions/'+action,{version:p.version,confirmed:true});}
  contact(id:string){return this.api.request<{url:string;message:string}>('POST','/publications/'+id+'/contact',{confirmed:true});}
}
@Injectable({providedIn:'root'})
export class ContributionService {
  private readonly api=inject(ApiClient);
  list(id:string){return this.api.request<{items:Contribution[]}>('GET','/publications/'+id+'/contributions');}
  mine(){return this.api.request<{items:Contribution[]}>('GET','/me/contributions');}
  detail(id:string){return this.api.request<Contribution>('GET','/contributions/'+id);}
  create(id:string,type:string,note:string,key:string){return this.api.request<Contribution>('POST','/publications/'+id+'/contributions',{type,note},{'Idempotency-Key':key});}
  transition(c:Contribution,action:string){return this.api.request<Contribution>('POST','/contributions/'+c.id+'/transitions/'+action,{version:c.version,confirmed:true});}
}
@Injectable({providedIn:'root'})
export class ModerationService {
  private readonly api=inject(ApiClient);
  report(targetType:string,targetId:string,category:string,detail:string){return this.api.request<{id:string;message:string}>('POST','/reports',{targetType,targetId,category,detail,confirmed:true});}
  list(page:number){return this.api.request<{items:Report[]}>('GET','/moderation/reports?page='+page);}
  decide(report:Report,decision:string,reason:string){return this.api.request('POST','/moderation/reports/'+report.id+'/decisions',{version:report.version,decision,reason});}
}
@Injectable({providedIn:'root'})
export class AdminService {
  private readonly api=inject(ApiClient);
  catalogs(){return this.api.request<Catalogs>('GET','/admin/catalogs');}
  saveCatalog(entry:CatalogEntry,reason:string){return this.api.request('PUT','/admin/catalogs/'+entry.group+'/'+entry.code,{label:entry.label,active:entry.active,position:entry.position,reason});}
  accounts(query:string){return this.api.request<{items:ManagedAccount[]}>('GET','/admin/accounts?q='+encodeURIComponent(query));}
  updateAccount(account:ManagedAccount,reason:string){return this.api.request('PUT','/admin/accounts/'+account.id,{state:account.state,roles:account.roles,reason});}
  audit(page:number){return this.api.request<{items:AuditEntry[]}>('GET','/admin/audit?page='+page);}
  ready(){return this.api.request<Ready>('GET','/ready');}
}

