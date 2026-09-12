import type { SqlContext, SqlDatabase } from '../../shared/sql.js';
import type { Publication, PublicationEvent, PublicationFilter, PublicationRepository } from './model.js';
export const publicationColumns = 'LOWER(CONVERT(char(36),p.Id)) AS id,LOWER(CONVERT(char(36),p.AuthorId)) AS authorId,p.Kind AS kind,p.State AS state,p.Hidden AS hidden,p.Version AS version,p.Title AS title,p.Description AS description,p.Category AS category,p.Territory AS territory,p.Zone AS zone,p.Urgency AS urgency,p.Damage AS damage,p.Availability AS availability,p.Conditions AS conditions,p.ContactEnabled AS contactEnabled,p.SafetyAccepted AS safetyAccepted,p.CreatedAt AS createdAt,p.UpdatedAt AS updatedAt,CAST(CASE WHEN a.State=\'active\' THEN 1 ELSE 0 END AS bit) AS authorActive,c.Label AS categoryLabel,t.Label AS territoryLabel,CAST(CASE WHEN a.ContactConsent=1 AND a.Phone IS NOT NULL THEN 1 ELSE 0 END AS bit) AS authorContactAllowed,CAST(CASE WHEN EXISTS(SELECT 1 FROM dbo.Reports r WHERE r.PublicationId=p.Id AND r.Status=\'pending\') THEN 1 ELSE 0 END AS bit) AS reported';
const from=" FROM dbo.Publications p JOIN dbo.Accounts a ON a.Id=p.AuthorId LEFT JOIN dbo.Catalogs c ON c.[Group]='category' AND c.Code=p.Category LEFT JOIN dbo.Catalogs t ON t.[Group]='territory' AND t.Code=p.Territory";
function values(p:Publication) {
  return {id:p.id,authorId:p.authorId,kind:p.kind,state:p.state,hidden:p.hidden,version:p.version,title:p.title,description:p.description,
    category:p.category||null,territory:p.territory||null,zone:p.zone,urgency:p.urgency,damage:p.damage,availability:p.availability,
    conditions:p.conditions,contactEnabled:p.contactEnabled,safetyAccepted:p.safetyAccepted,createdAt:p.createdAt,updatedAt:p.updatedAt};
}
function normalize(p:Publication):Publication {return {...p,category:p.category??'',territory:p.territory??''};}
export async function publicationHistory(tx:SqlContext,p:Publication,action:string){
  await tx.query('INSERT dbo.PublicationHistory (PublicationId,Action,State,CreatedAt) VALUES (@id,@action,@state,@at)',{id:p.id,action,state:p.state,at:p.updatedAt});
  await tx.audit(p.authorId,action,p.id);
}
export class SqlPublicationRepository implements PublicationRepository {
  constructor(private readonly db:SqlDatabase){}
  async create(p:Publication) {
    await this.db.transaction(async tx=>{
      await tx.query('INSERT dbo.Publications (Id,AuthorId,Kind,State,Hidden,Version,Title,Description,Category,Territory,Zone,Urgency,Damage,Availability,Conditions,ContactEnabled,SafetyAccepted,CreatedAt,UpdatedAt) VALUES (@id,@authorId,@kind,@state,@hidden,@version,@title,@description,@category,@territory,@zone,@urgency,@damage,@availability,@conditions,@contactEnabled,@safetyAccepted,@createdAt,@updatedAt)',values(p));
      await publicationHistory(tx,p,'publication.created');
    });
  }
  async find(id:string){const p=(await this.db.query<Publication>('SELECT '+publicationColumns+from+' WHERE p.Id=@id',{id}))[0];return p?normalize(p):undefined;}
  async update(p:Publication,expectedVersion:number,action:string){
    return this.db.transaction(async tx=>{
      const rows=await tx.query<{id:string}>('UPDATE dbo.Publications SET Title=@title,Description=@description,Category=@category,Territory=@territory,Zone=@zone,Urgency=@urgency,Damage=@damage,Availability=@availability,Conditions=@conditions,ContactEnabled=@contactEnabled,SafetyAccepted=@safetyAccepted,State=@state,Version=@version,UpdatedAt=@updatedAt OUTPUT inserted.Id AS id WHERE Id=@id AND AuthorId=@authorId AND Version=@expectedVersion AND Hidden=0',{...values(p),expectedVersion});
      if(!rows.length)return false;
      await publicationHistory(tx,p,action);return true;
    });
  }
  async wall(filter:PublicationFilter){
    const clauses=["p.Hidden=0","a.State='active'","p.State=@state"];
    const params:Record<string,string|number>={state:filter.state,offset:(filter.page-1)*filter.limit,limit:filter.limit};
    for(const key of ['kind','category','territory','urgency'] as const)if(filter[key]){clauses.push('p.'+key+'=@'+key);params[key]=filter[key]!;}
    const where=' WHERE '+clauses.join(' AND ');
    const items=await this.db.query<Publication>('SELECT '+publicationColumns+from+where+' ORDER BY p.UpdatedAt DESC,p.Id OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY',params);
    const count=await this.db.query<{total:number}>('SELECT COUNT(*) AS total'+from+where,params);
    return {items:items.map(normalize),total:count[0]!.total};
  }
  async mine(authorId:string){return (await this.db.query<Publication>('SELECT TOP (200) '+publicationColumns+from+' WHERE p.AuthorId=@authorId ORDER BY p.UpdatedAt DESC,p.Id',{authorId})).map(normalize);}
  timeline(id:string){return this.db.query<PublicationEvent>('SELECT Action AS action,State AS state,CreatedAt AS createdAt,NULL AS contributionId,NULL AS contributionType FROM dbo.PublicationHistory WHERE PublicationId=@id UNION ALL SELECT h.Action,h.State,h.CreatedAt,LOWER(CONVERT(char(36),c.Id)),c.Type FROM dbo.ContributionHistory h JOIN dbo.Contributions c ON c.Id=h.ContributionId WHERE c.PublicationId=@id AND c.Hidden=0 ORDER BY createdAt,action',{id});}
}
