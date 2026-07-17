using Austerlitz.DAL;
using System.Data.SqlClient;
using System.Linq;
using System.Web.Http;

namespace Austerlitz.Controllers
{
    public partial class TurnReportApiController
    {
        [HttpPost]
        public IHttpActionResult createTREstimatedMathBattle(CreateEstimatedMathBattleRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.TurnId) || request.SourceMathBattleNo <= 0)
            {
                return BadRequest("A valid turn and source battle are required.");
            }

            var sourcePhase = ((request.SourcePhase ?? string.Empty) + string.Empty).Trim().ToUpperInvariant();
            if (sourcePhase != "PRE" && sourcePhase != "POST")
            {
                return BadRequest("Source phase must be PRE or POST.");
            }

            using (var dataContext = new AusterlitzDbContext())
            using (var transaction = dataContext.Database.BeginTransaction())
            {
                try
                {
                    var hasTwoSides = dataContext.Database.SqlQuery<int>(@"
SELECT COUNT(1)
FROM dbo.TR_MathBattleResultActual
WHERE TurnId = @turnId
  AND MathBattleNo = @sourceMathBattleNo
  AND ISNULL(LTRIM(RTRIM(StateA)), '') <> ''
  AND ISNULL(LTRIM(RTRIM(StateB)), '') <> ''",
                        new SqlParameter("@turnId", request.TurnId),
                        new SqlParameter("@sourceMathBattleNo", request.SourceMathBattleNo)).SingleOrDefault() > 0;
                    if (!hasTwoSides)
                    {
                        transaction.Rollback();
                        return BadRequest("Source battle must have two armies present.");
                    }

                    var sourceBrigadeCount = dataContext.Database.SqlQuery<int>(@"
SELECT COUNT(1)
FROM dbo.TR_MathBattleBrigades
WHERE TurnId = @turnId
  AND MathBattleNo = @sourceMathBattleNo
  AND UPPER(LTRIM(RTRIM(Phase))) = @sourcePhase",
                        new SqlParameter("@turnId", request.TurnId),
                        new SqlParameter("@sourceMathBattleNo", request.SourceMathBattleNo),
                        new SqlParameter("@sourcePhase", sourcePhase)).SingleOrDefault();
                    if (sourceBrigadeCount <= 0)
                    {
                        transaction.Rollback();
                        return BadRequest("No source brigades found for the selected phase.");
                    }

                    var nextMathBattleNo = dataContext.Database.SqlQuery<int>(@"
SELECT CASE
    WHEN ISNULL(MAX(MathBattleNo), 9999) < 10000 THEN 10000
    ELSE ISNULL(MAX(MathBattleNo), 9999) + 1
END
FROM dbo.TR_MathBattleResultActual
WHERE TurnId = @turnId", new SqlParameter("@turnId", request.TurnId)).Single();

                    var insertedResults = dataContext.Database.ExecuteSqlCommand(@"
INSERT INTO dbo.TR_MathBattleResultActual (
    TurnId, MathBattleNo, StateA, StateB, Name, X, Y, Terrain,
    StateAMenTotal, StateALossesTotal, StateABattleRate, StateBMenTotal, StateBLossesTotal, StateBBattleRate,
    ArtStateAMen, ArtStateABattlePoints, ArtStateALosses, ArtStateBMen, ArtStateBBattlePoints, ArtStateBLosses,
    LR1StateAMen, LR1StateABattlePoints, LR1StateALosses, LR1StateBMen, LR1StateBBattlePoints, LR1StateBLosses,
    H2H1StateAMen, H2H1StateABattlePoints, H2H1StateALosses, H2H1StateBMen, H2H1StateBBattlePoints, H2H1StateBLosses,
    H2H2StateAMen, H2H2StateABattlePoints, H2H2StateALosses, H2H2StateBMen, H2H2StateBBattlePoints, H2H2StateBLosses,
    LR2StateAMen, LR2StateABattlePoints, LR2StateALosses, LR2StateBMen, LR2StateBBattlePoints, LR2StateBLosses,
    IsEstimated
)
SELECT
    TurnId, @nextMathBattleNo, StateA, StateB, @estimatedName, X, Y, Terrain,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    1
FROM dbo.TR_MathBattleResultActual
WHERE TurnId = @turnId
  AND MathBattleNo = @sourceMathBattleNo",
                        new SqlParameter("@nextMathBattleNo", nextMathBattleNo),
                        new SqlParameter("@estimatedName", "ESTIMATED"),
                        new SqlParameter("@turnId", request.TurnId),
                        new SqlParameter("@sourceMathBattleNo", request.SourceMathBattleNo));
                    if (insertedResults <= 0)
                    {
                        transaction.Rollback();
                        return BadRequest("Source battle result was not found.");
                    }

                    var insertedBrigades = dataContext.Database.ExecuteSqlCommand(@"
INSERT INTO dbo.TR_MathBattleBrigades (
    TurnId, MathBattleNo, State, Name, Phase,
    CalclLR, CalcArtillery, CalclHC, CalcTotal,
    Batt1Type, Batt1EF, Batt1Size, Batt2Type, Batt2EF, Batt2Size,
    Batt3Type, Batt3EF, Batt3Size, Batt4Type, Batt4EF, Batt4Size,
    Batt5Type, Batt5EF, Batt5Size, Batt6Type, Batt6EF, Batt6Size,
    Batt7Type, Batt7EF, Batt7Size
)
SELECT
    TurnId, @nextMathBattleNo, State, Name, 'PRE',
    CalclLR, CalcArtillery, CalclHC, CalcTotal,
    Batt1Type, Batt1EF, Batt1Size, Batt2Type, Batt2EF, Batt2Size,
    Batt3Type, Batt3EF, Batt3Size, Batt4Type, Batt4EF, Batt4Size,
    Batt5Type, Batt5EF, Batt5Size, Batt6Type, Batt6EF, Batt6Size,
    Batt7Type, Batt7EF, Batt7Size
FROM dbo.TR_MathBattleBrigades
WHERE TurnId = @turnId
  AND MathBattleNo = @sourceMathBattleNo
  AND UPPER(LTRIM(RTRIM(Phase))) = @sourcePhase",
                        new SqlParameter("@nextMathBattleNo", nextMathBattleNo),
                        new SqlParameter("@turnId", request.TurnId),
                        new SqlParameter("@sourceMathBattleNo", request.SourceMathBattleNo),
                        new SqlParameter("@sourcePhase", sourcePhase));
                    if (insertedBrigades <= 0)
                    {
                        transaction.Rollback();
                        return BadRequest("No brigades were copied.");
                    }

                    transaction.Commit();
                    return Ok(new CreateEstimatedMathBattleResponse
                    {
                        MathBattleNo = nextMathBattleNo
                    });
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
        }

        [HttpPost]
        public IHttpActionResult createTRFederationEstimatedMathBattle(CreateFederationEstimatedMathBattleRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.TurnId) || request.SourceMathBattleNo <= 0 || request.FederationNo <= 0)
            {
                return BadRequest("A valid turn, source battle and federation are required.");
            }

            var sourcePhase = ((request.SourcePhase ?? string.Empty) + string.Empty).Trim().ToUpperInvariant();
            if (sourcePhase != "PRE" && sourcePhase != "POST")
            {
                return BadRequest("Source phase must be PRE or POST.");
            }

            var replaceState = NormalizeStateCode(request.ReplaceState);
            if (string.IsNullOrWhiteSpace(replaceState))
            {
                return BadRequest("Replace state is required.");
            }

            using (var dataContext = new AusterlitzDbContext())
            using (var transaction = dataContext.Database.BeginTransaction())
            {
                try
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
                        transaction.Rollback();
                        return BadRequest("Source battle result was not found.");
                    }

                    var stateA = NormalizeStateCode(sourceBattle.StateA);
                    var stateB = NormalizeStateCode(sourceBattle.StateB);
                    if (replaceState != stateA && replaceState != stateB)
                    {
                        transaction.Rollback();
                        return BadRequest("Replace state must be one of the source battle states.");
                    }

                    var opponentState = replaceState == stateA ? stateB : stateA;
                    var battleSphere = CalcSphere(sourceBattle.X, sourceBattle.Y);
                    var sourceBrigadeCount = dataContext.Database.SqlQuery<int>(@"
SELECT COUNT(1)
FROM dbo.TR_MathBattleBrigades
WHERE TurnId = @turnId
  AND MathBattleNo = @sourceMathBattleNo
  AND UPPER(LTRIM(RTRIM(Phase))) = @sourcePhase",
                        new SqlParameter("@turnId", request.TurnId),
                        new SqlParameter("@sourceMathBattleNo", request.SourceMathBattleNo),
                        new SqlParameter("@sourcePhase", sourcePhase)).SingleOrDefault();
                    if (sourceBrigadeCount <= 0)
                    {
                        transaction.Rollback();
                        return BadRequest("No source brigades found for the selected phase.");
                    }

                    var federationRows = dataContext.Database.SqlQuery<FederationBrigadeSourceRow>(@"
SELECT
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
WHERE TurnId = @turnId
  AND ISNULL(Federation, 0) = @federationNo",
                        new SqlParameter("@turnId", request.TurnId),
                        new SqlParameter("@federationNo", request.FederationNo)).ToArray()
                        .Where(row => row != null && CalcSphere(ParseAxisText(row.X_OrState), ParseAxisText(row.Y_OrFleet)) == battleSphere)
                        .ToArray();
                    if (federationRows.Length <= 0)
                    {
                        transaction.Rollback();
                        return BadRequest("No federation brigades were found in the source battle sphere.");
                    }

                    var nextMathBattleNo = dataContext.Database.SqlQuery<int>(@"
SELECT CASE
    WHEN ISNULL(MAX(MathBattleNo), 9999) < 10000 THEN 10000
    ELSE ISNULL(MAX(MathBattleNo), 9999) + 1
END
FROM dbo.TR_MathBattleResultActual
WHERE TurnId = @turnId", new SqlParameter("@turnId", request.TurnId)).Single();

                    var estimatedName = TruncateText("ESTIMATED FED " + request.FederationNo + " vs " + opponentState, 16);
                    var insertedResults = dataContext.Database.ExecuteSqlCommand(@"
INSERT INTO dbo.TR_MathBattleResultActual (
    TurnId, MathBattleNo, StateA, StateB, Name, X, Y, Terrain,
    StateAMenTotal, StateALossesTotal, StateABattleRate, StateBMenTotal, StateBLossesTotal, StateBBattleRate,
    ArtStateAMen, ArtStateABattlePoints, ArtStateALosses, ArtStateBMen, ArtStateBBattlePoints, ArtStateBLosses,
    LR1StateAMen, LR1StateABattlePoints, LR1StateALosses, LR1StateBMen, LR1StateBBattlePoints, LR1StateBLosses,
    H2H1StateAMen, H2H1StateABattlePoints, H2H1StateALosses, H2H1StateBMen, H2H1StateBBattlePoints, H2H1StateBLosses,
    H2H2StateAMen, H2H2StateABattlePoints, H2H2StateALosses, H2H2StateBMen, H2H2StateBBattlePoints, H2H2StateBLosses,
    LR2StateAMen, LR2StateABattlePoints, LR2StateALosses, LR2StateBMen, LR2StateBBattlePoints, LR2StateBLosses,
    IsEstimated
)
SELECT
    TurnId, @nextMathBattleNo, StateA, StateB, @estimatedName, X, Y, Terrain,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    1
FROM dbo.TR_MathBattleResultActual
WHERE TurnId = @turnId
  AND MathBattleNo = @sourceMathBattleNo",
                        new SqlParameter("@nextMathBattleNo", nextMathBattleNo),
                        new SqlParameter("@estimatedName", estimatedName),
                        new SqlParameter("@turnId", request.TurnId),
                        new SqlParameter("@sourceMathBattleNo", request.SourceMathBattleNo));
                    if (insertedResults <= 0)
                    {
                        transaction.Rollback();
                        return BadRequest("Source battle result was not found.");
                    }

                    var insertedOpponentBrigades = dataContext.Database.ExecuteSqlCommand(@"
INSERT INTO dbo.TR_MathBattleBrigades (
    TurnId, MathBattleNo, State, Name, Phase,
    CalclLR, CalcArtillery, CalclHC, CalcTotal,
    Batt1Type, Batt1EF, Batt1Size, Batt2Type, Batt2EF, Batt2Size,
    Batt3Type, Batt3EF, Batt3Size, Batt4Type, Batt4EF, Batt4Size,
    Batt5Type, Batt5EF, Batt5Size, Batt6Type, Batt6EF, Batt6Size,
    Batt7Type, Batt7EF, Batt7Size
)
SELECT
    TurnId, @nextMathBattleNo, State, Name, 'PRE',
    NULL, NULL, NULL, NULL,
    Batt1Type, Batt1EF, Batt1Size, Batt2Type, Batt2EF, Batt2Size,
    Batt3Type, Batt3EF, Batt3Size, Batt4Type, Batt4EF, Batt4Size,
    Batt5Type, Batt5EF, Batt5Size, Batt6Type, Batt6EF, Batt6Size,
    Batt7Type, Batt7EF, Batt7Size
FROM dbo.TR_MathBattleBrigades
WHERE TurnId = @turnId
  AND MathBattleNo = @sourceMathBattleNo
  AND UPPER(LTRIM(RTRIM(Phase))) = @sourcePhase
  AND State = @opponentState",
                        new SqlParameter("@nextMathBattleNo", nextMathBattleNo),
                        new SqlParameter("@turnId", request.TurnId),
                        new SqlParameter("@sourceMathBattleNo", request.SourceMathBattleNo),
                        new SqlParameter("@sourcePhase", sourcePhase),
                        new SqlParameter("@opponentState", opponentState));
                    if (insertedOpponentBrigades <= 0)
                    {
                        transaction.Rollback();
                        return BadRequest("No opponent brigades were copied.");
                    }

                    foreach (var federationBrigade in federationRows)
                    {
                        dataContext.Database.ExecuteSqlCommand(@"
INSERT INTO dbo.TR_MathBattleBrigades (
    TurnId, MathBattleNo, State, Name, Phase,
    CalclLR, CalcArtillery, CalclHC, CalcTotal,
    Batt1Type, Batt1EF, Batt1Size, Batt2Type, Batt2EF, Batt2Size,
    Batt3Type, Batt3EF, Batt3Size, Batt4Type, Batt4EF, Batt4Size,
    Batt5Type, Batt5EF, Batt5Size, Batt6Type, Batt6EF, Batt6Size,
    Batt7Type, Batt7EF, Batt7Size
) VALUES (
    @p0, @p1, @p2, @p3, 'PRE',
    NULL, NULL, NULL, NULL,
    @p4, @p5, @p6, @p7, @p8, @p9,
    @p10, @p11, @p12, @p13, @p14, @p15,
    @p16, @p17, @p18, @p19, @p20, @p21,
    @p22, @p23, @p24
)",
                            request.TurnId,
                            nextMathBattleNo,
                            replaceState,
                            TruncateText(federationBrigade.Name, 16),
                            federationBrigade.Batt1Type, federationBrigade.Batt1EF, federationBrigade.Batt1Size,
                            federationBrigade.Batt2Type, federationBrigade.Batt2EF, federationBrigade.Batt2Size,
                            federationBrigade.Batt3Type, federationBrigade.Batt3EF, federationBrigade.Batt3Size,
                            federationBrigade.Batt4Type, federationBrigade.Batt4EF, federationBrigade.Batt4Size,
                            federationBrigade.Batt5Type, federationBrigade.Batt5EF, federationBrigade.Batt5Size,
                            federationBrigade.Batt6Type, federationBrigade.Batt6EF, federationBrigade.Batt6Size,
                            federationBrigade.Batt7Type, federationBrigade.Batt7EF, federationBrigade.Batt7Size);
                    }

                    transaction.Commit();
                    return Ok(new CreateEstimatedMathBattleResponse
                    {
                        MathBattleNo = nextMathBattleNo
                    });
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
        }

        [HttpPost]
        public IHttpActionResult saveTRMathBattleBrigadeCalcs(MathBattleBrigadeCalcSaveRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.TurnId) || request.Rows == null || request.Rows.Length == 0)
            {
                return Ok();
            }

