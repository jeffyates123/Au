using Austerlitz.DAL;
using Austerlitz.Models;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;

namespace Austerlitz.Services
{
    public partial class TurnReportImportService
    {
        private void SaveEconomySummary(ArrayList lineList, AusterlitzDbContext auDB, string turnId)
        {
            var summary = ParseEconomySummary(lineList, turnId);
            EnsureEconomySummaryTable(auDB);
            UpsertEconomySummary(auDB, summary);
        }

        private TR_EconomySummary ParseEconomySummary(ArrayList lineList, string turnId)
        {
            var summary = new TR_EconomySummary { TurnId = turnId };

            for (var i = 0; i < lineList.Count; i++)
            {
                var line = lineList[i].ToString();

                if (line.StartsWith("Maintenance costs:", StringComparison.OrdinalIgnoreCase))
                {
                    var maintenanceMatch = Regex.Match(
                        line,
                        @"Maintenance costs:\s*(?<ld>[\d,]+)\s+Louisdore\s+and\s+(?<eu>[\d,]+)\s+Worker\s+in\s+Europe,\s*(?<ca>[\d,]+)\s+in\s+the\s+Caribbean\s+and\s+(?<in>[\d,]+)\s+in\s+India",
                        RegexOptions.IgnoreCase);
                    if (maintenanceMatch.Success)
                    {
                        summary.ProductionMaintenanceLd = ParseDigitsToInt(maintenanceMatch.Groups["ld"].Value);
                        summary.EuropeMaintenanceWorkers = ParseDigitsToInt(maintenanceMatch.Groups["eu"].Value);
                        summary.CaribbeanMaintenanceWorkers = ParseDigitsToInt(maintenanceMatch.Groups["ca"].Value);
                        summary.IndiaMaintenanceWorkers = ParseDigitsToInt(maintenanceMatch.Groups["in"].Value);
                    }
                }
                else if (line.StartsWith("Pay ", StringComparison.OrdinalIgnoreCase))
                {
                    var commanderPayMatch = Regex.Match(line, @"Pay\s+(?<ld>[\d,]+)\s+Louisdore", RegexOptions.IgnoreCase);
                    if (commanderPayMatch.Success)
                    {
                        summary.CommanderPayLd = ParseDigitsToInt(commanderPayMatch.Groups["ld"].Value);
                    }
                }
                else if (line.StartsWith("Pay:", StringComparison.OrdinalIgnoreCase))
                {
                    var brigadePayMatch = Regex.Match(line, @"Pay:\s*(?<ld>[\d,]+)\s+Louisdore", RegexOptions.IgnoreCase);
                    if (brigadePayMatch.Success)
                    {
                        summary.BrigadePayLd = ParseDigitsToInt(brigadePayMatch.Groups["ld"].Value);
                    }
                }
                else if (line.StartsWith("Maintenance costs ", StringComparison.OrdinalIgnoreCase))
                {
                    var navyMaintenanceMatch = Regex.Match(
                        line,
                        @"Maintenance costs\s+(?<ld>[\d,]+)\s+Louisdore,\s*(?<marines>[\d,]+)\s+Marines",
                        RegexOptions.IgnoreCase);
                    if (navyMaintenanceMatch.Success)
                    {
                        summary.NavyMaintenanceLd = ParseDigitsToInt(navyMaintenanceMatch.Groups["ld"].Value);
                        summary.NavyMaintenanceMarines = ParseDigitsToInt(navyMaintenanceMatch.Groups["marines"].Value);
                    }
                }

                if (line.StartsWith("Production sites", StringComparison.OrdinalIgnoreCase) && (i + 2) < lineList.Count)
                {
                    var row1 = lineList[i + 1].ToString();
                    var row2 = lineList[i + 2].ToString();
                    ParseProductionSiteCounts(row1 + " " + row2, summary);
                }
            }

            return summary;
        }

