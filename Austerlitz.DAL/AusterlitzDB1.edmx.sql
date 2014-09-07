
-- --------------------------------------------------
-- Entity Designer DDL Script for SQL Server 2005, 2008, 2012 and Azure
-- --------------------------------------------------
-- Date Created: 09/04/2014 20:09:43
-- Generated from EDMX file: C:\Code\austerlitz\Austerlitz.DAL\AusterlitzDB1.edmx
-- --------------------------------------------------

SET QUOTED_IDENTIFIER OFF;
GO
USE [Austerlitz];
GO
IF SCHEMA_ID(N'dbo') IS NULL EXECUTE(N'CREATE SCHEMA [dbo]');
GO

-- --------------------------------------------------
-- Dropping existing FOREIGN KEY constraints
-- --------------------------------------------------


-- --------------------------------------------------
-- Dropping existing tables
-- --------------------------------------------------

IF OBJECT_ID(N'[dbo].[REF_ArmyList]', 'U') IS NOT NULL
    DROP TABLE [dbo].[REF_ArmyList];
GO
IF OBJECT_ID(N'[dbo].[REF_PoliticalMapCoordinates]', 'U') IS NOT NULL
    DROP TABLE [dbo].[REF_PoliticalMapCoordinates];
GO
IF OBJECT_ID(N'[dbo].[REF_Population]', 'U') IS NOT NULL
    DROP TABLE [dbo].[REF_Population];
GO
IF OBJECT_ID(N'[dbo].[REF_Ships]', 'U') IS NOT NULL
    DROP TABLE [dbo].[REF_Ships];
GO
IF OBJECT_ID(N'[dbo].[REF_States]', 'U') IS NOT NULL
    DROP TABLE [dbo].[REF_States];
GO
IF OBJECT_ID(N'[dbo].[REF_Terrain]', 'U') IS NOT NULL
    DROP TABLE [dbo].[REF_Terrain];
GO
IF OBJECT_ID(N'[dbo].[REF_UnitWeightsRates]', 'U') IS NOT NULL
    DROP TABLE [dbo].[REF_UnitWeightsRates];
