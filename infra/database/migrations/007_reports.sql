ALTER TABLE dbo.Contributions ADD Hidden bit NOT NULL CONSTRAINT DF_Contributions_Hidden DEFAULT 0;
CREATE TABLE dbo.Reports (
  Id uniqueidentifier NOT NULL PRIMARY KEY, ReporterId uniqueidentifier NOT NULL REFERENCES dbo.Accounts(Id),
  TargetType nvarchar(16) NOT NULL CHECK (TargetType IN ('publication','profile','contribution')), TargetId uniqueidentifier NOT NULL,
  PublicationId uniqueidentifier NOT NULL REFERENCES dbo.Publications(Id),
  ContributionId uniqueidentifier NULL REFERENCES dbo.Contributions(Id), AccountId uniqueidentifier NOT NULL REFERENCES dbo.Accounts(Id),
  Category nvarchar(64) NOT NULL, CategoryGroup nvarchar(32) NOT NULL DEFAULT 'reportCategory' CHECK (CategoryGroup='reportCategory'),
  Detail nvarchar(1000) NOT NULL, Status nvarchar(16) NOT NULL CHECK (Status IN ('pending','resolved','escalated')),
  Version int NOT NULL, CreatedAt datetime2 NOT NULL,
  FOREIGN KEY (CategoryGroup,Category) REFERENCES dbo.Catalogs([Group],Code)
);
CREATE INDEX IX_Reports_Queue ON dbo.Reports(Status,CreatedAt DESC);
CREATE TABLE dbo.ModerationDecisions (
  Id bigint IDENTITY PRIMARY KEY, ReportId uniqueidentifier NOT NULL REFERENCES dbo.Reports(Id),
  ActorId uniqueidentifier NOT NULL REFERENCES dbo.Accounts(Id), Decision nvarchar(16) NOT NULL,
  Reason nvarchar(1000) NOT NULL, CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