        private void ParseProductionSiteCounts(string productionSummaryText, TR_EconomySummary summary)
        {
            if (string.IsNullOrWhiteSpace(productionSummaryText) || summary == null)
            {
                return;
            }

            var matches = Regex.Matches(productionSummaryText, @"(?<count>\d+)\s+(?<name>[^,]+)", RegexOptions.IgnoreCase);
            foreach (Match match in matches)
            {
                var count = ParseDigitsToInt(match.Groups["count"].Value);
                var rawName = (match.Groups["name"].Value ?? string.Empty).Trim().ToLowerInvariant();
                if (rawName.Contains("brrcks") || rawName.Contains("shpyds") || rawName.Contains("supply"))
                {
                    summary.BarracksCount = count;
                }
                else if (rawName.Contains("factories"))
                {
                    summary.FactoriesCount = count;
                }
                else if (rawName.Contains("weaving"))
                {
                    summary.WeavingMillsCount = count;
                }
                else if (rawName.Contains("mints"))
                {
                    summary.MintsCount = count;
                }
                else if (rawName.Contains("estates"))
                {
                    summary.EstatesCount = count;
                }
                else if (rawName.Contains("sheep"))
                {
                    summary.SheepFarmsCount = count;
                }
                else if (rawName.Contains("horse"))
                {
                    summary.HorseFarmsCount = count;
                }
                else if (rawName.Contains("lumber"))
                {
                    summary.LumberCampsCount = count;
                }
                else if (rawName.Contains("quarries"))
                {
                    summary.QuarriesCount = count;
                }
                else if (rawName.Contains("mines"))
                {
                    summary.MinesCount = count;
                }
                else if (rawName.Contains("vineyards"))
                {
                    summary.VineyardsCount = count;
                }
                else if (rawName.Contains("free areas"))
                {
                    summary.FreeAreasCount = count;
                }
            }
        }

