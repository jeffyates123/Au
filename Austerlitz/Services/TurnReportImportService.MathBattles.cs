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
    }
}
