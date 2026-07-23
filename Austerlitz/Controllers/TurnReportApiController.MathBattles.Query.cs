using Austerlitz.DAL;
using Austerlitz.Models.TurnReport;
using System;
using System.Data.SqlClient;
using System.Linq;
using System.Web.Http;

namespace Austerlitz.Controllers
{
    public partial class TurnReportApiController
    {
        public MathBattleDetails[] getTRMathBattles(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var results = dataContext.Database.SqlQuery<MathBattleResultRow>(@"
SELECT
    TurnId, MathBattleNo, StateA, StateB, Name, X, Y, Terrain,
    StateAMenTotal, StateALossesTotal, StateABattleRate, StateBMenTotal, StateBLossesTotal, StateBBattleRate,
    ArtStateAMen, ArtStateABattlePoints, ArtStateALosses, ArtStateBMen, ArtStateBBattlePoints, ArtStateBLosses,
    LR1StateAMen, LR1StateABattlePoints, LR1StateALosses, LR1StateBMen, LR1StateBBattlePoints, LR1StateBLosses,
    H2H1StateAMen, H2H1StateABattlePoints, H2H1StateALosses, H2H1StateBMen, H2H1StateBBattlePoints, H2H1StateBLosses,
    H2H2StateAMen, H2H2StateABattlePoints, H2H2StateALosses, H2H2StateBMen, H2H2StateBBattlePoints, H2H2StateBLosses,
    LR2StateAMen, LR2StateABattlePoints, LR2StateALosses, LR2StateBMen, LR2StateBBattlePoints, LR2StateBLosses,
    IsEstimated
FROM dbo.TR_MathBattleResultActual
WHERE TurnId = @turnId
ORDER BY MathBattleNo", new SqlParameter("@turnId", turnId ?? string.Empty)).ToArray();

                var brigades = dataContext.Database.SqlQuery<MathBattleBrigadeRow>(@"
SELECT
    MathBattleBrigadeId, TurnId, MathBattleNo, State, Name, Phase,
    CalclLR AS CalcLR, CalcArtillery AS CalcArtileery, CalclHC AS CalcHC, CalcTotal,
    Batt1Type, Batt1EF, Batt1Size, Batt2Type, Batt2EF, Batt2Size,
    Batt3Type, Batt3EF, Batt3Size, Batt4Type, Batt4EF, Batt4Size,
    Batt5Type, Batt5EF, Batt5Size, Batt6Type, Batt6EF, Batt6Size,
    Batt7Type, Batt7EF, Batt7Size
FROM dbo.TR_MathBattleBrigades
WHERE TurnId = @turnId
ORDER BY MathBattleNo, State, Phase, Name", new SqlParameter("@turnId", turnId ?? string.Empty)).ToArray();

                return results.Select(result => new MathBattleDetails
                {
                    MathBattleNo = result.MathBattleNo,
                    IsEstimated = result.IsEstimated,
                    StateA = result.StateA,
                    StateB = result.StateB,
                    Winner = result.Name,
                    X = result.X,
                    Y = result.Y,
                    Terrain = result.Terrain,
                    StateAMenTotal = result.StateAMenTotal,
                    StateALossesTotal = result.StateALossesTotal,
                    StateABattleRate = result.StateABattleRate,
                    StateBMenTotal = result.StateBMenTotal,
                    StateBLossesTotal = result.StateBLossesTotal,
                    StateBBattleRate = result.StateBBattleRate,
                    Art = MapPhase(result.ArtStateAMen, result.ArtStateABattlePoints, result.ArtStateALosses, result.ArtStateBMen, result.ArtStateBBattlePoints, result.ArtStateBLosses),
                    LR1 = MapPhase(result.LR1StateAMen, result.LR1StateABattlePoints, result.LR1StateALosses, result.LR1StateBMen, result.LR1StateBBattlePoints, result.LR1StateBLosses),
                    H2H1 = MapPhase(result.H2H1StateAMen, result.H2H1StateABattlePoints, result.H2H1StateALosses, result.H2H1StateBMen, result.H2H1StateBBattlePoints, result.H2H1StateBLosses),
                    H2H2 = MapPhase(result.H2H2StateAMen, result.H2H2StateABattlePoints, result.H2H2StateALosses, result.H2H2StateBMen, result.H2H2StateBBattlePoints, result.H2H2StateBLosses),
                    LR2 = MapPhase(result.LR2StateAMen, result.LR2StateABattlePoints, result.LR2StateALosses, result.LR2StateBMen, result.LR2StateBBattlePoints, result.LR2StateBLosses),
                    Brigades = brigades
                        .Where(x => x.MathBattleNo == result.MathBattleNo)
                        .Select(MapBrigade)
                        .ToArray()
                }).ToArray();
            }
        }

        private static MathBattlePhaseMetrics MapPhase(int stateAMen, int stateABattlePoints, int stateALosses, int stateBMen, int stateBBattlePoints, int stateBLosses)
        {
            return new MathBattlePhaseMetrics
            {
                StateAMen = stateAMen,
                StateABattlePoints = stateABattlePoints,
                StateALosses = stateALosses,
                StateBMen = stateBMen,
                StateBBattlePoints = stateBBattlePoints,
                StateBLosses = stateBLosses
            };
        }

        [HttpPost]
        public IHttpActionResult getTRMathBattleFederationCandidates(GetMathBattleFederationCandidatesRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.TurnId) || request.SourceMathBattleNo <= 0)
            {
                return BadRequest("A valid turn and source battle are required.");
            }

