-- Align dbo.TR_TradingPortsAndCities with EF model (AusterlitzDB1.edmx).
-- Fixes: Invalid column name 'X' when DB was created from an older edmx.sql that used XCoordinate/YCoordinate/Text and omitted Name.

USE [Austerlitz];
GO

IF OBJECT_ID(N'dbo.TR_TradingPortsAndCities', N'U') IS NULL
BEGIN
    RAISERROR ('Table dbo.TR_TradingPortsAndCities does not exist.', 16, 1);
    RETURN;
END
GO

IF COL_LENGTH('dbo.TR_TradingPortsAndCities', 'X') IS NULL
   AND COL_LENGTH('dbo.TR_TradingPortsAndCities', 'XCoordinate') IS NOT NULL
    EXEC sp_rename N'dbo.TR_TradingPortsAndCities.XCoordinate', N'X', N'COLUMN';
GO

IF COL_LENGTH('dbo.TR_TradingPortsAndCities', 'Y') IS NULL
   AND COL_LENGTH('dbo.TR_TradingPortsAndCities', 'YCoordinate') IS NOT NULL
    EXEC sp_rename N'dbo.TR_TradingPortsAndCities.YCoordinate', N'Y', N'COLUMN';
GO

IF COL_LENGTH('dbo.TR_TradingPortsAndCities', 'Textiles') IS NULL
   AND COL_LENGTH('dbo.TR_TradingPortsAndCities', 'Text') IS NOT NULL
    EXEC sp_rename N'dbo.TR_TradingPortsAndCities.Text', N'Textiles', N'COLUMN';
GO

IF COL_LENGTH('dbo.TR_TradingPortsAndCities', 'Name') IS NULL
BEGIN
    ALTER TABLE dbo.TR_TradingPortsAndCities
        ADD [Name] varchar(25) NOT NULL
            CONSTRAINT DF_TR_TradingPortsAndCities_Name_migration DEFAULT('');
    ALTER TABLE dbo.TR_TradingPortsAndCities
        DROP CONSTRAINT DF_TR_TradingPortsAndCities_Name_migration;
END
GO
