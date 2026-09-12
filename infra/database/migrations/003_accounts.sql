CREATE TABLE dbo.Accounts (
  Id uniqueidentifier NOT NULL PRIMARY KEY, Email nvarchar(254) NOT NULL UNIQUE,
  Name nvarchar(80) NOT NULL, Territory nvarchar(64) NOT NULL, Phone nvarchar(16) NULL,
  ContactConsent bit NOT NULL DEFAULT 0, PasswordHash nvarchar(256) NOT NULL,
  State nvarchar(32) NOT NULL DEFAULT 'active' CHECK (State IN ('active','deactivation_requested','disabled')),
  CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE TABLE dbo.AccountRoles (
  AccountId uniqueidentifier NOT NULL REFERENCES dbo.Accounts(Id),
  Role nvarchar(32) NOT NULL CHECK (Role IN ('affected','donor','professional','organization','moderator','admin')),
  PRIMARY KEY (AccountId,Role)
);
CREATE TABLE dbo.AccountConsents (
  Id bigint IDENTITY PRIMARY KEY, AccountId uniqueidentifier NOT NULL REFERENCES dbo.Accounts(Id),
  Kind nvarchar(32) NOT NULL, Granted bit NOT NULL, PolicyVersion nvarchar(32) NOT NULL,
  CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE TABLE dbo.Sessions (
  Hash char(64) NOT NULL PRIMARY KEY, AccountId uniqueidentifier NOT NULL REFERENCES dbo.Accounts(Id),
  ExpiresAt datetime2 NOT NULL
);
CREATE INDEX IX_Sessions_Expiry ON dbo.Sessions(ExpiresAt);
CREATE INDEX IX_Sessions_Account ON dbo.Sessions(AccountId);