            using (var dataContext = new AusterlitzDbContext())
            using (var transaction = dataContext.Database.BeginTransaction())
            {
                try
                {
                    foreach (var row in request.Rows)
                    {
                        if (row == null || row.MathBattleBrigadeId <= 0)
                        {
                            continue;
                        }

                        dataContext.Database.ExecuteSqlCommand(@"
UPDATE dbo.TR_MathBattleBrigades
SET CalclLR = @p0,
    CalcArtillery = @p1,
    CalclHC = @p2,
    CalcTotal = @p3
WHERE TurnId = @p4
  AND MathBattleBrigadeId = @p5",
                            row.CalcLR,
                            row.CalcArtileery,
                            row.CalcHC,
                            row.CalcTotal,
                            request.TurnId,
                            row.MathBattleBrigadeId);
                    }

                    if (request.MathBattleNo.HasValue && request.MathBattleNo.Value > 0)
                    {
                        dataContext.Database.ExecuteSqlCommand(@"
UPDATE R
SET
    Name = '',
    StateAMenTotal = ISNULL(AggA.Men, 0),
    StateALossesTotal = 0,
    StateABattleRate = 0,
    StateBMenTotal = ISNULL(AggB.Men, 0),
    StateBLossesTotal = 0,
    StateBBattleRate = 0,
    ArtStateAMen = ISNULL(AggA.Men, 0),
    ArtStateABattlePoints = ISNULL(AggA.Art, 0),
    ArtStateALosses = 0,
    ArtStateBMen = ISNULL(AggB.Men, 0),
    ArtStateBBattlePoints = ISNULL(AggB.Art, 0),
    ArtStateBLosses = 0,
    LR1StateAMen = ISNULL(AggA.Men, 0),
    LR1StateABattlePoints = ISNULL(AggA.LR, 0),
    LR1StateALosses = 0,
    LR1StateBMen = ISNULL(AggB.Men, 0),
    LR1StateBBattlePoints = ISNULL(AggB.LR, 0),
    LR1StateBLosses = 0,
    H2H1StateAMen = ISNULL(AggA.Men, 0),
    H2H1StateABattlePoints = ISNULL(AggA.HC, 0),
    H2H1StateALosses = 0,
    H2H1StateBMen = ISNULL(AggB.Men, 0),
    H2H1StateBBattlePoints = ISNULL(AggB.HC, 0),
    H2H1StateBLosses = 0,
    H2H2StateAMen = ISNULL(AggA.Men, 0),
    H2H2StateABattlePoints = ISNULL(AggA.HC, 0),
    H2H2StateALosses = 0,
    H2H2StateBMen = ISNULL(AggB.Men, 0),
    H2H2StateBBattlePoints = ISNULL(AggB.HC, 0),
    H2H2StateBLosses = 0,
    LR2StateAMen = ISNULL(AggA.Men, 0),
    LR2StateABattlePoints = ISNULL(AggA.LR, 0),
    LR2StateALosses = 0,
    LR2StateBMen = ISNULL(AggB.Men, 0),
    LR2StateBBattlePoints = ISNULL(AggB.LR, 0),
    LR2StateBLosses = 0
FROM dbo.TR_MathBattleResultActual R
OUTER APPLY (
    SELECT
        SUM(
            ISNULL(B.Batt1Size, 0) + ISNULL(B.Batt2Size, 0) + ISNULL(B.Batt3Size, 0) +
            ISNULL(B.Batt4Size, 0) + ISNULL(B.Batt5Size, 0) + ISNULL(B.Batt6Size, 0) + ISNULL(B.Batt7Size, 0)
        ) AS Men,
        SUM(ISNULL(B.CalcArtillery, 0)) AS Art,
        SUM(ISNULL(B.CalclLR, 0)) AS LR,
        SUM(ISNULL(B.CalclHC, 0)) AS HC
    FROM dbo.TR_MathBattleBrigades B
    WHERE B.TurnId = R.TurnId
      AND B.MathBattleNo = R.MathBattleNo
      AND UPPER(LTRIM(RTRIM(B.Phase))) = 'PRE'
      AND B.State = R.StateA
) AggA
OUTER APPLY (
    SELECT
        SUM(
            ISNULL(B.Batt1Size, 0) + ISNULL(B.Batt2Size, 0) + ISNULL(B.Batt3Size, 0) +
            ISNULL(B.Batt4Size, 0) + ISNULL(B.Batt5Size, 0) + ISNULL(B.Batt6Size, 0) + ISNULL(B.Batt7Size, 0)
        ) AS Men,
        SUM(ISNULL(B.CalcArtillery, 0)) AS Art,
        SUM(ISNULL(B.CalclLR, 0)) AS LR,
        SUM(ISNULL(B.CalclHC, 0)) AS HC
    FROM dbo.TR_MathBattleBrigades B
    WHERE B.TurnId = R.TurnId
      AND B.MathBattleNo = R.MathBattleNo
      AND UPPER(LTRIM(RTRIM(B.Phase))) = 'PRE'
      AND B.State = R.StateB
) AggB
WHERE R.TurnId = @p0
  AND R.MathBattleNo = @p1
  AND R.IsEstimated = 1",
                            request.TurnId,
                            request.MathBattleNo.Value);
                    }

                    transaction.Commit();
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }

            return Ok();
        }
    }
}
