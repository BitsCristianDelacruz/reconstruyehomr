import type { SqlDatabase } from '../../shared/sql.js';
import type { CatalogEntry, CatalogRepository } from './catalogs.js';
export class SqlCatalogRepository implements CatalogRepository {
  constructor(private readonly db: SqlDatabase) {}
  list() { return this.db.query<CatalogEntry>('SELECT [Group] AS [group], Code AS code, Label AS label, Active AS active, Position AS position FROM dbo.Catalogs ORDER BY [Group], Position, Code'); }
}
