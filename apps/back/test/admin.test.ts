import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Router } from 'express';
import { AdminService,type AdminRepository } from '../src/modules/moderation/admin-service.js';
import { adminRouter } from '../src/modules/moderation/admin-router.js';
import { runtime } from '../src/shared/ports.js';
import { serve } from './helpers.js';
import type { CatalogEntry } from '../src/modules/catalogs/catalogs.js';
test('admin APIs: catalogs, accounts, role changes and audit require administration and reasons',async()=>{
  let account={id:runtime.id(),roles:['moderator']};const managedId=runtime.id(),entries:CatalogEntry[]=[];let writes=0;
  const repo:AdminRepository={saveCatalog:async(_id,e)=>{entries.push(e);writes++;},accounts:async()=>[{id:managedId,email:'test@example.test',name:'Prueba',state:'active',roles:['donor']}],
    updateAccount:async()=>{writes++;return true;},audit:async()=>[]};
  const router=Router();router.use((_req,res,next)=>{res.locals.account=account;next();},adminRouter(new AdminService(repo,{list:async()=>entries})));
  const http=await serve(router);
  const request=(path:string,method='GET',body?:unknown)=>fetch(http.base+path,{method,headers:{'Content-Type':'application/json','X-Requested-With':'ReconstruyeHome'},body:body===undefined?undefined:JSON.stringify(body)});
  try{
    for(const path of ['/admin/catalogs','/admin/accounts','/admin/audit'])assert.equal((await request(path)).status,403);
    const entry={label:'Territorio de prueba',active:true,position:3,reason:'Configuración para desarrollo'};
    assert.equal((await request('/admin/catalogs/territory/test','PUT',entry)).status,403);
    assert.equal((await request('/admin/accounts/'+managedId,'PUT',{state:'disabled',roles:['donor'],reason:'Cuenta de prueba'})).status,403);
    account={...account,roles:['admin']};
    assert.equal((await request('/admin/catalogs/territory/test','PUT',{...entry,reason:''})).status,400);
    assert.equal((await request('/admin/catalogs/needState/invented','PUT',entry)).status,400);
    assert.equal((await request('/admin/catalogs/safety/privacy','PUT',{...entry,active:false})).status,400);
    assert.equal((await request('/admin/catalogs/territory/test','PUT',entry)).status,200);
    assert.equal((await (await request('/admin/catalogs')).json()).entries.length,1);
    assert.equal((await (await request('/admin/accounts?q=test')).json()).items[0].id,managedId);
    const update={state:'disabled',roles:['donor'],reason:'Desactivación de prueba'};
    assert.equal((await request('/admin/accounts/'+account.id,'PUT',update)).status,400);
    assert.equal((await request('/admin/accounts/'+managedId,'PUT',update)).status,200);
    assert.equal((await request('/admin/audit')).status,200);assert.equal(writes,2);
    const features=(await (await request('/admin/catalogs')).json()).features;
    assert.ok(Object.values(features).every(v=>v===false));
  }finally{await http.close();}
});
