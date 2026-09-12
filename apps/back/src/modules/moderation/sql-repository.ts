import type { Actor } from '../../shared/ports.js';
import type { SqlDatabase } from '../../shared/sql.js';
import type { Decision,Report,ReportRepository,ReportTarget } from './model.js';
const columns='LOWER(CONVERT(char(36),r.Id)) AS id,LOWER(CONVERT(char(36),r.ReporterId)) AS reporterId,r.TargetType AS targetType,LOWER(CONVERT(char(36),r.TargetId)) AS targetId,LOWER(CONVERT(char(36),r.PublicationId)) AS publicationId,LOWER(CONVERT(char(36),r.ContributionId)) AS contributionId,LOWER(CONVERT(char(36),r.AccountId)) AS accountId,r.Category AS category,r.Detail AS detail,r.Status AS status,r.Version AS version,r.CreatedAt AS createdAt';
export class SqlReportRepository implements ReportRepository {
  constructor(private readonly db:SqlDatabase){}
  async resolve(type:ReportTarget,id:string){
    const contribution=type==='contribution';
    return (await this.db.query<{publicationId:string;contributionId:string|null;accountId:string}>(
      "SELECT LOWER(CONVERT(char(36),p.Id)) AS publicationId,"+(contribution?"LOWER(CONVERT(char(36),c.Id))":"NULL")+" AS contributionId,LOWER(CONVERT(char(36),"+(contribution?'c.ContributorId':'p.AuthorId')+")) AS accountId FROM dbo.Publications p JOIN dbo.Accounts a ON a.Id=p.AuthorId "+(contribution?'JOIN dbo.Contributions c ON c.PublicationId=p.Id ':'')+"WHERE "+(contribution?'c.Id=@id AND c.Hidden=0':'p.Id=@id')+" AND p.Hidden=0 AND p.State IN ('published','closed') AND a.State='active'",{id}))[0];
  }
  async create(r:Report){
    await this.db.transaction(async tx=>{
      const {summary,content,...values}=r;
      await tx.query('INSERT dbo.Reports (Id,ReporterId,TargetType,TargetId,PublicationId,ContributionId,AccountId,Category,Detail,Status,Version,CreatedAt) VALUES (@id,@reporterId,@targetType,@targetId,@publicationId,@contributionId,@accountId,@category,@detail,@status,@version,@createdAt)',values);
      await tx.audit(r.reporterId,'report.created',r.id);
    });
  }
  list(page:number){return this.db.query<Report>('SELECT '+columns+',p.Title AS summary,p.Description AS content FROM dbo.Reports r JOIN dbo.Publications p ON p.Id=r.PublicationId ORDER BY CASE WHEN r.Status=\'pending\' THEN 0 WHEN r.Status=\'escalated\' THEN 1 ELSE 2 END,r.CreatedAt DESC,r.Id OFFSET @offset ROWS FETCH NEXT 30 ROWS ONLY',{offset:(page-1)*30});}
  async find(id:string){return (await this.db.query<Report>('SELECT '+columns+' FROM dbo.Reports r WHERE r.Id=@id',{id}))[0];}
  async decide(actor:Actor,r:Report,version:number,decision:Decision,reason:string){
    return this.db.transaction(async tx=>{
      // A locking read prevents decisions based on stale report versions.
      const current=await tx.query('SELECT Id FROM dbo.Reports WITH (UPDLOCK,HOLDLOCK) WHERE Id=@id AND Version=@version',{id:r.id,version});
      if(!current.length)return false;
      if(['hide','restore'].includes(decision)){
        const hidden=decision==='hide';
        if(r.targetType==='profile'){
          const changed=await tx.query("UPDATE dbo.Accounts SET State=@state OUTPUT inserted.Id WHERE Id=@id AND State IN ('active','disabled'); DELETE dbo.Sessions WHERE AccountId=@id",{id:r.accountId,state:hidden?'disabled':'active'});
          if(!changed.length)return false;
        }else if(r.targetType==='contribution'){
          await tx.query('UPDATE dbo.Contributions SET Hidden=@hidden,Version=Version+1,UpdatedAt=SYSUTCDATETIME() WHERE Id=@id; INSERT dbo.ContributionHistory (ContributionId,Action,State,CreatedAt) SELECT Id,@action,State,SYSUTCDATETIME() FROM dbo.Contributions WHERE Id=@id',{id:r.contributionId,hidden,action:'moderation.'+decision});
        }else{
          await tx.query('UPDATE dbo.Publications SET Hidden=@hidden,Version=Version+1,UpdatedAt=SYSUTCDATETIME() WHERE Id=@id; INSERT dbo.PublicationHistory (PublicationId,Action,State,CreatedAt) SELECT Id,@action,State,SYSUTCDATETIME() FROM dbo.Publications WHERE Id=@id',{id:r.publicationId,hidden,action:'moderation.'+decision});
        }
      }
      await tx.query('UPDATE dbo.Reports SET Status=@status,Version=Version+1 WHERE Id=@id; INSERT dbo.ModerationDecisions (ReportId,ActorId,Decision,Reason) VALUES (@id,@actorId,@decision,@reason)',{id:r.id,status:decision==='escalate'?'escalated':'resolved',actorId:actor.id,decision,reason});
      await tx.audit(actor.id,'moderation.'+decision,r.targetId,reason);return true;
    });
  }
}