GO
IF OBJECT_ID(N'[dbo].[TR_BaggageTrains]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TR_BaggageTrains];
GO
IF OBJECT_ID(N'[dbo].[TR_Barracks]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TR_Barracks];
GO
IF OBJECT_ID(N'[dbo].[TR_Brigades]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TR_Brigades];
GO
IF OBJECT_ID(N'[dbo].[TR_Commanders]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TR_Commanders];
GO
IF OBJECT_ID(N'[dbo].[TR_MapCoordinates]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TR_MapCoordinates];
GO
IF OBJECT_ID(N'[dbo].[TR_MerchantShips]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TR_MerchantShips];
GO
IF OBJECT_ID(N'[dbo].[TR_Spies]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TR_Spies];
GO
IF OBJECT_ID(N'[dbo].[TR_StateRelationships]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TR_StateRelationships];
GO
IF OBJECT_ID(N'[dbo].[TR_TradingPortsAndCities]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TR_TradingPortsAndCities];
GO
IF OBJECT_ID(N'[dbo].[TR_Warehouses]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TR_Warehouses];
GO
IF OBJECT_ID(N'[dbo].[TR_Warships]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TR_Warships];
GO
IF OBJECT_ID(N'[dbo].[TS_00TurnDetails]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TS_00TurnDetails];
GO
IF OBJECT_ID(N'[dbo].[TS_01TransferGoods]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TS_01TransferGoods];
GO
IF OBJECT_ID(N'[dbo].[TS_02DemolishItems]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TS_02DemolishItems];
GO
IF OBJECT_ID(N'[dbo].[TS_03SetUpBrigades]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TS_03SetUpBrigades];
GO
IF OBJECT_ID(N'[dbo].[TS_04SetUpAdditionalBrigades]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TS_04SetUpAdditionalBrigades];
GO
IF OBJECT_ID(N'[dbo].[TS_05IncreaseHeadcount]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TS_05IncreaseHeadcount];
GO
IF OBJECT_ID(N'[dbo].[TS_06IncreaseBrigadeXP]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TS_06IncreaseBrigadeXP];
GO
IF OBJECT_ID(N'[dbo].[TS_07ExchangeBattalions]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TS_07ExchangeBattalions];
GO
IF OBJECT_ID(N'[dbo].[TS_08MergeBattalions]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TS_08MergeBattalions];
GO
IF OBJECT_ID(N'[dbo].[TS_09RepairShips_BaggageTrains]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TS_09RepairShips_BaggageTrains];
GO
IF OBJECT_ID(N'[dbo].[TS_10BuildShips]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TS_10BuildShips];
GO
IF OBJECT_ID(N'[dbo].[TS_11BuildBaggageTrain]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TS_11BuildBaggageTrain];
GO
IF OBJECT_ID(N'[dbo].[TS_12IncreasePopulationDensity]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TS_12IncreasePopulationDensity];
GO
IF OBJECT_ID(N'[dbo].[TS_13BuildProductionSites]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TS_13BuildProductionSites];
GO
IF OBJECT_ID(N'[dbo].[TS_14FormFederations]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TS_14FormFederations];
GO
IF OBJECT_ID(N'[dbo].[TS_15CoastalDefence]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TS_15CoastalDefence];
GO
IF OBJECT_ID(N'[dbo].[TS_16SeaBlockade]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TS_16SeaBlockade];
GO
IF OBJECT_ID(N'[dbo].[TS_17TradeAndLoading1]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TS_17TradeAndLoading1];
GO
IF OBJECT_ID(N'[dbo].[TS_18Movement]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TS_18Movement];
GO
IF OBJECT_ID(N'[dbo].[TS_19TradeAndLoading2]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TS_19TradeAndLoading2];
GO
IF OBJECT_ID(N'[dbo].[TS_20Boarding]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TS_20Boarding];
GO
IF OBJECT_ID(N'[dbo].[TS_21HandOverTerritory]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TS_21HandOverTerritory];
GO
IF OBJECT_ID(N'[dbo].[TS_22ChangeNames]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TS_22ChangeNames];
GO
IF OBJECT_ID(N'[dbo].[TS_23ChangeStateRelationships]', 'U') IS NOT NULL
    DROP TABLE [dbo].[TS_23ChangeStateRelationships];
GO
IF OBJECT_ID(N'[AusterlitzModelStoreContainer].[REF_ProductionSites]', 'U') IS NOT NULL
    DROP TABLE [AusterlitzModelStoreContainer].[REF_ProductionSites];
GO

-- --------------------------------------------------
-- Creating all tables
-- --------------------------------------------------

-- Creating table 'REF_ArmyList'
CREATE TABLE [dbo].[REF_ArmyList] (
    [ItemNo] int  NOT NULL,
    [State] varchar(1)  NOT NULL,
    [Name] varchar(300)  NOT NULL,
    [ShortName] varchar(2)  NOT NULL,
    [Cost] int  NOT NULL,
    [EcPtsPer25] int  NOT NULL,
    [EF] int  NOT NULL,
    [HC] int  NOT NULL,
    [LR] int  NOT NULL,
    [RG] int  NOT NULL,
    [SimMP] int  NOT NULL,
    [MP] int  NOT NULL,
    [Formation] varchar(30)  NULL,
    [Allow_Co] bit  NOT NULL,
    [Allow_Li] bit  NOT NULL,
    [Allow_Sk] bit  NOT NULL,
    [Allow_Sq] bit  NOT NULL,
    [IsColonial] bit  NOT NULL,
    [TroopSpecification] varchar(15)  NULL,
    [IsCavalry] bit  NOT NULL
);
GO

-- Creating table 'REF_Population'
CREATE TABLE [dbo].[REF_Population] (
    [Density] int  NOT NULL,
    [TotalCitizens] int  NOT NULL,
    [ExtraCitizensRequired] int  NOT NULL,
    [StoneOrWood] varchar(1)  NOT NULL,
    [GoodAmount] int  NOT NULL
);
GO

-- Creating table 'REF_ProductionSites'
CREATE TABLE [dbo].[REF_ProductionSites] (
    [SiteTypeNo] int  NOT NULL,
    [Terrain] varchar(10)  NOT NULL,
    [SiteType] varchar(30)  NOT NULL,
    [Symbol] varchar(1)  NOT NULL,
    [SecondarySymbol] varchar(1)  NULL,
    [Cost] int  NOT NULL,
    [Maintenance] int  NOT NULL,
    [MinPopulation] int  NOT NULL,
    [MaxPopulation] int  NOT NULL,
    [ProductionType] varchar(15)  NULL,
    [MinProduction] int  NOT NULL,
    [MaxProduction] int  NOT NULL,
    [MinProductionColonial] int  NULL,
    [MaxProductionColonial] nchar(10)  NULL,
    [BonusSymbol] varchar(1)  NULL,
    [BonusPercentage] int  NULL,
    [CitizensRequired] int  NOT NULL
);
GO

-- Creating table 'REF_Ships'
CREATE TABLE [dbo].[REF_Ships] (
    [Type] int  NOT NULL,
    [Name] varchar(30)  NOT NULL,
    [Wood] int  NOT NULL,
    [EcPts] int  NOT NULL,
    [Textiles] int  NOT NULL,
    [Citizens] int  NOT NULL,
    [Cost] int  NOT NULL,
    [Maintenance] int  NOT NULL,
    [LoadCapacity] int  NOT NULL,
    [MovementFactor] int  NOT NULL,
    [ShipClass] int  NULL
);
GO

-- Creating table 'REF_States'
CREATE TABLE [dbo].[REF_States] (
    [State] varchar(1)  NOT NULL,
    [StateName] varchar(30)  NOT NULL,
    [TaxRate] int  NOT NULL,
    [FleetMorale] int  NOT NULL
);
GO

-- Creating table 'REF_Terrain'
CREATE TABLE [dbo].[REF_Terrain] (
    [TerrainId] varchar(1)  NOT NULL,
    [MaxPopulation] int  NULL,
    [MP] int  NULL,
    [Attrition] decimal(3,2)  NULL
);
GO

-- Creating table 'REF_UnitWeightsRates'
CREATE TABLE [dbo].[REF_UnitWeightsRates] (
    [WeightOfItem] int  NOT NULL,
    [ItemType] varchar(20)  NOT NULL,
    [GoodsFactors] int  NULL
);
GO

-- Creating table 'TR_BaggageTrains'
CREATE TABLE [dbo].[TR_BaggageTrains] (
    [TurnId] varchar(13)  NOT NULL,
    [ItemNo] int  NOT NULL,
    [XCoordinate] int  NOT NULL,
    [YCoordinate] int  NOT NULL,
    [FederationNo] int  NOT NULL,
    [MP] int  NOT NULL,
    [Condition] int  NOT NULL,
    [Goods1] int  NOT NULL,
    [Quantity1] int  NOT NULL,
    [Goods2] int  NOT NULL,
    [Quantity2] int  NOT NULL,
    [Money] int  NOT NULL
);
GO

-- Creating table 'TR_Barracks'
CREATE TABLE [dbo].[TR_Barracks] (
    [ItemNo] int  NOT NULL,
    [TurnId] varchar(13)  NOT NULL,
    [Type] varchar(3)  NOT NULL,
    [Money] int  NOT NULL,
    [Citizens] int  NOT NULL,
    [EcPts] int  NOT NULL,
    [Wood] int  NOT NULL,
    [Horses] int  NOT NULL,
    [Text] int  NOT NULL,
    [FortressSize] int  NOT NULL
);
GO

-- Creating table 'TR_Brigades'
CREATE TABLE [dbo].[TR_Brigades] (
    [ItemNo] int  NOT NULL,
    [TurnId] varchar(13)  NOT NULL,
    [Name] varchar(16)  NOT NULL,
    [CoordinateX_OrState] varchar(3)  NOT NULL,
    [CoordinateY_OrFleet] varchar(3)  NOT NULL,
    [MP] int  NOT NULL,
    [Federation] int  NOT NULL,
    [Batt1Type] varchar(2)  NULL,
    [Batt1EF] int  NULL,
    [Batt1Size] int  NULL,
    [Batt2Type] varchar(2)  NULL,
    [Batt2EF] int  NULL,
    [Batt2Size] int  NULL,
    [Batt3Type] varchar(2)  NULL,
    [Batt3EF] int  NULL,
    [Batt3Size] int  NULL,
    [Batt4Type] varchar(2)  NULL,
    [Batt4EF] int  NULL,
    [Batt4Size] int  NULL,
    [Batt5Type] varchar(2)  NULL,
    [Batt5EF] int  NULL,
    [Batt5Size] int  NULL,
    [Batt6Type] varchar(2)  NULL,
    [Batt6EF] int  NULL,
    [Batt6Size] int  NULL,
    [Batt7Type] varchar(2)  NULL,
    [Batt7EF] int  NULL,
    [Batt7Size] int  NULL
);
GO

-- Creating table 'TR_Commanders'
CREATE TABLE [dbo].[TR_Commanders] (
    [ItemNo] int  NOT NULL,
    [TurnId] varchar(13)  NOT NULL,
    [Rank] varchar(15)  NOT NULL,
    [Name] varchar(30)  NOT NULL,
    [CoordinateX] int  NOT NULL,
    [CoordinateY] int  NOT NULL,
    [Boarded] int  NOT NULL,
    [Federation] int  NOT NULL,
    [MP] int  NOT NULL,
    [CommandCapacity] int  NOT NULL
);
GO

-- Creating table 'TR_MerchantShips'
CREATE TABLE [dbo].[TR_MerchantShips] (
    [TurnId] varchar(13)  NOT NULL,
    [ItemNo] int  NOT NULL,
    [Type] int  NOT NULL,
    [XCoordinate] int  NOT NULL,
    [YCoordinate] int  NOT NULL,
    [FleetNo] int  NOT NULL,
    [MP] int  NOT NULL,
    [Condition] int  NOT NULL,
    [Age] int  NOT NULL,
    [Goods1] int  NOT NULL,
    [Quantity1] int  NOT NULL,
    [Goods2] int  NOT NULL,
    [Quantity2] int  NOT NULL,
    [Money] int  NOT NULL
);
GO

-- Creating table 'TR_Spies'
CREATE TABLE [dbo].[TR_Spies] (
    [TurnId] varchar(13)  NOT NULL,
    [ItemNo] int  NOT NULL,
    [XCoordinate] int  NOT NULL,
    [YCoordinate] int  NOT NULL,
    [FederationNo] int  NOT NULL,
    [Reports] varchar(100)  NOT NULL,
    [FortressSize] varchar(15)  NOT NULL
);
GO

-- Creating table 'TR_StateRelationships'
CREATE TABLE [dbo].[TR_StateRelationships] (
    [TurnId] varchar(13)  NOT NULL,
    [State] varchar(1)  NOT NULL,
    [Relationship] int  NOT NULL
);
GO

-- Creating table 'TR_Warehouses'
CREATE TABLE [dbo].[TR_Warehouses] (
    [ItemNo] int  NOT NULL,
    [TurnId] varchar(13)  NOT NULL,
    [WarehouseName] varchar(30)  NOT NULL,
    [Inhabitants] int  NOT NULL,
    [Foreign] int  NOT NULL,
    [Money] int  NOT NULL,
    [Citizens] int  NOT NULL,
    [EcPts] int  NOT NULL,
    [Food] int  NOT NULL,
    [Stone] int  NOT NULL,
    [Wood] int  NOT NULL,
    [Ore] int  NOT NULL,
    [Zinc] int  NOT NULL,
    [Horses] int  NOT NULL,
    [Text] int  NOT NULL,
    [Wool] int  NOT NULL,
    [Gold] int  NOT NULL,
    [Wine] int  NOT NULL
);
GO

-- Creating table 'TR_Warships'
CREATE TABLE [dbo].[TR_Warships] (
    [TurnId] varchar(13)  NOT NULL,
    [ItemNo] int  NOT NULL,
    [Type] int  NOT NULL,
    [XCoordinate] int  NOT NULL,
    [YCoordinate] int  NOT NULL,
    [FleetNo] int  NOT NULL,
    [MP] int  NOT NULL,
    [Condition] int  NOT NULL,
    [Age] int  NOT NULL,
    [Marines] int  NOT NULL,
    [Brigade1] int  NOT NULL,
    [Brigade2] int  NOT NULL
);
GO

-- Creating table 'TS_00TurnDetails'
CREATE TABLE [dbo].[TS_00TurnDetails] (
    [TurnId] varchar(13)  NOT NULL,
    [State] varchar(1)  NULL,
    [GameNo] nchar(10)  NULL,
    [Month] varchar(3)  NULL,
    [Year] int  NULL,
    [PlayerName] varchar(50)  NULL,
    [AccountNo] varchar(20)  NULL,
    [ProcessDate] datetime  NULL,
    [FundsSentCash] int  NULL,
    [FundsSentCheque] int  NULL,
    [FundsSentPO] int  NULL
);
GO

-- Creating table 'TS_01TransferGoods'
CREATE TABLE [dbo].[TS_01TransferGoods] (
    [TurnId] varchar(13)  NOT NULL,
    [OrderNo] int  NOT NULL,
    [From] int  NULL,
    [To] int  NULL,
    [Louisdore] int  NULL,
    [Citizens] int  NULL,
    [EcPts] int  NULL,
    [Wood] int  NULL,
    [Horses] int  NULL,
    [Textiles] int  NULL
);
GO

-- Creating table 'TS_02DemolishItems'
CREATE TABLE [dbo].[TS_02DemolishItems] (
    [TurnId] varchar(13)  NOT NULL,
    [OrderNo] int  NOT NULL,
    [ItemNo] int  NULL
);
GO

-- Creating table 'TS_03SetUpBrigades'
CREATE TABLE [dbo].[TS_03SetUpBrigades] (
    [TurnId] varchar(13)  NOT NULL,
    [OrderNo] int  NOT NULL,
    [Depot] int  NULL,
    [Batt1] int  NULL,
    [Batt2] int  NULL,
    [Batt3] int  NULL,
    [Batt4] int  NULL,
    [Batt5] int  NULL,
    [Batt6] int  NULL,
    [Batt7] int  NULL,
    [BrigadeName] varchar(16)  NOT NULL
);
GO

-- Creating table 'TS_04SetUpAdditionalBrigades'
CREATE TABLE [dbo].[TS_04SetUpAdditionalBrigades] (
    [TurnId] varchar(13)  NOT NULL,
    [OrderNo] int  NOT NULL,
    [BrigadeNo] int  NULL,
    [BattType] int  NULL
);
GO

-- Creating table 'TS_05IncreaseHeadcount'
CREATE TABLE [dbo].[TS_05IncreaseHeadcount] (
    [TurnId] varchar(13)  NOT NULL,
    [OrderNo] int  NOT NULL,
    [BrigadeOrFederation] int  NULL,
    [IncreaseAmount] int  NULL
);
GO

-- Creating table 'TS_06IncreaseBrigadeXP'
CREATE TABLE [dbo].[TS_06IncreaseBrigadeXP] (
    [TurnId] varchar(13)  NOT NULL,
    [OrderNo] int  NOT NULL,
    [BrigadeOrFederation] int  NULL
);
GO

-- Creating table 'TS_07ExchangeBattalions'
CREATE TABLE [dbo].[TS_07ExchangeBattalions] (
    [TurnId] varchar(13)  NOT NULL,
    [OrderNo] int  NOT NULL,
    [BrigadeA] int  NULL,
    [BattA] int  NULL,
    [BrigadeB] int  NULL,
    [BattB] int  NULL
);
GO

-- Creating table 'TS_08MergeBattalions'
CREATE TABLE [dbo].[TS_08MergeBattalions] (
    [TurnId] varchar(13)  NOT NULL,
    [OrderNo] int  NOT NULL,
    [BridageA] int  NULL,
    [BattA] int  NULL,
    [BrigadeB] int  NULL,
    [BattB] int  NULL
);
GO

-- Creating table 'TS_09RepairShips_BaggageTrains'
CREATE TABLE [dbo].[TS_09RepairShips_BaggageTrains] (
    [TurnId] varchar(13)  NOT NULL,
    [OrderNo] int  NOT NULL,
    [ItemNo] int  NULL
);
GO

-- Creating table 'TS_10BuildShips'
CREATE TABLE [dbo].[TS_10BuildShips] (
    [TurnId] varchar(13)  NOT NULL,
    [OrderNo] int  NOT NULL,
    [Shipyard] int  NULL,
    [ShipType] int  NULL,
    [Name_WarshipOnly] nchar(10)  NULL
);
GO

-- Creating table 'TS_11BuildBaggageTrain'
CREATE TABLE [dbo].[TS_11BuildBaggageTrain] (
    [TurnId] varchar(13)  NOT NULL,
    [OrderNo] int  NOT NULL,
    [Barracks] int  NULL
);
GO

-- Creating table 'TS_12IncreasePopulationDensity'
CREATE TABLE [dbo].[TS_12IncreasePopulationDensity] (
    [TurnId] varchar(13)  NOT NULL,
    [OrderNo] int  NOT NULL,
    [YCoordinate] int  NULL,
    [XCoordinate] int  NULL
);
GO

-- Creating table 'TS_13BuildProductionSites'
CREATE TABLE [dbo].[TS_13BuildProductionSites] (
    [TurnId] varchar(13)  NOT NULL,
    [OrderNo] int  NOT NULL,
    [ProdSiteType] int  NULL,
    [XCoordinate] int  NULL,
    [YCoordinate] int  NULL
);
GO

-- Creating table 'TS_14FormFederations'
CREATE TABLE [dbo].[TS_14FormFederations] (
    [TurnId] varchar(13)  NOT NULL,
    [OrderNo] int  NOT NULL,
    [ItemNo] int  NULL,
    [Federation_Fleet] int  NULL
);
GO

-- Creating table 'TS_15CoastalDefence'
CREATE TABLE [dbo].[TS_15CoastalDefence] (
    [TurnId] varchar(13)  NOT NULL,
    [OrderNo] int  NOT NULL,
    [FleetNo] int  NULL
);
GO

-- Creating table 'TS_16SeaBlockade'
CREATE TABLE [dbo].[TS_16SeaBlockade] (
    [TurnId] varchar(13)  NOT NULL,
    [OrderNo] int  NOT NULL,
    [FleetNo] int  NULL,
    [StateA_Or_Fleet0] varchar(2)  NULL,
    [StateB] varchar(1)  NULL,
    [StateC] varchar(1)  NULL,
    [StateD] varchar(1)  NULL,
    [StateE] varchar(1)  NULL
);
GO

-- Creating table 'TS_17TradeAndLoading1'
CREATE TABLE [dbo].[TS_17TradeAndLoading1] (
    [TurnId] varchar(13)  NOT NULL,
    [OrderNo] int  NOT NULL,
    [Goods] int  NULL,
    [Quantity] int  NULL,
    [From] int  NULL,
    [To] int  NULL
);
GO

-- Creating table 'TS_18Movement'
CREATE TABLE [dbo].[TS_18Movement] (
    [TurnId] varchar(13)  NOT NULL,
    [OrderNo] int  NOT NULL,
    [ItemNo] int  NULL,
    [Direction1] int  NULL,
    [Distance1] int  NULL,
    [Direction2] int  NULL,
    [Distance2] int  NULL,
    [Direction3] int  NULL,
    [Distance3] int  NULL
);
GO

-- Creating table 'TS_19TradeAndLoading2'
CREATE TABLE [dbo].[TS_19TradeAndLoading2] (
    [TurnId] varchar(13)  NOT NULL,
    [OrderNo] int  NOT NULL,
    [Goods] int  NULL,
    [Quantity] int  NULL,
    [Source] int  NULL,
    [Destination] int  NULL
);
GO

-- Creating table 'TS_20Boarding'
CREATE TABLE [dbo].[TS_20Boarding] (
    [TurnId] varchar(13)  NOT NULL,
    [OrderNo] int  NOT NULL,
    [Command] int  NULL,
    [ItemNo] int  NULL,
    [FleetNo] int  NULL,
    [FleetOwner] int  NULL
);
GO

-- Creating table 'TS_21HandOverTerritory'
CREATE TABLE [dbo].[TS_21HandOverTerritory] (
    [TurnId] varchar(13)  NOT NULL,
    [OrderNo] int  NOT NULL,
    [State] varchar(1)  NULL,
    [ShipNumber] int  NULL,
    [XCoordinate] int  NULL,
    [YCoordinate] int  NULL
);
GO

-- Creating table 'TS_22ChangeNames'
CREATE TABLE [dbo].[TS_22ChangeNames] (
    [TurnId] varchar(13)  NOT NULL,
    [OrderNo] int  NOT NULL,
    [ItemNo] int  NULL,
    [Name] varchar(30)  NULL
);
GO

-- Creating table 'TS_23ChangeStateRelationships'
CREATE TABLE [dbo].[TS_23ChangeStateRelationships] (
    [TurnId] varchar(13)  NOT NULL,
    [OrderNo] int  NOT NULL,
    [State] varchar(1)  NULL,
    [Relationship] int  NULL
);
GO

-- Creating table 'TR_MapCoordinates'
CREATE TABLE [dbo].[TR_MapCoordinates] (
    [TurnId] varchar(13)  NOT NULL,
    [X] int  NOT NULL,
    [Y] int  NOT NULL,
    [State] varchar(1)  NOT NULL,
    [ProductionSite] varchar(1)  NOT NULL,
    [Population] varchar(1)  NOT NULL
);
GO

-- Creating table 'REF_PoliticalMapCoordinates'
CREATE TABLE [dbo].[REF_PoliticalMapCoordinates] (
    [X] int  NOT NULL,
    [Y] int  NOT NULL,
    [Owner] varchar(1)  NOT NULL,
    [Terrain] varchar(1)  NOT NULL,
    [Bonus] varchar(1)  NOT NULL
);
GO

-- Creating table 'TR_TradingPortsAndCities'
CREATE TABLE [dbo].[TR_TradingPortsAndCities] (
    [TurnId] varchar(13)  NOT NULL,
    [ItemNo] int  NOT NULL,
    [XCoordinate] int  NOT NULL,
    [YCoordinate] int  NOT NULL,
    [Rate] int  NOT NULL,
    [EctPts] int  NOT NULL,
    [Food] int  NOT NULL,
    [Stone] int  NOT NULL,
    [Wood] int  NOT NULL,
    [Ore] int  NOT NULL,
    [Zinc] int  NOT NULL,
    [Horses] int  NOT NULL,
    [Text] int  NOT NULL,
    [Wool] int  NOT NULL,
    [Gold] int  NOT NULL,
    [Wine] int  NOT NULL
);
GO

-- --------------------------------------------------
-- Creating all PRIMARY KEY constraints
-- --------------------------------------------------

-- Creating primary key on [ItemNo], [State] in table 'REF_ArmyList'
ALTER TABLE [dbo].[REF_ArmyList]
ADD CONSTRAINT [PK_REF_ArmyList]
    PRIMARY KEY CLUSTERED ([ItemNo], [State] ASC);
GO

-- Creating primary key on [Density] in table 'REF_Population'
ALTER TABLE [dbo].[REF_Population]
ADD CONSTRAINT [PK_REF_Population]
    PRIMARY KEY CLUSTERED ([Density] ASC);
GO

-- Creating primary key on [SiteTypeNo], [Terrain], [SiteType], [Symbol] in table 'REF_ProductionSites'
ALTER TABLE [dbo].[REF_ProductionSites]
ADD CONSTRAINT [PK_REF_ProductionSites]
    PRIMARY KEY CLUSTERED ([SiteTypeNo], [Terrain], [SiteType], [Symbol] ASC);
GO

-- Creating primary key on [Type] in table 'REF_Ships'
ALTER TABLE [dbo].[REF_Ships]
ADD CONSTRAINT [PK_REF_Ships]
    PRIMARY KEY CLUSTERED ([Type] ASC);
GO

-- Creating primary key on [State] in table 'REF_States'
ALTER TABLE [dbo].[REF_States]
ADD CONSTRAINT [PK_REF_States]
    PRIMARY KEY CLUSTERED ([State] ASC);
GO

-- Creating primary key on [TerrainId] in table 'REF_Terrain'
ALTER TABLE [dbo].[REF_Terrain]
ADD CONSTRAINT [PK_REF_Terrain]
    PRIMARY KEY CLUSTERED ([TerrainId] ASC);
GO

-- Creating primary key on [ItemType] in table 'REF_UnitWeightsRates'
ALTER TABLE [dbo].[REF_UnitWeightsRates]
ADD CONSTRAINT [PK_REF_UnitWeightsRates]
    PRIMARY KEY CLUSTERED ([ItemType] ASC);
GO

-- Creating primary key on [TurnId], [ItemNo] in table 'TR_BaggageTrains'
ALTER TABLE [dbo].[TR_BaggageTrains]
ADD CONSTRAINT [PK_TR_BaggageTrains]
    PRIMARY KEY CLUSTERED ([TurnId], [ItemNo] ASC);
GO

-- Creating primary key on [TurnId], [ItemNo] in table 'TR_Barracks'
ALTER TABLE [dbo].[TR_Barracks]
ADD CONSTRAINT [PK_TR_Barracks]
    PRIMARY KEY CLUSTERED ([TurnId], [ItemNo] ASC);
GO

-- Creating primary key on [TurnId], [ItemNo] in table 'TR_Brigades'
ALTER TABLE [dbo].[TR_Brigades]
ADD CONSTRAINT [PK_TR_Brigades]
    PRIMARY KEY CLUSTERED ([TurnId], [ItemNo] ASC);
GO

-- Creating primary key on [TurnId], [ItemNo] in table 'TR_Commanders'
ALTER TABLE [dbo].[TR_Commanders]
ADD CONSTRAINT [PK_TR_Commanders]
    PRIMARY KEY CLUSTERED ([TurnId], [ItemNo] ASC);
GO

-- Creating primary key on [TurnId], [ItemNo] in table 'TR_MerchantShips'
ALTER TABLE [dbo].[TR_MerchantShips]
ADD CONSTRAINT [PK_TR_MerchantShips]
    PRIMARY KEY CLUSTERED ([TurnId], [ItemNo] ASC);
GO

-- Creating primary key on [TurnId], [ItemNo] in table 'TR_Spies'
ALTER TABLE [dbo].[TR_Spies]
ADD CONSTRAINT [PK_TR_Spies]
    PRIMARY KEY CLUSTERED ([TurnId], [ItemNo] ASC);
GO

-- Creating primary key on [TurnId], [State] in table 'TR_StateRelationships'
ALTER TABLE [dbo].[TR_StateRelationships]
ADD CONSTRAINT [PK_TR_StateRelationships]
    PRIMARY KEY CLUSTERED ([TurnId], [State] ASC);
GO

-- Creating primary key on [TurnId], [ItemNo] in table 'TR_Warehouses'
ALTER TABLE [dbo].[TR_Warehouses]
ADD CONSTRAINT [PK_TR_Warehouses]
    PRIMARY KEY CLUSTERED ([TurnId], [ItemNo] ASC);
GO

-- Creating primary key on [TurnId], [ItemNo] in table 'TR_Warships'
ALTER TABLE [dbo].[TR_Warships]
ADD CONSTRAINT [PK_TR_Warships]
    PRIMARY KEY CLUSTERED ([TurnId], [ItemNo] ASC);
GO

-- Creating primary key on [TurnId] in table 'TS_00TurnDetails'
ALTER TABLE [dbo].[TS_00TurnDetails]
ADD CONSTRAINT [PK_TS_00TurnDetails]
    PRIMARY KEY CLUSTERED ([TurnId] ASC);
GO

-- Creating primary key on [TurnId], [OrderNo] in table 'TS_01TransferGoods'
ALTER TABLE [dbo].[TS_01TransferGoods]
ADD CONSTRAINT [PK_TS_01TransferGoods]
    PRIMARY KEY CLUSTERED ([TurnId], [OrderNo] ASC);
GO

-- Creating primary key on [TurnId], [OrderNo] in table 'TS_02DemolishItems'
ALTER TABLE [dbo].[TS_02DemolishItems]
ADD CONSTRAINT [PK_TS_02DemolishItems]
    PRIMARY KEY CLUSTERED ([TurnId], [OrderNo] ASC);
GO

-- Creating primary key on [TurnId], [OrderNo] in table 'TS_03SetUpBrigades'
ALTER TABLE [dbo].[TS_03SetUpBrigades]
ADD CONSTRAINT [PK_TS_03SetUpBrigades]
    PRIMARY KEY CLUSTERED ([TurnId], [OrderNo] ASC);
GO

-- Creating primary key on [TurnId], [OrderNo] in table 'TS_04SetUpAdditionalBrigades'
ALTER TABLE [dbo].[TS_04SetUpAdditionalBrigades]
ADD CONSTRAINT [PK_TS_04SetUpAdditionalBrigades]
    PRIMARY KEY CLUSTERED ([TurnId], [OrderNo] ASC);
GO

-- Creating primary key on [TurnId], [OrderNo] in table 'TS_05IncreaseHeadcount'
ALTER TABLE [dbo].[TS_05IncreaseHeadcount]
ADD CONSTRAINT [PK_TS_05IncreaseHeadcount]
    PRIMARY KEY CLUSTERED ([TurnId], [OrderNo] ASC);
GO

-- Creating primary key on [TurnId], [OrderNo] in table 'TS_06IncreaseBrigadeXP'
ALTER TABLE [dbo].[TS_06IncreaseBrigadeXP]
ADD CONSTRAINT [PK_TS_06IncreaseBrigadeXP]
    PRIMARY KEY CLUSTERED ([TurnId], [OrderNo] ASC);
GO

-- Creating primary key on [TurnId], [OrderNo] in table 'TS_07ExchangeBattalions'
ALTER TABLE [dbo].[TS_07ExchangeBattalions]
ADD CONSTRAINT [PK_TS_07ExchangeBattalions]
    PRIMARY KEY CLUSTERED ([TurnId], [OrderNo] ASC);
GO

-- Creating primary key on [TurnId], [OrderNo] in table 'TS_08MergeBattalions'
ALTER TABLE [dbo].[TS_08MergeBattalions]
ADD CONSTRAINT [PK_TS_08MergeBattalions]
    PRIMARY KEY CLUSTERED ([TurnId], [OrderNo] ASC);
GO

-- Creating primary key on [TurnId], [OrderNo] in table 'TS_09RepairShips_BaggageTrains'
ALTER TABLE [dbo].[TS_09RepairShips_BaggageTrains]
ADD CONSTRAINT [PK_TS_09RepairShips_BaggageTrains]
    PRIMARY KEY CLUSTERED ([TurnId], [OrderNo] ASC);
GO

-- Creating primary key on [TurnId], [OrderNo] in table 'TS_10BuildShips'
ALTER TABLE [dbo].[TS_10BuildShips]
ADD CONSTRAINT [PK_TS_10BuildShips]
    PRIMARY KEY CLUSTERED ([TurnId], [OrderNo] ASC);
GO

-- Creating primary key on [TurnId], [OrderNo] in table 'TS_11BuildBaggageTrain'
ALTER TABLE [dbo].[TS_11BuildBaggageTrain]
ADD CONSTRAINT [PK_TS_11BuildBaggageTrain]
    PRIMARY KEY CLUSTERED ([TurnId], [OrderNo] ASC);
GO

-- Creating primary key on [TurnId], [OrderNo] in table 'TS_12IncreasePopulationDensity'
ALTER TABLE [dbo].[TS_12IncreasePopulationDensity]
ADD CONSTRAINT [PK_TS_12IncreasePopulationDensity]
    PRIMARY KEY CLUSTERED ([TurnId], [OrderNo] ASC);
GO

-- Creating primary key on [TurnId], [OrderNo] in table 'TS_13BuildProductionSites'
ALTER TABLE [dbo].[TS_13BuildProductionSites]
ADD CONSTRAINT [PK_TS_13BuildProductionSites]
    PRIMARY KEY CLUSTERED ([TurnId], [OrderNo] ASC);
GO

-- Creating primary key on [TurnId], [OrderNo] in table 'TS_14FormFederations'
ALTER TABLE [dbo].[TS_14FormFederations]
ADD CONSTRAINT [PK_TS_14FormFederations]
    PRIMARY KEY CLUSTERED ([TurnId], [OrderNo] ASC);
GO

-- Creating primary key on [TurnId], [OrderNo] in table 'TS_15CoastalDefence'
ALTER TABLE [dbo].[TS_15CoastalDefence]
ADD CONSTRAINT [PK_TS_15CoastalDefence]
    PRIMARY KEY CLUSTERED ([TurnId], [OrderNo] ASC);
GO

-- Creating primary key on [TurnId], [OrderNo] in table 'TS_16SeaBlockade'
ALTER TABLE [dbo].[TS_16SeaBlockade]
ADD CONSTRAINT [PK_TS_16SeaBlockade]
    PRIMARY KEY CLUSTERED ([TurnId], [OrderNo] ASC);
GO

-- Creating primary key on [TurnId], [OrderNo] in table 'TS_17TradeAndLoading1'
ALTER TABLE [dbo].[TS_17TradeAndLoading1]
ADD CONSTRAINT [PK_TS_17TradeAndLoading1]
    PRIMARY KEY CLUSTERED ([TurnId], [OrderNo] ASC);
GO

-- Creating primary key on [TurnId], [OrderNo] in table 'TS_18Movement'
ALTER TABLE [dbo].[TS_18Movement]
ADD CONSTRAINT [PK_TS_18Movement]
    PRIMARY KEY CLUSTERED ([TurnId], [OrderNo] ASC);
GO

-- Creating primary key on [TurnId], [OrderNo] in table 'TS_19TradeAndLoading2'
ALTER TABLE [dbo].[TS_19TradeAndLoading2]
ADD CONSTRAINT [PK_TS_19TradeAndLoading2]
    PRIMARY KEY CLUSTERED ([TurnId], [OrderNo] ASC);
GO

-- Creating primary key on [TurnId], [OrderNo] in table 'TS_20Boarding'
ALTER TABLE [dbo].[TS_20Boarding]
ADD CONSTRAINT [PK_TS_20Boarding]
    PRIMARY KEY CLUSTERED ([TurnId], [OrderNo] ASC);
GO

-- Creating primary key on [TurnId], [OrderNo] in table 'TS_21HandOverTerritory'
ALTER TABLE [dbo].[TS_21HandOverTerritory]
ADD CONSTRAINT [PK_TS_21HandOverTerritory]
    PRIMARY KEY CLUSTERED ([TurnId], [OrderNo] ASC);
GO

-- Creating primary key on [TurnId], [OrderNo] in table 'TS_22ChangeNames'
ALTER TABLE [dbo].[TS_22ChangeNames]
ADD CONSTRAINT [PK_TS_22ChangeNames]
    PRIMARY KEY CLUSTERED ([TurnId], [OrderNo] ASC);
GO

-- Creating primary key on [TurnId], [OrderNo] in table 'TS_23ChangeStateRelationships'
ALTER TABLE [dbo].[TS_23ChangeStateRelationships]
ADD CONSTRAINT [PK_TS_23ChangeStateRelationships]
    PRIMARY KEY CLUSTERED ([TurnId], [OrderNo] ASC);
GO

-- Creating primary key on [TurnId], [X], [Y] in table 'TR_MapCoordinates'
ALTER TABLE [dbo].[TR_MapCoordinates]
ADD CONSTRAINT [PK_TR_MapCoordinates]
    PRIMARY KEY CLUSTERED ([TurnId], [X], [Y] ASC);
GO

-- Creating primary key on [X], [Y] in table 'REF_PoliticalMapCoordinates'
ALTER TABLE [dbo].[REF_PoliticalMapCoordinates]
ADD CONSTRAINT [PK_REF_PoliticalMapCoordinates]
    PRIMARY KEY CLUSTERED ([X], [Y] ASC);
GO

-- Creating primary key on [TurnId], [ItemNo] in table 'TR_TradingPortsAndCities'
ALTER TABLE [dbo].[TR_TradingPortsAndCities]
ADD CONSTRAINT [PK_TR_TradingPortsAndCities]
    PRIMARY KEY CLUSTERED ([TurnId], [ItemNo] ASC);
GO

-- --------------------------------------------------
-- Creating all FOREIGN KEY constraints
-- --------------------------------------------------

-- --------------------------------------------------
-- Script has ended
-- --------------------------------------------------