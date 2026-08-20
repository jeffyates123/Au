using Austerlitz.DAL;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Data.Entity;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;

namespace Austerlitz.Services
{
    public partial class TurnReportImportService
    {
        private static readonly Regex SeaBattleHeaderRegex = new Regex(@"^Naval Battle No\.\s*(?<no>\d+)\s*$", RegexOptions.Compiled);
        private static readonly Regex GroupARegex = new Regex(@"^Battle between Group A:\s*(?<name>.+)$", RegexOptions.Compiled);
        private static readonly Regex GroupBRegex = new Regex(@"Group B:\s*(?<name>.+)$", RegexOptions.Compiled);
        private static readonly Regex PositionRegex = new Regex(@"^at position\s*(?<x>\d+)\s*/\s*(?<y>\d+)\s*$", RegexOptions.Compiled);
        private static readonly Regex GroupSideRegex = new Regex(@"Group\s+(?<side>[AB])", RegexOptions.Compiled);
        private static readonly Regex LongRangeHeaderRegex = new Regex(@"^(?<round>\d+)\.\s+Long-range fight of group\s+(?<side>[AB])", RegexOptions.Compiled);
        private static readonly Regex BoardingHeaderRegex = new Regex(@"^(?<round>\d+)\.\s+Boarding", RegexOptions.Compiled);
        private static readonly Regex WinnerRegex = new Regex(@"^Group\s+(?<side>[AB])\s+wins the naval battle", RegexOptions.Compiled);
        private static readonly Regex SummaryLineRegex = new Regex(
            @"begin:\s*(?<beginA>\d+)\s+end:\s*(?<endA>\d+)\s+losses:\s*(?<lossA>[\d\.,]+)%\s+begin:\s*(?<beginB>\d+)\s+end:\s*(?<endB>\d+)\s+losses:\s*(?<lossB>[\d\.,]+)%",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);
        private static readonly Regex SummaryAverageRegex = new Regex(@"losses:\s*(?<lossA>[\d\.,]+)%.*losses:\s*(?<lossB>[\d\.,]+)%", RegexOptions.Compiled | RegexOptions.IgnoreCase);
        private static readonly Regex PreFleetShipRegex = new Regex(
            @"(?<no>\d{1,4})\s+(?<type>\d{1,3})\s+(?<name>[A-Z0-9 \-']{0,24}?)\s+(?<ton>\d{1,5})\s+(?<mar>\d{1,5})\s+(?<brig>--|\d+)",
            RegexOptions.Compiled);
        private static readonly Regex MerchantFleetRegex = new Regex(@"(?<no>\d{1,4})\s+(?<type>\d{1,3})\s+(?<g1>\d{1,5})\s+(?<g2>\d{1,5})", RegexOptions.Compiled);
        private static readonly Regex LongRangeActionRegex = new Regex(@"(?<no>\d{1,4})\s+(?<type>\d{1,3})\s+(?<ton>\d{1,5})\s+(?<mar>\d{1,5})\s+(?<enem>\d{1,4})", RegexOptions.Compiled);
        private static readonly Regex BoardingActionRegex = new Regex(
            @"(?<attNo>\d{1,4})\s+(?<attSide>[AB])\s+(?<attMar>\d{1,5})\s+(?<attOut>[\*\!\-F])\s+(?<defNo>\d{1,4})\s+(?<defSide>[AB])\s+(?<defMar>\d{1,5})\s+(?<defOut>[\*\!\-F])",
            RegexOptions.Compiled);
        private static readonly Regex MerchantCaptureRegex = new Regex(@"(?<ship>\d{1,4})\s+(?<cap>\d{1,4})", RegexOptions.Compiled);
        private static readonly Regex PostFleetRegex = new Regex(@"(?<item>\d{1,6})\s+(?<type>\d{1,3})\s+(?<cond>\d{1,3})%\s+(?<mar>\d{1,5})", RegexOptions.Compiled);

