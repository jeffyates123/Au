using System;
using System.Collections.Generic;
using System.Linq;

namespace Austerlitz.Controllers
{
    public partial class TurnReportApiController
    {
        private static SideBattleSnapshot BuildSideBattleSnapshot(MathBattleBrigadeRow[] preBrigades, string state)
        {
            var sideRows = preBrigades
                .Where(x => x != null && NormalizeStateCode(x.State) == state)
                .ToArray();

            var snapshot = new SideBattleSnapshot
            {
                Brigades = sideRows,
                StartMen = sideRows.Sum(GetBrigadeMen),
                ArtilleryPoints = sideRows.Sum(x => x.CalcArtileery ?? 0),
                LongRangePoints = sideRows.Sum(x => x.CalcLR ?? 0),
                HandCombatPoints = sideRows.Sum(x => x.CalcHC ?? 0)
            };

            return snapshot;
        }

        private static int ClampLoss(int availableMen, int battlePoints)
        {
            var plannedLoss = Math.Max(0, battlePoints);
            if (plannedLoss > availableMen)
            {
                return availableMen;
            }

            return plannedLoss;
        }

        private static int CalcBattleRate(int men, int losses)
        {
            if (men <= 0 || losses <= 0)
            {
                return 0;
            }

            return (int)Math.Round((double)men / (double)losses);
        }

        private static double CalcBattleRatePrecise(int men, int losses)
        {
            if (men <= 0 || losses <= 0)
            {
                return 0;
            }

            return (double)men / (double)losses;
        }

        private static string DetermineEstimatedBattleWinner(string stateA, string stateB, double rateA, double rateB)
        {
            var gap = Math.Abs(rateA - rateB);
            if (gap < 2.0)
            {
                return "DRAW";
            }

            return rateA >= rateB ? stateA : stateB;
        }

        private static int GetBrigadeMen(MathBattleBrigadeRow row)
        {
            return Math.Max(0, row.Batt1Size ?? 0)
                + Math.Max(0, row.Batt2Size ?? 0)
                + Math.Max(0, row.Batt3Size ?? 0)
                + Math.Max(0, row.Batt4Size ?? 0)
                + Math.Max(0, row.Batt5Size ?? 0)
                + Math.Max(0, row.Batt6Size ?? 0)
                + Math.Max(0, row.Batt7Size ?? 0);
        }

        private static List<MathBattleBrigadeRow> BuildPostBattleRows(string turnId, int mathBattleNo, string state, MathBattleBrigadeRow[] brigades, int totalLosses)
        {
            var postRows = new List<MathBattleBrigadeRow>();
            if (brigades == null || brigades.Length == 0)
            {
                return postRows;
            }

            var casualtiesByBrigade = AllocateLossesToBrigades(brigades, totalLosses);
            for (var i = 0; i < brigades.Length; i++)
            {
                var source = brigades[i];
                var battalionSizes = ReadBattalionSizes(source);
                var battalionLosses = AllocateLossesWithinBrigade(battalionSizes, casualtiesByBrigade[i]);

                postRows.Add(new MathBattleBrigadeRow
                {
                    TurnId = turnId,
                    MathBattleNo = mathBattleNo,
                    State = state,
                    Name = TruncateText(source.Name, 16),
                    Phase = "POST",
                    Batt1Type = source.Batt1Type,
                    Batt1EF = source.Batt1EF,
                    Batt1Size = Math.Max(0, battalionSizes[0] - battalionLosses[0]),
                    Batt2Type = source.Batt2Type,
                    Batt2EF = source.Batt2EF,
                    Batt2Size = Math.Max(0, battalionSizes[1] - battalionLosses[1]),
                    Batt3Type = source.Batt3Type,
                    Batt3EF = source.Batt3EF,
                    Batt3Size = Math.Max(0, battalionSizes[2] - battalionLosses[2]),
                    Batt4Type = source.Batt4Type,
                    Batt4EF = source.Batt4EF,
                    Batt4Size = Math.Max(0, battalionSizes[3] - battalionLosses[3]),
                    Batt5Type = source.Batt5Type,
                    Batt5EF = source.Batt5EF,
                    Batt5Size = Math.Max(0, battalionSizes[4] - battalionLosses[4]),
                    Batt6Type = source.Batt6Type,
                    Batt6EF = source.Batt6EF,
                    Batt6Size = Math.Max(0, battalionSizes[5] - battalionLosses[5]),
                    Batt7Type = source.Batt7Type,
                    Batt7EF = source.Batt7EF,
                    Batt7Size = Math.Max(0, battalionSizes[6] - battalionLosses[6])
                });
            }

            return postRows;
        }

