import type { SqlDatabase } from '../../shared/sql.js';
import type { ContactRepository, ContactTarget } from './service.js';
const available="p.Hidden=0 AND p.State='published' AND p.ContactEnabled=1 AND a.State='active' AND a.ContactConsent=1 AND a.Phone IS NOT NULL";
export class SqlContactRepository implements ContactRepository {
  constructor(private readonly db:SqlDatabase){}
  async target(id:string){
    return (await this.db.query<ContactTarget>("SELECT a.Phone AS phone,CAST(1 AS bit) AS available FROM dbo.Publications p JOIN dbo.Accounts a ON a.Id=p.AuthorId WHERE p.Id=@id AND "+available,{id}))[0];
  }
  async grant(actorId:string,id:string,phone:string,at:Date){
    return this.db.transaction(async tx=>{
      const rows=await tx.query<{id:number}>("INSERT dbo.ContactConsents (ActorId,PublicationId,PolicyVersion,CreatedAt) OUTPUT inserted.Id AS id SELECT @actorId,p.Id,'local-v1',@at FROM dbo.Publications p WITH (UPDLOCK,HOLDLOCK) JOIN dbo.Accounts a WITH (UPDLOCK,HOLDLOCK) ON a.Id=p.AuthorId WHERE p.Id=@id AND a.Phone=@phone AND "+available,{actorId,id,phone,at});
      if(!rows.length)return false;
      await tx.audit(actorId,'contact.consented',id);return true;
    });
  }
}
