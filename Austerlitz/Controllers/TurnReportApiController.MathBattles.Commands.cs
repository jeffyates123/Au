using Austerlitz.DAL;
using System;
using System.Collections.Generic;
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
                catch (Exception ex)
                {
                    transaction.Rollback();
                    return BadRequest("Could not create model battle. " + ex.Message);
                }
            }
        }

        [HttpPost]
        public IHttpActionResult createTRModelEstimatedMathBattle(CreateModelEstimatedMathBattleRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.TurnId))
            {
                return BadRequest("A valid turn is required.");
            }

            var stateA = NormalizeStateCode(request.StateA);
            var stateB = NormalizeStateCode(request.StateB);
            if (string.IsNullOrWhiteSpace(stateA) || string.IsNullOrWhiteSpace(stateB))
            {
                return BadRequest("Both battle states are required.");
            }

            if (stateA == stateB)
            {
                return BadRequest("Model battle requires two different states.");
            }

            var terrain = TruncateText((request.Terrain ?? string.Empty).Trim().ToUpperInvariant(), 2);
            if (string.IsNullOrWhiteSpace(terrain))
            {
                return BadRequest("A terrain is required.");
            }

            using (var dataContext = new AusterlitzDbContext())
            using (var transaction = dataContext.Database.BeginTransaction())
            {
                try
                {
                    var sourceSphereBattle = dataContext.Database.SqlQuery<MathBattleHeaderRow>(@"
SELECT TOP 1 MathBattleNo, StateA, StateB, X, Y
FROM dbo.TR_MathBattleResultActual
WHERE TurnId = @turnId
  AND MathBattleNo = @sourceMathBattleNo",
                        new SqlParameter("@turnId", request.TurnId),
                        new SqlParameter("@sourceMathBattleNo", request.SourceMathBattleNo)).SingleOrDefault();

                    var nextMathBattleNo = dataContext.Database.SqlQuery<int>(@"
SELECT CASE
    WHEN ISNULL(MAX(MathBattleNo), 9999) < 10000 THEN 10000
    ELSE ISNULL(MAX(MathBattleNo), 9999) + 1
END
FROM dbo.TR_MathBattleResultActual
WHERE TurnId = @turnId", new SqlParameter("@turnId", request.TurnId)).Single();

                    dataContext.Database.ExecuteSqlCommand(@"
INSERT INTO dbo.TR_MathBattleResultActual (
    TurnId, MathBattleNo, StateA, StateB, Name, X, Y, Terrain,
    StateAMenTotal, StateALossesTotal, StateABattleRate, StateBMenTotal, StateBLossesTotal, StateBBattleRate,
    ArtStateAMen, ArtStateABattlePoints, ArtStateALosses, ArtStateBMen, ArtStateBBattlePoints, ArtStateBLosses,
    LR1StateAMen, LR1StateABattlePoints, LR1StateALosses, LR1StateBMen, LR1StateBBattlePoints, LR1StateBLosses,
    H2H1StateAMen, H2H1StateABattlePoints, H2H1StateALosses, H2H1StateBMen, H2H1StateBBattlePoints, H2H1StateBLosses,
    H2H2StateAMen, H2H2StateABattlePoints, H2H2StateALosses, H2H2StateBMen, H2H2StateBBattlePoints, H2H2StateBLosses,
    LR2StateAMen, LR2StateABattlePoints, LR2StateALosses, LR2StateBMen, LR2StateBBattlePoints, LR2StateBLosses,
    IsEstimated
) VALUES (
    @p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
    1
)",
                        request.TurnId,
                        nextMathBattleNo,
                        stateA,
                        stateB,
                        "MODEL BATTLE",
                        sourceSphereBattle != null ? sourceSphereBattle.X : 0,
                        sourceSphereBattle != null ? sourceSphereBattle.Y : 0,
                        terrain);

                    if (sourceSphereBattle != null)
                    {
                        var battleSphere = CalcSphere(sourceSphereBattle.X, sourceSphereBattle.Y);
                        var candidateRows = dataContext.Database.SqlQuery<FederationBrigadeSourceRow>(@"
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
                            new SqlParameter("@turnId", request.TurnId)).ToArray()
                            .Where(row => row != null && CalcSphere(ParseAxisText(row.X_OrState), ParseAxisText(row.Y_OrFleet)) == battleSphere)
                            .ToArray();

                        var selectedRows = ResolveSelectedForceRows(candidateRows, request.Selections, 0);
                        foreach (var row in selectedRows)
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
                                stateA,
                                TruncateText(row.Name, 16),
                                row.Batt1Type, row.Batt1EF, row.Batt1Size,
                                row.Batt2Type, row.Batt2EF, row.Batt2Size,
                                row.Batt3Type, row.Batt3EF, row.Batt3Size,
                                row.Batt4Type, row.Batt4EF, row.Batt4Size,
                                row.Batt5Type, row.Batt5EF, row.Batt5Size,
                                row.Batt6Type, row.Batt6EF, row.Batt6Size,
                                row.Batt7Type, row.Batt7EF, row.Batt7Size);
                        }
                    }

                    transaction.Commit();
                    return Ok(new CreateEstimatedMathBattleResponse
                    {
                        MathBattleNo = nextMathBattleNo
                    });
                }
                catch (Exception ex)
                {
                    transaction.Rollback();
                    return BadRequest("Could not create model battle. " + ex.Message);
                }
            }
        }

        [HttpPost]
        public IHttpActionResult saveTRModelBattleBrigades(SaveModelBattleBrigadesRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.TurnId) || request.MathBattleNo <= 0)
            {
                return BadRequest("A valid turn and battle are required.");
            }

            using (var dataContext = new AusterlitzDbContext())
            using (var transaction = dataContext.Database.BeginTransaction())
            {
                try
                {
                    var header = dataContext.Database.SqlQuery<MathBattleHeaderStateRow>(@"
SELECT TOP 1
    StateA,
    StateB
FROM dbo.TR_MathBattleResultActual
WHERE TurnId = @turnId
  AND MathBattleNo = @mathBattleNo
  AND IsEstimated = 1",
                        new SqlParameter("@turnId", request.TurnId),
                        new SqlParameter("@mathBattleNo", request.MathBattleNo)).SingleOrDefault();
                    if (header == null)
                    {
                        transaction.Rollback();
                        return BadRequest("Estimated battle was not found.");
                    }

                    var stateA = NormalizeStateCode(header.StateA);
                    var stateB = NormalizeStateCode(header.StateB);
                    if (string.IsNullOrWhiteSpace(stateA) || string.IsNullOrWhiteSpace(stateB))
                    {
                        transaction.Rollback();
                        return BadRequest("Estimated battle states are invalid.");
                    }

                    var requestedStateA = NormalizeStateCode(request.StateA);
                    var requestedStateB = NormalizeStateCode(request.StateB);
                    if (!string.IsNullOrWhiteSpace(requestedStateA))
                    {
                        stateA = requestedStateA;
                    }
                    if (!string.IsNullOrWhiteSpace(requestedStateB))
                    {
                        stateB = requestedStateB;
                    }
                    if (string.IsNullOrWhiteSpace(stateA) || string.IsNullOrWhiteSpace(stateB) || stateA == stateB)
                    {
                        transaction.Rollback();
                        return BadRequest("Model battle must have two different states.");
                    }

                    var armyRows = dataContext.Database.SqlQuery<ArmyListTypeEfRow>(@"
SELECT
    State,
    ShortName,
    EF
FROM dbo.REF_ArmyList
WHERE State IN (@stateA, @stateB)",
                        new SqlParameter("@stateA", stateA),
                        new SqlParameter("@stateB", stateB)).ToArray();
                    var efLookup = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                    foreach (var armyRow in armyRows)
                    {
                        if (armyRow == null || string.IsNullOrWhiteSpace(armyRow.State) || string.IsNullOrWhiteSpace(armyRow.ShortName))
                        {
                            continue;
                        }

                        var key = NormalizeStateCode(armyRow.State) + "|" + armyRow.ShortName.Trim().ToUpperInvariant();
                        var ef = armyRow.EF > 0 ? armyRow.EF : 3;
                        int existingEf;
                        if (!efLookup.TryGetValue(key, out existingEf) || ef > existingEf)
                        {
                            efLookup[key] = ef;
                        }
                    }

                    var stateCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
                    {
                        { stateA, 0 },
                        { stateB, 0 }
                    };
                    var rowsToInsert = new List<ModelBattleBrigadeSaveRow>();
                    foreach (var rawRow in request.Rows ?? new ModelBattleBrigadeSaveRow[0])
                    {
                        var rowState = NormalizeStateCode(rawRow != null ? rawRow.State : string.Empty);
                        if (rowState != stateA && rowState != stateB)
                        {
                            continue;
                        }

                        if (!HasAnyModelBattalionType(rawRow))
                        {
                            continue;
                        }

                        stateCounts[rowState] = stateCounts[rowState] + 1;
                        var brigadeName = TruncateText((rawRow.Name ?? string.Empty).Trim(), 16);
                        if (string.IsNullOrWhiteSpace(brigadeName))
                        {
                            brigadeName = TruncateText("Brigade " + stateCounts[rowState], 16);
                        }

                        rowsToInsert.Add(new ModelBattleBrigadeSaveRow
                        {
                            State = rowState,
                            Name = brigadeName,
                            Batt1Type = NormalizeModelBattalionType(rawRow.Batt1Type),
                            Batt2Type = NormalizeModelBattalionType(rawRow.Batt2Type),
                            Batt3Type = NormalizeModelBattalionType(rawRow.Batt3Type),
                            Batt4Type = NormalizeModelBattalionType(rawRow.Batt4Type),
                            Batt5Type = NormalizeModelBattalionType(rawRow.Batt5Type),
                            Batt6Type = NormalizeModelBattalionType(rawRow.Batt6Type),
                            Batt7Type = NormalizeModelBattalionType(rawRow.Batt7Type)
                        });
                    }

                    dataContext.Database.ExecuteSqlCommand(@"
DELETE FROM dbo.TR_MathBattleBrigades
WHERE TurnId = @turnId
  AND MathBattleNo = @mathBattleNo",
                        new SqlParameter("@turnId", request.TurnId),
                        new SqlParameter("@mathBattleNo", request.MathBattleNo));

                    foreach (var row in rowsToInsert)
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
                            request.MathBattleNo,
                            row.State,
                            row.Name,
                            row.Batt1Type, ResolveModelBattalionEf(efLookup, row.State, row.Batt1Type), ResolveModelBattalionSize(row.Batt1Type),
                            row.Batt2Type, ResolveModelBattalionEf(efLookup, row.State, row.Batt2Type), ResolveModelBattalionSize(row.Batt2Type),
                            row.Batt3Type, ResolveModelBattalionEf(efLookup, row.State, row.Batt3Type), ResolveModelBattalionSize(row.Batt3Type),
                            row.Batt4Type, ResolveModelBattalionEf(efLookup, row.State, row.Batt4Type), ResolveModelBattalionSize(row.Batt4Type),
                            row.Batt5Type, ResolveModelBattalionEf(efLookup, row.State, row.Batt5Type), ResolveModelBattalionSize(row.Batt5Type),
                            row.Batt6Type, ResolveModelBattalionEf(efLookup, row.State, row.Batt6Type), ResolveModelBattalionSize(row.Batt6Type),
                            row.Batt7Type, ResolveModelBattalionEf(efLookup, row.State, row.Batt7Type), ResolveModelBattalionSize(row.Batt7Type));
                    }

                    dataContext.Database.ExecuteSqlCommand(@"
UPDATE dbo.TR_MathBattleResultActual
SET
    Name = @p0,
    StateA = @p1,
    StateB = @p2,
    StateAMenTotal = 0,
    StateALossesTotal = 0,
    StateABattleRate = 0,
    StateBMenTotal = 0,
    StateBLossesTotal = 0,
    StateBBattleRate = 0,
    ArtStateAMen = 0,
    ArtStateABattlePoints = 0,
    ArtStateALosses = 0,
    ArtStateBMen = 0,
    ArtStateBBattlePoints = 0,
    ArtStateBLosses = 0,
    LR1StateAMen = 0,
    LR1StateABattlePoints = 0,
    LR1StateALosses = 0,
    LR1StateBMen = 0,
    LR1StateBBattlePoints = 0,
    LR1StateBLosses = 0,
    H2H1StateAMen = 0,
    H2H1StateABattlePoints = 0,
    H2H1StateALosses = 0,
    H2H1StateBMen = 0,
    H2H1StateBBattlePoints = 0,
    H2H1StateBLosses = 0,
    H2H2StateAMen = 0,
    H2H2StateABattlePoints = 0,
    H2H2StateALosses = 0,
    H2H2StateBMen = 0,
    H2H2StateBBattlePoints = 0,
    H2H2StateBLosses = 0,
    LR2StateAMen = 0,
    LR2StateABattlePoints = 0,
    LR2StateALosses = 0,
    LR2StateBMen = 0,
    LR2StateBBattlePoints = 0,
    LR2StateBLosses = 0
WHERE TurnId = @p3
  AND MathBattleNo = @p4
  AND IsEstimated = 1",
                        "MODEL BATTLE",
                        stateA,
                        stateB,
                        request.TurnId,
                        request.MathBattleNo);

                    transaction.Commit();
                    return Ok();
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
            if (request == null || string.IsNullOrWhiteSpace(request.TurnId) || request.SourceMathBattleNo <= 0)
            {
                return BadRequest("A valid turn and source battle are required.");
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

                    var isRealSourceBattle = dataContext.Database.SqlQuery<int>(@"
SELECT COUNT(1)
FROM dbo.TR_MathBattleResultActual
WHERE TurnId = @turnId
  AND MathBattleNo = @sourceMathBattleNo
  AND ISNULL(IsEstimated, 0) = 0",
                        new SqlParameter("@turnId", request.TurnId),
                        new SqlParameter("@sourceMathBattleNo", request.SourceMathBattleNo)).SingleOrDefault() > 0;
                    if (!isRealSourceBattle)
                    {
                        transaction.Rollback();
                        return BadRequest("Fight same enemy requires a real (non-estimated) source battle.");
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

                    var candidateRows = dataContext.Database.SqlQuery<FederationBrigadeSourceRow>(@"
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
                        new SqlParameter("@turnId", request.TurnId)).ToArray()
                        .Where(row => row != null && CalcSphere(ParseAxisText(row.X_OrState), ParseAxisText(row.Y_OrFleet)) == battleSphere)
                        .ToArray();

                    var hasSelections = request.Selections != null && request.Selections.Length > 0;
                    var selectedRows = ResolveSelectedForceRows(candidateRows, request.Selections, request.FederationNo);

                    if (selectedRows.Count <= 0)
                    {
                        transaction.Rollback();
                        return BadRequest("Select at least one federation or brigade in the source battle sphere.");
                    }

                    var nextMathBattleNo = dataContext.Database.SqlQuery<int>(@"
SELECT CASE
    WHEN ISNULL(MAX(MathBattleNo), 9999) < 10000 THEN 10000
    ELSE ISNULL(MAX(MathBattleNo), 9999) + 1
END
FROM dbo.TR_MathBattleResultActual
WHERE TurnId = @turnId", new SqlParameter("@turnId", request.TurnId)).Single();

                    var estimatedName = hasSelections
                        ? TruncateText("ESTIMATED MIXED", 16)
                        : TruncateText("ESTIMATED FED " + request.FederationNo + " vs " + opponentState, 16);
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

                    foreach (var federationBrigade in selectedRows)
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
                        RecalculateEstimatedBattleOutcome(dataContext, request.TurnId, request.MathBattleNo.Value);
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

        private static string NormalizeModelBattalionType(string battalionType)
        {
            var type = (battalionType ?? string.Empty).Trim().ToUpperInvariant();
            if (string.IsNullOrWhiteSpace(type) || type == "--")
            {
                return null;
            }

            return TruncateText(type, 8);
        }

        private static int? ResolveModelBattalionEf(Dictionary<string, int> efLookup, string state, string battalionType)
        {
            if (string.IsNullOrWhiteSpace(battalionType) || string.IsNullOrWhiteSpace(state))
            {
                return null;
            }

            var key = NormalizeStateCode(state) + "|" + battalionType.Trim().ToUpperInvariant();
            int ef;
            if (efLookup != null && efLookup.TryGetValue(key, out ef))
            {
                return ef > 0 ? ef : 3;
            }

            return 3;
        }

        private static int? ResolveModelBattalionSize(string battalionType)
        {
            return string.IsNullOrWhiteSpace(battalionType) ? (int?)null : 800;
        }

        private static bool HasAnyModelBattalionType(ModelBattleBrigadeSaveRow row)
        {
            if (row == null)
            {
                return false;
            }

            return !string.IsNullOrWhiteSpace(row.Batt1Type)
                || !string.IsNullOrWhiteSpace(row.Batt2Type)
                || !string.IsNullOrWhiteSpace(row.Batt3Type)
                || !string.IsNullOrWhiteSpace(row.Batt4Type)
                || !string.IsNullOrWhiteSpace(row.Batt5Type)
                || !string.IsNullOrWhiteSpace(row.Batt6Type)
                || !string.IsNullOrWhiteSpace(row.Batt7Type);
        }

        private static List<FederationBrigadeSourceRow> ResolveSelectedForceRows(
            FederationBrigadeSourceRow[] candidateRows,
            MathBattleEstimateSelection[] selections,
            int fallbackFederationNo)
        {
            var selectedRows = new List<FederationBrigadeSourceRow>();
            var rows = candidateRows ?? new FederationBrigadeSourceRow[0];
            var hasSelections = selections != null && selections.Length > 0;
            if (hasSelections)
            {
                var seenItemNos = new HashSet<int>();
                foreach (var selection in selections)
                {
                    if (selection == null)
                    {
                        continue;
                    }

                    var selectionType = ((selection.CandidateType ?? string.Empty) + string.Empty).Trim().ToUpperInvariant();
                    if (selectionType == "FEDERATION" && selection.FederationNo.HasValue && selection.FederationNo.Value > 0)
                    {
                        foreach (var row in rows.Where(row => row.FederationNo == selection.FederationNo.Value))
                        {
                            if (row.ItemNo > 0 && seenItemNos.Add(row.ItemNo))
                            {
                                selectedRows.Add(row);
                            }
                        }
                        continue;
                    }

                    if (selectionType == "BRIGADE" && selection.BrigadeItemNo.HasValue && selection.BrigadeItemNo.Value > 0)
                    {
                        var brigadeRow = rows.FirstOrDefault(row => row.ItemNo == selection.BrigadeItemNo.Value && row.FederationNo <= 0);
                        if (brigadeRow != null && brigadeRow.ItemNo > 0 && seenItemNos.Add(brigadeRow.ItemNo))
                        {
                            selectedRows.Add(brigadeRow);
                        }
                    }
                }
            }
            else if (fallbackFederationNo > 0)
            {
                selectedRows.AddRange(rows.Where(row => row.FederationNo == fallbackFederationNo));
            }

            return selectedRows;
        }

        private class SideBattleSnapshot
        {
            public MathBattleBrigadeRow[] Brigades { get; set; }
            public int StartMen { get; set; }
            public int ArtilleryPoints { get; set; }
            public int LongRangePoints { get; set; }
            public int HandCombatPoints { get; set; }
        }

        private class MathBattleHeaderStateRow
        {
            public string StateA { get; set; }
            public string StateB { get; set; }
        }
    }
}
