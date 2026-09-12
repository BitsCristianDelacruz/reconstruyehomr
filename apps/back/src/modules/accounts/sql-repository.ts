import { AppError } from '../../shared/errors.js';
import type { SqlDatabase, SqlContext } from '../../shared/sql.js';
import type { Account, AccountRepository, ProfileInput, Session } from './model.js';
import { publicRoles } from '../../shared/ports.js';
const columns = 'LOWER(CONVERT(char(36),a.Id)) AS id,a.Email AS email,a.Name AS name,a.Territory AS territory,a.Phone AS phone,a.ContactConsent AS contactConsent,a.State AS state,a.PasswordHash AS passwordHash,a.CreatedAt AS createdAt';
export class SqlAccountRepository implements AccountRepository {
  constructor(private readonly db: SqlDatabase) {}
  private async attachRoles(rows: Account[]) {
    const account = rows[0];
    if (account) account.roles = (await this.db.query<{role:string}>('SELECT Role AS role FROM dbo.AccountRoles WHERE AccountId=@id', {id: account.id})).map(r => r.role);
    return account;
  }
  async findByEmail(email: string) { return this.attachRoles(await this.db.query<Account>('SELECT '+columns+' FROM dbo.Accounts a WHERE a.Email=@email', {email})); }
  async findById(id: string) { return this.attachRoles(await this.db.query<Account>('SELECT '+columns+' FROM dbo.Accounts a WHERE a.Id=@id', {id})); }
  private async roles(tx: SqlContext, id: string, roles: string[]) {
    await tx.query('DELETE dbo.AccountRoles WHERE AccountId=@id', {id});
    for (const role of roles) await tx.query('INSERT dbo.AccountRoles (AccountId,Role) VALUES (@id,@role)', {id,role});
  }
  async create(account: Account) {
    try {
      await this.db.transaction(async tx => {
        const {roles, ...values} = account;
        await tx.query('INSERT dbo.Accounts (Id,Email,Name,Territory,Phone,ContactConsent,State,PasswordHash,CreatedAt) VALUES (@id,@email,@name,@territory,@phone,@contactConsent,@state,@passwordHash,@createdAt)', values);
        await this.roles(tx, account.id, roles);
        await tx.query("INSERT dbo.AccountConsents (AccountId,Kind,Granted,PolicyVersion) VALUES (@id,'privacy',1,'local-v1'),(@id,'contact',@consent,'local-v1')", {id:account.id,consent:account.contactConsent});
        await tx.audit(account.id,'account.registered',account.id);
      });
    } catch (error) {
      if ([2601,2627].includes((error as {number:number}).number)) throw new AppError(409,'No se puede registrar ese correo');
      throw error;
    }
  }
  async updateProfile(id: string, profile: ProfileInput) {
    await this.db.transaction(async tx => {
      const {roles,...values}=profile;
      const updated=await tx.query("UPDATE dbo.Accounts SET Name=@name,Territory=@territory,Phone=@phone,ContactConsent=@contactConsent OUTPUT inserted.Id WHERE Id=@id AND State='active'", {id,...values});
      if(!updated.length)throw new AppError(401,'Inicia sesión nuevamente');
      // Self-service changes only public roles; concurrent privilege revocations must never be restored.
      await tx.query("DELETE dbo.AccountRoles WHERE AccountId=@id AND Role IN ('affected','donor','professional','organization')",{id});
      for(const role of roles.filter(role=>publicRoles.includes(role as typeof publicRoles[number])))
        await tx.query('INSERT dbo.AccountRoles(AccountId,Role) VALUES(@id,@role)',{id,role});
      await tx.query("INSERT dbo.AccountConsents (AccountId,Kind,Granted,PolicyVersion) VALUES (@id,'contact',@contactConsent,'local-v1')", {id,contactConsent:profile.contactConsent});
      await tx.audit(id,'account.profile_updated',id);
    });
  }
  async deactivate(id: string) {
    await this.db.transaction(async tx => {
      await tx.query("UPDATE dbo.Accounts SET State='deactivation_requested' WHERE Id=@id; DELETE dbo.Sessions WHERE AccountId=@id", {id});
      await tx.audit(id,'account.deactivation_requested',id);
    });
  }
  async saveSession(session: Session) {
    await this.db.query('DELETE dbo.Sessions WHERE ExpiresAt<SYSUTCDATETIME(); INSERT dbo.Sessions (Hash,AccountId,ExpiresAt) VALUES (@hash,@accountId,@expiresAt)', {...session});
  }
  async sessionAccount(hash: string, now: Date) {
    return this.attachRoles(await this.db.query<Account>("SELECT "+columns+" FROM dbo.Sessions s JOIN dbo.Accounts a ON a.Id=s.AccountId WHERE s.Hash=@hash AND s.ExpiresAt>@now AND a.State='active'", {hash,now}));
  }
  async revokeSession(hash: string) { await this.db.query('DELETE dbo.Sessions WHERE Hash=@hash',{hash}); }
}
