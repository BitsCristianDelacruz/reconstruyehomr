CREATE TABLE dbo.Catalogs (
  [Group] nvarchar(32) NOT NULL, Code nvarchar(64) NOT NULL, Label nvarchar(1000) NOT NULL,
  Active bit NOT NULL DEFAULT 1, Position int NOT NULL DEFAULT 0,
  CONSTRAINT PK_Catalogs PRIMARY KEY ([Group], Code)
);
CREATE TABLE dbo.Audit (
  Id uniqueidentifier NOT NULL PRIMARY KEY, ActorId uniqueidentifier NOT NULL,
  Action nvarchar(80) NOT NULL, TargetId nvarchar(128) NOT NULL, Reason nvarchar(1000) NULL,
  CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_Audit_CreatedAt ON dbo.Audit (CreatedAt DESC);
INSERT dbo.Catalogs ([Group],Code,Label,Position) VALUES
(N'category',N'materials',N'Materiales',1),(N'category',N'labor',N'Mano de obra',2),
(N'category',N'home',N'Elementos para el hogar',3),(N'category',N'technical',N'Orientación técnica',4),
(N'territory',N'soacha',N'Soacha, Cundinamarca (demostración)',1),
(N'territory',N'mocoa',N'Mocoa, Putumayo (demostración)',2),
(N'urgency',N'low',N'Puede esperar',1),(N'urgency',N'medium',N'Prioridad media',2),(N'urgency',N'high',N'Urgente',3),
(N'reportCategory',N'privacy',N'Datos personales expuestos',1),(N'reportCategory',N'fraud',N'Posible engaño',2),
(N'reportCategory',N'money',N'Solicitud de dinero',3),(N'reportCategory',N'safety',N'Riesgo o contenido inapropiado',4),
(N'needState',N'draft',N'Borrador',1),(N'needState',N'published',N'Publicada',2),(N'needState',N'paused',N'Pausada',3),(N'needState',N'closed',N'Cerrada',4),
(N'offerState',N'draft',N'Borrador',1),(N'offerState',N'published',N'Publicada',2),(N'offerState',N'paused',N'Pausada',3),(N'offerState',N'closed',N'Cerrada',4),
(N'safety',N'contact',N'Comparte solo lo necesario. Confirma con quién hablas antes de acordar una entrega. ReconstruyeHome no garantiza identidades, aportes ni resultados.',1),
(N'safety',N'emergency',N'En una emergencia comunícate con la línea oficial 123 o con las autoridades de tu municipio. Esta plataforma no presta atención de emergencias.',2),
(N'safety',N'privacy',N'No publiques direcciones exactas, documentos, teléfonos, fotos de menores ni datos de otras personas. Las ayudas son en especie; no solicites dinero.',3),
(N'safety',N'local',N'Entorno de desarrollo. Autenticación, territorios y categorías provisionales. No utilices datos personales reales.',4);