        private void EnsureEconomySummaryTable(AusterlitzDbContext auDB)
        {
            auDB.Database.ExecuteSqlCommand(@"
IF OBJECT_ID('dbo.TR_EconomySummary', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TR_EconomySummary (
        TurnId NVARCHAR(16) NOT NULL PRIMARY KEY,
        ProductionMaintenanceLd INT NOT NULL DEFAULT 0,
        EuropeMaintenanceWorkers INT NOT NULL DEFAULT 0,
        CaribbeanMaintenanceWorkers INT NOT NULL DEFAULT 0,
        IndiaMaintenanceWorkers INT NOT NULL DEFAULT 0,
        CommanderPayLd INT NOT NULL DEFAULT 0,
        BrigadePayLd INT NOT NULL DEFAULT 0,
        NavyMaintenanceLd INT NOT NULL DEFAULT 0,
        NavyMaintenanceMarines INT NOT NULL DEFAULT 0,
        BarracksCount INT NOT NULL DEFAULT 0,
        FactoriesCount INT NOT NULL DEFAULT 0,
        WeavingMillsCount INT NOT NULL DEFAULT 0,
        MintsCount INT NOT NULL DEFAULT 0,
        EstatesCount INT NOT NULL DEFAULT 0,
        SheepFarmsCount INT NOT NULL DEFAULT 0,
        HorseFarmsCount INT NOT NULL DEFAULT 0,
        LumberCampsCount INT NOT NULL DEFAULT 0,
        QuarriesCount INT NOT NULL DEFAULT 0,
        MinesCount INT NOT NULL DEFAULT 0,
        VineyardsCount INT NOT NULL DEFAULT 0,
        FreeAreasCount INT NOT NULL DEFAULT 0
    );
END");
        }

        private void UpsertEconomySummary(AusterlitzDbContext auDB, TR_EconomySummary summary)
        {
            auDB.Database.ExecuteSqlCommand(@"
MERGE dbo.TR_EconomySummary AS target
USING (SELECT @TurnId AS TurnId) AS source
ON target.TurnId = source.TurnId
WHEN MATCHED THEN
    UPDATE SET
        ProductionMaintenanceLd = @ProductionMaintenanceLd,
        EuropeMaintenanceWorkers = @EuropeMaintenanceWorkers,
        CaribbeanMaintenanceWorkers = @CaribbeanMaintenanceWorkers,
        IndiaMaintenanceWorkers = @IndiaMaintenanceWorkers,
        CommanderPayLd = @CommanderPayLd,
        BrigadePayLd = @BrigadePayLd,
        NavyMaintenanceLd = @NavyMaintenanceLd,
        NavyMaintenanceMarines = @NavyMaintenanceMarines,
        BarracksCount = @BarracksCount,
        FactoriesCount = @FactoriesCount,
        WeavingMillsCount = @WeavingMillsCount,
        MintsCount = @MintsCount,
        EstatesCount = @EstatesCount,
        SheepFarmsCount = @SheepFarmsCount,
        HorseFarmsCount = @HorseFarmsCount,
        LumberCampsCount = @LumberCampsCount,
        QuarriesCount = @QuarriesCount,
        MinesCount = @MinesCount,
        VineyardsCount = @VineyardsCount,
        FreeAreasCount = @FreeAreasCount
WHEN NOT MATCHED THEN
    INSERT (
        TurnId, ProductionMaintenanceLd, EuropeMaintenanceWorkers, CaribbeanMaintenanceWorkers, IndiaMaintenanceWorkers,
        CommanderPayLd, BrigadePayLd, NavyMaintenanceLd, NavyMaintenanceMarines,
        BarracksCount, FactoriesCount, WeavingMillsCount, MintsCount, EstatesCount, SheepFarmsCount, HorseFarmsCount,
        LumberCampsCount, QuarriesCount, MinesCount, VineyardsCount, FreeAreasCount
    )
    VALUES (
        @TurnId, @ProductionMaintenanceLd, @EuropeMaintenanceWorkers, @CaribbeanMaintenanceWorkers, @IndiaMaintenanceWorkers,
        @CommanderPayLd, @BrigadePayLd, @NavyMaintenanceLd, @NavyMaintenanceMarines,
        @BarracksCount, @FactoriesCount, @WeavingMillsCount, @MintsCount, @EstatesCount, @SheepFarmsCount, @HorseFarmsCount,
        @LumberCampsCount, @QuarriesCount, @MinesCount, @VineyardsCount, @FreeAreasCount
    );",
                new System.Data.SqlClient.SqlParameter("@TurnId", summary.TurnId ?? string.Empty),
                new System.Data.SqlClient.SqlParameter("@ProductionMaintenanceLd", summary.ProductionMaintenanceLd),
                new System.Data.SqlClient.SqlParameter("@EuropeMaintenanceWorkers", summary.EuropeMaintenanceWorkers),
                new System.Data.SqlClient.SqlParameter("@CaribbeanMaintenanceWorkers", summary.CaribbeanMaintenanceWorkers),
                new System.Data.SqlClient.SqlParameter("@IndiaMaintenanceWorkers", summary.IndiaMaintenanceWorkers),
                new System.Data.SqlClient.SqlParameter("@CommanderPayLd", summary.CommanderPayLd),
                new System.Data.SqlClient.SqlParameter("@BrigadePayLd", summary.BrigadePayLd),
                new System.Data.SqlClient.SqlParameter("@NavyMaintenanceLd", summary.NavyMaintenanceLd),
                new System.Data.SqlClient.SqlParameter("@NavyMaintenanceMarines", summary.NavyMaintenanceMarines),
                new System.Data.SqlClient.SqlParameter("@BarracksCount", summary.BarracksCount),
                new System.Data.SqlClient.SqlParameter("@FactoriesCount", summary.FactoriesCount),
                new System.Data.SqlClient.SqlParameter("@WeavingMillsCount", summary.WeavingMillsCount),
                new System.Data.SqlClient.SqlParameter("@MintsCount", summary.MintsCount),
                new System.Data.SqlClient.SqlParameter("@EstatesCount", summary.EstatesCount),
                new System.Data.SqlClient.SqlParameter("@SheepFarmsCount", summary.SheepFarmsCount),
                new System.Data.SqlClient.SqlParameter("@HorseFarmsCount", summary.HorseFarmsCount),
                new System.Data.SqlClient.SqlParameter("@LumberCampsCount", summary.LumberCampsCount),
                new System.Data.SqlClient.SqlParameter("@QuarriesCount", summary.QuarriesCount),
                new System.Data.SqlClient.SqlParameter("@MinesCount", summary.MinesCount),
                new System.Data.SqlClient.SqlParameter("@VineyardsCount", summary.VineyardsCount),
                new System.Data.SqlClient.SqlParameter("@FreeAreasCount", summary.FreeAreasCount));
        }
    }
}
