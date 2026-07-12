IF OBJECT_ID('dbo.TR_EconomyComputedSummary', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TR_EconomyComputedSummary (
        TurnId NVARCHAR(16) NOT NULL,
        Sphere NVARCHAR(16) NOT NULL,
        ComputedAtUtc DATETIME NULL,
        ComputedVersion INT NULL,
        StartingRevenueLd BIGINT NOT NULL DEFAULT 0,
        ArmyMaintLd BIGINT NOT NULL DEFAULT 0,
        NavyMaintLd BIGINT NOT NULL DEFAULT 0,
        ProductionMaintLd BIGINT NOT NULL DEFAULT 0,
        ArmyBuildingLd BIGINT NOT NULL DEFAULT 0,
        ArmyTrainingLd BIGINT NOT NULL DEFAULT 0,
        NavyBuildRepairLd BIGINT NOT NULL DEFAULT 0,
        ProductionBuildLd BIGINT NOT NULL DEFAULT 0,
        LdInBarracks BIGINT NOT NULL DEFAULT 0,
        BuildFundsAvailableLd BIGINT NOT NULL DEFAULT 0,
        TransferToEuropeLd BIGINT NOT NULL DEFAULT 0,
        TransferFromEuropeLd BIGINT NOT NULL DEFAULT 0,
        TransferToCaribbeanLd BIGINT NOT NULL DEFAULT 0,
        TransferFromCaribbeanLd BIGINT NOT NULL DEFAULT 0,
        TransferToIndiaLd BIGINT NOT NULL DEFAULT 0,
        TransferFromIndiaLd BIGINT NOT NULL DEFAULT 0,
        DirectSellingLd BIGINT NOT NULL DEFAULT 0,
        DirectBuyingLd BIGINT NOT NULL DEFAULT 0,
        TaxesLd BIGINT NOT NULL DEFAULT 0,
        LdProduction BIGINT NOT NULL DEFAULT 0,
        ProjectedNextMonthLd BIGINT NOT NULL DEFAULT 0,
        CONSTRAINT PK_TR_EconomyComputedSummary PRIMARY KEY (TurnId, Sphere)
    );
END;