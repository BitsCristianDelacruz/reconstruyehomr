import sql from 'mssql';
import { randomUUID } from 'node:crypto';
export type Parameters = Record<string, string | number | boolean | Date | null>;
export class SqlContext {
  constructor(private readonly connection: sql.ConnectionPool | sql.Transaction) {}
  async query<T = Record<string, unknown>>(statement: string, parameters: Parameters = {}): Promise<T[]> {
    const request = this.connection instanceof sql.Transaction ? new sql.Request(this.connection) : new sql.Request(this.connection);
    for (const [key, value] of Object.entries(parameters)) {
      const type = value instanceof Date ? sql.DateTime2 : typeof value === 'boolean' ? sql.Bit
        : typeof value === 'number' ? sql.Int : sql.NVarChar(sql.MAX);
      request.input(key, type, value);
    }
    return (await request.query<T>(statement)).recordset ?? [];
  }
  async audit(actorId: string, action: string, targetId: string, reason: string | null = null) {
    await this.query('INSERT dbo.Audit (Id, ActorId, Action, TargetId, Reason) VALUES (@id,@actorId,@action,@targetId,@reason)',
      { id: randomUUID(), actorId, action, targetId, reason });
  }
}
export class SqlDatabase extends SqlContext {
  constructor(private readonly pool: sql.ConnectionPool) { super(pool); }
  async transaction<T>(work: (context: SqlContext) => Promise<T>): Promise<T> {
    const tx = new sql.Transaction(this.pool);
    await tx.begin();
    try { const value = await work(new SqlContext(tx)); await tx.commit(); return value; }
    catch (error) { await tx.rollback().catch(() => undefined); throw error; }
  }
}
