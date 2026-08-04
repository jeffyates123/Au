using Austerlitz.DAL;
using System;
using System.Data.SqlClient;
using System.Linq;

namespace Austerlitz.Controllers
{
    public partial class TurnReportApiController
    {
        private void RecalculateEstimatedBattleOutcome(AusterlitzDbContext dataContext, string turnId, int mathBattleNo)
        {
            var header = dataContext.Database.SqlQuery<MathBattleHeaderStateRow>(@"
SELECT TOP 1
    StateA,
    StateB
FROM dbo.TR_MathBattleResultActual
WHERE TurnId = @turnId
  AND MathBattleNo = @mathBattleNo
  AND IsEstimated = 1",
                new SqlParameter("@turnId", turnId),
                new SqlParameter("@mathBattleNo", mathBattleNo)).SingleOrDefault();
            if (header == null)
            {
                return;
            }

            var stateA = NormalizeStateCode(header.StateA);
            var stateB = NormalizeStateCode(header.StateB);
            if (string.IsNullOrWhiteSpace(stateA) || string.IsNullOrWhiteSpace(stateB))
            {
                return;
            }

            var preBrigades = dataContext.Database.SqlQuery<MathBattleBrigadeRow>(@"
SELECT
    MathBattleBrigadeId, TurnId, MathBattleNo, State, Name, Phase,
    CalclLR AS CalcLR, CalcArtillery AS CalcArtileery, CalclHC AS CalcHC, CalcTotal,
    Batt1Type, Batt1EF, Batt1Size, Batt2Type, Batt2EF, Batt2Size,
    Batt3Type, Batt3EF, Batt3Size, Batt4Type, Batt4EF, Batt4Size,
    Batt5Type, Batt5EF, Batt5Size, Batt6Type, Batt6EF, Batt6Size,
    Batt7Type, Batt7EF, Batt7Size
FROM dbo.TR_MathBattleBrigades
WHERE TurnId = @turnId
  AND MathBattleNo = @mathBattleNo
  AND UPPER(LTRIM(RTRIM(Phase))) = 'PRE'
ORDER BY State, Name",
                new SqlParameter("@turnId", turnId),
                new SqlParameter("@mathBattleNo", mathBattleNo)).ToArray();

            var sideA = BuildSideBattleSnapshot(preBrigades, stateA);
            var sideB = BuildSideBattleSnapshot(preBrigades, stateB);

            var artLossToA = ClampLoss(sideA.StartMen, sideB.ArtilleryPoints);
            var artLossToB = ClampLoss(sideB.StartMen, sideA.ArtilleryPoints);

            var menAAfterArt = Math.Max(0, sideA.StartMen - artLossToA);
            var menBAfterArt = Math.Max(0, sideB.StartMen - artLossToB);

            var lr1LossToA = ClampLoss(menAAfterArt, sideB.LongRangePoints);
            var lr1LossToB = ClampLoss(menBAfterArt, sideA.LongRangePoints);

            var menAAfterLr1 = Math.Max(0, menAAfterArt - lr1LossToA);
            var menBAfterLr1 = Math.Max(0, menBAfterArt - lr1LossToB);

            var h2h1LossToA = ClampLoss(menAAfterLr1, sideB.HandCombatPoints);
            var h2h1LossToB = ClampLoss(menBAfterLr1, sideA.HandCombatPoints);

            var menAAfterH2H1 = Math.Max(0, menAAfterLr1 - h2h1LossToA);
            var menBAfterH2H1 = Math.Max(0, menBAfterLr1 - h2h1LossToB);

            var h2h2LossToA = ClampLoss(menAAfterH2H1, sideB.HandCombatPoints);
            var h2h2LossToB = ClampLoss(menBAfterH2H1, sideA.HandCombatPoints);

            var menAAfterH2H2 = Math.Max(0, menAAfterH2H1 - h2h2LossToA);
            var menBAfterH2H2 = Math.Max(0, menBAfterH2H1 - h2h2LossToB);

            var lr2LossToA = ClampLoss(menAAfterH2H2, sideB.LongRangePoints);
            var lr2LossToB = ClampLoss(menBAfterH2H2, sideA.LongRangePoints);

            var totalLossA = artLossToA + lr1LossToA + h2h1LossToA + h2h2LossToA + lr2LossToA;
            var totalLossB = artLossToB + lr1LossToB + h2h1LossToB + h2h2LossToB + lr2LossToB;
            var preciseRateA = CalcBattleRatePrecise(sideA.StartMen, totalLossA);
            var preciseRateB = CalcBattleRatePrecise(sideB.StartMen, totalLossB);
            var winner = DetermineEstimatedBattleWinner(stateA, stateB, preciseRateA, preciseRateB);

            var postA = BuildPostBattleRows(turnId, mathBattleNo, stateA, sideA.Brigades, totalLossA);
            var postB = BuildPostBattleRows(turnId, mathBattleNo, stateB, sideB.Brigades, totalLossB);

            dataContext.Database.ExecuteSqlCommand(@"
UPDATE dbo.TR_MathBattleResultActual
SET
    Name = @p0,
    StateAMenTotal = @p1,
    StateALossesTotal = @p2,
    StateABattleRate = @p3,
    StateBMenTotal = @p4,
    StateBLossesTotal = @p5,
    StateBBattleRate = @p6,
    ArtStateAMen = @p7,
    ArtStateABattlePoints = @p8,
    ArtStateALosses = @p9,
    ArtStateBMen = @p10,
    ArtStateBBattlePoints = @p11,
    ArtStateBLosses = @p12,
    LR1StateAMen = @p13,
    LR1StateABattlePoints = @p14,
    LR1StateALosses = @p15,
    LR1StateBMen = @p16,
    LR1StateBBattlePoints = @p17,
    LR1StateBLosses = @p18,
    H2H1StateAMen = @p19,
    H2H1StateABattlePoints = @p20,
    H2H1StateALosses = @p21,
    H2H1StateBMen = @p22,
    H2H1StateBBattlePoints = @p23,
    H2H1StateBLosses = @p24,
    H2H2StateAMen = @p25,
    H2H2StateABattlePoints = @p26,
    H2H2StateALosses = @p27,
    H2H2StateBMen = @p28,
    H2H2StateBBattlePoints = @p29,
    H2H2StateBLosses = @p30,
    LR2StateAMen = @p31,
    LR2StateABattlePoints = @p32,
    LR2StateALosses = @p33,
    LR2StateBMen = @p34,
    LR2StateBBattlePoints = @p35,
    LR2StateBLosses = @p36
WHERE TurnId = @p37
  AND MathBattleNo = @p38
  AND IsEstimated = 1",
                winner,
                sideA.StartMen,
                totalLossA,
                CalcBattleRate(sideA.StartMen, totalLossA),
                sideB.StartMen,
                totalLossB,
                CalcBattleRate(sideB.StartMen, totalLossB),
                sideA.StartMen,
                sideA.ArtilleryPoints,
                artLossToA,
                sideB.StartMen,
                sideB.ArtilleryPoints,
                artLossToB,
                menAAfterArt,
                sideA.LongRangePoints,
                lr1LossToA,
                menBAfterArt,
                sideB.LongRangePoints,
                lr1LossToB,
                menAAfterLr1,
                sideA.HandCombatPoints,
                h2h1LossToA,
                menBAfterLr1,
                sideB.HandCombatPoints,
                h2h1LossToB,
                menAAfterH2H1,
                sideA.HandCombatPoints,
                h2h2LossToA,
                menBAfterH2H1,
                sideB.HandCombatPoints,
                h2h2LossToB,
                menAAfterH2H2,
                sideA.LongRangePoints,
                lr2LossToA,
                menBAfterH2H2,
                sideB.LongRangePoints,
                lr2LossToB,
                turnId,
                mathBattleNo);

            dataContext.Database.ExecuteSqlCommand(@"
DELETE FROM dbo.TR_MathBattleBrigades
WHERE TurnId = @p0
  AND MathBattleNo = @p1
  AND UPPER(LTRIM(RTRIM(Phase))) = 'POST'",
                turnId,
                mathBattleNo);

            foreach (var post in postA.Concat(postB))
            {
                dataContext.Database.ExecuteSqlCommand(@"
INSERT INTO dbo.TR_MathBattleBrigades (
    TurnId, MathBattleNo, State, Name, Phase,
    CalclLR, CalcArtillery, CalclHC, CalcTotal,
    Batt1Type, Batt1EF, Batt1Size, Batt2Type, Batt2EF, Batt2Size,
    Batt3Type, Batt3EF, Batt3Size, Batt4Type, Batt4EF, Batt4Size,
    Batt5Type, Batt5EF, Batt5Size, Batt6Type, Batt6EF, Batt6Size,
    Batt7Type, Batt7EF, Batt7Size
)
VALUES (
    @p0, @p1, @p2, @p3, 'POST',
    NULL, NULL, NULL, NULL,
    @p4, @p5, @p6, @p7, @p8, @p9,
    @p10, @p11, @p12, @p13, @p14, @p15,
    @p16, @p17, @p18, @p19, @p20, @p21,
    @p22, @p23, @p24
)",
                    post.TurnId,
                    post.MathBattleNo,
                    post.State,
                    post.Name,
                    post.Batt1Type, post.Batt1EF, post.Batt1Size,
                    post.Batt2Type, post.Batt2EF, post.Batt2Size,
                    post.Batt3Type, post.Batt3EF, post.Batt3Size,
                    post.Batt4Type, post.Batt4EF, post.Batt4Size,
                    post.Batt5Type, post.Batt5EF, post.Batt5Size,
                    post.Batt6Type, post.Batt6EF, post.Batt6Size,
                    post.Batt7Type, post.Batt7EF, post.Batt7Size);
            }
        }
    }
}