            var replaceState = NormalizeStateCode(request.ReplaceState);
            if (string.IsNullOrWhiteSpace(replaceState))
            {
                return BadRequest("A valid replace state is required.");
            }

            using (var dataContext = new AusterlitzDbContext())
            {
                var sourceBattle = dataContext.Database.SqlQuery<MathBattleHeaderRow>(@"
SELECT TOP 1 MathBattleNo, StateA, StateB, X, Y
FROM dbo.TR_MathBattleResultActual
WHERE TurnId = @turnId
  AND MathBattleNo = @sourceMathBattleNo",
                    new SqlParameter("@turnId", request.TurnId),
                    new SqlParameter("@sourceMathBattleNo", request.SourceMathBattleNo)).SingleOrDefault();

                if (sourceBattle == null)
                {
                    return BadRequest("Source battle was not found.");
                }

                var battleSphere = CalcSphere(sourceBattle.X, sourceBattle.Y);
                var federationRows = dataContext.Database.SqlQuery<FederationBrigadeSourceRow>(@"
SELECT
    ItemNo,
    ISNULL(Federation, 0) AS FederationNo,
    X_OrState,
    Y_OrFleet,
    Name,
    Batt1Type, Batt1EF, Batt1Size,
    Batt2Type, Batt2EF, Batt2Size,
    Batt3Type, Batt3EF, Batt3Size,
    Batt4Type, Batt4EF, Batt4Size,
    Batt5Type, Batt5EF, Batt5Size,
    Batt6Type, Batt6EF, Batt6Size,
    Batt7Type, Batt7EF, Batt7Size
FROM dbo.TR_Brigades
WHERE TurnId = @turnId",
                    new SqlParameter("@turnId", request.TurnId)).ToArray();

                var armyRows = dataContext.Database.SqlQuery<ArmyListCalcRow>(@"
SELECT
    ItemNo,
    ShortName,
    EF,
    HC,
    LR
FROM dbo.REF_ArmyList
WHERE State = @state",
                    new SqlParameter("@state", replaceState)).ToArray();
                var armyLookup = BuildArmyCalcLookup(armyRows);

                var sphereRows = federationRows
                    .Where(row => row != null)
                    .Where(row => CalcSphere(ParseAxisText(row.X_OrState), ParseAxisText(row.Y_OrFleet)) == battleSphere)
                    .ToArray();

                var grouped = sphereRows
                    .Where(row => row != null && row.FederationNo > 0)
                    .GroupBy(row => row.FederationNo)
                    .OrderBy(group => group.Key)
                    .ToArray();

                var federationCandidates = grouped.Select(group =>
                {
                    var calc = new FederationCalcAccumulator();
                    var first = group.FirstOrDefault();
                    var position = FormatPosition(ParseAxisText(first != null ? first.X_OrState : null), ParseAxisText(first != null ? first.Y_OrFleet : null));
                    foreach (var brigade in group)
                    {
                        AddBrigadeToFederationCalc(calc, brigade, armyLookup);
                    }

                    return new MathBattleFederationCandidateRow
                    {
                        CandidateKey = "FED:" + group.Key,
                        CandidateType = "Federation",
                        DisplayName = "Federation " + group.Key,
                        FederationNo = group.Key,
                        BrigadeItemNo = null,
                        Position = position,
                        BrigadeCount = group.Count(),
                        TotalMen = calc.TotalMen,
                        EstimatedLR = (int)Math.Round(calc.LR),
                        EstimatedArtillery = (int)Math.Round(calc.Artillery),
                        EstimatedHC = (int)Math.Round(calc.HC),
                        EstimatedTotal = (int)Math.Round(calc.Total)
                    };
                }).ToArray();

                var looseBrigadeCandidates = sphereRows
                    .Where(row => row.FederationNo <= 0)
                    .OrderBy(row => row.ItemNo)
                    .Select(row =>
                    {
                        var calc = new FederationCalcAccumulator();
                        AddBrigadeToFederationCalc(calc, row, armyLookup);
                        var position = FormatPosition(ParseAxisText(row.X_OrState), ParseAxisText(row.Y_OrFleet));
                        var brigadeName = string.IsNullOrWhiteSpace(row.Name) ? ("Brigade " + row.ItemNo) : row.Name.Trim();
                        return new MathBattleFederationCandidateRow
                        {
                            CandidateKey = "BDE:" + row.ItemNo,
                            CandidateType = "Brigade",
                            DisplayName = row.ItemNo + " - " + brigadeName,
                            FederationNo = 0,
                            BrigadeItemNo = row.ItemNo,
                            Position = position,
                            BrigadeCount = 1,
                            TotalMen = calc.TotalMen,
                            EstimatedLR = (int)Math.Round(calc.LR),
                            EstimatedArtillery = (int)Math.Round(calc.Artillery),
                            EstimatedHC = (int)Math.Round(calc.HC),
                            EstimatedTotal = (int)Math.Round(calc.Total)
                        };
                    }).ToArray();

                var candidates = federationCandidates.Concat(looseBrigadeCandidates).ToArray();

                return Ok(candidates);
            }
        }
    }
}