        private int LoadSeaBattles(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                auDB.Database.ExecuteSqlCommand("DELETE FROM dbo.TR_SeaBattleMerchantCaptures WHERE TurnId = @p0", turnId);
                auDB.Database.ExecuteSqlCommand("DELETE FROM dbo.TR_SeaBattleBoardingActions WHERE TurnId = @p0", turnId);
                auDB.Database.ExecuteSqlCommand("DELETE FROM dbo.TR_SeaBattleLongRangeActions WHERE TurnId = @p0", turnId);
                auDB.Database.ExecuteSqlCommand("DELETE FROM dbo.TR_SeaBattleShips WHERE TurnId = @p0", turnId);
                auDB.Database.ExecuteSqlCommand("DELETE FROM dbo.TR_SeaBattles WHERE TurnId = @p0", turnId);

                for (var i = 1; i < lineList.Count; i++)
                {
                    var line = lineList[i].ToString();
                    var headerMatch = SeaBattleHeaderRegex.Match(line);
                    if (!headerMatch.Success)
                    {
                        continue;
                    }

                    var nextLine = i + 1 < lineList.Count ? lineList[i + 1].ToString() : string.Empty;
                    var groupAMatch = GroupARegex.Match(nextLine);
                    if (!groupAMatch.Success)
                    {
                        // Repeated battle header used for page continuation.
                        continue;
                    }

                    var battle = new SeaBattleImport
                    {
                        TurnId = turnId,
                        SeaBattleNo = ParseDigitsToInt(headerMatch.Groups["no"].Value),
                        GroupAName = Truncate(groupAMatch.Groups["name"].Value.Trim(), 32),
                        GroupBName = Truncate(ExtractGroupBName(lineList, i + 2), 32),
                        StateA = TurnReportImportParsingUtils.GetStateLetter(groupAMatch.Groups["name"].Value.Trim()),
                        StateB = TurnReportImportParsingUtils.GetStateLetter(ExtractGroupBName(lineList, i + 2)),
                        WinnerGroup = string.Empty,
                        WinnerText = string.Empty
                    };

                    ParsePosition(lineList, i + 3, battle);

                    var cursor = i + 4;
                    cursor = ParseSeaBattleSections(lineList, cursor, battle);
                    if (string.IsNullOrWhiteSpace(battle.WinnerGroup))
                    {
                        if (battle.GroupAAverageLossPct < battle.GroupBAverageLossPct)
                        {
                            battle.WinnerGroup = "A";
                            battle.WinnerText = "Group A wins the naval battle";
                        }
                        else if (battle.GroupBAverageLossPct < battle.GroupAAverageLossPct)
                        {
                            battle.WinnerGroup = "B";
                            battle.WinnerText = "Group B wins the naval battle";
                        }
                    }
                    InsertSeaBattle(auDB, battle);
                    i = cursor - 1;
                }

                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadSeaBattles: " + ex.Message, ex);
            }
        }

        private static string ExtractGroupBName(ArrayList lineList, int lineIndex)
        {
            if (lineIndex < 0 || lineIndex >= lineList.Count)
            {
                return string.Empty;
            }

            var line = lineList[lineIndex].ToString();
            var groupBMatch = GroupBRegex.Match(line);
            return groupBMatch.Success ? groupBMatch.Groups["name"].Value.Trim() : string.Empty;
        }

        private static void ParsePosition(ArrayList lineList, int lineIndex, SeaBattleImport battle)
        {
            if (lineIndex < 0 || lineIndex >= lineList.Count)
            {
                return;
            }

            var posLine = lineList[lineIndex].ToString();
            var match = PositionRegex.Match(posLine);
            if (!match.Success)
            {
                return;
            }

            battle.X = ParseDigitsToInt(match.Groups["x"].Value);
            battle.Y = ParseDigitsToInt(match.Groups["y"].Value);
        }

