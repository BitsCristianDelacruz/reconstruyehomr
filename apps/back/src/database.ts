import sql from 'mssql';
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { databaseConfig } from './config.js';

export async function connectDatabase(): Promise<sql.ConnectionPool> {
  const config = databaseConfig();
  if (process.env.DB_INITIALIZE === 'true') {
    const admin = await new sql.ConnectionPool({ ...config, database: 'master' }).connect();
    try {
      // The identifier is validated in databaseConfig; values remain parameters.
      await admin.request().input('name', sql.NVarChar(128), config.database)
        .query('IF DB_ID(@name) IS NULL CREATE DATABASE [' + config.database + ']');
    } finally { await admin.close(); }
  }
  const pool = new sql.ConnectionPool(config);
  pool.on('error', () => console.error('Error de conexión con SQL Server'));
  return pool.connect();
}

export async function migrate(pool: sql.ConnectionPool): Promise<void> {
  const directory = process.env.MIGRATIONS_DIR ?? fileURLToPath(new URL('../../../infra/database/migrations/', import.meta.url));
  const files = (await readdir(directory)).filter(name => /^\d+.*\.sql$/.test(name)).sort();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    // Serialize migrations when multiple backends start against the same database.
    await new sql.Request(transaction).batch([
      "DECLARE @result int;",
      "EXEC @result = sp_getapplock @Resource = 'reconstruyehome_migrations',",
      "@LockMode = 'Exclusive', @LockOwner = 'Transaction', @LockTimeout = 10000;",
      "IF @result < 0 THROW 50001, 'No se pudo bloquear las migraciones', 1;",
      "IF OBJECT_ID('dbo.SchemaMigrations', 'U') IS NULL",
      "CREATE TABLE dbo.SchemaMigrations (Name nvarchar(255) NOT NULL PRIMARY KEY,",
      "Checksum char(64) NOT NULL, AppliedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME());"
    ].join('\n'));
    for (const file of files) {
      const content = (await readFile(directory + '/' + file, 'utf8')).replace(/\r\n/g, '\n');
      const checksum = createHash('sha256').update(content).digest('hex');
      const existing = await new sql.Request(transaction).input('name', sql.NVarChar(255), file)
        .query('SELECT Checksum FROM dbo.SchemaMigrations WHERE Name = @name');
      if (existing.recordset.length) {
        if (existing.recordset[0].Checksum !== checksum) throw new Error('Migración ya aplicada modificada: ' + file);
        continue;
      }
      // Files are single T-SQL batches; do not include sqlcmd GO separators.
      await new sql.Request(transaction).batch(content);
      await new sql.Request(transaction).input('name', sql.NVarChar(255), file)
        .input('checksum', sql.Char(64), checksum)
        .query('INSERT dbo.SchemaMigrations (Name, Checksum) VALUES (@name, @checksum)');
      console.log('Migración aplicada: ' + file);
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback().catch(() => undefined);
    throw error;
  }
}

export async function readStatus(pool: sql.ConnectionPool) {
  const result = await pool.request().query(
    'SELECT Name AS name, CreatedAt AS createdAt, DB_NAME() AS databaseName, ' +
    'SYSUTCDATETIME() AS databaseTime FROM dbo.ApplicationInfo WHERE Id = 1'
  );
  if (!result.recordset[0]) throw new Error('Falta la información inicial de la aplicación');
  return result.recordset[0] as {
    name: string; createdAt: Date; databaseName: string; databaseTime: Date;
  };
}
