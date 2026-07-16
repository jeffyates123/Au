IF OBJECT_ID('dbo.TR_TurnOrderErrors', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TR_TurnOrderErrors (
        TurnOrderErrorId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        TurnId NVARCHAR(16) NOT NULL,
        SectionNo SMALLINT NOT NULL,
        OrderNo SMALLINT NOT NULL,
        ErrorCode SMALLINT NOT NULL,
        RawToken NVARCHAR(32) NULL
    );
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.TR_TurnOrderErrors')
      AND name = 'UX_TR_TurnOrderErrors_TurnSectionOrderError'
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_TR_TurnOrderErrors_TurnSectionOrderError
        ON dbo.TR_TurnOrderErrors (TurnId, SectionNo, OrderNo, ErrorCode);
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.TR_TurnOrderErrors')
      AND name = 'IX_TR_TurnOrderErrors_TurnId'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_TR_TurnOrderErrors_TurnId
        ON dbo.TR_TurnOrderErrors (TurnId);
END;