        private static int ParseSeaBattleSections(ArrayList lineList, int cursor, SeaBattleImport battle)
        {
            for (var i = cursor; i < lineList.Count; i++)
            {
                var line = lineList[i].ToString();
                var trimmed = line.Trim();
                if (trimmed.Length == 0)
                {
                    continue;
                }

                if (trimmed.StartsWith("Mathematical battle No.", StringComparison.Ordinal))
                {
                    return i;
                }

                var headerMatch = SeaBattleHeaderRegex.Match(trimmed);
                if (headerMatch.Success)
                {
                    var lineBattleNo = ParseDigitsToInt(headerMatch.Groups["no"].Value);
                    if (lineBattleNo != battle.SeaBattleNo)
                    {
                        return i;
                    }

                    continue;
                }

                if (trimmed.StartsWith("Fleet of Group", StringComparison.Ordinal))
                {
                    var side = ParseGroupSide(trimmed);
                    i = ParsePreFleet(lineList, i + 1, battle, side) - 1;
                    continue;
                }

                if (trimmed.StartsWith("Merchant fleet of Group", StringComparison.Ordinal))
                {
                    var side = ParseGroupSide(trimmed);
                    i = ParseMerchantFleet(lineList, i + 1, battle, side) - 1;
                    continue;
                }

                var longRangeMatch = LongRangeHeaderRegex.Match(trimmed);
                if (longRangeMatch.Success)
                {
                    var roundNo = ParseDigitsToInt(longRangeMatch.Groups["round"].Value);
                    var side = (longRangeMatch.Groups["side"].Value ?? string.Empty).Trim();
                    i = ParseLongRangeRound(lineList, i + 1, battle, roundNo, side) - 1;
                    continue;
                }

                var boardingMatch = BoardingHeaderRegex.Match(trimmed);
                if (boardingMatch.Success)
                {
                    var roundNo = ParseDigitsToInt(boardingMatch.Groups["round"].Value);
                    i = ParseBoardingRound(lineList, i + 1, battle, roundNo) - 1;
                    continue;
                }

                if (trimmed.StartsWith("Determining the winner", StringComparison.Ordinal))
                {
                    i = ParseWinnerSummary(lineList, i + 1, battle) - 1;
                    continue;
                }

                var winnerMatch = WinnerRegex.Match(trimmed);
                if (winnerMatch.Success)
                {
                    battle.WinnerGroup = winnerMatch.Groups["side"].Value;
                    battle.WinnerText = Truncate(trimmed, 64);
                    continue;
                }

                if (trimmed.StartsWith("7. Capture of merchant ships", StringComparison.Ordinal))
                {
                    i = ParseMerchantCaptures(lineList, i + 1, battle) - 1;
                    continue;
                }

                if (trimmed.StartsWith("Fleet after the battle - Group", StringComparison.Ordinal))
                {
                    var side = ResolvePostBattleSide(trimmed, battle);
                    i = ParsePostFleet(lineList, i + 1, battle, side) - 1;
                    continue;
                }
            }

            return lineList.Count;
        }

        private static string ParseGroupSide(string line)
        {
            var match = GroupSideRegex.Match(line ?? string.Empty);
            return match.Success ? match.Groups["side"].Value : "A";
        }

        private static string ResolvePostBattleSide(string line, SeaBattleImport battle)
        {
            var groupName = (line ?? string.Empty)
                .Replace("Fleet after the battle - Group", string.Empty)
                .Trim();

            if (groupName.Equals(battle.GroupAName, StringComparison.OrdinalIgnoreCase))
            {
                return "A";
            }

            if (groupName.Equals(battle.GroupBName, StringComparison.OrdinalIgnoreCase))
            {
                return "B";
            }

            var state = TurnReportImportParsingUtils.GetStateLetter(groupName);
            if (state == battle.StateA)
            {
                return "A";
            }

            if (state == battle.StateB)
            {
                return "B";
            }

            return battle.Ships.Any(x => x.Phase == "POST" && x.GroupSide == "A") ? "B" : "A";
        }

        private static bool IsSeaBattleBoundary(string line)
        {
            var trimmed = (line ?? string.Empty).Trim();
            return trimmed.StartsWith("Fleet of Group", StringComparison.Ordinal)
                   || trimmed.StartsWith("Merchant fleet of Group", StringComparison.Ordinal)
                   || LongRangeHeaderRegex.IsMatch(trimmed)
                   || BoardingHeaderRegex.IsMatch(trimmed)
                   || trimmed.StartsWith("Determining the winner", StringComparison.Ordinal)
                   || trimmed.StartsWith("Fleet after the battle - Group", StringComparison.Ordinal)
                   || trimmed.StartsWith("7. Capture of merchant ships", StringComparison.Ordinal)
                   || WinnerRegex.IsMatch(trimmed)
                   || SeaBattleHeaderRegex.IsMatch(trimmed)
                   || trimmed.StartsWith("Mathematical battle No.", StringComparison.Ordinal);
        }

