using Austerlitz.DAL;
using Austerlitz.DAL.Management;
using Austerlitz.Models.TurnReport;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace Austerlitz.Controllers
{
    public class TurnReportApiController : ApiController
    {
        private int dummy;

        private static int? FederationOverride(object entity, string newField, string baseField)
        {
            int? newValue = GetNullableInt(entity, newField);
            if (newValue.HasValue)
            {
                return newValue.Value > 0 ? (int?)newValue.Value : null;
            }

            int? baseValue = GetNullableInt(entity, baseField);
            if (baseValue.HasValue)
            {
                return baseValue.Value > 0 ? (int?)baseValue.Value : null;
            }

            return null;
        }

        private static int? GetNullableInt(object entity, string propertyName)
        {
            if (entity == null)
            {
                return null;
            }

            var type = entity.GetType();
            var prop = type.GetProperty(propertyName);
            if (prop == null)
            {
                return null;
            }

            var value = prop.GetValue(entity, null);
            if (value == null)
            {
                return null;
            }

            if (value is int)
            {
                return (int)value;
            }

            if (value is int?)
            {
                return (int?)value;
            }

            int parsed;
            return int.TryParse(value.ToString(), out parsed) ? (int?)parsed : null;
        }

        public TurnReport getTRFullTurnDetails(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var turnReport = new TurnReport();

                var turnCommanders = new GenericRepository<TR_Commanders>(dataContext);
                turnReport.Commanders = turnCommanders.GetItems(x => x.TurnId == turnId).ToArray();

                var turnBrigades = new GenericRepository<TR_Brigades>(dataContext);
                turnReport.Brigades = turnBrigades.GetItems(x => x.TurnId == turnId).ToArray();

                var turnWarships = new GenericRepository<TR_Warships>(dataContext);
                turnReport.Warships = turnWarships.GetItems(x => x.TurnId == turnId).ToArray();

                var turnMerchantShips = new GenericRepository<TR_MerchantShips>(dataContext);
                turnReport.MerchantShips = turnMerchantShips.GetItems(x => x.TurnId == turnId).ToArray();

                var turnBaggageTrains = new GenericRepository<TR_BaggageTrains>(dataContext);
                turnReport.BaggageTrains = turnBaggageTrains.GetItems(x => x.TurnId == turnId).ToArray();

                var turnSpies = new GenericRepository<TR_Spies>(dataContext);
                turnReport.Spies = turnSpies.GetItems(x => x.TurnId == turnId).ToArray();

                var turnStateRelationships = new GenericRepository<TR_StateRelationships>(dataContext);
                turnReport.StateRelationships = turnStateRelationships.GetItems(x => x.TurnId == turnId).ToArray();

                var turnWarehouses = new GenericRepository<TR_Warehouses>(dataContext);
                turnReport.Warehouses = turnWarehouses.GetItems(x => x.TurnId == turnId).ToArray();

                var turnBarracks = new GenericRepository<TR_Barracks>(dataContext);
                turnReport.Barracks = turnBarracks.GetItems(x => x.TurnId == turnId).ToArray();

                var turnTradingPortsAndCities = new GenericRepository<TR_TradingPortsAndCities>(dataContext);
                turnReport.TradingPortsAndCities = turnTradingPortsAndCities.GetItems(x => x.TurnId == turnId).ToArray();
                turnReport.EconomySummary = getTREconomySummary(dataContext, turnId);

                List<MovementItems> movementItems = turnReport.Commanders.Select(x => new MovementItems() { ItemNo = x.ItemNo, OriginalItemNo = x.ItemNo, MemberItemNos = new[] { x.ItemNo }, FederationNo = FederationOverride(x, "NewFederation", "Federation"), ItemType = ItemType.Commander, Description = x.Name + " (" + x.CommandCapacity + ")", MP = x.MP, OriginalMP = x.MP, X = x.X, Y = x.Y, Sphere = CalcSphere(x.X, x.Y) }).ToList();
                var dummy = 0;

                movementItems.AddRange(turnReport.Brigades.Select(x => new MovementItems() 
                { ItemNo = x.ItemNo, OriginalItemNo = x.ItemNo, MemberItemNos = new[] { x.ItemNo }, FederationNo = FederationOverride(x, "NewFederation", "Federation"), ItemType = ItemType.Brigade, 
                    Description = x.Batt1Type + x.Batt1EF + " " + x.Batt2Type + x.Batt2EF + " " + x.Batt3Type + x.Batt3EF + " " + x.Batt4Type + x.Batt4EF + " " + x.Batt5Type + x.Batt5EF + " " + x.Batt6Type + x.Batt6EF + " " + x.Batt7Type + x.Batt7EF,
                    MP = x.MP
                    , OriginalMP = x.MP
                    , X = AxisValue(x.X_OrState)
                    , Y = AxisValue(x.Y_OrFleet)
                    , Sphere = CalcSphere(AxisValue(x.X_OrState), AxisValue(x.Y_OrFleet))
                }).ToList());

                // can add more union stuff here if necessary, not sure it makes much difference
                movementItems.AddRange(turnReport.Warships.Select(x => new MovementItems() { ItemNo = x.ItemNo, OriginalItemNo = x.ItemNo, MemberItemNos = new[] { x.ItemNo }, FederationNo = FederationOverride(x, "NewFederation", "FleetNo"), ItemType = ItemType.Warship, ShipTypeNo = x.Type, Description = x.Name, MP = x.MP, OriginalMP = x.MP, X = x.X, Y = x.Y, Sphere = CalcSphere(x.X, x.Y) }).ToList());
                movementItems.AddRange(turnReport.MerchantShips.Select(x => new MovementItems() { ItemNo = x.ItemNo, OriginalItemNo = x.ItemNo, MemberItemNos = new[] { x.ItemNo }, FederationNo = FederationOverride(x, "NewFederation", "FleetNo"), ItemType = ItemType.MerchantShip, ShipTypeNo = x.Type, Description = ItemType.MerchantShip.ToString(), MP = x.MP, OriginalMP = x.MP, X = x.X, Y = x.Y, Sphere = CalcSphere(x.X, x.Y) }).ToList());
                movementItems.AddRange(turnReport.BaggageTrains.Select(x => new MovementItems() { ItemNo = x.ItemNo, OriginalItemNo = x.ItemNo, MemberItemNos = new[] { x.ItemNo }, FederationNo = FederationOverride(x, "NewFederation", "FederationNo"), ItemType = ItemType.BaggageTrain, Description = ItemType.BaggageTrain.ToString(), MP = x.MP, OriginalMP = x.MP, X = x.X, Y = x.Y, Sphere = CalcSphere(x.X, x.Y) }).ToList());
                movementItems.AddRange(turnReport.Spies.Select(x => new MovementItems() { ItemNo = x.ItemNo, OriginalItemNo = x.ItemNo, MemberItemNos = new[] { x.ItemNo }, FederationNo = FederationOverride(x, "NewFederation", "FederationNo"), ItemType = ItemType.Spy, Description = ItemType.Spy.ToString(), MP = 75, OriginalMP = 75, X = x.X, Y = x.Y, Sphere = CalcSphere(x.X,x.Y)}).ToList());

                var federationMinMp = movementItems
                    .Where(x => x.FederationNo.HasValue)
                    .GroupBy(x => x.FederationNo.Value)
                    .ToDictionary(g => g.Key, g => g.Min(x => x.MP));

                var federationMemberNos = movementItems
                    .Where(x => x.FederationNo.HasValue)
                    .GroupBy(x => x.FederationNo.Value)
                    .ToDictionary(g => g.Key, g => g.SelectMany(x => x.MemberItemNos ?? new[] { x.ItemNo }).Distinct().ToArray());

                var normalizedMovementItems = movementItems
                    .Select(x =>
                    {
                        var isFederation = x.FederationNo.HasValue;
                        return new MovementItems
                        {
                            ItemNo = isFederation ? x.FederationNo.Value : x.ItemNo,
                            OriginalItemNo = x.OriginalItemNo,
                            MemberItemNos = isFederation ? federationMemberNos[x.FederationNo.Value] : (x.MemberItemNos ?? new[] { x.ItemNo }),
                            FederationNo = x.FederationNo,
                            ItemType = x.ItemType,
                            ShipTypeNo = x.ShipTypeNo,
                            OriginalMP = x.OriginalMP,
                            Description = x.Description,
                            MP = isFederation ? federationMinMp[x.FederationNo.Value] : x.MP,
                            X = x.X,
                            Y = x.Y,
                            Sphere = x.Sphere
                        };
                    })
                    .ToList();

                turnReport.MovementItemList = normalizedMovementItems.ToArray();
                turnReport.MapCoordinates = GetMapCoordinates(turnId, normalizedMovementItems);
                turnReport.MathBattles = getTRMathBattles(turnId);

                return turnReport;
            }
        }

        [HttpGet]
        public EconomyComputedSummaryDto getTREconomyComputedSummary(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                EnsureEconomyComputedSummaryTable(dataContext);
                return new EconomyComputedSummaryDto
                {
                    TurnId = turnId,
                    Rows = dataContext.Database.SqlQuery<EconomyComputedSummaryRow>(@"
SELECT
    TurnId,
    Sphere,
    ComputedAtUtc,
    ComputedVersion,
    StartingRevenueLd,
    ArmyMaintLd,
    NavyMaintLd,
    ProductionMaintLd,
    ArmyBuildingLd,
    ArmyTrainingLd,
    NavyBuildRepairLd,
    ProductionBuildLd,
    LdInBarracks,
    BuildFundsAvailableLd,
    TransferToEuropeLd,
    TransferFromEuropeLd,
    TransferToCaribbeanLd,
    TransferFromCaribbeanLd,
    TransferToIndiaLd,
    TransferFromIndiaLd,
    DirectSellingLd,
    DirectBuyingLd,
    TaxesLd,
    LdProduction,
    ProjectedNextMonthLd
FROM dbo.TR_EconomyComputedSummary
WHERE TurnId = @turnId
ORDER BY Sphere", new SqlParameter("@turnId", turnId ?? string.Empty)).ToArray()
                };
            }
        }

        [HttpPost]
        public IHttpActionResult saveTREconomyComputedSummary(EconomyComputedSummaryDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.TurnId))
            {
                return BadRequest("TurnId is required.");
            }

            var rows = request.Rows ?? new EconomyComputedSummaryRow[0];
            using (var dataContext = new AusterlitzDbContext())
            {
                EnsureEconomyComputedSummaryTable(dataContext);
                foreach (var row in rows.Where(x => x != null && !string.IsNullOrWhiteSpace(x.Sphere)))
                {
                    dataContext.Database.ExecuteSqlCommand(@"
MERGE dbo.TR_EconomyComputedSummary AS target
USING (SELECT @TurnId AS TurnId, @Sphere AS Sphere) AS source
ON target.TurnId = source.TurnId AND target.Sphere = source.Sphere
WHEN MATCHED THEN
    UPDATE SET
        ComputedAtUtc = @ComputedAtUtc,
        ComputedVersion = @ComputedVersion,
        StartingRevenueLd = @StartingRevenueLd,
        ArmyMaintLd = @ArmyMaintLd,
        NavyMaintLd = @NavyMaintLd,
        ProductionMaintLd = @ProductionMaintLd,
        ArmyBuildingLd = @ArmyBuildingLd,
        ArmyTrainingLd = @ArmyTrainingLd,
        NavyBuildRepairLd = @NavyBuildRepairLd,
        ProductionBuildLd = @ProductionBuildLd,
        LdInBarracks = @LdInBarracks,
        BuildFundsAvailableLd = @BuildFundsAvailableLd,
        TransferToEuropeLd = @TransferToEuropeLd,
        TransferFromEuropeLd = @TransferFromEuropeLd,
        TransferToCaribbeanLd = @TransferToCaribbeanLd,
        TransferFromCaribbeanLd = @TransferFromCaribbeanLd,
        TransferToIndiaLd = @TransferToIndiaLd,
        TransferFromIndiaLd = @TransferFromIndiaLd,
        DirectSellingLd = @DirectSellingLd,
        DirectBuyingLd = @DirectBuyingLd,
        TaxesLd = @TaxesLd,
        LdProduction = @LdProduction,
        ProjectedNextMonthLd = @ProjectedNextMonthLd
WHEN NOT MATCHED THEN
    INSERT (
        TurnId, Sphere, ComputedAtUtc, ComputedVersion,
        StartingRevenueLd, ArmyMaintLd, NavyMaintLd, ProductionMaintLd,
        ArmyBuildingLd, ArmyTrainingLd, NavyBuildRepairLd, ProductionBuildLd,
        LdInBarracks, BuildFundsAvailableLd, TransferToEuropeLd, TransferFromEuropeLd,
        TransferToCaribbeanLd, TransferFromCaribbeanLd, TransferToIndiaLd, TransferFromIndiaLd,
        DirectSellingLd, DirectBuyingLd, TaxesLd, LdProduction, ProjectedNextMonthLd
    ) VALUES (
        @TurnId, @Sphere, @ComputedAtUtc, @ComputedVersion,
        @StartingRevenueLd, @ArmyMaintLd, @NavyMaintLd, @ProductionMaintLd,
        @ArmyBuildingLd, @ArmyTrainingLd, @NavyBuildRepairLd, @ProductionBuildLd,
        @LdInBarracks, @BuildFundsAvailableLd, @TransferToEuropeLd, @TransferFromEuropeLd,
        @TransferToCaribbeanLd, @TransferFromCaribbeanLd, @TransferToIndiaLd, @TransferFromIndiaLd,
        @DirectSellingLd, @DirectBuyingLd, @TaxesLd, @LdProduction, @ProjectedNextMonthLd
    );",
                        new SqlParameter("@TurnId", request.TurnId ?? string.Empty),
                        new SqlParameter("@Sphere", row.Sphere ?? string.Empty),
                        new SqlParameter("@ComputedAtUtc", (object)row.ComputedAtUtc ?? DBNull.Value),
                        new SqlParameter("@ComputedVersion", (object)row.ComputedVersion ?? DBNull.Value),
                        new SqlParameter("@StartingRevenueLd", row.StartingRevenueLd),
                        new SqlParameter("@ArmyMaintLd", row.ArmyMaintLd),
                        new SqlParameter("@NavyMaintLd", row.NavyMaintLd),
                        new SqlParameter("@ProductionMaintLd", row.ProductionMaintLd),
                        new SqlParameter("@ArmyBuildingLd", row.ArmyBuildingLd),
                        new SqlParameter("@ArmyTrainingLd", row.ArmyTrainingLd),
                        new SqlParameter("@NavyBuildRepairLd", row.NavyBuildRepairLd),
                        new SqlParameter("@ProductionBuildLd", row.ProductionBuildLd),
                        new SqlParameter("@LdInBarracks", row.LdInBarracks),
                        new SqlParameter("@BuildFundsAvailableLd", row.BuildFundsAvailableLd),
                        new SqlParameter("@TransferToEuropeLd", row.TransferToEuropeLd),
                        new SqlParameter("@TransferFromEuropeLd", row.TransferFromEuropeLd),
                        new SqlParameter("@TransferToCaribbeanLd", row.TransferToCaribbeanLd),
                        new SqlParameter("@TransferFromCaribbeanLd", row.TransferFromCaribbeanLd),
                        new SqlParameter("@TransferToIndiaLd", row.TransferToIndiaLd),
                        new SqlParameter("@TransferFromIndiaLd", row.TransferFromIndiaLd),
                        new SqlParameter("@DirectSellingLd", row.DirectSellingLd),
                        new SqlParameter("@DirectBuyingLd", row.DirectBuyingLd),
                        new SqlParameter("@TaxesLd", row.TaxesLd),
                        new SqlParameter("@LdProduction", row.LdProduction),
                        new SqlParameter("@ProjectedNextMonthLd", row.ProjectedNextMonthLd));
                }
            }

            return Ok(getTREconomyComputedSummary(request.TurnId));
        }

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

                var stateA = NormalizeStateCode(sourceBattle.StateA);
                var stateB = NormalizeStateCode(sourceBattle.StateB);
                if (replaceState != stateA && replaceState != stateB)
                {
                    return BadRequest("Replace state must be one of the source battle states.");
                }

                var battleSphere = CalcSphere(sourceBattle.X, sourceBattle.Y);
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
  AND ISNULL(Federation, 0) BETWEEN 61 AND 90",
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

                var grouped = federationRows
                    .Where(row => row != null && row.FederationNo > 0)
                    .Where(row => CalcSphere(ParseAxisText(row.X_OrState), ParseAxisText(row.Y_OrFleet)) == battleSphere)
                    .GroupBy(row => row.FederationNo)
                    .OrderBy(group => group.Key)
                    .ToArray();

                var candidates = grouped.Select(group =>
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
                        FederationNo = group.Key,
                        Position = position,
                        BrigadeCount = group.Count(),
                        TotalMen = calc.TotalMen,
                        EstimatedLR = (int)Math.Round(calc.LR),
                        EstimatedArtillery = (int)Math.Round(calc.Artillery),
                        EstimatedHC = (int)Math.Round(calc.HC),
                        EstimatedTotal = (int)Math.Round(calc.Total)
                    };
                }).ToArray();

                return Ok(candidates);
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

        public class EconomyComputedSummaryDto
        {
            public string TurnId { get; set; }
            public EconomyComputedSummaryRow[] Rows { get; set; }
        }

        public class EconomyComputedSummaryRow
        {
            public string TurnId { get; set; }
            public string Sphere { get; set; }
            public DateTime? ComputedAtUtc { get; set; }
            public int? ComputedVersion { get; set; }
            public long StartingRevenueLd { get; set; }
            public long ArmyMaintLd { get; set; }
            public long NavyMaintLd { get; set; }
            public long ProductionMaintLd { get; set; }
            public long ArmyBuildingLd { get; set; }
            public long ArmyTrainingLd { get; set; }
            public long NavyBuildRepairLd { get; set; }
            public long ProductionBuildLd { get; set; }
            public long LdInBarracks { get; set; }
            public long BuildFundsAvailableLd { get; set; }
            public long TransferToEuropeLd { get; set; }
            public long TransferFromEuropeLd { get; set; }
            public long TransferToCaribbeanLd { get; set; }
            public long TransferFromCaribbeanLd { get; set; }
            public long TransferToIndiaLd { get; set; }
            public long TransferFromIndiaLd { get; set; }
            public long DirectSellingLd { get; set; }
            public long DirectBuyingLd { get; set; }
            public long TaxesLd { get; set; }
            public long LdProduction { get; set; }
            public long ProjectedNextMonthLd { get; set; }
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

        public int AxisValue(string axisValue)
        {
            return Int32.TryParse(axisValue, out dummy) ? int.Parse(axisValue) : 0;
        }

        private void EnsureEconomyComputedSummaryTable(AusterlitzDbContext dataContext)
        {
            dataContext.Database.ExecuteSqlCommand(@"
IF OBJECT_ID('dbo.TR_EconomyComputedSummary', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TR_EconomyComputedSummary (
        TurnId NVARCHAR(16) NOT NULL,
        Sphere NVARCHAR(16) NOT NULL,
        ComputedAtUtc DATETIME NULL,
        ComputedVersion INT NULL,
        StartingRevenueLd BIGINT NOT NULL DEFAULT 0,
        ArmyMaintLd BIGINT NOT NULL DEFAULT 0,
        NavyMaintLd BIGINT NOT NULL DEFAULT 0,
        ProductionMaintLd BIGINT NOT NULL DEFAULT 0,
        ArmyBuildingLd BIGINT NOT NULL DEFAULT 0,
        ArmyTrainingLd BIGINT NOT NULL DEFAULT 0,
        NavyBuildRepairLd BIGINT NOT NULL DEFAULT 0,
        ProductionBuildLd BIGINT NOT NULL DEFAULT 0,
        LdInBarracks BIGINT NOT NULL DEFAULT 0,
        BuildFundsAvailableLd BIGINT NOT NULL DEFAULT 0,
        TransferToEuropeLd BIGINT NOT NULL DEFAULT 0,
        TransferFromEuropeLd BIGINT NOT NULL DEFAULT 0,
        TransferToCaribbeanLd BIGINT NOT NULL DEFAULT 0,
        TransferFromCaribbeanLd BIGINT NOT NULL DEFAULT 0,
        TransferToIndiaLd BIGINT NOT NULL DEFAULT 0,
        TransferFromIndiaLd BIGINT NOT NULL DEFAULT 0,
        DirectSellingLd BIGINT NOT NULL DEFAULT 0,
        DirectBuyingLd BIGINT NOT NULL DEFAULT 0,
        TaxesLd BIGINT NOT NULL DEFAULT 0,
        LdProduction BIGINT NOT NULL DEFAULT 0,
        ProjectedNextMonthLd BIGINT NOT NULL DEFAULT 0,
        CONSTRAINT PK_TR_EconomyComputedSummary PRIMARY KEY (TurnId, Sphere)
    );
END");
        }

        private TR_EconomySummary getTREconomySummary(AusterlitzDbContext dataContext, string turnId)
        {
            var summary = new TR_EconomySummary { TurnId = turnId };
            try
            {
                var tableExists = dataContext.Database.SqlQuery<int>(
                    @"SELECT COUNT(1)
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'TR_EconomySummary'").SingleOrDefault() > 0;
                if (!tableExists)
                {
                    return summary;
                }

                var row = dataContext.Database.SqlQuery<TR_EconomySummary>(@"
SELECT TOP 1
    TurnId,
    ProductionMaintenanceLd,
    EuropeMaintenanceWorkers,
    CaribbeanMaintenanceWorkers,
    IndiaMaintenanceWorkers,
    CommanderPayLd,
    BrigadePayLd,
    NavyMaintenanceLd,
    NavyMaintenanceMarines,
    BarracksCount,
    FactoriesCount,
    WeavingMillsCount,
    MintsCount,
    EstatesCount,
    SheepFarmsCount,
    HorseFarmsCount,
    LumberCampsCount,
    QuarriesCount,
    MinesCount,
    VineyardsCount,
    FreeAreasCount
FROM dbo.TR_EconomySummary
WHERE TurnId = @turnId",
                    new SqlParameter("@turnId", turnId ?? string.Empty)).SingleOrDefault();
                return row ?? summary;
            }
            catch
            {
                return summary;
            }
        }

        public Sphere CalcSphere(int x, int y)
        {
            if (x <= 80 && y <= 65)
            {
                return Sphere.Europe;
            }
            if (x <= 40 && y <= 99)
            {
                return Sphere.Carribbean;
            }
            if (x <= 90 && y <= 99)
            {
                return Sphere.India;
            }
            return Sphere.Unknown;
        }

        public DisplayCoordinate[][] GetMapCoordinates(string turnId, List<MovementItems> movementItems)
        {
            var displayMapArray = new DisplayCoordinate[100][];

            using (var dataContext = new AusterlitzDbContext())
            {
                var turnMap = new GenericRepository<TR_MapCoordinates>(dataContext);
                var regionalMap = new GenericRepository<REF_PoliticalMapCoordinates>(dataContext);

                var turnCoordinateList = turnMap.GetItems(x => x.TurnId == turnId);
                var regionalCoordinateList = regionalMap.Get();
                var rulesCatalogApiController = new RulesCatalogApiController();

                var refProductionSites = rulesCatalogApiController.GetRefProductionSites();

                for (var y = 0; y <= 99; y++)
                {
                    displayMapArray[y] = new DisplayCoordinate[91];

                    for (var x = 0; x <= 90; x++)
                    {
                        var turnCoord = turnCoordinateList.SingleOrDefault(a => a.X == x && a.Y == y);
                        var regionalCoord = regionalCoordinateList.SingleOrDefault(a => a.X == x && a.Y == y);

                        if (turnCoord != null && regionalCoord != null)
                        {
                            displayMapArray[turnCoord.Y][turnCoord.X] = new DisplayCoordinate()
                            {
                                X = x,
                                Y = y,
                                TurnId = turnId,
                                Population = turnCoord.Population,
                                ProductionSite = turnCoord.ProductionSite.Replace(".", ""),
                                State = turnCoord.State,
                                Bonus = regionalCoord.Bonus,
                                Owner = regionalCoord.Owner,
                                Terrain = regionalCoord.Terrain,
                                Units = movementItems!=null && movementItems.Any(m => m.X == x && m.Y == y)? movementItems.Where(m => m.X == x && m.Y == y)?.Select(m => m.ItemNo).ToList() : new List<int>()
                            };

                            //displayMapArray[turnCoord.Y][turnCoord.X].allowableProdSites = calcAllowableProdSites(displayMapArray[turnCoord.Y][turnCoord.X], refProductionSites, state);

                        }
                        else
                        {
                            displayMapArray[y][x] = new DisplayCoordinate()
                            {
                                X = x,
                                Y = y,
                                TurnId = turnId,
                                Population = ".",
                                ProductionSite = " ",
                                State = " ",
                                Bonus = " ",
                                Owner = " ",
                                Terrain = " ",
                                Units = new List<int>()
                            };
                        }

                        if (x == 0)
                            displayMapArray[y][x].Population = x.ToString();
                        else if (y == 0)
                            displayMapArray[y][x].Population = y.ToString();

                    }
                }
                return displayMapArray;
            }
        }

        //private string calcAllowableProdSites(DisplayCoordinate displayCoordinate, REF_ProductionSites[] refProductionSites, string state)
        //{
        //    if (displayCoordinate.State != state) {
        //        return "";
        //    }
        //    else
        //    {
        //        foreach (var prodSite in refProductionSites)
        //        {
        //            if (displayCoordinate.Terrain in )
        //            {

        //            }
        //        }
        //    }
        //}

    }
}
