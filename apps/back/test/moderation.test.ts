import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Router } from 'express';
import type { Report,ReportRepository } from '../src/modules/moderation/model.js';
import { ModerationService } from '../src/modules/moderation/service.js';
import { moderationRouter } from '../src/modules/moderation/router.js';
import { runtime } from '../src/shared/ports.js';
import { serve } from './helpers.js';
import { activeCatalogs } from './memory.js';
test('report and moderation APIs: manual review, role boundaries, reasons and stale decisions',async()=>{
  const owner={id:runtime.id(),roles:['affected']},mod={id:runtime.id(),roles:['moderator']},admin={id:runtime.id(),roles:['admin']};
  let actor:typeof owner|undefined=owner,hidden=false,decisions=0;
  const reports:Report[]=[];
  const repo:ReportRepository={
    resolve:async(_type,id)=>({publicationId:id,contributionId:null,accountId:owner.id}),
    create:async r=>{reports.push(r);},list:async()=>reports,find:async id=>reports.find(r=>r.id===id),
    decide:async(_actor,r,version,decision)=>{if(r.version!==version)return false;r.version++;r.status=decision==='escalate'?'escalated':'resolved';if(decision==='hide')hidden=true;if(decision==='restore')hidden=false;decisions++;return true;}
  };
  const router=Router();router.use((_req,res,next)=>{res.locals.account=actor;next();},moderationRouter(new ModerationService(repo,activeCatalogs,runtime)));
  const http=await serve(router);
  const request=(path:string,method='GET',body?:unknown)=>fetch(http.base+path,{method,headers:{'Content-Type':'application/json','X-Requested-With':'ReconstruyeHome'},body:body===undefined?undefined:JSON.stringify(body)});
  const input={targetType:'publication',targetId:runtime.id(),category:'privacy',detail:'Datos privados expuestos',confirmed:true};
  try{
    actor=undefined;assert.equal((await request('/reports','POST',input)).status,401);actor=owner;
    assert.equal((await request('/reports','POST',{...input,confirmed:false})).status,400);
    assert.equal((await request('/reports','POST',{...input,category:'unknown'})).status,400);
    const report=await (await request('/reports','POST',input)).json();assert.equal(report.status,'pending');assert.equal(hidden,false);
    assert.equal((await request('/moderation/reports')).status,403);
    const path='/moderation/reports/'+report.id+'/decisions';
    assert.equal((await request(path,'POST',{version:1,decision:'hide',reason:'Datos personales'})).status,403);
    actor=mod;const list=await (await request('/moderation/reports')).json();assert.equal(list.items[0].reporterId,undefined);
    assert.equal((await request(path,'POST',{version:1,decision:'hide',reason:''})).status,400);
    assert.equal((await request(path,'POST',{version:1,decision:'hide',reason:'Datos personales'})).status,200);assert.equal(hidden,true);
    assert.equal((await request(path,'POST',{version:1,decision:'restore',reason:'Revisión completada'})).status,409);
    assert.equal((await request(path,'POST',{version:2,decision:'restore',reason:'Revisión completada'})).status,200);assert.equal(hidden,false);
    assert.equal((await request(path,'POST',{version:3,decision:'escalate',reason:'Requiere revisión superior'})).status,200);
    assert.equal((await request(path,'POST',{version:4,decision:'dismiss',reason:'Caso revisado y resuelto'})).status,200);
    const profileReport=await (await request('/reports','POST',{...input,targetType:'profile'})).json();
    const profilePath='/moderation/reports/'+profileReport.id+'/decisions';
    assert.equal((await request(profilePath,'POST',{version:1,decision:'hide',reason:'Riesgo en la cuenta'})).status,403);
    actor=admin;assert.equal((await request(profilePath,'POST',{version:1,decision:'hide',reason:'Riesgo en la cuenta'})).status,200);
    assert.equal(decisions,5);
  }finally{await http.close();}
});