        private static int ParsePreFleet(ArrayList lineList, int cursor, SeaBattleImport battle, string side)
        {
            for (var i = cursor; i < lineList.Count; i++)
            {
                var line = lineList[i].ToString();
                if (IsSeaBattleBoundary(line))
                {
                    return i;
                }

                if (line.IndexOf("No Type Name", StringComparison.Ordinal) >= 0)
                {
                    continue;
                }

                var matches = PreFleetShipRegex.Matches(line);
                foreach (Match match in matches)
                {
                    battle.Ships.Add(new SeaBattleShipImport
                    {
                        GroupSide = side,
                        Phase = "PRE",
                        ShipKind = "WARSHIP",
                        ReportShipNo = ParseDigitsToInt(match.Groups["no"].Value),
                        FinalItemNo = null,
                        Type = ParseDigitsToInt(match.Groups["type"].Value),
                        Name = Truncate(match.Groups["name"].Value.Trim(), 32),
                        Tonnage = ParseDigitsToInt(match.Groups["ton"].Value),
                        Marines = ParseDigitsToInt(match.Groups["mar"].Value),
                        Brigade = Truncate(match.Groups["brig"].Value.Trim(), 8),
                        ConditionPct = null,
                        Goods1 = null,
                        Goods2 = null
                    });
                }
            }

            return lineList.Count;
        }

        private static int ParseMerchantFleet(ArrayList lineList, int cursor, SeaBattleImport battle, string side)
        {
            for (var i = cursor; i < lineList.Count; i++)
            {
                var line = lineList[i].ToString();
                if (IsSeaBattleBoundary(line))
                {
                    return i;
                }

                if (line.IndexOf("Nr Typ", StringComparison.Ordinal) >= 0 || line.IndexOf("No Typ", StringComparison.Ordinal) >= 0)
                {
                    continue;
                }

                var matches = MerchantFleetRegex.Matches(line);
                foreach (Match match in matches)
                {
                    battle.Ships.Add(new SeaBattleShipImport
                    {
                        GroupSide = side,
                        Phase = "PRE",
                        ShipKind = "MERCHANT",
                        ReportShipNo = ParseDigitsToInt(match.Groups["no"].Value),
                        FinalItemNo = null,
                        Type = ParseDigitsToInt(match.Groups["type"].Value),
                        Name = string.Empty,
                        Tonnage = null,
                        Marines = null,
                        Brigade = string.Empty,
                        ConditionPct = null,
                        Goods1 = ParseDigitsToInt(match.Groups["g1"].Value),
                        Goods2 = ParseDigitsToInt(match.Groups["g2"].Value)
                    });
                }
            }

            return lineList.Count;
        }

        private static int ParseLongRangeRound(ArrayList lineList, int cursor, SeaBattleImport battle, int roundNo, string side)
        {
            for (var i = cursor; i < lineList.Count; i++)
            {
                var line = lineList[i].ToString();
                if (IsSeaBattleBoundary(line))
                {
                    return i;
                }

                if (line.IndexOf("No Typ Tonn", StringComparison.Ordinal) >= 0)
                {
                    continue;
                }

                var matches = LongRangeActionRegex.Matches(line);
                foreach (Match match in matches)
                {
                    battle.LongRangeActions.Add(new SeaBattleLongRangeActionImport
                    {
                        RoundNo = roundNo,
                        GroupSide = side,
                        ReportShipNo = ParseDigitsToInt(match.Groups["no"].Value),
                        ShipType = ParseDigitsToInt(match.Groups["type"].Value),
                        Tonnage = ParseDigitsToInt(match.Groups["ton"].Value),
                        Marines = ParseDigitsToInt(match.Groups["mar"].Value),
                        EnemyShipNo = ParseDigitsToInt(match.Groups["enem"].Value)
                    });
                }
            }

            return lineList.Count;
        }

