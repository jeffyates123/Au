IF COL_LENGTH('dbo.TR_MathBattleResultActual', 'IsEstimated') IS NULL
BEGIN
    ALTER TABLE dbo.TR_MathBattleResultActual
    ADD IsEstimated BIT NOT NULL
        CONSTRAINT DF_TR_MathBattleResultActual_IsEstimated DEFAULT (0);
END;
