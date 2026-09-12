import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Router } from 'express';
import { AccountService, assertLocalAuthAllowed } from '../src/modules/accounts/service.js';
import { accountRouter, sessionMiddleware } from '../src/modules/accounts/router.js';
import { ScryptPasswords, secureTokens } from '../src/modules/accounts/crypto.js';
import type { Account, AccountRepository, ProfileInput, Session } from '../src/modules/accounts/model.js';
import { runtime } from '../src/shared/ports.js';
import { serve } from './helpers.js';
export class MemoryAccounts implements AccountRepository {
  accounts: Account[] = []; sessions: Session[] = [];
  async findByEmail(email:string){return this.accounts.find(a=>a.email===email);}
  async findById(id:string){return this.accounts.find(a=>a.id===id);}
  async create(account:Account){this.accounts.push(account);}
  async updateProfile(id:string,profile:ProfileInput){Object.assign((await this.findById(id))!,profile);}
  async deactivate(id:string){(await this.findById(id))!.state='deactivation_requested';this.sessions=this.sessions.filter(s=>s.accountId!==id);}
  async saveSession(session:Session){this.sessions.push(session);}
  async sessionAccount(hash:string,now:Date){const s=this.sessions.find(s=>s.hash===hash&&s.expiresAt>now);return this.accounts.find(a=>a.id===s?.accountId&&a.state==='active');}
  async revokeSession(hash:string){this.sessions=this.sessions.filter(s=>s.hash!==hash);}
}
test('account endpoints: validation, consent, login, own profile, privilege rejection, logout and deactivation',async()=>{
  const repo=new MemoryAccounts();
  const service=new AccountService(repo,{hash:async p=>'test:'+p,verify:async(p,h)=>h==='test:'+p},secureTokens,runtime,{isActive:async(g,c)=>g==='territory'&&c==='soacha'});
  const router=Router();router.use(sessionMiddleware(service),accountRouter(service));
  const http=await serve(router);
  let cookie='';
  const request=async(path:string,method='GET',body?:unknown,headers={})=>fetch(http.base+path,{method,headers:{'Content-Type':'application/json','X-Requested-With':'ReconstruyeHome',Cookie:cookie,...headers},body:body===undefined?undefined:JSON.stringify(body)});
  const input={email:'person@example.test',password:'LongPassword!2026',name:'Persona prueba',territory:'soacha',roles:['affected'],phone:null,contactConsent:false,privacyConsent:true};
  try{
    assert.equal((await request('/me')).status,401);
    assert.equal((await request('/auth/register','POST',{...input,privacyConsent:false})).status,400);
    assert.equal((await request('/auth/register','POST',{...input,roles:['admin']})).status,400);
    assert.equal((await request('/auth/register','POST',input,{Origin:'https://hostile.example'})).status,403);
    const registered=await request('/auth/register','POST',input);assert.equal(registered.status,201);
    assert.equal((await registered.json()).passwordHash,undefined);
    assert.equal((await request('/auth/register','POST',input)).status,409);
    assert.equal((await request('/auth/login','POST',{email:input.email,password:'wrong'})).status,401);
    const logged=await request('/auth/login','POST',{email:input.email,password:input.password});assert.equal(logged.status,200);
    const setCookie=logged.headers.get('set-cookie')!;assert.match(setCookie,/HttpOnly/);assert.match(setCookie,/SameSite=Lax/);
    cookie=setCookie.split(';')[0]!;
    assert.equal(repo.sessions[0]!.hash.includes(cookie.split('=')[1]!),false);
    assert.equal((await request('/me')).status,200);
    const profile={name:'Nombre nuevo',territory:'soacha',roles:['donor'],phone:'+573000000000',contactConsent:true};
    assert.equal((await request('/me','PATCH',{...profile,roles:['moderator']})).status,400);
    assert.equal((await request('/me','PATCH',{...profile,email:'other@example.test'})).status,400);
    assert.equal((await request('/me','PATCH',profile)).status,200);
    assert.equal((await (await request('/me')).json()).name,'Nombre nuevo');
    assert.equal((await request('/auth/logout','POST',{})).status,204);
    assert.equal((await request('/me')).status,401);
    const relog=await request('/auth/login','POST',{email:input.email,password:input.password});cookie=relog.headers.get('set-cookie')!.split(';')[0]!;
    assert.equal((await request('/me/deactivation','POST',{confirmed:false})).status,400);
    assert.equal((await request('/me/deactivation','POST',{confirmed:true})).status,200);
    assert.equal((await request('/me')).status,401);
    assert.equal((await request('/auth/login','POST',{email:input.email,password:input.password})).status,401);
  }finally{await http.close();}
});
test('scrypt salts passwords and validates credentials; local authentication is blocked in production',async()=>{
  const passwords=new ScryptPasswords();const first=await passwords.hash('LongPassword!2026');const second=await passwords.hash('LongPassword!2026');
  assert.notEqual(first,second);assert.equal(await passwords.verify('LongPassword!2026',first),true);
  assert.equal(await passwords.verify('wrong',first),false);assert.equal(await passwords.verify('wrong',undefined),false);
  assert.throws(()=>assertLocalAuthAllowed({NODE_ENV:'production',AUTH_MODE:'local'}));
  assert.throws(()=>assertLocalAuthAllowed({NODE_ENV:'development'}));
  assert.doesNotThrow(()=>assertLocalAuthAllowed({NODE_ENV:'development',AUTH_MODE:'local'}));
});
