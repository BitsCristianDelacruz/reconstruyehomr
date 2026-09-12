import type { SqlDatabase } from '../../shared/sql.js';
import type { CatalogEntry } from '../catalogs/catalogs.js';
import type { AdminRepository,AuditEntry,ManagedAccount } from './admin-service.js';
export class SqlAdminRepository implements AdminRepository {
  constructor(private readonly db:SqlDatabase){}
  async saveCatalog(actorId:string,entry:CatalogEntry,reason:string){
    await this.db.transaction(async tx=>{
      await tx.query('UPDATE dbo.Catalogs WITH (UPDLOCK,SERIALIZABLE) SET Label=@label,Active=@active,Position=@position WHERE [Group]=@group AND Code=@code; IF @@ROWCOUNT=0 INSERT dbo.Catalogs ([Group],Code,Label,Active,Position) VALUES(@group,@code,@label,@active,@position)',{...entry});
      await tx.audit(actorId,'catalog.updated',entry.group+':'+entry.code,reason);
    });
  }
  async accounts(query:string){
    const accounts=await this.db.query<ManagedAccount>('SELECT TOP (100) LOWER(CONVERT(char(36),Id)) AS id,Email AS email,Name AS name,State AS state FROM dbo.Accounts WHERE CHARINDEX(@query,Email)>0 OR CHARINDEX(@query,Name)>0 ORDER BY CreatedAt DESC,Id',{query});
    for(const account of accounts)account.roles=(await this.db.query<{role:string}>('SELECT Role AS role FROM dbo.AccountRoles WHERE AccountId=@id',{id:account.id})).map(r=>r.role);
    return accounts;
  }
  async updateAccount(actorId:string,id:string,state:'active'|'disabled',roles:string[],reason:string){
    return this.db.transaction(async tx=>{
      const rows=await tx.query("UPDATE dbo.Accounts SET State=@state OUTPUT inserted.Id WHERE Id=@id AND State IN ('active','disabled')",{id,state});
      if(!rows.length)return false;
      await tx.query('DELETE dbo.AccountRoles WHERE AccountId=@id; DELETE dbo.Sessions WHERE AccountId=@id',{id});
      for(const role of roles)await tx.query('INSERT dbo.AccountRoles(AccountId,Role) VALUES(@id,@role)',{id,role});
      await tx.audit(actorId,'account.admin_updated',id,reason);return true;
    });
  }
  audit(page:number){return this.db.query<AuditEntry>('SELECT LOWER(CONVERT(char(36),Id)) AS id,LOWER(CONVERT(char(36),ActorId)) AS actorId,Action AS action,TargetId AS targetId,Reason AS reason,CreatedAt AS createdAt FROM dbo.Audit ORDER BY CreatedAt DESC,Id OFFSET @offset ROWS FETCH NEXT 50 ROWS ONLY',{offset:(page-1)*50});}
}