        private static int ParseBoardingRound(ArrayList lineList, int cursor, SeaBattleImport battle, int roundNo)
        {
            for (var i = cursor; i < lineList.Count; i++)
            {
                var line = lineList[i].ToString();
                if (IsSeaBattleBoundary(line))
                {
                    return i;
                }

                if (line.IndexOf("Att  Mar", StringComparison.Ordinal) >= 0)
                {
                    continue;
                }

                var matches = BoardingActionRegex.Matches(line);
                foreach (Match match in matches)
                {
                    battle.BoardingActions.Add(new SeaBattleBoardingActionImport
                    {
                        RoundNo = roundNo,
                        ActionNo = battle.BoardingActions.Count(x => x.RoundNo == roundNo) + 1,
                        AttackerShipNo = ParseDigitsToInt(match.Groups["attNo"].Value),
                        AttackerGroupSide = match.Groups["attSide"].Value,
                        AttackerMarines = ParseDigitsToInt(match.Groups["attMar"].Value),
                        AttackerOutcome = match.Groups["attOut"].Value,
                        DefenderShipNo = ParseDigitsToInt(match.Groups["defNo"].Value),
                        DefenderGroupSide = match.Groups["defSide"].Value,
                        DefenderMarines = ParseDigitsToInt(match.Groups["defMar"].Value),
                        DefenderOutcome = match.Groups["defOut"].Value
                    });
                }
            }

            return lineList.Count;
        }

