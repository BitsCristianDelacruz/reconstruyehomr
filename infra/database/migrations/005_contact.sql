CREATE TABLE dbo.ContactConsents (
  Id bigint IDENTITY PRIMARY KEY, ActorId uniqueidentifier NOT NULL REFERENCES dbo.Accounts(Id),
  PublicationId uniqueidentifier NOT NULL REFERENCES dbo.Publications(Id),
  PolicyVersion nvarchar(32) NOT NULL, CreatedAt datetime2 NOT NULL
);
CREATE INDEX IX_ContactConsents_Publication ON dbo.ContactConsents(PublicationId,CreatedAt);
