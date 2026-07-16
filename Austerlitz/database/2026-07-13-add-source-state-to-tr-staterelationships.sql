IF COL_LENGTH('dbo.TR_StateRelationships', 'SourceState') IS NULL
BEGIN
    ALTER TABLE dbo.TR_StateRelationships
    ADD SourceState varchar(1) NULL;
END
GO

UPDATE R
SET SourceState = COALESCE(NULLIF(T.State, ''), SUBSTRING(R.TurnId, 4, 1), ' ')
FROM dbo.TR_StateRelationships R
LEFT JOIN dbo.TS_00TurnDetails T
    ON T.TurnId = R.TurnId
WHERE ISNULL(R.SourceState, '') = '';
GO

DECLARE @pkName sysname;
SELECT @pkName = KC.name
FROM sys.key_constraints KC
INNER JOIN sys.tables T
    ON T.object_id = KC.parent_object_id
INNER JOIN sys.schemas S
    ON S.schema_id = T.schema_id
WHERE KC.type = 'PK'
  AND S.name = 'dbo'
  AND T.name = 'TR_StateRelationships';

IF @pkName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE dbo.TR_StateRelationships DROP CONSTRAINT [' + @pkName + ']');
END
GO

ALTER TABLE dbo.TR_StateRelationships
ALTER COLUMN SourceState varchar(1) NOT NULL;
GO

ALTER TABLE dbo.TR_StateRelationships
ADD CONSTRAINT PK_TR_StateRelationships
PRIMARY KEY (TurnId, SourceState, State);
GO