        private static int[] AllocateLossesToBrigades(MathBattleBrigadeRow[] brigades, int totalLosses)
        {
            var losses = new int[brigades.Length];
            if (totalLosses <= 0 || brigades.Length == 0)
            {
                return losses;
            }

            var baseShare = totalLosses / brigades.Length;
            var remainder = totalLosses % brigades.Length;
            var weightedTargets = new double[brigades.Length];
            var weightedSum = 0.0;

            for (var i = 0; i < brigades.Length; i++)
            {
                var baseTarget = baseShare + (i < remainder ? 1 : 0);
                var modifier = ResolveBrigadeLossModifier(brigades[i]);
                weightedTargets[i] = baseTarget * modifier;
                weightedSum += weightedTargets[i];
            }

            if (weightedSum <= 0)
            {
                weightedSum = totalLosses;
            }

            var assigned = 0;
            var remainders = new double[brigades.Length];
            for (var i = 0; i < brigades.Length; i++)
            {
                var brigadeMen = GetBrigadeMen(brigades[i]);
                var scaled = weightedTargets[i] * totalLosses / weightedSum;
                var floorValue = (int)Math.Floor(scaled);
                if (floorValue > brigadeMen)
                {
                    floorValue = brigadeMen;
                }

                losses[i] = Math.Max(0, floorValue);
                remainders[i] = scaled - floorValue;
                assigned += losses[i];
            }

            var toAssign = Math.Max(0, totalLosses - assigned);
            while (toAssign > 0)
            {
                var bestIdx = -1;
                var bestRemainder = double.MinValue;
                for (var i = 0; i < brigades.Length; i++)
                {
                    var brigadeMen = GetBrigadeMen(brigades[i]);
                    if (losses[i] >= brigadeMen)
                    {
                        continue;
                    }

                    if (remainders[i] > bestRemainder)
                    {
                        bestRemainder = remainders[i];
                        bestIdx = i;
                    }
                }

                if (bestIdx < 0)
                {
                    break;
                }

                losses[bestIdx]++;
                remainders[bestIdx] = 0;
                toAssign--;
            }

            return losses;
        }

        private static int[] ReadBattalionSizes(MathBattleBrigadeRow row)
        {
            return new[]
            {
                Math.Max(0, row.Batt1Size ?? 0),
                Math.Max(0, row.Batt2Size ?? 0),
                Math.Max(0, row.Batt3Size ?? 0),
                Math.Max(0, row.Batt4Size ?? 0),
                Math.Max(0, row.Batt5Size ?? 0),
                Math.Max(0, row.Batt6Size ?? 0),
                Math.Max(0, row.Batt7Size ?? 0)
            };
        }

        private static int[] AllocateLossesWithinBrigade(int[] battalionSizes, int totalLosses)
        {
            var battalionLosses = new int[7];
            if (battalionSizes == null || battalionSizes.Length != 7 || totalLosses <= 0)
            {
                return battalionLosses;
            }

            var brigadeMen = battalionSizes.Sum();
            if (brigadeMen <= 0)
            {
                return battalionLosses;
            }

            var maxLosses = Math.Min(totalLosses, brigadeMen);
            var assigned = 0;
            var remainders = new double[7];

            for (var i = 0; i < 7; i++)
            {
                if (battalionSizes[i] <= 0)
                {
                    continue;
                }

                var share = (double)maxLosses * (double)battalionSizes[i] / (double)brigadeMen;
                var floorValue = (int)Math.Floor(share);
                if (floorValue > battalionSizes[i])
                {
                    floorValue = battalionSizes[i];
                }

                battalionLosses[i] = Math.Max(0, floorValue);
                remainders[i] = share - floorValue;
                assigned += battalionLosses[i];
            }

            var left = Math.Max(0, maxLosses - assigned);
            while (left > 0)
            {
                var bestIdx = -1;
                var bestRemainder = double.MinValue;
                for (var i = 0; i < 7; i++)
                {
                    if (battalionSizes[i] <= battalionLosses[i])
                    {
                        continue;
                    }

                    if (remainders[i] > bestRemainder)
                    {
                        bestRemainder = remainders[i];
                        bestIdx = i;
                    }
                }

                if (bestIdx < 0)
                {
                    break;
                }

                battalionLosses[bestIdx]++;
                remainders[bestIdx] = 0;
                left--;
            }

            return battalionLosses;
        }

        private static double ResolveBrigadeLossModifier(MathBattleBrigadeRow brigade)
        {
            if (brigade == null)
            {
                return 1.0;
            }

            var battalionTypes = new[]
            {
                brigade.Batt1Type, brigade.Batt2Type, brigade.Batt3Type, brigade.Batt4Type,
                brigade.Batt5Type, brigade.Batt6Type, brigade.Batt7Type
            };
            var battalionSizes = new[]
            {
                Math.Max(0, brigade.Batt1Size ?? 0), Math.Max(0, brigade.Batt2Size ?? 0), Math.Max(0, brigade.Batt3Size ?? 0),
                Math.Max(0, brigade.Batt4Size ?? 0), Math.Max(0, brigade.Batt5Size ?? 0), Math.Max(0, brigade.Batt6Size ?? 0),
                Math.Max(0, brigade.Batt7Size ?? 0)
            };

            var weightedModifier = 0.0;
            var menTotal = 0;
            for (var i = 0; i < 7; i++)
            {
                var size = battalionSizes[i];
                if (size <= 0)
                {
                    continue;
                }

                weightedModifier += ResolveUnitLossModifier(battalionTypes[i]) * size;
                menTotal += size;
            }

            if (menTotal <= 0)
            {
                return 1.0;
            }

            return weightedModifier / menTotal;
        }

        private static double ResolveUnitLossModifier(string battalionType)
        {
            var type = (battalionType ?? string.Empty).Trim().ToUpperInvariant();
            if (type == "CB")
            {
                return 0.90;
            }

            if (type == "PI")
            {
                return 1.15;
            }

            if (type == "FT" || type == "FO")
            {
                return 0.75;
            }

            return 1.0;
        }
    }
}
