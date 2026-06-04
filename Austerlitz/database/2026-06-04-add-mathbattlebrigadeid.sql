IF COL_LENGTH('dbo.TR_MathBattleBrigades', 'MathBattleBrigadeId') IS NULL
BEGIN
    ALTER TABLE dbo.TR_MathBattleBrigades
    ADD MathBattleBrigadeId INT IDENTITY(1,1) NOT NULL;
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.TR_MathBattleBrigades')
      AND name = 'UX_TR_MathBattleBrigades_MathBattleBrigadeId'
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_TR_MathBattleBrigades_MathBattleBrigadeId
        ON dbo.TR_MathBattleBrigades(MathBattleBrigadeId);
END;
