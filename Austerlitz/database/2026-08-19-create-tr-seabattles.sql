IF OBJECT_ID('dbo.TR_SeaBattles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TR_SeaBattles (
        TurnId VARCHAR(13) NOT NULL,
        SeaBattleNo INT NOT NULL,
        GroupAName VARCHAR(32) NOT NULL,
        GroupBName VARCHAR(32) NOT NULL,
        StateA VARCHAR(1) NOT NULL,
        StateB VARCHAR(1) NOT NULL,
        X INT NOT NULL,
        Y INT NOT NULL,
        WinnerGroup VARCHAR(1) NULL,
        WinnerText VARCHAR(64) NULL,
        GroupATonnageBegin INT NOT NULL DEFAULT (0),
        GroupATonnageEnd INT NOT NULL DEFAULT (0),
        GroupATonnageLossPct DECIMAL(6,2) NOT NULL DEFAULT (0),
        GroupAMarinesBegin INT NOT NULL DEFAULT (0),
        GroupAMarinesEnd INT NOT NULL DEFAULT (0),
        GroupAMarinesLossPct DECIMAL(6,2) NOT NULL DEFAULT (0),
        GroupAAverageLossPct DECIMAL(6,2) NOT NULL DEFAULT (0),
        GroupBTonnageBegin INT NOT NULL DEFAULT (0),
        GroupBTonnageEnd INT NOT NULL DEFAULT (0),
        GroupBTonnageLossPct DECIMAL(6,2) NOT NULL DEFAULT (0),
        GroupBMarinesBegin INT NOT NULL DEFAULT (0),
        GroupBMarinesEnd INT NOT NULL DEFAULT (0),
        GroupBMarinesLossPct DECIMAL(6,2) NOT NULL DEFAULT (0),
        GroupBAverageLossPct DECIMAL(6,2) NOT NULL DEFAULT (0),
        CONSTRAINT PK_TR_SeaBattles PRIMARY KEY (TurnId, SeaBattleNo)
    );
END;

IF OBJECT_ID('dbo.TR_SeaBattleShips', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TR_SeaBattleShips (
        SeaBattleShipId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        TurnId VARCHAR(13) NOT NULL,
        SeaBattleNo INT NOT NULL,
        GroupSide VARCHAR(1) NOT NULL,
        Phase VARCHAR(16) NOT NULL,
        ShipKind VARCHAR(16) NOT NULL,
        ReportShipNo INT NULL,
        FinalItemNo INT NULL,
        Type INT NULL,
        Name VARCHAR(32) NULL,
        Tonnage INT NULL,
        Marines INT NULL,
        Brigade VARCHAR(8) NULL,
        ConditionPct INT NULL,
        Goods1 INT NULL,
        Goods2 INT NULL
    );
END;

IF OBJECT_ID('dbo.TR_SeaBattleLongRangeActions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TR_SeaBattleLongRangeActions (
        SeaBattleLongRangeActionId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        TurnId VARCHAR(13) NOT NULL,
        SeaBattleNo INT NOT NULL,
        RoundNo INT NOT NULL,
        GroupSide VARCHAR(1) NOT NULL,
        ReportShipNo INT NOT NULL,
        ShipType INT NOT NULL,
        Tonnage INT NOT NULL,
        Marines INT NOT NULL,
        EnemyShipNo INT NOT NULL
    );
END;

IF OBJECT_ID('dbo.TR_SeaBattleBoardingActions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TR_SeaBattleBoardingActions (
        SeaBattleBoardingActionId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        TurnId VARCHAR(13) NOT NULL,
        SeaBattleNo INT NOT NULL,
        RoundNo INT NOT NULL,
        ActionNo INT NOT NULL,
        AttackerShipNo INT NOT NULL,
        AttackerGroupSide VARCHAR(1) NOT NULL,
        AttackerMarines INT NOT NULL,
        AttackerOutcome VARCHAR(1) NOT NULL,
        DefenderShipNo INT NOT NULL,
        DefenderGroupSide VARCHAR(1) NOT NULL,
        DefenderMarines INT NOT NULL,
        DefenderOutcome VARCHAR(1) NOT NULL
    );
END;

IF OBJECT_ID('dbo.TR_SeaBattleMerchantCaptures', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TR_SeaBattleMerchantCaptures (
        SeaBattleMerchantCaptureId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        TurnId VARCHAR(13) NOT NULL,
        SeaBattleNo INT NOT NULL,
        RoundNo INT NOT NULL,
        CapturedShipNo INT NOT NULL,
        CapturedByShipNo INT NOT NULL
    );
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.TR_SeaBattleShips')
      AND name = 'IX_TR_SeaBattleShips_TurnBattle'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_TR_SeaBattleShips_TurnBattle
        ON dbo.TR_SeaBattleShips (TurnId, SeaBattleNo, GroupSide, Phase, ShipKind);
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.TR_SeaBattleLongRangeActions')
      AND name = 'IX_TR_SeaBattleLongRangeActions_TurnBattle'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_TR_SeaBattleLongRangeActions_TurnBattle
        ON dbo.TR_SeaBattleLongRangeActions (TurnId, SeaBattleNo, RoundNo, GroupSide);
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.TR_SeaBattleBoardingActions')
      AND name = 'IX_TR_SeaBattleBoardingActions_TurnBattle'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_TR_SeaBattleBoardingActions_TurnBattle
        ON dbo.TR_SeaBattleBoardingActions (TurnId, SeaBattleNo, RoundNo, ActionNo);
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.TR_SeaBattleMerchantCaptures')
      AND name = 'IX_TR_SeaBattleMerchantCaptures_TurnBattle'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_TR_SeaBattleMerchantCaptures_TurnBattle
        ON dbo.TR_SeaBattleMerchantCaptures (TurnId, SeaBattleNo, RoundNo);
END;
