CREATE TABLE dbo.Contributions (
  Id uniqueidentifier NOT NULL PRIMARY KEY, PublicationId uniqueidentifier NOT NULL REFERENCES dbo.Publications(Id),
  ContributorId uniqueidentifier NOT NULL REFERENCES dbo.Accounts(Id),
  Type nvarchar(64) NOT NULL, CategoryGroup nvarchar(32) NOT NULL DEFAULT 'category' CHECK (CategoryGroup='category'),
  Note nvarchar(1000) NOT NULL, State nvarchar(16) NOT NULL CHECK (State IN ('declared','coordinated','received','cancelled','reported')),
  Version int NOT NULL CHECK (Version>0), IdempotencyKey nvarchar(80) COLLATE Latin1_General_100_BIN2 NOT NULL,
  Fingerprint char(64) NOT NULL, CreatedAt datetime2 NOT NULL, UpdatedAt datetime2 NOT NULL,
  CONSTRAINT UQ_Contributions_Idempotency UNIQUE (ContributorId,IdempotencyKey),
  FOREIGN KEY (CategoryGroup,Type) REFERENCES dbo.Catalogs([Group],Code)
);
CREATE INDEX IX_Contributions_Publication ON dbo.Contributions(PublicationId,CreatedAt);
CREATE TABLE dbo.ContributionHistory (
  Id bigint IDENTITY PRIMARY KEY, ContributionId uniqueidentifier NOT NULL REFERENCES dbo.Contributions(Id),
  Action nvarchar(80) NOT NULL, State nvarchar(32) NOT NULL, CreatedAt datetime2 NOT NULL
);
CREATE INDEX IX_ContributionHistory ON dbo.ContributionHistory(ContributionId,CreatedAt);
