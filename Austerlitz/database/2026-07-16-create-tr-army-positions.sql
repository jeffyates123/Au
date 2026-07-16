IF OBJECT_ID('dbo.TR_ArmyPositions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TR_ArmyPositions (
        TurnId VARCHAR(13) NOT NULL,
        X INT NOT NULL,
        Y INT NOT NULL,
        State VARCHAR(1) NOT NULL,
        Bat INT NOT NULL,
        CONSTRAINT PK_TR_ArmyPositions PRIMARY KEY (TurnId, X, Y, State)
    );
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.TR_ArmyPositions')
      AND name = 'IX_TR_ArmyPositions_TurnId'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_TR_ArmyPositions_TurnId
        ON dbo.TR_ArmyPositions (TurnId);
END;