        private static int ParseWinnerSummary(ArrayList lineList, int cursor, SeaBattleImport battle)
        {
            for (var i = cursor; i < lineList.Count; i++)
            {
                var line = lineList[i].ToString();
                var trimmed = line.Trim();
                if (trimmed.Length == 0 || trimmed.StartsWith("Group A", StringComparison.Ordinal))
                {
                    continue;
                }

                if (trimmed.StartsWith("tonnage:", StringComparison.OrdinalIgnoreCase))
                {
                    int beginA, endA, beginB, endB;
                    decimal lossA, lossB;
                    ParseSummaryPair(trimmed, out beginA, out endA, out lossA, out beginB, out endB, out lossB);
                    battle.GroupATonnageBegin = beginA;
                    battle.GroupATonnageEnd = endA;
                    battle.GroupATonnageLossPct = lossA;
                    battle.GroupBTonnageBegin = beginB;
                    battle.GroupBTonnageEnd = endB;
                    battle.GroupBTonnageLossPct = lossB;
                    continue;
                }

                if (trimmed.StartsWith("marines:", StringComparison.OrdinalIgnoreCase))
                {
                    int beginA, endA, beginB, endB;
                    decimal lossA, lossB;
                    ParseSummaryPair(trimmed, out beginA, out endA, out lossA, out beginB, out endB, out lossB);
                    battle.GroupAMarinesBegin = beginA;
                    battle.GroupAMarinesEnd = endA;
                    battle.GroupAMarinesLossPct = lossA;
                    battle.GroupBMarinesBegin = beginB;
                    battle.GroupBMarinesEnd = endB;
                    battle.GroupBMarinesLossPct = lossB;
                    continue;
                }

                if (trimmed.StartsWith("losses:", StringComparison.OrdinalIgnoreCase) || trimmed.IndexOf("losses:", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    var avgMatch = SummaryAverageRegex.Match(trimmed);
                    if (avgMatch.Success)
                    {
                        battle.GroupAAverageLossPct = ParsePercent(avgMatch.Groups["lossA"].Value);
                        battle.GroupBAverageLossPct = ParsePercent(avgMatch.Groups["lossB"].Value);
                    }
                    continue;
                }

                var winnerMatch = WinnerRegex.Match(trimmed);
                if (winnerMatch.Success)
                {
                    battle.WinnerGroup = winnerMatch.Groups["side"].Value;
                    battle.WinnerText = Truncate(trimmed, 64);
                    return i + 1;
                }

                if (trimmed.IndexOf("wins the naval battle", StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    battle.WinnerGroup = trimmed.IndexOf("Group A", StringComparison.OrdinalIgnoreCase) >= 0 ? "A"
                        : (trimmed.IndexOf("Group B", StringComparison.OrdinalIgnoreCase) >= 0 ? "B" : string.Empty);
                    battle.WinnerText = Truncate(trimmed, 64);
                    return i + 1;
                }

                if (WinnerRegex.IsMatch(trimmed)
                    || trimmed.StartsWith("Fleet after the battle - Group", StringComparison.Ordinal)
                    || trimmed.StartsWith("7. Capture of merchant ships", StringComparison.Ordinal)
                    || SeaBattleHeaderRegex.IsMatch(trimmed))
                {
                    return i;
                }
            }

            return lineList.Count;
        }

        private static void ParseSummaryPair(
            string line,
            out int beginA,
            out int endA,
            out decimal lossA,
            out int beginB,
            out int endB,
            out decimal lossB)
        {
            beginA = 0;
            endA = 0;
            lossA = 0;
            beginB = 0;
            endB = 0;
            lossB = 0;

            var match = SummaryLineRegex.Match(line ?? string.Empty);
            if (!match.Success)
            {
                return;
            }

            beginA = ParseDigitsToInt(match.Groups["beginA"].Value);
            endA = ParseDigitsToInt(match.Groups["endA"].Value);
            lossA = ParsePercent(match.Groups["lossA"].Value);
            beginB = ParseDigitsToInt(match.Groups["beginB"].Value);
            endB = ParseDigitsToInt(match.Groups["endB"].Value);
            lossB = ParsePercent(match.Groups["lossB"].Value);
        }

        private static decimal ParsePercent(string text)
        {
            var normalized = ((text ?? string.Empty).Trim()).Replace(",", ".");
            decimal parsed;
            return decimal.TryParse(normalized, NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture, out parsed) ? parsed : 0m;
        }

        private static int ParseMerchantCaptures(ArrayList lineList, int cursor, SeaBattleImport battle)
        {
            for (var i = cursor; i < lineList.Count; i++)
            {
                var line = lineList[i].ToString();
                if (IsSeaBattleBoundary(line))
                {
                    return i;
                }

                if (line.IndexOf("Ship  Cap", StringComparison.Ordinal) >= 0)
                {
                    continue;
                }

                var matches = MerchantCaptureRegex.Matches(line);
                foreach (Match match in matches)
                {
                    battle.MerchantCaptures.Add(new SeaBattleMerchantCaptureImport
                    {
                        RoundNo = 7,
                        CapturedShipNo = ParseDigitsToInt(match.Groups["ship"].Value),
                        CapturedByShipNo = ParseDigitsToInt(match.Groups["cap"].Value)
                    });
                }
            }

            return lineList.Count;
        }

        private static int ParsePostFleet(ArrayList lineList, int cursor, SeaBattleImport battle, string side)
        {
            for (var i = cursor; i < lineList.Count; i++)
            {
                var line = lineList[i].ToString();
                if (IsSeaBattleBoundary(line))
                {
                    return i;
                }

                if (line.IndexOf("No Typ Cond", StringComparison.Ordinal) >= 0)
                {
                    continue;
                }

                var matches = PostFleetRegex.Matches(line);
                foreach (Match match in matches)
                {
                    battle.Ships.Add(new SeaBattleShipImport
                    {
                        GroupSide = side,
                        Phase = "POST",
                        ShipKind = ParseDigitsToInt(match.Groups["type"].Value) > 25 ? "MERCHANT" : "WARSHIP",
                        ReportShipNo = null,
                        FinalItemNo = ParseDigitsToInt(match.Groups["item"].Value),
                        Type = ParseDigitsToInt(match.Groups["type"].Value),
                        Name = string.Empty,
                        Tonnage = null,
                        Marines = ParseDigitsToInt(match.Groups["mar"].Value),
                        Brigade = string.Empty,
                        ConditionPct = ParseDigitsToInt(match.Groups["cond"].Value),
                        Goods1 = null,
                        Goods2 = null
                    });
                }
            }

            return lineList.Count;
        }

        private static void InsertSeaBattle(DbContext auDB, SeaBattleImport battle)
        {
            var winnerGroup = (battle.WinnerGroup ?? string.Empty).Trim().ToUpperInvariant();
            var winnerText = (battle.WinnerText ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(winnerGroup))
            {
                if (battle.GroupAAverageLossPct < battle.GroupBAverageLossPct)
                {
                    winnerGroup = "A";
                    winnerText = "Group A wins the naval battle";
                }
                else if (battle.GroupBAverageLossPct < battle.GroupAAverageLossPct)
                {
                    winnerGroup = "B";
                    winnerText = "Group B wins the naval battle";
                }
            }

            auDB.Database.ExecuteSqlCommand(@"
INSERT INTO dbo.TR_SeaBattles (
    TurnId, SeaBattleNo, GroupAName, GroupBName, StateA, StateB, X, Y, WinnerGroup, WinnerText,
    GroupATonnageBegin, GroupATonnageEnd, GroupATonnageLossPct,
    GroupAMarinesBegin, GroupAMarinesEnd, GroupAMarinesLossPct, GroupAAverageLossPct,
    GroupBTonnageBegin, GroupBTonnageEnd, GroupBTonnageLossPct,
    GroupBMarinesBegin, GroupBMarinesEnd, GroupBMarinesLossPct, GroupBAverageLossPct
) VALUES (
    @p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9,
    @p10, @p11, @p12,
    @p13, @p14, @p15, @p16,
    @p17, @p18, @p19,
    @p20, @p21, @p22, @p23
)",
                battle.TurnId, battle.SeaBattleNo, battle.GroupAName, battle.GroupBName, battle.StateA, battle.StateB, battle.X, battle.Y,
                winnerGroup, winnerText,
                battle.GroupATonnageBegin, battle.GroupATonnageEnd, battle.GroupATonnageLossPct,
                battle.GroupAMarinesBegin, battle.GroupAMarinesEnd, battle.GroupAMarinesLossPct, battle.GroupAAverageLossPct,
                battle.GroupBTonnageBegin, battle.GroupBTonnageEnd, battle.GroupBTonnageLossPct,
                battle.GroupBMarinesBegin, battle.GroupBMarinesEnd, battle.GroupBMarinesLossPct, battle.GroupBAverageLossPct);

            foreach (var ship in battle.Ships)
            {
                auDB.Database.ExecuteSqlCommand(@"
INSERT INTO dbo.TR_SeaBattleShips (
    TurnId, SeaBattleNo, GroupSide, Phase, ShipKind, ReportShipNo, FinalItemNo, Type, Name, Tonnage, Marines, Brigade, ConditionPct, Goods1, Goods2
) VALUES (
    @p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9, @p10, @p11, @p12, @p13, @p14
)",
                    battle.TurnId, battle.SeaBattleNo, ship.GroupSide, ship.Phase, ship.ShipKind,
                    ship.ReportShipNo, ship.FinalItemNo, ship.Type, ship.Name, ship.Tonnage, ship.Marines, ship.Brigade, ship.ConditionPct, ship.Goods1, ship.Goods2);
            }

            foreach (var action in battle.LongRangeActions)
            {
                auDB.Database.ExecuteSqlCommand(@"
INSERT INTO dbo.TR_SeaBattleLongRangeActions (
    TurnId, SeaBattleNo, RoundNo, GroupSide, ReportShipNo, ShipType, Tonnage, Marines, EnemyShipNo
) VALUES (
    @p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8
)",
                    battle.TurnId, battle.SeaBattleNo, action.RoundNo, action.GroupSide, action.ReportShipNo,
                    action.ShipType, action.Tonnage, action.Marines, action.EnemyShipNo);
            }

            foreach (var action in battle.BoardingActions)
            {
                auDB.Database.ExecuteSqlCommand(@"
INSERT INTO dbo.TR_SeaBattleBoardingActions (
    TurnId, SeaBattleNo, RoundNo, ActionNo, AttackerShipNo, AttackerGroupSide, AttackerMarines, AttackerOutcome, DefenderShipNo, DefenderGroupSide, DefenderMarines, DefenderOutcome
) VALUES (
    @p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9, @p10, @p11
)",
                    battle.TurnId, battle.SeaBattleNo, action.RoundNo, action.ActionNo, action.AttackerShipNo, action.AttackerGroupSide,
                    action.AttackerMarines, action.AttackerOutcome, action.DefenderShipNo, action.DefenderGroupSide, action.DefenderMarines, action.DefenderOutcome);
            }

            foreach (var capture in battle.MerchantCaptures)
            {
                auDB.Database.ExecuteSqlCommand(@"
INSERT INTO dbo.TR_SeaBattleMerchantCaptures (
    TurnId, SeaBattleNo, RoundNo, CapturedShipNo, CapturedByShipNo
) VALUES (
    @p0, @p1, @p2, @p3, @p4
)",
                    battle.TurnId, battle.SeaBattleNo, capture.RoundNo, capture.CapturedShipNo, capture.CapturedByShipNo);
            }
        }

        private class SeaBattleImport
        {
            public string TurnId { get; set; }
            public int SeaBattleNo { get; set; }
            public string GroupAName { get; set; }
            public string GroupBName { get; set; }
            public string StateA { get; set; }
            public string StateB { get; set; }
            public int X { get; set; }
            public int Y { get; set; }
            public string WinnerGroup { get; set; }
            public string WinnerText { get; set; }
            public int GroupATonnageBegin { get; set; }
            public int GroupATonnageEnd { get; set; }
            public decimal GroupATonnageLossPct { get; set; }
            public int GroupAMarinesBegin { get; set; }
            public int GroupAMarinesEnd { get; set; }
            public decimal GroupAMarinesLossPct { get; set; }
            public decimal GroupAAverageLossPct { get; set; }
            public int GroupBTonnageBegin { get; set; }
            public int GroupBTonnageEnd { get; set; }
            public decimal GroupBTonnageLossPct { get; set; }
            public int GroupBMarinesBegin { get; set; }
            public int GroupBMarinesEnd { get; set; }
            public decimal GroupBMarinesLossPct { get; set; }
            public decimal GroupBAverageLossPct { get; set; }
            public List<SeaBattleShipImport> Ships { get; set; } = new List<SeaBattleShipImport>();
            public List<SeaBattleLongRangeActionImport> LongRangeActions { get; set; } = new List<SeaBattleLongRangeActionImport>();
            public List<SeaBattleBoardingActionImport> BoardingActions { get; set; } = new List<SeaBattleBoardingActionImport>();
            public List<SeaBattleMerchantCaptureImport> MerchantCaptures { get; set; } = new List<SeaBattleMerchantCaptureImport>();
        }

        private class SeaBattleShipImport
        {
            public string GroupSide { get; set; }
            public string Phase { get; set; }
            public string ShipKind { get; set; }
            public int? ReportShipNo { get; set; }
            public int? FinalItemNo { get; set; }
            public int? Type { get; set; }
            public string Name { get; set; }
            public int? Tonnage { get; set; }
            public int? Marines { get; set; }
            public string Brigade { get; set; }
            public int? ConditionPct { get; set; }
            public int? Goods1 { get; set; }
            public int? Goods2 { get; set; }
        }

        private class SeaBattleLongRangeActionImport
        {
            public int RoundNo { get; set; }
            public string GroupSide { get; set; }
            public int ReportShipNo { get; set; }
            public int ShipType { get; set; }
            public int Tonnage { get; set; }
            public int Marines { get; set; }
            public int EnemyShipNo { get; set; }
        }

        private class SeaBattleBoardingActionImport
        {
            public int RoundNo { get; set; }
            public int ActionNo { get; set; }
            public int AttackerShipNo { get; set; }
            public string AttackerGroupSide { get; set; }
            public int AttackerMarines { get; set; }
            public string AttackerOutcome { get; set; }
            public int DefenderShipNo { get; set; }
            public string DefenderGroupSide { get; set; }
            public int DefenderMarines { get; set; }
            public string DefenderOutcome { get; set; }
        }

        private class SeaBattleMerchantCaptureImport
        {
            public int RoundNo { get; set; }
            public int CapturedShipNo { get; set; }
            public int CapturedByShipNo { get; set; }
        }
    }
}
