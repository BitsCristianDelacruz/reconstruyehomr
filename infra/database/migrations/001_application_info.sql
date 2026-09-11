CREATE TABLE dbo.ApplicationInfo (
  Id int NOT NULL CONSTRAINT PK_ApplicationInfo PRIMARY KEY,
  Name nvarchar(100) NOT NULL,
  CreatedAt datetime2 NOT NULL CONSTRAINT DF_ApplicationInfo_CreatedAt DEFAULT SYSUTCDATETIME()
);

INSERT dbo.ApplicationInfo (Id, Name) VALUES (1, N'ReconstruyeHome');
