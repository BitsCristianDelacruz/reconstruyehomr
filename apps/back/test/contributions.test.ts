import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Router } from 'express';
import { ContributionService } from '../src/modules/contributions/service.js';
import { contributionRouter } from '../src/modules/contributions/router.js';
import type { Contribution,ContributionEvent,ContributionRepository } from '../src/modules/contributions/model.js';
import { PublicationService } from '../src/modules/publications/service.js';
import { secureTokens } from '../src/modules/accounts/crypto.js';
import { runtime } from '../src/shared/ports.js';
import { serve } from './helpers.js';
import { MemoryPublications,activeCatalogs,needInput } from './memory.js';
class MemoryContributions implements ContributionRepository {
  items:Contribution[]=[];events=new Map<string,ContributionEvent[]>();
  async find(id:string){return structuredClone(this.items.find(c=>c.id===id));}
  async findByKey(id:string,key:string){return structuredClone(this.items.find(c=>c.contributorId===id&&c.idempotencyKey===key));}
  async create(c:Contribution){const previous=await this.findByKey(c.contributorId,c.idempotencyKey);if(previous)return {value:previous,replayed:true};this.items.push(structuredClone(c));this.events.set(c.id,[{action:'contribution.declared',state:c.state,createdAt:c.createdAt}]);return {value:c,replayed:false};}
  async update(c:Contribution,version:number,_actor:string,action:string){const i=this.items.findIndex(old=>old.id===c.id&&old.version===version);if(i<0)return false;this.items[i]=structuredClone(c);this.events.get(c.id)!.push({action,state:c.state,createdAt:c.updatedAt});return true;}
  async list(id:string){return this.items.filter(c=>c.publicationId===id);}
  async mine(id:string){return this.items.filter(c=>c.contributorId===id);}
  async history(id:string){return this.events.get(id)??[];}
}
test('contribution APIs: retry identity, participant-only notes, roles, receipt confirmation and lifecycle',async()=>{
  const pubs=new MemoryPublications();const repo=new MemoryContributions();
  const owner={id:runtime.id(),roles:['affected']},donor={id:runtime.id(),roles:['donor']},other={id:runtime.id(),roles:['donor']};
  let account:typeof owner|undefined=donor;
  const pubService=new PublicationService(pubs,activeCatalogs,runtime);const need=await pubService.create('need',owner,needInput,'published');
  const service=new ContributionService(repo,pubs,activeCatalogs,runtime,secureTokens.hash);
  const router=Router();router.use((_req,res,next)=>{res.locals.account=account;next();},contributionRouter(service));
  const http=await serve(router);
  const request=(path:string,method='GET',body?:unknown,key='retry-key-0001')=>fetch(http.base+path,{method,headers:{'Content-Type':'application/json','X-Requested-With':'ReconstruyeHome','Idempotency-Key':key},body:body===undefined?undefined:JSON.stringify(body)});
  const path='/publications/'+need.id+'/contributions';
  try{
    account=undefined;assert.equal((await request(path,'POST',{type:'materials'})).status,401);account=owner;
    assert.equal((await request(path,'POST',{type:'materials'})).status,400);account=donor;
    assert.equal((await request(path,'POST',{type:'materials'},'')).status,400);
    const created=await request(path,'POST',{type:'materials',note:'Nota privada'});assert.equal(created.status,201);const c=await created.json();
    const retried=await request(path,'POST',{type:'materials',note:'Nota privada'});assert.equal(retried.status,200);assert.equal((await retried.json()).id,c.id);
    assert.equal((await request(path,'POST',{type:'home'})).status,409);assert.equal(repo.items.length,1);
    const route='/contributions/'+c.id;
    assert.equal((await (await request('/me/contributions')).json()).items.length,1);
    assert.equal((await (await request(route)).json()).history.length,1);
    account=other;assert.equal((await request(route)).status,403);
    const publicList=await (await request(path)).json();assert.equal(publicList.items[0].note,undefined);assert.equal(publicList.items[0].contributorId,undefined);
    const transition=(action:string,version:number,confirmed=true)=>request(route+'/transitions/'+action,'POST',{version,confirmed});
    assert.equal((await transition('coordinate',1)).status,403);
    account=donor;assert.equal((await transition('receive',1)).status,403);
    assert.equal((await transition('coordinate',1)).status,200);
    account=owner;assert.equal((await transition('receive',2,false)).status,400);
    assert.equal((await transition('receive',1)).status,409);
    assert.equal((await transition('receive',2)).status,200);
    assert.equal(pubs.items[0]!.state,'published');
    assert.equal((await transition('dispute',3)).status,200);
    assert.equal((await transition('receive',4)).status,409);
    account=donor;const second=await (await request(path,'POST',{type:'labor'},'retry-key-0002')).json();
    assert.equal((await request('/contributions/'+second.id+'/transitions/cancel','POST',{version:1,confirmed:true})).status,200);
    repo.items[0]!.hidden=true;
    assert.equal((await request(path,'POST',{type:'materials',note:'Nota privada'})).status,404);
    assert.equal((await request(route)).status,404);
    assert.equal((await (await request(path)).json()).items.length,1);
    pubs.items[0]!.hidden=true;assert.equal((await request(path)).status,404);
    assert.equal((await request(route)).status,404);
  }finally{await http.close();}
});
