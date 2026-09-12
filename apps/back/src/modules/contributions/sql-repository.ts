import { AppError } from '../../shared/errors.js';
import type { SqlDatabase,SqlContext } from '../../shared/sql.js';
import type { Contribution,ContributionEvent,ContributionRepository } from './model.js';
const columns='LOWER(CONVERT(char(36),c.Id)) AS id,LOWER(CONVERT(char(36),c.PublicationId)) AS publicationId,LOWER(CONVERT(char(36),c.ContributorId)) AS contributorId,c.Type AS type,c.Note AS note,c.State AS state,c.Hidden AS hidden,c.Version AS version,c.IdempotencyKey AS idempotencyKey,c.Fingerprint AS fingerprint,c.CreatedAt AS createdAt,c.UpdatedAt AS updatedAt';
async function event(tx:SqlContext,c:Contribution,actorId:string,action:string){
  await tx.query('INSERT dbo.ContributionHistory (ContributionId,Action,State,CreatedAt) VALUES (@id,@action,@state,@at)',{id:c.id,action,state:c.state,at:c.updatedAt});
  await tx.audit(actorId,action,c.id);
}
export class SqlContributionRepository implements ContributionRepository {
  constructor(private readonly db:SqlDatabase){}
  async find(id:string){return (await this.db.query<Contribution>('SELECT '+columns+' FROM dbo.Contributions c WHERE c.Id=@id AND c.Hidden=0',{id}))[0];}
  async findByKey(actorId:string,key:string){return (await this.db.query<Contribution>('SELECT '+columns+' FROM dbo.Contributions c WHERE c.ContributorId=@actorId AND c.IdempotencyKey=@key',{actorId,key}))[0];}
  async create(c:Contribution){
    try{return await this.db.transaction(async tx=>{
      const rows=await tx.query("INSERT dbo.Contributions (Id,PublicationId,ContributorId,Type,Note,State,Version,IdempotencyKey,Fingerprint,CreatedAt,UpdatedAt) OUTPUT inserted.Id SELECT @id,@publicationId,@contributorId,@type,@note,@state,@version,@idempotencyKey,@fingerprint,@createdAt,@updatedAt FROM dbo.Publications p WITH (UPDLOCK,HOLDLOCK) JOIN dbo.Accounts a ON a.Id=p.AuthorId WHERE p.Id=@publicationId AND p.Hidden=0 AND p.State='published' AND p.Kind='need' AND a.State='active'",{...c});
      if(!rows.length)throw new AppError(409,'La solicitud ya no admite contribuciones');
      await event(tx,c,c.contributorId,'contribution.declared');return {value:c,replayed:false};
    });}catch(error){
      if([2601,2627].includes((error as {number:number}).number)){
        const previous=await this.findByKey(c.contributorId,c.idempotencyKey);
        if(previous)return {value:previous,replayed:true};
      }throw error;
    }
  }
  async update(c:Contribution,expectedVersion:number,actorId:string,action:string){
    return this.db.transaction(async tx=>{
      const rows=await tx.query("UPDATE c SET State=@state,Version=@version,UpdatedAt=@updatedAt OUTPUT inserted.Id FROM dbo.Contributions c JOIN dbo.Publications p ON p.Id=c.PublicationId JOIN dbo.Accounts a ON a.Id=p.AuthorId WHERE c.Id=@id AND c.Version=@expectedVersion AND c.Hidden=0 AND p.Hidden=0 AND p.State IN ('published','closed') AND a.State='active'",{id:c.id,state:c.state,version:c.version,updatedAt:c.updatedAt,expectedVersion});
      if(!rows.length)return false;await event(tx,c,actorId,action);return true;
    });
  }
  list(publicationId:string){return this.db.query<Contribution>('SELECT '+columns+' FROM dbo.Contributions c WHERE c.PublicationId=@publicationId AND c.Hidden=0 ORDER BY c.CreatedAt,c.Id',{publicationId});}
  mine(actorId:string){return this.db.query<Contribution>('SELECT '+columns+' FROM dbo.Contributions c JOIN dbo.Publications p ON p.Id=c.PublicationId WHERE c.Hidden=0 AND (c.ContributorId=@actorId OR p.AuthorId=@actorId) ORDER BY c.UpdatedAt DESC',{actorId});}
  history(id:string){return this.db.query<ContributionEvent>('SELECT Action AS action,State AS state,CreatedAt AS createdAt FROM dbo.ContributionHistory WHERE ContributionId=@id ORDER BY CreatedAt,Id',{id});}
}
