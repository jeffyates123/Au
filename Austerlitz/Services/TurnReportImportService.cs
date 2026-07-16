using Austerlitz.DAL;
using Austerlitz.Models;
using Austerlitz.Models.SimBattle;
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
    public class TurnReportImportService
    {
        private static readonly Regex TurnOrderErrorRegex = new Regex(
            @"(?<section>\d{1,2})\s+(?<order>\d{1,2})\s+(?<error>\d{1,2})--",
            RegexOptions.Compiled);
        private static readonly Regex ArmyPositionTokenRegex = new Regex(
            @"(?<x>\d{1,2})\s*/\s*(?<y>\d{1,2})\s+(?<state>[A-Za-z])\s+(?<bat>\d+)",
            RegexOptions.Compiled);

        public string LoadTurnReport(string filePath)
        {
            try
            {
                var auDB = new AusterlitzDbContext();
                var simBattleVm = new SimBattleVm();
                var lineList = LoadTurnFile(filePath);
                var lineLocation = 0;

                var turnId = GetTurnId(lineList, lineLocation, auDB);
                CleanUpTurnReport(lineList);

                lineLocation = LoadWarehouses(lineList, lineLocation, auDB, turnId);
                lineLocation = LoadBarracks(lineList, lineLocation, auDB, turnId);
                lineLocation = LoadCommanders(lineList, lineLocation, auDB, turnId);
                lineLocation = LoadBrigades(lineList, lineLocation, auDB, turnId);
                lineLocation = LoadWarships(lineList, lineLocation, auDB, turnId);
                lineLocation = LoadMerchantShips(lineList, lineLocation, auDB, turnId);
                lineLocation = LoadBaggageTrains(lineList, lineLocation, auDB, turnId);
                lineLocation = LoadSpies(lineList, lineLocation, auDB, turnId);
                lineLocation = LoadArmyPositions(lineList, lineLocation, auDB, turnId);
                lineLocation = LoadStateRelationships(lineList, lineLocation, auDB, turnId);
                lineLocation = LoadTradingPortsAndCities(lineList, lineLocation, auDB, turnId);
                lineLocation = LoadMathBattles(lineList, lineLocation, auDB, turnId);

                // SAVE THIS TO THE DATABASE!!!
                // lineLocation = LoadSimBattleMap(lineList, simBattleVm, lineLocation);
                // lineLocation = LoadSimArmies(lineList, simBattleVm, lineLocation);

                lineLocation = LoadTRMap(lineList, lineLocation, auDB, turnId);
                SaveEconomySummary(lineList, auDB, turnId);
                SaveTurnOrderErrors(lineList, auDB, turnId);
                return turnId;
            }
            catch (Exception ex)
            {
                throw new Exception("loadTurnReport: " + ex.Message, ex);
            }
        }

        private void CleanUpTurnReport(ArrayList lineList)
        {
            try
            {
                for (var lineLocation = lineList.Count - 1; lineLocation >= 0; lineLocation--)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    if ((lineToProcess.IndexOf(" Page") != -1)
                        || (lineToProcess.IndexOf(" The Rise of the Eagle") != -1)
                        || (lineToProcess.IndexOf("              Month:") != -1)
                        || (lineToProcess.IndexOf("AUSTERLITZ   Game:") != -1)
                        || (lineToProcess.Length == 0))
                    {
                        lineList.RemoveAt(lineLocation);
                    }
                }
            }
            catch (Exception ex)
            {
                throw new Exception("cleanUpTurnReport: " + ex.Message, ex);
            }
        }

        private string GetTurnId(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB)
        {
            try
            {
                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    if (lineToProcess.IndexOf("AUSTERLITZ   Game:", StringComparison.Ordinal) == -1)
                    {
                        continue;
                    }

                    var gameMatch = Regex.Match(lineToProcess, @"Game:\s*AU-(?<gameNo>\d{3})(?<state>.*)$");
                    if (!gameMatch.Success)
                    {
                        continue;
                    }

                    var nextContentLine = MoveToNextLine(lineList, lineLocation + 1, x => !string.IsNullOrWhiteSpace(x));
                    if (nextContentLine < 0 || nextContentLine >= lineList.Count)
                    {
                        continue;
                    }

                    var gameNo = gameMatch.Groups["gameNo"].Value;
                    var stateName = gameMatch.Groups["state"].Value.Trim();
                    var state = TurnReportImportParsingUtils.GetStateLetter(stateName);

                    var monthLine = lineList[nextContentLine].ToString();
                    var monthMatch = Regex.Match(monthLine, @"Month:\s*(?<month>[A-Za-z]{3})[A-Za-z]*\s+(?<year>\d{4})");
                    if (!monthMatch.Success)
                    {
                        continue;
                    }

                    var month = monthMatch.Groups["month"].Value;
                    var year = monthMatch.Groups["year"].Value;
                    var turnId = gameNo + state + month + year;

                    var existingTurn = auDB.TS_00TurnDetails.Where(x => x.TurnId == turnId);
                    if (existingTurn.Count() == 0)
                    {
                        var newTurn = new TS_00TurnDetails { TurnId = turnId };
                        auDB.TS_00TurnDetails.Add(newTurn);
                        auDB.SaveChanges();

                        var turnSheetManager = new Austerlitz.Domain.TurnSheetManager();
                        turnSheetManager.EnsureAllTurnsheetSectionsSeeded(turnId);
                    }

                    return turnId;
                }

                throw new Exception("Unable to locate a valid turn header in imported file.");
            }
            catch (Exception ex)
            {
                throw new Exception("getTurnId: " + ex.Message, ex);
            }
        }

        private int LoadStateRelationships(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                var originalLineLocation = lineLocation;
                var existingRecords = auDB.TR_StateRelationships.Where(x => x.TurnId == turnId);
                auDB.TR_StateRelationships.RemoveRange(existingRecords);
                auDB.SaveChanges();

                var parsedRelationshipLines = new List<ParsedRelationshipLine>();
                var relationshipLineFound = false;

                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    var parsedLine = ParseRelationshipLine(lineToProcess);
                    if (parsedLine != null)
                    {
                        relationshipLineFound = true;
                        parsedRelationshipLines.Add(parsedLine);
                        continue;
                    }

                    if (relationshipLineFound)
                    {
                        break;
                    }

                    if (!string.IsNullOrWhiteSpace(lineToProcess))
                    {
                        break;
                    }
                }

                if (parsedRelationshipLines.Count == 0)
                {
                    return originalLineLocation;
                }

                var relationshipBySourceAndTarget = new Dictionary<string, ParsedRelationshipPair>(StringComparer.OrdinalIgnoreCase);
                foreach (var relationshipLine in parsedRelationshipLines)
                {
                    var targetRelationships = ParseRelationshipPairs(relationshipLine.PairsText);
                    foreach (var targetRelationship in targetRelationships)
                    {
                        var key = relationshipLine.SourceState + "|" + targetRelationship.Key;
                        relationshipBySourceAndTarget[key] = new ParsedRelationshipPair
                        {
                            SourceState = relationshipLine.SourceState,
                            TargetState = targetRelationship.Key,
                            Relationship = targetRelationship.Value
                        };
                    }
                }

                foreach (var relationship in relationshipBySourceAndTarget.Values)
                {
                    auDB.TR_StateRelationships.Add(new TR_StateRelationships
                    {
                        TurnId = turnId,
                        SourceState = relationship.SourceState,
                        State = relationship.TargetState,
                        Relationship = relationship.Relationship
                    });
                }

                auDB.SaveChanges();
                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadStateRelationships: " + ex.Message, ex);
            }
        }

        private static ParsedRelationshipLine ParseRelationshipLine(string lineToProcess)
        {
            if (string.IsNullOrWhiteSpace(lineToProcess))
            {
                return null;
            }

            var lineMatch = Regex.Match(
                lineToProcess,
                @"^Relationship of\s+(?<source>[A-Za-z])\s+to other countries:\s*(?<pairs>.+)$",
                RegexOptions.IgnoreCase);
            if (!lineMatch.Success)
            {
                return null;
            }

            return new ParsedRelationshipLine
            {
                SourceState = (lineMatch.Groups["source"].Value ?? string.Empty).Trim().ToUpperInvariant(),
                PairsText = lineMatch.Groups["pairs"].Value ?? string.Empty
            };
        }

        private static Dictionary<string, int> ParseRelationshipPairs(string pairsText)
        {
            var results = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            if (string.IsNullOrWhiteSpace(pairsText))
            {
                return results;
            }

            var pairMatches = Regex.Matches(pairsText, @"(?<state>[A-Za-z])\s*-\s*(?<value>\d+)");
            foreach (Match pairMatch in pairMatches)
            {
                if (!pairMatch.Success)
                {
                    continue;
                }

                var targetState = (pairMatch.Groups["state"].Value ?? string.Empty).Trim().ToUpperInvariant();
                if (string.IsNullOrWhiteSpace(targetState))
                {
                    continue;
                }

                int relationshipValue;
                if (!int.TryParse(pairMatch.Groups["value"].Value, out relationshipValue))
                {
                    continue;
                }

                results[targetState] = relationshipValue;
            }

            return results;
        }

        private int LoadWarehouses(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                var locationFound = false;
                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    if (lineToProcess.IndexOf("Warehouses") != -1)
                    {
                        locationFound = true;
                        lineLocation += 3;
                        lineToProcess = lineList[lineLocation].ToString();
                        var existingWarehouses = auDB.TR_Warehouses.Where(x => x.TurnId == turnId);
                        auDB.TR_Warehouses.RemoveRange(existingWarehouses);
                    }

                    if (!locationFound)
                    {
                        continue;
                    }

                    if (lineToProcess.IndexOf("Barracks") != -1 || lineToProcess.IndexOf("No. Typ  x/ y") != -1)
                    {
                        break;
                    }

                    var newWarehouse = new TR_Warehouses
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
                    };

                    auDB.TR_Warehouses.Add(newWarehouse);
                    auDB.SaveChanges();
                }

                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadWarehouses: " + ex.Message, ex);
            }
        }

        private int LoadBarracks(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                var locationFound = false;
                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    if (lineToProcess.IndexOf("No. Typ  x/ y") != -1)
                    {
                        locationFound = true;
                        lineLocation += 2;
                        lineToProcess = lineList[lineLocation].ToString();
                        var existingRecords = auDB.TR_Barracks.Where(x => x.TurnId == turnId);
                        auDB.TR_Barracks.RemoveRange(existingRecords);
                    }

                    if (!locationFound)
                    {
                        continue;
                    }

                    if (lineToProcess.IndexOf("Production sites") != -1)
                    {
                        break;
                    }

                    var newRecord = new TR_Barracks
                    {
                        TurnId = turnId,
                        ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 0, 3),
                        Type = lineToProcess.Substring(4, 3),
                        X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 8, 2),
                        Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 11, 2),
                        Money = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 16, 9),
                        Citizens = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 26, 6),
                        EcPts = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 33, 6),
                        Wood = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 40, 6),
                        Horses = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 47, 6),
                        Text = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 54, 6),
                        FortressSize = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 60, 1)
                    };

                    auDB.TR_Barracks.Add(newRecord);
                    if (lineToProcess.Length > 67)
                    {
                        newRecord = new TR_Barracks
                        {
                            TurnId = turnId,
                            ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 66, 3),
                            Type = lineToProcess.Substring(70, 3),
                            X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 74, 2),
                            Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 77, 2),
                            Money = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 82, 9),
                            Citizens = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 92, 6),
                            EcPts = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 99, 6),
                            Wood = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 106, 6),
                            Horses = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 113, 6),
                            Text = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 120, 6),
                            FortressSize = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 126, 1)
                        };
                        auDB.TR_Barracks.Add(newRecord);
                    }

                    auDB.SaveChanges();
                }

                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadBarracks: " + ex.Message, ex);
            }
        }

        private int LoadCommanders(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                var locationFound = false;
                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    if (lineToProcess.IndexOf("Commander") != -1)
                    {
                        locationFound = true;
                        lineLocation += 2;
                        lineToProcess = lineList[lineLocation].ToString();
                        var existingRecords = auDB.TR_Commanders.Where(x => x.TurnId == turnId);
                        auDB.TR_Commanders.RemoveRange(existingRecords);
                    }

                    if (!locationFound)
                    {
                        continue;
                    }

                    if (lineToProcess.IndexOf("Pay") != -1)
                    {
                        break;
                    }

                    var newRecord = new TR_Commanders
                    {
                        TurnId = turnId,
                        ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 0, 2),
                        Rank = lineToProcess.Substring(4, 14),
                        Name = lineToProcess.Substring(20, 15),
                        Federation = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 48, 2),
                        MP = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 51, 2),
                        CommandCapacity = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 55, 2)
                    };

                    if (lineToProcess.Substring(43, 4) == "----")
                    {
                        newRecord.X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 37, 2);
                        newRecord.Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 40, 2);
                    }
                    else
                    {
                        newRecord.Boarded = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 43, 4);
                    }

                    auDB.TR_Commanders.Add(newRecord);
                    if (lineToProcess.Length > 65)
                    {
                        newRecord = new TR_Commanders
                        {
                            TurnId = turnId,
                            ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 63, 2),
                            Rank = lineToProcess.Substring(67, 14),
                            Name = lineToProcess.Substring(83, 15),
                            Federation = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 111, 2),
                            MP = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 114, 2),
                            CommandCapacity = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 118, 2)
                        };

                        if (lineToProcess.Substring(106, 4) == "----")
                        {
                            newRecord.X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 100, 2);
                            newRecord.Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 103, 2);
                        }
                        else
                        {
                            newRecord.Boarded = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 106, 4);
                        }

                        auDB.TR_Commanders.Add(newRecord);
                    }

                    auDB.SaveChanges();
                }

                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadCommanders: " + ex.Message, ex);
            }
        }

        private int LoadMathBattles(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                auDB.Database.ExecuteSqlCommand("DELETE FROM dbo.TR_MathBattleBrigades WHERE TurnId = @p0", turnId);
                auDB.Database.ExecuteSqlCommand("DELETE FROM dbo.TR_MathBattleResultActual WHERE TurnId = @p0", turnId);

                for (var i = 1; i < lineList.Count; i++)
                {
                    var lineToProcess = lineList[i].ToString();
                    if (!lineToProcess.StartsWith("Mathematical battle No.", StringComparison.Ordinal))
                    {
                        continue;
                    }

                    var mathBattleNo = ParseTrailingInt(lineToProcess);
                    var betweenLine = i + 1 < lineList.Count ? lineList[i + 1].ToString() : string.Empty;
                    if (!betweenLine.StartsWith("Between the nations of:", StringComparison.Ordinal))
                    {
                        // This is the post-battle section, already processed as part of the full battle block.
                        continue;
                    }

                    var result = new TR_MathBattleResultActual
                    {
                        TurnId = turnId,
                        MathBattleNo = mathBattleNo
                    };

                    ParseStatesLine(result, betweenLine);
                    var battleFieldLine = i + 2 < lineList.Count ? lineList[i + 2].ToString() : string.Empty;
                    ParseBattleFieldLine(result, battleFieldLine);

                    var cursor = i + 3;
                    cursor = MoveToNextLine(lineList, cursor, x => x.StartsWith("Army of ", StringComparison.Ordinal));
                    if (cursor < 0 || cursor >= lineList.Count)
                    {
                        break;
                    }

                    var preArmiesA = ParseMathBattleArmy(lineList, ref cursor, turnId, mathBattleNo, "PRE");
                    var preArmiesB = ParseMathBattleArmy(lineList, ref cursor, turnId, mathBattleNo, "PRE");
                    InsertMathBattleBrigades(auDB, preArmiesA);
                    InsertMathBattleBrigades(auDB, preArmiesB);

                    cursor = ParseMathBattlePhases(lineList, cursor, result);
                    cursor = ParseMathBattleRatesAndWinner(lineList, cursor, result);
                    result.StateA = string.IsNullOrWhiteSpace(result.StateA) ? "E" : result.StateA;
                    result.StateB = string.IsNullOrWhiteSpace(result.StateB) ? "E" : result.StateB;
                    result.Terrain = string.IsNullOrWhiteSpace(result.Terrain) ? " " : result.Terrain;
                    result.Name = string.IsNullOrWhiteSpace(result.Name) ? "Unknown" : result.Name;
                    InsertMathBattleResult(auDB, result);

                    var postStart = FindPostBattleStart(lineList, cursor, mathBattleNo);
                    if (postStart != -1)
                    {
                        cursor = postStart;
                        var postArmiesA = ParseMathBattleArmy(lineList, ref cursor, turnId, mathBattleNo, "POST");
                        var postArmiesB = ParseMathBattleArmy(lineList, ref cursor, turnId, mathBattleNo, "POST");
                        InsertMathBattleBrigades(auDB, postArmiesA);
                        InsertMathBattleBrigades(auDB, postArmiesB);
                        i = cursor - 1;
                    }
                    else
                    {
                        i = cursor - 1;
                    }
                }

                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadMathBattles: " + ex.Message, ex);
            }
        }

        private static int FindPostBattleStart(ArrayList lineList, int cursor, int mathBattleNo)
        {
            if (cursor >= 0 && cursor < lineList.Count && lineList[cursor].ToString().StartsWith("Army of ", StringComparison.Ordinal))
            {
                return cursor;
            }

            for (var i = cursor; i < lineList.Count; i++)
            {
                var line = lineList[i].ToString();
                if (line.StartsWith("Mathematical battle No.", StringComparison.Ordinal))
                {
                    var lineBattleNo = ParseTrailingInt(line);
                    if (lineBattleNo == mathBattleNo)
                    {
                        var armyLine = MoveToNextLine(lineList, i + 1, x => x.StartsWith("Army of ", StringComparison.Ordinal));
                        return armyLine == -1 ? -1 : armyLine;
                    }

                    if (lineBattleNo != mathBattleNo)
                    {
                        return -1;
                    }
                }
            }

            return -1;
        }

        private static int ParseMathBattlePhases(ArrayList lineList, int cursor, TR_MathBattleResultActual result)
        {
            var longRangeCounter = 0;
            var handToHandCounter = 0;

            for (var i = cursor; i < lineList.Count; i++)
            {
                var line = lineList[i].ToString();
                if (line.StartsWith("Winner of the mathematical battle", StringComparison.Ordinal))
                {
                    return i + 1;
                }

                if (!(line.StartsWith("Artillery fire", StringComparison.Ordinal)
                    || line.StartsWith("Long-range fighting", StringComparison.Ordinal)
                    || line.StartsWith("Hand-to-hand fightin", StringComparison.Ordinal)))
                {
                    continue;
                }

                if (i + 1 >= lineList.Count)
                {
                    break;
                }

                var sideA = ParseBattleMetricsLine(line);
                var sideB = ParseBattleMetricsLine(lineList[i + 1].ToString());

                if (line.StartsWith("Artillery fire", StringComparison.Ordinal))
                {
                    result.ArtStateAMen = sideA.Men;
                    result.ArtStateABattlePoints = sideA.BattlePoints;
                    result.ArtStateALosses = sideA.Losses;
                    result.ArtStateBMen = sideB.Men;
                    result.ArtStateBBattlePoints = sideB.BattlePoints;
                    result.ArtStateBLosses = sideB.Losses;
                }
                else if (line.StartsWith("Long-range fighting", StringComparison.Ordinal))
                {
                    if (longRangeCounter == 0)
                    {
                        result.LR1StateAMen = sideA.Men;
                        result.LR1StateABattlePoints = sideA.BattlePoints;
                        result.LR1StateALosses = sideA.Losses;
                        result.LR1StateBMen = sideB.Men;
                        result.LR1StateBBattlePoints = sideB.BattlePoints;
                        result.LR1StateBLosses = sideB.Losses;
                    }
                    else
                    {
                        result.LR2StateAMen = sideA.Men;
                        result.LR2StateABattlePoints = sideA.BattlePoints;
                        result.LR2StateALosses = sideA.Losses;
                        result.LR2StateBMen = sideB.Men;
                        result.LR2StateBBattlePoints = sideB.BattlePoints;
                        result.LR2StateBLosses = sideB.Losses;
                    }

                    longRangeCounter++;
                }
                else
                {
                    if (handToHandCounter == 0)
                    {
                        result.H2H1StateAMen = sideA.Men;
                        result.H2H1StateABattlePoints = sideA.BattlePoints;
                        result.H2H1StateALosses = sideA.Losses;
                        result.H2H1StateBMen = sideB.Men;
                        result.H2H1StateBBattlePoints = sideB.BattlePoints;
                        result.H2H1StateBLosses = sideB.Losses;
                    }
                    else
                    {
                        result.H2H2StateAMen = sideA.Men;
                        result.H2H2StateABattlePoints = sideA.BattlePoints;
                        result.H2H2StateALosses = sideA.Losses;
                        result.H2H2StateBMen = sideB.Men;
                        result.H2H2StateBBattlePoints = sideB.BattlePoints;
                        result.H2H2StateBLosses = sideB.Losses;
                    }

                    handToHandCounter++;
                }

                i++;
            }

            return cursor;
        }

        private static int ParseMathBattleRatesAndWinner(ArrayList lineList, int cursor, TR_MathBattleResultActual result)
        {
            for (var i = cursor; i < lineList.Count; i++)
            {
                var line = lineList[i].ToString();
                if (line.StartsWith("Battle-rate of ", StringComparison.Ordinal))
                {
                    var firstRate = ParseBattleRateLine(line);
                    result.StateAMenTotal = firstRate.Men;
                    result.StateALossesTotal = firstRate.Losses;
                    result.StateABattleRate = firstRate.Rate;

                    if (i + 1 < lineList.Count && lineList[i + 1].ToString().StartsWith("Battle-rate of ", StringComparison.Ordinal))
                    {
                        var secondRate = ParseBattleRateLine(lineList[i + 1].ToString());
                        result.StateBMenTotal = secondRate.Men;
                        result.StateBLossesTotal = secondRate.Losses;
                        result.StateBBattleRate = secondRate.Rate;
                        i++;
                    }
                }
                else if (line.StartsWith("Winner of the battle:", StringComparison.Ordinal))
                {
                    result.Name = Truncate(line.Substring("Winner of the battle:".Length).Trim(), 16);
                    return i + 1;
                }
                else if (line.StartsWith("Mathematical battle No.", StringComparison.Ordinal))
                {
                    return i;
                }
            }

            return cursor;
        }

        private static List<TR_MathBattleBrigades> ParseMathBattleArmy(ArrayList lineList, ref int cursor, string turnId, int mathBattleNo, string phase)
        {
            var result = new List<TR_MathBattleBrigades>();
            if (cursor >= lineList.Count)
            {
                return result;
            }

            var armyLine = lineList[cursor].ToString();
            if (!armyLine.StartsWith("Army of ", StringComparison.Ordinal))
            {
                return result;
            }

            var stateName = armyLine.Substring("Army of ".Length).Trim();
            var stateLetter = TurnReportImportParsingUtils.GetStateLetter(stateName);
            cursor++;

            if (cursor < lineList.Count && lineList[cursor].ToString().StartsWith("Name", StringComparison.Ordinal))
            {
                cursor++;
            }

            for (; cursor < lineList.Count; cursor++)
            {
                var line = lineList[cursor].ToString();
                if (line.StartsWith("Army of ", StringComparison.Ordinal)
                    || line.StartsWith("Artillery fire", StringComparison.Ordinal)
                    || line.StartsWith("Long-range fighting", StringComparison.Ordinal)
                    || line.StartsWith("Hand-to-hand fightin", StringComparison.Ordinal)
                    || line.StartsWith("Winner of ", StringComparison.Ordinal)
                    || line.StartsWith("Battle-rate of ", StringComparison.Ordinal)
                    || line.StartsWith("Mathematical battle No.", StringComparison.Ordinal)
                    || line.IndexOf("raises:", StringComparison.Ordinal) != -1)
                {
                    break;
                }

                if (!TryParseMathBattleBrigadeLine(line, out var brigade))
                {
                    continue;
                }

                brigade.TurnId = turnId;
                brigade.MathBattleNo = mathBattleNo;
                brigade.State = stateLetter;
                brigade.Phase = phase;
                result.Add(brigade);
            }

            return result;
        }

        private static bool TryParseMathBattleBrigadeLine(string line, out TR_MathBattleBrigades brigade)
        {
            brigade = null;
            var match = Regex.Match(line, @"^(?<name>.{1,16})\s+(?<x>\d{1,2})\s*/\s*(?<y>\d{1,2})\s+(?<rest>.+)$");
            if (!match.Success)
            {
                return false;
            }

            var battalionMatches = Regex.Matches(match.Groups["rest"].Value, @"(?<type>[A-Za-z-]{2})\s+(?<ef>\d+)\s+(?<size>\d+)");
            if (battalionMatches.Count == 0)
            {
                return false;
            }

            var parsedBrigade = new TR_MathBattleBrigades
            {
                Name = Truncate(match.Groups["name"].Value.Trim(), 16)
            };

            SetBattalionValues(parsedBrigade, battalionMatches, 0, (t, ef, size) => { parsedBrigade.Batt1Type = t; parsedBrigade.Batt1EF = ef; parsedBrigade.Batt1Size = size; });
            SetBattalionValues(parsedBrigade, battalionMatches, 1, (t, ef, size) => { parsedBrigade.Batt2Type = t; parsedBrigade.Batt2EF = ef; parsedBrigade.Batt2Size = size; });
            SetBattalionValues(parsedBrigade, battalionMatches, 2, (t, ef, size) => { parsedBrigade.Batt3Type = t; parsedBrigade.Batt3EF = ef; parsedBrigade.Batt3Size = size; });
            SetBattalionValues(parsedBrigade, battalionMatches, 3, (t, ef, size) => { parsedBrigade.Batt4Type = t; parsedBrigade.Batt4EF = ef; parsedBrigade.Batt4Size = size; });
            SetBattalionValues(parsedBrigade, battalionMatches, 4, (t, ef, size) => { parsedBrigade.Batt5Type = t; parsedBrigade.Batt5EF = ef; parsedBrigade.Batt5Size = size; });
            SetBattalionValues(parsedBrigade, battalionMatches, 5, (t, ef, size) => { parsedBrigade.Batt6Type = t; parsedBrigade.Batt6EF = ef; parsedBrigade.Batt6Size = size; });
            SetBattalionValues(parsedBrigade, battalionMatches, 6, (t, ef, size) => { parsedBrigade.Batt7Type = t; parsedBrigade.Batt7EF = ef; parsedBrigade.Batt7Size = size; });

            brigade = parsedBrigade;

            return true;
        }

        private static void SetBattalionValues(TR_MathBattleBrigades brigade, MatchCollection battalionMatches, int index, Action<string, int?, int?> assign)
        {
            if (index >= battalionMatches.Count)
            {
                return;
            }

            var m = battalionMatches[index];
            var type = m.Groups["type"].Value;
            if (type == "--")
            {
                assign(null, null, null);
                return;
            }

            assign(type, ParseDigitsToInt(m.Groups["ef"].Value), ParseDigitsToInt(m.Groups["size"].Value));
        }

        private static void ParseStatesLine(TR_MathBattleResultActual result, string betweenLine)
        {
            var nationText = betweenLine.Replace("Between the nations of:", "").Trim();
            var nationParts = nationText.Split(new[] { " - " }, StringSplitOptions.None);
            if (nationParts.Length < 2)
            {
                return;
            }

            result.StateA = TurnReportImportParsingUtils.GetStateLetter(nationParts[0].Trim());
            result.StateB = TurnReportImportParsingUtils.GetStateLetter(nationParts[1].Trim());
        }

        private static void ParseBattleFieldLine(TR_MathBattleResultActual result, string battleFieldLine)
        {
            var match = Regex.Match(battleFieldLine, @"Battle-Field:\s*(?<x>\d+)\s*/\s*(?<y>\d+)\s+Terrain:\s*(?<terrain>\S)");
            if (!match.Success)
            {
                return;
            }

            result.X = ParseDigitsToInt(match.Groups["x"].Value);
            result.Y = ParseDigitsToInt(match.Groups["y"].Value);
            result.Terrain = match.Groups["terrain"].Value;
        }

        private static MathBattleMetrics ParseBattleMetricsLine(string line)
        {
            var match = Regex.Match(line, @":\s*(?<state>.+?)\s+(?<men>\d+)\s+Men,\s*(?<bp>\d+)\s+Battle points,\s*(?<losses>\d+)\s+own losses");
            if (!match.Success)
            {
                return new MathBattleMetrics();
            }

            return new MathBattleMetrics
            {
                Men = ParseDigitsToInt(match.Groups["men"].Value),
                BattlePoints = ParseDigitsToInt(match.Groups["bp"].Value),
                Losses = ParseDigitsToInt(match.Groups["losses"].Value)
            };
        }

        private static MathBattleRate ParseBattleRateLine(string line)
        {
            var match = Regex.Match(line, @"Battle-rate of\s+.+?\s+(?<men>\d+)\s+Men\s*:\s*(?<losses>\d+)\s+own losses\s*=\s*(?<rate>[\d\.,]+)");
            if (!match.Success)
            {
                return new MathBattleRate();
            }

            return new MathBattleRate
            {
                Men = ParseDigitsToInt(match.Groups["men"].Value),
                Losses = ParseDigitsToInt(match.Groups["losses"].Value),
                Rate = ParseDigitsToInt(match.Groups["rate"].Value)
            };
        }

        private static void InsertMathBattleResult(DbContext auDB, TR_MathBattleResultActual item)
        {
            auDB.Database.ExecuteSqlCommand(@"
INSERT INTO dbo.TR_MathBattleResultActual (
TurnId, MathBattleNo, StateA, StateB, Name, X, Y, Terrain,
StateAMenTotal, StateALossesTotal, StateABattleRate, StateBMenTotal, StateBLossesTotal, StateBBattleRate,
ArtStateAMen, ArtStateABattlePoints, ArtStateALosses, ArtStateBMen, ArtStateBBattlePoints, ArtStateBLosses,
LR1StateAMen, LR1StateABattlePoints, LR1StateALosses, LR1StateBMen, LR1StateBBattlePoints, LR1StateBLosses,
H2H1StateAMen, H2H1StateABattlePoints, H2H1StateALosses, H2H1StateBMen, H2H1StateBBattlePoints, H2H1StateBLosses,
H2H2StateAMen, H2H2StateABattlePoints, H2H2StateALosses, H2H2StateBMen, H2H2StateBBattlePoints, H2H2StateBLosses,
LR2StateAMen, LR2StateABattlePoints, LR2StateALosses, LR2StateBMen, LR2StateBBattlePoints, LR2StateBLosses
) VALUES (
@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7,
@p8, @p9, @p10, @p11, @p12, @p13,
@p14, @p15, @p16, @p17, @p18, @p19,
@p20, @p21, @p22, @p23, @p24, @p25,
@p26, @p27, @p28, @p29, @p30, @p31,
@p32, @p33, @p34, @p35, @p36, @p37,
@p38, @p39, @p40, @p41, @p42, @p43
)",
                item.TurnId, item.MathBattleNo, item.StateA, item.StateB, Truncate(item.Name, 16), item.X, item.Y, item.Terrain,
                item.StateAMenTotal, item.StateALossesTotal, item.StateABattleRate, item.StateBMenTotal, item.StateBLossesTotal, item.StateBBattleRate,
                item.ArtStateAMen, item.ArtStateABattlePoints, item.ArtStateALosses, item.ArtStateBMen, item.ArtStateBBattlePoints, item.ArtStateBLosses,
                item.LR1StateAMen, item.LR1StateABattlePoints, item.LR1StateALosses, item.LR1StateBMen, item.LR1StateBBattlePoints, item.LR1StateBLosses,
                item.H2H1StateAMen, item.H2H1StateABattlePoints, item.H2H1StateALosses, item.H2H1StateBMen, item.H2H1StateBBattlePoints, item.H2H1StateBLosses,
                item.H2H2StateAMen, item.H2H2StateABattlePoints, item.H2H2StateALosses, item.H2H2StateBMen, item.H2H2StateBBattlePoints, item.H2H2StateBLosses,
                item.LR2StateAMen, item.LR2StateABattlePoints, item.LR2StateALosses, item.LR2StateBMen, item.LR2StateBBattlePoints, item.LR2StateBLosses);
        }

        private static void InsertMathBattleBrigades(DbContext auDB, IEnumerable<TR_MathBattleBrigades> items)
        {
            foreach (var item in items)
            {
                auDB.Database.ExecuteSqlCommand(@"
INSERT INTO dbo.TR_MathBattleBrigades (
TurnId, MathBattleNo, State, Name, Phase,
Batt1Type, Batt1EF, Batt1Size, Batt2Type, Batt2EF, Batt2Size,
Batt3Type, Batt3EF, Batt3Size, Batt4Type, Batt4EF, Batt4Size,
Batt5Type, Batt5EF, Batt5Size, Batt6Type, Batt6EF, Batt6Size,
Batt7Type, Batt7EF, Batt7Size
) VALUES (
@p0, @p1, @p2, @p3, @p4,
@p5, @p6, @p7, @p8, @p9, @p10,
@p11, @p12, @p13, @p14, @p15, @p16,
@p17, @p18, @p19, @p20, @p21, @p22,
@p23, @p24, @p25
)",
                    item.TurnId, item.MathBattleNo, item.State, Truncate(item.Name, 16), item.Phase,
                    item.Batt1Type, item.Batt1EF, item.Batt1Size, item.Batt2Type, item.Batt2EF, item.Batt2Size,
                    item.Batt3Type, item.Batt3EF, item.Batt3Size, item.Batt4Type, item.Batt4EF, item.Batt4Size,
                    item.Batt5Type, item.Batt5EF, item.Batt5Size, item.Batt6Type, item.Batt6EF, item.Batt6Size,
                    item.Batt7Type, item.Batt7EF, item.Batt7Size);
            }
        }

        private static int MoveToNextLine(ArrayList lineList, int start, Func<string, bool> predicate)
        {
            for (var i = start; i < lineList.Count; i++)
            {
                if (predicate(lineList[i].ToString()))
                {
                    return i;
                }
            }

            return -1;
        }

        private static int ParseTrailingInt(string text)
        {
            var match = Regex.Match(text, @"(\d+)\s*$");
            return match.Success ? ParseDigitsToInt(match.Groups[1].Value) : 0;
        }

        private static int ParseDigitsToInt(string text)
        {
            var digits = new string(text.Where(char.IsDigit).ToArray());
            if (string.IsNullOrWhiteSpace(digits))
            {
                return 0;
            }

            return int.Parse(digits);
        }

        private static string Truncate(string value, int maxLength)
        {
            if (string.IsNullOrEmpty(value))
            {
                return value;
            }

            return value.Length <= maxLength ? value : value.Substring(0, maxLength);
        }

        private class MathBattleMetrics
        {
            public int Men { get; set; }
            public int BattlePoints { get; set; }
            public int Losses { get; set; }
        }

        private class MathBattleRate
        {
            public int Men { get; set; }
            public int Losses { get; set; }
            public int Rate { get; set; }
        }

        private class ParsedRelationshipLine
        {
            public string SourceState { get; set; }
            public string PairsText { get; set; }
        }

        private class ParsedRelationshipPair
        {
            public string SourceState { get; set; }
            public string TargetState { get; set; }
            public int Relationship { get; set; }
        }

        private int LoadTRMap(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                var locationFound = false;
                var xStart = 0;
                var coordinatesOnALine = new TR_MapCoordinates[40];
                var y = 0;

                const string mapBoundaryEurope1 = "    1  2  3  4  5  6  7  8  9";
                const string mapBoundaryEurope2 = "   41 42 43 44 45 46 47 48 49 50";
                const string mapBoundaryCarribean = "    1  2  3  4  5  6  7  8  9 10";
                const string mapBoundaryIndies = "   51 52 53 54 55 56 57 58 59 60";
                var mapBoundaryText = mapBoundaryEurope1;

                var existingCoordinates = auDB.TR_MapCoordinates.Where(z => z.TurnId == turnId);
                auDB.TR_MapCoordinates.RemoveRange(existingCoordinates);

                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    if (lineToProcess.IndexOf(mapBoundaryText) != -1)
                    {
                        if (locationFound)
                        {
                            locationFound = false;
                            if (mapBoundaryText == mapBoundaryEurope1) mapBoundaryText = mapBoundaryEurope2;
                            else if (mapBoundaryText == mapBoundaryEurope2) mapBoundaryText = mapBoundaryCarribean;
                            else if (mapBoundaryText == mapBoundaryCarribean) mapBoundaryText = mapBoundaryIndies;
                            else if (mapBoundaryText == mapBoundaryIndies) break;
                        }
                        else
                        {
                            locationFound = true;
                            lineLocation += 1;
                            lineToProcess = lineList[lineLocation].ToString();
                            if (mapBoundaryText == mapBoundaryEurope1) { xStart = 1; y = 1; }
                            else if (mapBoundaryText == mapBoundaryEurope2) { xStart = 41; y = 1; }
                            else if (mapBoundaryText == mapBoundaryCarribean) { xStart = 1; y = 70; }
                            else if (mapBoundaryText == mapBoundaryIndies) { xStart = 51; y = 70; }
                        }
                    }

                    if (!locationFound)
                    {
                        continue;
                    }

                    if (lineToProcess.IndexOf(mapBoundaryText) != -1)
                    {
                        break;
                    }

                    for (var x = xStart; x < xStart + 40; x++)
                    {
                        var coordinate = lineToProcess.Substring(3 + (x - xStart) * 3, 3);
                        var newCoordinate = new TR_MapCoordinates
                        {
                            X = x,
                            Y = y,
                            TurnId = turnId,
                            State = coordinate.Substring(0, 1),
                            Population = coordinate.Substring(1, 1),
                            ProductionSite = coordinate.Substring(2, 1)
                        };
                        coordinatesOnALine[x - xStart] = newCoordinate;
                    }

                    auDB.TR_MapCoordinates.AddRange(coordinatesOnALine);
                    auDB.SaveChanges();
                    y++;
                }

                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadTRMap: " + ex.Message, ex);
            }
        }

        private int LoadBrigades(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                var locationFound = false;
                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    if (lineToProcess.IndexOf("Brigades") != -1)
                    {
                        lineLocation += 2;
                        lineToProcess = lineList[lineLocation].ToString();
                        if (!locationFound)
                        {
                            locationFound = true;
                            var existingBrigades = auDB.TR_Brigades.Where(x => x.TurnId == turnId);
                            auDB.TR_Brigades.RemoveRange(existingBrigades);
                        }
                    }

                    if (!locationFound)
                    {
                        continue;
                    }

                    if (lineToProcess.IndexOf("Pay:") != -1)
                    {
                        break;
                    }

                    var newBrigade = new TR_Brigades
                    {
                        TurnId = turnId,
                        ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 0, 4),
                        Name = lineToProcess.Substring(6, 16),
                        X_OrState = lineToProcess.Substring(23, 2),
                        Y_OrFleet = lineToProcess.Substring(26, 2),
                        MP = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 30, 2),
                        Federation = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 34, 2),
                        Batt1Type = lineToProcess.Substring(40, 2),
                        Batt1EF = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 43, 2),
                        Batt1Size = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 46, 3),
                        Batt2Type = lineToProcess.Substring(53, 2),
                        Batt2EF = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 56, 2),
                        Batt2Size = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 59, 3),
                        Batt3Type = lineToProcess.Substring(66, 2),
                        Batt3EF = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 69, 2),
                        Batt3Size = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 72, 3),
                        Batt4Type = lineToProcess.Substring(79, 2),
                        Batt4EF = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 82, 2),
                        Batt4Size = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 85, 3),
                        Batt5Type = lineToProcess.Substring(92, 2),
                        Batt5EF = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 95, 2),
                        Batt5Size = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 98, 3),
                        Batt6Type = lineToProcess.Substring(105, 2),
                        Batt6EF = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 108, 2),
                        Batt6Size = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 111, 3),
                        Batt7Type = lineToProcess.Substring(118, 2),
                        Batt7EF = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 121, 2),
                        Batt7Size = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 124, 3)
                    };

                    auDB.TR_Brigades.Add(newBrigade);
                    auDB.SaveChanges();
                }

                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadBrigades: " + ex.Message, ex);
            }
        }

        private int LoadWarships(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                var locationFound = false;
                var originalLineLocation = lineLocation;
                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    if (lineToProcess.IndexOf("Warships") != -1)
                    {
                        locationFound = true;
                        lineLocation += 2;
                        lineToProcess = lineList[lineLocation].ToString();
                        var existingRecords = auDB.TR_Warships.Where(x => x.TurnId == turnId);
                        auDB.TR_Warships.RemoveRange(existingRecords);
                    }

                    if (!locationFound)
                    {
                        continue;
                    }

                    if (lineToProcess.IndexOf("Merchant Ships") != -1)
                    {
                        break;
                    }

                    var newRecord = new TR_Warships
                    {
                        TurnId = turnId,
                        ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 0, 4),
                        Type = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 6, 2),
                        Name = lineToProcess.Substring(10, 15),
                        X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 26, 2),
                        Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 29, 2),
                        FleetNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 32, 2),
                        MP = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 35, 2),
                        Condition = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 38, 3),
                        Age = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 44, 2),
                        Marines = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 47, 4),
                        Brigade1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 52, 4),
                        Brigade2 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 57, 4)
                    };

                    auDB.TR_Warships.Add(newRecord);
                    if (lineToProcess.Length > 69)
                    {
                        newRecord = new TR_Warships
                        {
                            TurnId = turnId,
                            ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 69, 4),
                            Type = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 75, 2),
                            Name = lineToProcess.Substring(79, 15),
                            X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 95, 2),
                            Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 98, 2),
                            FleetNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 101, 2),
                            MP = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 104, 2),
                            Condition = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 107, 3),
                            Age = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 113, 2),
                            Marines = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 116, 4),
                            Brigade1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 121, 4),
                            Brigade2 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 126, 4)
                        };
                        auDB.TR_Warships.Add(newRecord);
                    }

                    auDB.SaveChanges();
                }

                return locationFound ? lineLocation : originalLineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadWarships: " + ex.Message, ex);
            }
        }

        private int LoadMerchantShips(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                var locationFound = false;
                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    if (lineToProcess.IndexOf("Merchant Ships") != -1)
                    {
                        locationFound = true;
                        lineLocation += 2;
                        lineToProcess = lineList[lineLocation].ToString();
                        var existingRecords = auDB.TR_MerchantShips.Where(x => x.TurnId == turnId);
                        auDB.TR_MerchantShips.RemoveRange(existingRecords);
                    }

                    if (!locationFound)
                    {
                        continue;
                    }

                    if (lineToProcess.IndexOf("Maintenance costs") != -1)
                    {
                        break;
                    }

                    var newRecord = new TR_MerchantShips
                    {
                        TurnId = turnId,
                        ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 0, 4),
                        Type = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 6, 2),
                        X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 9, 2),
                        Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 12, 2),
                        FleetNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 15, 2),
                        MP = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 18, 2),
                        Condition = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 21, 3),
                        Age = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 27, 2),
                        Goods1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 32, 2),
                        Quantity1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 35, 5),
                        Goods2 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 43, 2),
                        Money = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 52, 9)
                    };
                    newRecord.Quantity1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 46, 5);
                    auDB.TR_MerchantShips.Add(newRecord);

                    if (lineToProcess.Length > 69)
                    {
                        newRecord = new TR_MerchantShips
                        {
                            TurnId = turnId,
                            ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 70, 4),
                            Type = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 76, 2),
                            X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 79, 2),
                            Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 82, 2),
                            FleetNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 85, 2),
                            MP = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 88, 2),
                            Condition = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 91, 3),
                            Age = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 97, 2),
                            Goods1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 102, 2),
                            Quantity1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 105, 5),
                            Goods2 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 113, 2),
                            Money = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 122, 9)
                        };
                        newRecord.Quantity1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 116, 5);
                        auDB.TR_MerchantShips.Add(newRecord);
                    }

                    auDB.SaveChanges();
                }

                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadMerchantShips: " + ex.Message, ex);
            }
        }

        private int LoadBaggageTrains(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                var locationFound = false;
                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    if (lineToProcess.IndexOf("Baggage Trains") != -1)
                    {
                        locationFound = true;
                        lineLocation += 2;
                        lineToProcess = lineList[lineLocation].ToString();
                        var existingRecords = auDB.TR_BaggageTrains.Where(x => x.TurnId == turnId);
                        auDB.TR_BaggageTrains.RemoveRange(existingRecords);
                    }

                    if (!locationFound)
                    {
                        continue;
                    }

                    if (lineToProcess.IndexOf("Spies") != -1)
                    {
                        break;
                    }

                    var newRecord = new TR_BaggageTrains
                    {
                        TurnId = turnId,
                        ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 0, 4),
                        X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 5, 2),
                        Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 8, 2),
                        FederationNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 11, 2),
                        MP = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 14, 2),
                        Condition = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 17, 3),
                        Goods1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 25, 2),
                        Quantity1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 28, 5),
                        Goods2 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 37, 2),
                        Quantity2 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 40, 5),
                        Money = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 46, 10)
                    };
                    auDB.TR_BaggageTrains.Add(newRecord);

                    if (lineToProcess.Length > 69)
                    {
                        newRecord = new TR_BaggageTrains
                        {
                            TurnId = turnId,
                            ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 68, 4),
                            X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 73, 2),
                            Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 76, 2),
                            FederationNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 79, 2),
                            MP = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 82, 2),
                            Condition = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 85, 3),
                            Goods1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 93, 2),
                            Quantity1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 96, 5),
                            Goods2 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 105, 2),
                            Quantity2 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 108, 5),
                            Money = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 114, 10)
                        };
                        auDB.TR_BaggageTrains.Add(newRecord);
                    }

                    auDB.SaveChanges();
                }

                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadBaggageTrains: " + ex.Message, ex);
            }
        }

        private int LoadSpies(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                var locationFound = false;
                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    if (lineToProcess.IndexOf("Spies") != -1)
                    {
                        lineLocation += 2;
                        lineToProcess = lineList[lineLocation].ToString();
                        if (!locationFound)
                        {
                            locationFound = true;
                            var existingRecords = auDB.TR_Spies.Where(x => x.TurnId == turnId);
                            auDB.TR_Spies.RemoveRange(existingRecords);
                        }
                    }

                    if (!locationFound)
                    {
                        continue;
                    }

                    if (lineToProcess.IndexOf("Relationship of") != -1 || lineToProcess.IndexOf("Army positions") != -1)
                    {
                        break;
                    }

                    var newRecord = new TR_Spies
                    {
                        TurnId = turnId,
                        ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 1, 2),
                        X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 4, 2),
                        Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 7, 2),
                        Report = lineToProcess.Substring(16, 107)
                    };

                    if (lineToProcess.Substring(10, 4) != "----")
                    {
                        newRecord.Boarded = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 10, 4);
                    }

                    auDB.TR_Spies.Add(newRecord);
                    auDB.SaveChanges();
                }

                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadSpies: " + ex.Message, ex);
            }
        }

        private int LoadTradingPortsAndCities(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                var locationFound = false;
                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    if (lineToProcess.IndexOf("Trading Ports & Cities") != -1)
                    {
                        locationFound = true;
                        lineLocation += 3;
                        lineToProcess = lineList[lineLocation].ToString();
                        var existingRecords = auDB.TR_TradingPortsAndCities.Where(x => x.TurnId == turnId);
                        auDB.TR_TradingPortsAndCities.RemoveRange(existingRecords);
                    }

                    if (!locationFound)
                    {
                        continue;
                    }

                    if (lineToProcess.IndexOf("Austria-Hungary -") != -1 || lineToProcess.IndexOf("     (1)") != -1)
                    {
                        break;
                    }

                    var newRecord = new TR_TradingPortsAndCities
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
                    };

                    auDB.TR_TradingPortsAndCities.Add(newRecord);
                    auDB.SaveChanges();
                }

                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadTradingPortsAndCities: " + ex.Message, ex);
            }
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
                    if (lineToProcess.IndexOf("Relationship of", StringComparison.OrdinalIgnoreCase) != -1)
                    {
                        return originalLineLocation;
                    }

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

                auDB.Database.ExecuteSqlCommand(
                    "DELETE FROM dbo.TR_ArmyPositions WHERE TurnId = @p0",
                    turnId ?? string.Empty);

                var parsedArmyPositions = new List<Tuple<int, int, string, int>>();
                var hasLoadedRows = false;
                var cursor = sectionStart;

                for (; cursor < lineList.Count; cursor++)
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

        private int LoadSimArmies(ArrayList lineList, SimBattleVm simBattleVm, int lineLocation)
        {
            var armyA = new Army();
            var armyB = new Army();
            simBattleVm.ArmyA = armyA;
            simBattleVm.ArmyB = armyB;
            lineLocation = LoadSimArmy(armyA, lineList, lineLocation);
            lineLocation = LoadSimArmy(armyB, lineList, lineLocation);
            return lineLocation;
        }

        private int LoadSimArmy(Army army, ArrayList lineList, int lineLocation)
        {
            var batGroups = new List<BattalionGroup>();
            int dummyValue;
            var bArmyFound = false;
            var bArmyProcessed = false;

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                var lineToProcess = lineList[lineLocation].ToString();
                if (!bArmyFound && !bArmyProcessed)
                {
                    if (lineToProcess.IndexOf("Command Capability") != -1)
                    {
                        army.Commander = new Commander
                        {
                            CommanderName = lineToProcess.Substring(0, 25).Trim(),
                            Capability = int.Parse(lineToProcess.Substring(49, 2))
                        };
                    }

                    if (lineToProcess.IndexOf("Battalion Groups of ") != -1)
                    {
                        bArmyFound = true;
                        army.State = lineToProcess.Replace("Battalion Groups of ", "").Trim();
                        lineLocation += 2;
                        lineToProcess = lineList[lineLocation].ToString();
                    }
                }

                if (!bArmyFound || bArmyProcessed)
                {
                    continue;
                }

                if (!int.TryParse(lineToProcess.Substring(0, 3), out dummyValue))
                {
                    bArmyProcessed = true;
                    army.BattalionGroups = batGroups.ToArray();
                    batGroups.Clear();
                    lineLocation--;
                    break;
                }

                for (var bt = 0; bt <= 2 && lineToProcess.Length >= (45 * bt); bt++)
                {
                    var batGroupStr = lineToProcess.Substring(45 * bt, 40);
                    batGroups.Add(ProcessSimBattalionGroup(batGroupStr));
                }
            }

            return lineLocation;
        }

        private BattalionGroup ProcessSimBattalionGroup(string battalionGroupStr)
        {
            var battalions = new Battalion[4];
            var batGroup = new BattalionGroup
            {
                Federation = int.Parse(battalionGroupStr.Substring(0, 3)),
                Type = battalionGroupStr.Substring(5, 2),
                TotalEF = decimal.Parse(battalionGroupStr.Replace(",", ".").Substring(36, 4)),
                Dest0 = new VmCoordinate(),
                Dest1 = new VmCoordinate(),
                Dest2 = new VmCoordinate(),
                StartAttack = 0,
                Battalions = battalions,
                Formation = 1
            };

            batGroup.BattGroup = batGroup.Federation <= 110 ? batGroup.Federation : 0;
            for (var bt = 0; bt <= 3; bt++)
            {
                battalions[bt] = ProcessSimBattalion(battalionGroupStr.Substring(8 + (7 * bt), 6));
            }

            batGroup.TotalSize = battalions.Sum(x => x.size);
            var noBatsNotEmpty = battalions.Count(x => x.size > 0);
            batGroup.PercentMaxSize = decimal.Round((batGroup.TotalSize / (noBatsNotEmpty * 800M)) * 100, 0);
            return batGroup;
        }

        private Battalion ProcessSimBattalion(string battalionStr)
        {
            var newBattalion = new Battalion();
            var effect = battalionStr.Substring(0, 2);
            if (effect.IndexOf("-") == -1)
            {
                newBattalion.EF = short.Parse(effect);
                newBattalion.size = short.Parse(battalionStr.Substring(3, 3));
            }

            return newBattalion;
        }

        private int LoadSimBattleMap(ArrayList lineList, SimBattleVm simBattleVm, int lineLocation)
        {
            var simBattleMap = new VmMapCoordinate[41][];
            var bSimMapFound = false;
            simBattleVm.Map = simBattleMap;
            int x, y = 0;
            for (; lineLocation < lineList.Count; lineLocation++)
            {
                if (!bSimMapFound && lineList[lineLocation].ToString().IndexOf("The Battle field") != -1)
                {
                    bSimMapFound = true;
                    lineLocation += 1;
                    y = 0;
                }

                if (!bSimMapFound)
                {
                    continue;
                }

                if (y > 40)
                {
                    break;
                }

                var lineToProcess = lineList[lineLocation].ToString();
                var lineCoords = new VmMapCoordinate[46];
                for (x = 0; x <= 45 && y <= 40; x++)
                {
                    var coord = new VmMapCoordinate { X = x, Y = y };
                    if (x > 0 && y > 0)
                    {
                        coord.Terrain = lineToProcess.Substring(x * 3 + 3, 1);
                        coord.Height = short.Parse(lineToProcess.Substring(x * 3 + 4, 1));
                    }

                    lineCoords[x] = coord;
                }

                simBattleMap[y] = lineCoords;
                y = y + 1;
            }

            return lineLocation;
        }

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

        private void SaveTurnOrderErrors(ArrayList lineList, AusterlitzDbContext auDB, string turnId)
        {
            EnsureTurnOrderErrorTables(auDB);
            auDB.Database.ExecuteSqlCommand("DELETE FROM dbo.TR_TurnOrderErrors WHERE TurnId = @p0", turnId);

            var parsedErrors = ParseTurnOrderErrors(lineList);
            foreach (var parsedError in parsedErrors)
            {
                auDB.Database.ExecuteSqlCommand(@"
INSERT INTO dbo.TR_TurnOrderErrors (TurnId, SectionNo, OrderNo, ErrorCode, RawToken)
VALUES (@TurnId, @SectionNo, @OrderNo, @ErrorCode, @RawToken)",
                    new SqlParameter("@TurnId", turnId ?? string.Empty),
                    new SqlParameter("@SectionNo", parsedError.SectionNo),
                    new SqlParameter("@OrderNo", parsedError.OrderNo),
                    new SqlParameter("@ErrorCode", parsedError.ErrorCode),
                    new SqlParameter("@RawToken", parsedError.RawToken ?? string.Empty));
            }
        }

        private List<ParsedTurnOrderError> ParseTurnOrderErrors(ArrayList lineList)
        {
            var parsedErrors = new List<ParsedTurnOrderError>();
            if (lineList == null || lineList.Count == 0)
            {
                return parsedErrors;
            }

            var startLine = GetTurnOrderErrorStartLine(lineList);
            if (startLine < 0)
            {
                return parsedErrors;
            }

            var dedupe = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            for (var i = startLine; i < lineList.Count; i++)
            {
                var line = (lineList[i] ?? string.Empty).ToString();
                if (string.IsNullOrWhiteSpace(line))
                {
                    continue;
                }

                var matches = TurnOrderErrorRegex.Matches(line);
                foreach (Match match in matches)
                {
                    if (!match.Success)
                    {
                        continue;
                    }

                    var sectionNo = ParseDigitsToInt(match.Groups["section"].Value);
                    var orderNo = ParseDigitsToInt(match.Groups["order"].Value);
                    var errorCode = ParseDigitsToInt(match.Groups["error"].Value);
                    if (sectionNo <= 0 || orderNo <= 0 || errorCode <= 0)
                    {
                        continue;
                    }

                    var dedupeKey = sectionNo + "|" + orderNo + "|" + errorCode;
                    if (!dedupe.Add(dedupeKey))
                    {
                        continue;
                    }

                    parsedErrors.Add(new ParsedTurnOrderError
                    {
                        SectionNo = sectionNo,
                        OrderNo = orderNo,
                        ErrorCode = errorCode,
                        RawToken = (match.Value ?? string.Empty).Trim()
                    });
                }
            }

            return parsedErrors;
        }

        private int GetTurnOrderErrorStartLine(ArrayList lineList)
        {
            for (var i = 0; i < lineList.Count; i++)
            {
                var line = (lineList[i] ?? string.Empty).ToString();
                if (Regex.IsMatch(line, @"^-{20,}\s*$"))
                {
                    return i + 1;
                }
            }

            return -1;
        }

        private void EnsureTurnOrderErrorTables(AusterlitzDbContext auDB)
        {
            auDB.Database.ExecuteSqlCommand(@"
IF OBJECT_ID('dbo.TR_TurnOrderErrors', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TR_TurnOrderErrors (
        TurnOrderErrorId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        TurnId NVARCHAR(16) NOT NULL,
        SectionNo SMALLINT NOT NULL,
        OrderNo SMALLINT NOT NULL,
        ErrorCode SMALLINT NOT NULL,
        RawToken NVARCHAR(32) NULL
    );
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.TR_TurnOrderErrors')
      AND name = 'UX_TR_TurnOrderErrors_TurnSectionOrderError'
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_TR_TurnOrderErrors_TurnSectionOrderError
        ON dbo.TR_TurnOrderErrors (TurnId, SectionNo, OrderNo, ErrorCode);
END;

IF OBJECT_ID('dbo.REF_TurnErrorCodes', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.REF_TurnErrorCodes (
        SectionNo SMALLINT NOT NULL,
        ErrorCode SMALLINT NOT NULL,
        [Message] NVARCHAR(500) NOT NULL,
        CONSTRAINT PK_REF_TurnErrorCodes PRIMARY KEY (SectionNo, ErrorCode)
    );
END;");
        }

        private void EnsureArmyPositionsTable(AusterlitzDbContext auDB)
        {
            auDB.Database.ExecuteSqlCommand(@"
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
END;");
        }

        private ArrayList LoadTurnFile(string filePath)
        {
            var objReader = new StreamReader(filePath);
            string sLine = "";
            var arrText = new ArrayList();
            arrText.Add("");
            while (sLine != null)
            {
                sLine = objReader.ReadLine();
                if (sLine != null)
                {
                    arrText.Add(sLine);
                }
            }

            objReader.Close();
            return arrText;
        }

        private class ParsedTurnOrderError
        {
            public int SectionNo { get; set; }
            public int OrderNo { get; set; }
            public int ErrorCode { get; set; }
            public string RawToken { get; set; }
        }
    }
}
