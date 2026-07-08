USE [Austerlitz];
GO

IF COL_LENGTH('dbo.TS_17TradeAndLoading1', 'RowMarker') IS NULL
BEGIN
    ALTER TABLE [dbo].[TS_17TradeAndLoading1]
    ADD [RowMarker] VARCHAR(20) NULL;
END
GO

IF COL_LENGTH('dbo.TS_19TradeAndLoading2', 'RowMarker') IS NULL
BEGIN
    ALTER TABLE [dbo].[TS_19TradeAndLoading2]
    ADD [RowMarker] VARCHAR(20) NULL;
END
GO
