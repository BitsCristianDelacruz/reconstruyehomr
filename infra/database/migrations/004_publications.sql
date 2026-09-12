CREATE TABLE dbo.Publications (
  Id uniqueidentifier NOT NULL PRIMARY KEY, AuthorId uniqueidentifier NOT NULL REFERENCES dbo.Accounts(Id),
  Kind nvarchar(8) NOT NULL CHECK (Kind IN ('need','offer')),
  State nvarchar(16) NOT NULL CHECK (State IN ('draft','published','paused','closed')), Hidden bit NOT NULL DEFAULT 0,
  Version int NOT NULL DEFAULT 1 CHECK (Version>0), Title nvarchar(120) NOT NULL, Description nvarchar(3000) NOT NULL,
  Category nvarchar(64) NULL, CategoryGroup nvarchar(32) NOT NULL DEFAULT 'category' CHECK (CategoryGroup='category'),
  Territory nvarchar(64) NULL, TerritoryGroup nvarchar(32) NOT NULL DEFAULT 'territory' CHECK (TerritoryGroup='territory'),
  Urgency nvarchar(64) NULL, UrgencyGroup nvarchar(32) NOT NULL DEFAULT 'urgency' CHECK (UrgencyGroup='urgency'),
  Zone nvarchar(120) NOT NULL, Damage nvarchar(500) NOT NULL, Availability nvarchar(500) NOT NULL, Conditions nvarchar(1000) NOT NULL,
  ContactEnabled bit NOT NULL, SafetyAccepted bit NOT NULL, CreatedAt datetime2 NOT NULL, UpdatedAt datetime2 NOT NULL,
  FOREIGN KEY (CategoryGroup,Category) REFERENCES dbo.Catalogs([Group],Code),
  FOREIGN KEY (TerritoryGroup,Territory) REFERENCES dbo.Catalogs([Group],Code),
  FOREIGN KEY (UrgencyGroup,Urgency) REFERENCES dbo.Catalogs([Group],Code)
);
CREATE INDEX IX_Publications_Wall ON dbo.Publications(Hidden,State,UpdatedAt DESC) INCLUDE (Category,Territory,Kind);
CREATE INDEX IX_Publications_Author ON dbo.Publications(AuthorId,UpdatedAt DESC);
CREATE TABLE dbo.PublicationHistory (
  Id bigint IDENTITY PRIMARY KEY, PublicationId uniqueidentifier NOT NULL REFERENCES dbo.Publications(Id),
  Action nvarchar(80) NOT NULL, State nvarchar(32) NOT NULL, CreatedAt datetime2 NOT NULL
);
CREATE INDEX IX_PublicationHistory_Publication ON dbo.PublicationHistory(PublicationId,CreatedAt);
