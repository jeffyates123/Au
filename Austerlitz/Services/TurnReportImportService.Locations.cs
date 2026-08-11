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
        private static readonly Regex ArmyPositionTokenRegex = new Regex(
            @"(?<x>\d{1,2})\s*/\s*(?<y>\d{1,2})\s+(?<state>[A-Za-z])\s+(?<bat>\d+)",
            RegexOptions.Compiled);

        private static readonly Regex EpidemicTokenRegex = new Regex(
            @"(?<x>\d{1,2})\s*/\s*(?<y>\d{1,2})\s+(?<state>[A-Za-z?])",
            RegexOptions.Compiled);

        private int LoadWarehouses(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                bool sectionFound;
                var warehouses = ParseWarehouses(lineList, ref lineLocation, turnId, out sectionFound);
                if (!sectionFound)
                {
                    return lineLocation;
                }

                var existingWarehouses = auDB.TR_Warehouses.Where(x => x.TurnId == turnId);
                auDB.TR_Warehouses.RemoveRange(existingWarehouses);
                auDB.TR_Warehouses.AddRange(warehouses);
                auDB.SaveChanges();
                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadWarehouses: " + ex.Message, ex);
            }
        }

        private static List<TR_Warehouses> ParseWarehouses(ArrayList lineList, ref int lineLocation, string turnId, out bool sectionFound)
        {
            var warehouses = new List<TR_Warehouses>();
            sectionFound = false;

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                var lineToProcess = lineList[lineLocation].ToString();
                if (lineToProcess.IndexOf("Warehouses") != -1)
                {
                    sectionFound = true;
                    lineLocation += 3;
                    lineToProcess = lineList[lineLocation].ToString();
                }

                if (!sectionFound)
                {
                    continue;
                }

                if (lineToProcess.IndexOf("Barracks") != -1 || lineToProcess.IndexOf("No. Typ  x/ y") != -1)
                {
                    break;
                }

                warehouses.Add(new TR_Warehouses
                {
                    TurnId = turnId,
                    ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 1, 1),
                    WarehouseName = lineToProcess.Substring(15, 6),
                    Inhabitants = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 14, 8),
                    Foreign = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 23, 8),
                    Money = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 33, 9),
                    Citizens = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 43, 6),
                    EcPts = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 50, 6),
                    Food = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 57, 6),
                    Stone = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 64, 6),
                    Wood = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 71, 6),
                    Ore = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 78, 6),
                    Zinc = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 85, 6),
                    Horses = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 92, 6),
                    Textiles = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 99, 6),
                    Wool = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 106, 6),
                    Gold = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 113, 6),
                    Wine = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 120, 5)
                });
            }

            return warehouses;
        }

        private int LoadBarracks(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                bool sectionFound;
                var barracks = ParseBarracks(lineList, ref lineLocation, turnId, out sectionFound);
                if (!sectionFound)
                {
                    return lineLocation;
                }

                var existingRecords = auDB.TR_Barracks.Where(x => x.TurnId == turnId);
                auDB.TR_Barracks.RemoveRange(existingRecords);
                auDB.TR_Barracks.AddRange(barracks);
                auDB.SaveChanges();
                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadBarracks: " + ex.Message, ex);
            }
        }

        private static List<TR_Barracks> ParseBarracks(ArrayList lineList, ref int lineLocation, string turnId, out bool sectionFound)
        {
            var barracks = new List<TR_Barracks>();
            sectionFound = false;

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                var lineToProcess = lineList[lineLocation].ToString();
                if (lineToProcess.IndexOf("No. Typ  x/ y") != -1)
                {
                    sectionFound = true;
                    lineLocation += 2;
                    lineToProcess = lineList[lineLocation].ToString();
                }

                if (!sectionFound)
                {
                    continue;
                }

                if (lineToProcess.IndexOf("Production sites") != -1)
                {
                    break;
                }

                // The barracks table prints two barracks per report line, side by side.
                barracks.Add(ParseBarracksColumn(lineToProcess, 0, turnId));
                if (lineToProcess.Length > 67)
                {
                    barracks.Add(ParseBarracksColumn(lineToProcess, 66, turnId));
                }
            }

            return barracks;
        }

        private static TR_Barracks ParseBarracksColumn(string lineToProcess, int offset, string turnId)
        {
            return new TR_Barracks
            {
                TurnId = turnId,
                ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 0, 3),
                Type = lineToProcess.Substring(offset + 4, 3),
                X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 8, 2),
                Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 11, 2),
                Money = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 16, 9),
                Citizens = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 26, 6),
                EcPts = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 33, 6),
                Wood = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 40, 6),
                Horses = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 47, 6),
                Text = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 54, 6),
                FortressSize = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 60, 1)
            };
        }

        private int LoadTradingPortsAndCities(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                bool sectionFound;
                var tradingPortsAndCities = ParseTradingPortsAndCities(lineList, ref lineLocation, turnId, out sectionFound);
                if (!sectionFound)
                {
                    return lineLocation;
                }

                var existingRecords = auDB.TR_TradingPortsAndCities.Where(x => x.TurnId == turnId);
                auDB.TR_TradingPortsAndCities.RemoveRange(existingRecords);
                auDB.TR_TradingPortsAndCities.AddRange(tradingPortsAndCities);
                auDB.SaveChanges();
                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadTradingPortsAndCities: " + ex.Message, ex);
            }
        }

        private static List<TR_TradingPortsAndCities> ParseTradingPortsAndCities(ArrayList lineList, ref int lineLocation, string turnId, out bool sectionFound)
        {
            var tradingPortsAndCities = new List<TR_TradingPortsAndCities>();
            sectionFound = false;

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                var lineToProcess = lineList[lineLocation].ToString();
                if (lineToProcess.IndexOf("Trading Ports & Cities") != -1)
                {
                    sectionFound = true;
                    lineLocation += 3;
                    lineToProcess = lineList[lineLocation].ToString();
                }

                if (!sectionFound)
                {
                    continue;
                }

                if (lineToProcess.IndexOf("Austria-Hungary -") != -1 || lineToProcess.IndexOf("     (1)") != -1)
                {
                    break;
                }

                tradingPortsAndCities.Add(new TR_TradingPortsAndCities
                {
                    TurnId = turnId,
                    ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 0, 3),
                    X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 5, 2),
                    Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 8, 2),
                    Name = lineToProcess.Substring(12, 16),
                    Rate = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 32, 1),
                    EctPts = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 34, 7),
                    Food = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 42, 6),
                    Stone = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 49, 6),
                    Wood = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 56, 6),
                    Ore = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 63, 6),
                    Zinc = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 70, 6),
                    Horses = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 77, 6),
                    Textiles = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 84, 6),
                    Wool = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 91, 6),
                    Gold = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 98, 6),
                    Wine = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 105, 6)
                });
            }

            return tradingPortsAndCities;
        }

        private int LoadArmyPositions(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                EnsureArmyPositionsTable(auDB);
                var originalLineLocation = lineLocation;
                var sectionStart = -1;
                for (var i = lineLocation; i < lineList.Count; i++)
                {
                    var lineToProcess = (lineList[i] ?? string.Empty).ToString();
                    if (lineToProcess.IndexOf("Army positions in your empire", StringComparison.OrdinalIgnoreCase) != -1)
                    {
                        sectionStart = i + 1;
                        break;
                    }
                }

                if (sectionStart < 0 || sectionStart >= lineList.Count)
                {
                    return originalLineLocation;
                }

                int cursor;
                var parsedArmyPositions = ParseArmyPositions(lineList, sectionStart, out cursor);

                auDB.Database.ExecuteSqlCommand(
                    "DELETE FROM dbo.TR_ArmyPositions WHERE TurnId = @p0",
                    turnId ?? string.Empty);

                if (parsedArmyPositions.Count > 0)
                {
                    foreach (var parsedArmyPosition in parsedArmyPositions)
                    {
                        auDB.Database.ExecuteSqlCommand(@"
INSERT INTO dbo.TR_ArmyPositions (TurnId, X, Y, State, Bat)
VALUES (@p0, @p1, @p2, @p3, @p4)",
                            turnId ?? string.Empty,
                            parsedArmyPosition.Item1,
                            parsedArmyPosition.Item2,
                            parsedArmyPosition.Item3,
                            parsedArmyPosition.Item4);
                    }
                }

                return cursor;
            }
            catch (Exception ex)
            {
                throw new Exception("loadArmyPositions: " + ex.Message, ex);
            }
        }

        private static List<Tuple<int, int, string, int>> ParseArmyPositions(ArrayList lineList, int sectionStart, out int cursor)
        {
            var parsedArmyPositions = new List<Tuple<int, int, string, int>>();
            var hasLoadedRows = false;

            for (cursor = sectionStart; cursor < lineList.Count; cursor++)
            {
                var lineToProcess = (lineList[cursor] ?? string.Empty).ToString();
                if (string.IsNullOrWhiteSpace(lineToProcess))
                {
                    if (hasLoadedRows)
                    {
                        break;
                    }

                    continue;
                }

                if (lineToProcess.IndexOf("x/ y State", StringComparison.OrdinalIgnoreCase) != -1)
                {
                    continue;
                }

                if (lineToProcess.IndexOf("Relationship of", StringComparison.OrdinalIgnoreCase) != -1
                    || lineToProcess.IndexOf("There are epidemics", StringComparison.OrdinalIgnoreCase) != -1
                    || lineToProcess.IndexOf("Occupying Forces", StringComparison.OrdinalIgnoreCase) != -1)
                {
                    break;
                }

                var matches = ArmyPositionTokenRegex.Matches(lineToProcess);
                if (matches.Count == 0)
                {
                    if (hasLoadedRows)
                    {
                        break;
                    }

                    continue;
                }

                foreach (Match match in matches)
                {
                    if (!match.Success)
                    {
                        continue;
                    }

                    parsedArmyPositions.Add(Tuple.Create(
                        ParseDigitsToInt(match.Groups["x"].Value),
                        ParseDigitsToInt(match.Groups["y"].Value),
                        (match.Groups["state"].Value ?? string.Empty).Trim().ToUpperInvariant(),
                        ParseDigitsToInt(match.Groups["bat"].Value)));
                }

                hasLoadedRows = true;
            }

            return parsedArmyPositions;
        }

        private int LoadEpidemics(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                EnsureEpidemicsTable(auDB);
                var originalLineLocation = lineLocation;
                var sectionStart = -1;
                for (var i = lineLocation; i < lineList.Count; i++)
                {
                    var lineToProcess = (lineList[i] ?? string.Empty).ToString();
                    if (lineToProcess.IndexOf("There are epidemics in the following regions", StringComparison.OrdinalIgnoreCase) != -1)
                    {
                        sectionStart = i + 1;
                        break;
                    }
                }

                if (sectionStart < 0 || sectionStart >= lineList.Count)
                {
                    return originalLineLocation;
                }

                int cursor;
                var parsedEpidemics = ParseEpidemics(lineList, sectionStart, out cursor);

                auDB.Database.ExecuteSqlCommand(
                    "DELETE FROM dbo.TR_Epidemics WHERE TurnId = @p0",
                    turnId ?? string.Empty);

                if (parsedEpidemics.Count > 0)
                {
                    foreach (var parsedEpidemic in parsedEpidemics)
                    {
                        auDB.Database.ExecuteSqlCommand(@"
INSERT INTO dbo.TR_Epidemics (TurnId, X, Y, State)
VALUES (@p0, @p1, @p2, @p3)",
                            turnId ?? string.Empty,
                            parsedEpidemic.Item1,
                            parsedEpidemic.Item2,
                            parsedEpidemic.Item3);
                    }
                }

                return cursor;
            }
            catch (Exception ex)
            {
                throw new Exception("loadEpidemics: " + ex.Message, ex);
            }
        }

        private static List<Tuple<int, int, string>> ParseEpidemics(ArrayList lineList, int sectionStart, out int cursor)
        {
            var parsedEpidemics = new List<Tuple<int, int, string>>();
            var hasLoadedRows = false;

            for (cursor = sectionStart; cursor < lineList.Count; cursor++)
            {
                var lineToProcess = (lineList[cursor] ?? string.Empty).ToString();
                if (string.IsNullOrWhiteSpace(lineToProcess))
                {
                    if (hasLoadedRows)
                    {
                        break;
                    }

                    continue;
                }

                if (lineToProcess.IndexOf("Relationship of", StringComparison.OrdinalIgnoreCase) != -1
                    || lineToProcess.IndexOf("Occupying Forces", StringComparison.OrdinalIgnoreCase) != -1
                    || lineToProcess.IndexOf("Army positions", StringComparison.OrdinalIgnoreCase) != -1
                    || lineToProcess.IndexOf("Page", StringComparison.OrdinalIgnoreCase) != -1)
                {
                    break;
                }

                var matches = EpidemicTokenRegex.Matches(lineToProcess);
                if (matches.Count == 0)
                {
                    if (hasLoadedRows)
                    {
                        break;
                    }

                    continue;
                }

                foreach (Match match in matches)
                {
                    if (!match.Success)
                    {
                        continue;
                    }

                    parsedEpidemics.Add(Tuple.Create(
                        ParseDigitsToInt(match.Groups["x"].Value),
                        ParseDigitsToInt(match.Groups["y"].Value),
                        (match.Groups["state"].Value ?? string.Empty).Trim().ToUpperInvariant()));
                }

                hasLoadedRows = true;
            }

            return parsedEpidemics;
        }
    }
}
