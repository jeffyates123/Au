using Austerlitz.Models.TurnReport;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Austerlitz.Controllers
{
    public partial class TurnReportApiController
    {
        private static string TruncateText(string text, int maxLen)
        {
            var value = (text ?? string.Empty).Trim();
            if (value.Length <= maxLen)
            {
                return value;
            }

            return value.Substring(0, maxLen);
        }

        private static string NormalizeStateCode(string stateCode)
        {
            if (string.IsNullOrWhiteSpace(stateCode))
            {
                return string.Empty;
            }

            return stateCode.Trim().ToUpperInvariant();
        }

        private static int ParseAxisText(string axisText)
        {
            int parsed;
            return int.TryParse((axisText ?? string.Empty).Trim(), out parsed) ? parsed : 0;
        }

        private static string FormatPosition(int x, int y)
        {
            return x + "/" + y;
        }

        private static Dictionary<string, ArmyListCalcRow> BuildArmyCalcLookup(IEnumerable<ArmyListCalcRow> rows)
        {
            var lookup = new Dictionary<string, ArmyListCalcRow>(StringComparer.OrdinalIgnoreCase);
            foreach (var row in rows ?? Enumerable.Empty<ArmyListCalcRow>())
            {
                if (row == null || string.IsNullOrWhiteSpace(row.ShortName))
                {
                    continue;
                }

                var key = row.ShortName.Trim().ToUpperInvariant();
                if (!lookup.ContainsKey(key))
                {
                    lookup[key] = row;
                }
            }

            return lookup;
        }

        private static int ReadBattalionEf(FederationBrigadeSourceRow row, int battalionNo)
        {
            switch (battalionNo)
            {
                case 1: return row.Batt1EF ?? 0;
                case 2: return row.Batt2EF ?? 0;
                case 3: return row.Batt3EF ?? 0;
                case 4: return row.Batt4EF ?? 0;
                case 5: return row.Batt5EF ?? 0;
                case 6: return row.Batt6EF ?? 0;
                case 7: return row.Batt7EF ?? 0;
                default: return 0;
            }
        }

        private static int ReadBattalionSize(FederationBrigadeSourceRow row, int battalionNo)
        {
            switch (battalionNo)
            {
                case 1: return row.Batt1Size ?? 0;
                case 2: return row.Batt2Size ?? 0;
                case 3: return row.Batt3Size ?? 0;
                case 4: return row.Batt4Size ?? 0;
                case 5: return row.Batt5Size ?? 0;
                case 6: return row.Batt6Size ?? 0;
                case 7: return row.Batt7Size ?? 0;
                default: return 0;
            }
        }

        private static string ReadBattalionType(FederationBrigadeSourceRow row, int battalionNo)
        {
            switch (battalionNo)
            {
                case 1: return row.Batt1Type;
                case 2: return row.Batt2Type;
                case 3: return row.Batt3Type;
                case 4: return row.Batt4Type;
                case 5: return row.Batt5Type;
                case 6: return row.Batt6Type;
                case 7: return row.Batt7Type;
                default: return string.Empty;
            }
        }

        private static void AddBrigadeToFederationCalc(FederationCalcAccumulator acc, FederationBrigadeSourceRow brigade, Dictionary<string, ArmyListCalcRow> armyLookup)
        {
            if (acc == null || brigade == null)
            {
                return;
            }

            for (var battalionNo = 1; battalionNo <= 7; battalionNo++)
            {
                var type = (ReadBattalionType(brigade, battalionNo) ?? string.Empty).Trim();
                if (string.IsNullOrWhiteSpace(type) || type == "--")
                {
                    continue;
                }

                var size = ReadBattalionSize(brigade, battalionNo);
                if (size <= 0)
                {
                    continue;
                }

                ArmyListCalcRow armyItem;
                if (!armyLookup.TryGetValue(type.ToUpperInvariant(), out armyItem) || armyItem == null)
                {
                    continue;
                }

                var battalionEf = ReadBattalionEf(brigade, battalionNo);
                var actualEf = battalionEf > 0 ? battalionEf : 3;
                var armyEf = armyItem.EF > 0 ? armyItem.EF : 3;
                var efFactor = (double)actualEf / (double)armyEf;
                var sizeFactor = (double)size / 800.0;

                var lrPoints = Math.Max(0, armyItem.LR);
                var hcPoints = Math.Max(0, armyItem.HC);
                var totalPoints = Math.Max(0, armyItem.TotalPoints) > 0
                    ? Math.Max(0, armyItem.TotalPoints)
                    : (lrPoints + hcPoints);
                var battalionLR = lrPoints * sizeFactor * efFactor;
                var battalionHC = hcPoints * sizeFactor * efFactor;
                var battalionTotal = totalPoints * sizeFactor * efFactor;

                acc.TotalMen += size;
                acc.LR += battalionLR;
                acc.HC += battalionHC;
                acc.Total += battalionTotal;
                if (armyItem.ItemNo >= 41 && armyItem.ItemNo <= 45)
                {
                    acc.Artillery += battalionLR;
                }
            }
        }

        private static MathBattleBrigade MapBrigade(MathBattleBrigadeRow brigade)
        {
            return new MathBattleBrigade
            {
                MathBattleBrigadeId = brigade.MathBattleBrigadeId,
                MathBattleNo = brigade.MathBattleNo,
                State = brigade.State,
                Phase = brigade.Phase,
                Name = brigade.Name,
                CalcLR = brigade.CalcLR,
                CalcArtileery = brigade.CalcArtileery,
                CalcHC = brigade.CalcHC,
                CalcTotal = brigade.CalcTotal,
                Batt1Type = brigade.Batt1Type,
                Batt1EF = brigade.Batt1EF,
                Batt1Size = brigade.Batt1Size,
                Batt2Type = brigade.Batt2Type,
                Batt2EF = brigade.Batt2EF,
                Batt2Size = brigade.Batt2Size,
                Batt3Type = brigade.Batt3Type,
                Batt3EF = brigade.Batt3EF,
                Batt3Size = brigade.Batt3Size,
                Batt4Type = brigade.Batt4Type,
                Batt4EF = brigade.Batt4EF,
                Batt4Size = brigade.Batt4Size,
                Batt5Type = brigade.Batt5Type,
                Batt5EF = brigade.Batt5EF,
                Batt5Size = brigade.Batt5Size,
                Batt6Type = brigade.Batt6Type,
                Batt6EF = brigade.Batt6EF,
                Batt6Size = brigade.Batt6Size,
                Batt7Type = brigade.Batt7Type,
                Batt7EF = brigade.Batt7EF,
                Batt7Size = brigade.Batt7Size
            };
        }

        private class MathBattleResultRow
        {
            public string TurnId { get; set; }
            public int MathBattleNo { get; set; }
            public string StateA { get; set; }
            public string StateB { get; set; }
            public string Name { get; set; }
            public int X { get; set; }
            public int Y { get; set; }
            public string Terrain { get; set; }
            public int StateAMenTotal { get; set; }
            public int StateALossesTotal { get; set; }
            public int StateABattleRate { get; set; }
            public int StateBMenTotal { get; set; }
            public int StateBLossesTotal { get; set; }
            public int StateBBattleRate { get; set; }
            public int ArtStateAMen { get; set; }
            public int ArtStateABattlePoints { get; set; }
            public int ArtStateALosses { get; set; }
            public int ArtStateBMen { get; set; }
            public int ArtStateBBattlePoints { get; set; }
            public int ArtStateBLosses { get; set; }
            public int LR1StateAMen { get; set; }
            public int LR1StateABattlePoints { get; set; }
            public int LR1StateALosses { get; set; }
            public int LR1StateBMen { get; set; }
            public int LR1StateBBattlePoints { get; set; }
            public int LR1StateBLosses { get; set; }
            public int H2H1StateAMen { get; set; }
            public int H2H1StateABattlePoints { get; set; }
            public int H2H1StateALosses { get; set; }
            public int H2H1StateBMen { get; set; }
            public int H2H1StateBBattlePoints { get; set; }
            public int H2H1StateBLosses { get; set; }
            public int H2H2StateAMen { get; set; }
            public int H2H2StateABattlePoints { get; set; }
            public int H2H2StateALosses { get; set; }
            public int H2H2StateBMen { get; set; }
            public int H2H2StateBBattlePoints { get; set; }
            public int H2H2StateBLosses { get; set; }
            public int LR2StateAMen { get; set; }
            public int LR2StateABattlePoints { get; set; }
            public int LR2StateALosses { get; set; }
            public int LR2StateBMen { get; set; }
            public int LR2StateBBattlePoints { get; set; }
            public int LR2StateBLosses { get; set; }
            public bool IsEstimated { get; set; }
        }

        private class MathBattleBrigadeRow
        {
            public int MathBattleBrigadeId { get; set; }
            public string TurnId { get; set; }
            public int MathBattleNo { get; set; }
            public string State { get; set; }
            public string Name { get; set; }
            public string Phase { get; set; }
            public int? CalcLR { get; set; }
            public int? CalcArtileery { get; set; }
            public int? CalcHC { get; set; }
            public int? CalcTotal { get; set; }
            public string Batt1Type { get; set; }
            public int? Batt1EF { get; set; }
            public int? Batt1Size { get; set; }
            public string Batt2Type { get; set; }
            public int? Batt2EF { get; set; }
            public int? Batt2Size { get; set; }
            public string Batt3Type { get; set; }
            public int? Batt3EF { get; set; }
            public int? Batt3Size { get; set; }
            public string Batt4Type { get; set; }
            public int? Batt4EF { get; set; }
            public int? Batt4Size { get; set; }
            public string Batt5Type { get; set; }
            public int? Batt5EF { get; set; }
            public int? Batt5Size { get; set; }
            public string Batt6Type { get; set; }
            public int? Batt6EF { get; set; }
            public int? Batt6Size { get; set; }
            public string Batt7Type { get; set; }
            public int? Batt7EF { get; set; }
            public int? Batt7Size { get; set; }
        }

        private class MathBattleHeaderRow
        {
            public int MathBattleNo { get; set; }
            public string StateA { get; set; }
            public string StateB { get; set; }
            public int X { get; set; }
            public int Y { get; set; }
        }

        private class FederationBrigadeSourceRow
        {
            public int FederationNo { get; set; }
            public string X_OrState { get; set; }
            public string Y_OrFleet { get; set; }
            public string Name { get; set; }
            public string Batt1Type { get; set; }
            public int? Batt1EF { get; set; }
            public int? Batt1Size { get; set; }
            public string Batt2Type { get; set; }
            public int? Batt2EF { get; set; }
            public int? Batt2Size { get; set; }
            public string Batt3Type { get; set; }
            public int? Batt3EF { get; set; }
            public int? Batt3Size { get; set; }
            public string Batt4Type { get; set; }
            public int? Batt4EF { get; set; }
            public int? Batt4Size { get; set; }
            public string Batt5Type { get; set; }
            public int? Batt5EF { get; set; }
            public int? Batt5Size { get; set; }
            public string Batt6Type { get; set; }
            public int? Batt6EF { get; set; }
            public int? Batt6Size { get; set; }
            public string Batt7Type { get; set; }
            public int? Batt7EF { get; set; }
            public int? Batt7Size { get; set; }
        }

        private class ArmyListCalcRow
        {
            public int ItemNo { get; set; }
            public string ShortName { get; set; }
            public int EF { get; set; }
            public int HC { get; set; }
            public int LR { get; set; }
            public int TotalPoints { get; set; }
        }

        private class FederationCalcAccumulator
        {
            public int TotalMen { get; set; }
            public double LR { get; set; }
            public double Artillery { get; set; }
            public double HC { get; set; }
            public double Total { get; set; }
        }

        public class MathBattleBrigadeCalcSaveRequest
        {
            public string TurnId { get; set; }
            public int? MathBattleNo { get; set; }
            public MathBattleBrigadeCalcSaveRow[] Rows { get; set; }
        }

        public class CreateEstimatedMathBattleRequest
        {
            public string TurnId { get; set; }
            public int SourceMathBattleNo { get; set; }
            public string SourcePhase { get; set; }
        }

        public class GetMathBattleFederationCandidatesRequest
        {
            public string TurnId { get; set; }
            public int SourceMathBattleNo { get; set; }
            public string ReplaceState { get; set; }
        }

        public class CreateFederationEstimatedMathBattleRequest
        {
            public string TurnId { get; set; }
            public int SourceMathBattleNo { get; set; }
            public string SourcePhase { get; set; }
            public string ReplaceState { get; set; }
            public int FederationNo { get; set; }
        }

        public class CreateEstimatedMathBattleResponse
        {
            public int MathBattleNo { get; set; }
        }

        public class MathBattleFederationCandidateRow
        {
            public int FederationNo { get; set; }
            public string Position { get; set; }
            public int BrigadeCount { get; set; }
            public int TotalMen { get; set; }
            public int EstimatedLR { get; set; }
            public int EstimatedArtillery { get; set; }
            public int EstimatedHC { get; set; }
            public int EstimatedTotal { get; set; }
        }

        public class MathBattleBrigadeCalcSaveRow
        {
            public int MathBattleBrigadeId { get; set; }
            public int? CalcLR { get; set; }
            public int? CalcArtileery { get; set; }
            public int? CalcHC { get; set; }
            public int? CalcTotal { get; set; }
        }
    }
}
