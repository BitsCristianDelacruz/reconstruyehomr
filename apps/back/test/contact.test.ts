import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Router } from 'express';
import { ContactService } from '../src/modules/contact/service.js';
import { contactRouter } from '../src/modules/contact/router.js';
import { runtime } from '../src/shared/ports.js';
import { serve } from './helpers.js';
test('contact endpoint requires a session, both consents, current visibility and a safe WhatsApp URL',async()=>{
  let available=true,granted=0,grantAllowed=true,logged=true;
  const service=new ContactService({target:async()=>({phone:'+573000000000',available}),grant:async()=>{if(grantAllowed)granted++;return grantAllowed;}},runtime);
  const router=Router();router.use((_req,res,next)=>{res.locals.account=logged?{id:runtime.id(),roles:['donor']}:undefined;next();},contactRouter(service));
  const http=await serve(router);const id=runtime.id();
  const request=(confirmed:boolean)=>fetch(http.base+'/publications/'+id+'/contact',{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'ReconstruyeHome'},body:JSON.stringify({confirmed})});
  try{
    assert.equal((await request(false)).status,400);assert.equal(granted,0);
    logged=false;assert.equal((await request(true)).status,401);logged=true;
    available=false;assert.equal((await request(true)).status,404);available=true;
    grantAllowed=false;assert.equal((await request(true)).status,409);grantAllowed=true;
    const response=await request(true);assert.equal(response.status,200);const body=await response.json();const url=new URL(body.url);
    assert.equal(url.origin,'https://wa.me');assert.equal(url.pathname,'/573000000000');
    assert.ok(url.searchParams.get('text')!.includes(id));assert.equal(body.phone,undefined);assert.equal(granted,1);
  }finally{await http.close();}
});
