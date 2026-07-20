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
    public partial class TurnReportApiController : ApiController
    {
        private const int SpyMovementPoints = 75;

        private static int? FederationOverride(int? newValue, int baseValue)
        {
            if (newValue.HasValue && newValue.Value > 0)
            {
                return newValue.Value;
            }

            return baseValue > 0 ? (int?)baseValue : null;
        }

        private static int? FederationOverride(int? newValue)
        {
            return newValue.HasValue && newValue.Value > 0 ? newValue.Value : (int?)null;
        }

        public TurnReport getTRFullTurnDetails(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var turnReport = new TurnReport();
                LoadTurnEntities(dataContext, turnId, turnReport);
                turnReport.ArmyPositions = getTRArmyPositions(dataContext, turnId);
                turnReport.Epidemics = getTREpidemics(dataContext, turnId);
                turnReport.EconomySummary = getTREconomySummary(dataContext, turnId);

                var movementItems = new List<MovementItems>();
                movementItems.AddRange(BuildCommanderMovementItems(turnReport.Commanders));
                movementItems.AddRange(BuildBrigadeMovementItems(turnReport.Brigades));
                movementItems.AddRange(BuildWarshipMovementItems(turnReport.Warships));
                movementItems.AddRange(BuildMerchantShipMovementItems(turnReport.MerchantShips));
                movementItems.AddRange(BuildBaggageTrainMovementItems(turnReport.BaggageTrains));
                movementItems.AddRange(BuildSpyMovementItems(turnReport.Spies));

                var normalizedMovementItems = NormalizeFederations(movementItems);

                turnReport.MovementItemList = normalizedMovementItems.ToArray();
                turnReport.MapCoordinates = GetMapCoordinates(turnId, normalizedMovementItems);
                turnReport.MathBattles = getTRMathBattles(turnId);
                turnReport.Errors = getTRTurnOrderErrors(dataContext, turnId);

                return turnReport;
            }
        }

        private static void LoadTurnEntities(AusterlitzDbContext dataContext, string turnId, TurnReport turnReport)
        {
            turnReport.Commanders = new GenericRepository<TR_Commanders>(dataContext).GetItems(x => x.TurnId == turnId).ToArray();
            turnReport.Brigades = new GenericRepository<TR_Brigades>(dataContext).GetItems(x => x.TurnId == turnId).ToArray();
            turnReport.Warships = new GenericRepository<TR_Warships>(dataContext).GetItems(x => x.TurnId == turnId).ToArray();
            turnReport.MerchantShips = new GenericRepository<TR_MerchantShips>(dataContext).GetItems(x => x.TurnId == turnId).ToArray();
            turnReport.BaggageTrains = new GenericRepository<TR_BaggageTrains>(dataContext).GetItems(x => x.TurnId == turnId).ToArray();
            turnReport.Spies = new GenericRepository<TR_Spies>(dataContext).GetItems(x => x.TurnId == turnId).ToArray();
            turnReport.StateRelationships = new GenericRepository<TR_StateRelationships>(dataContext).GetItems(x => x.TurnId == turnId).ToArray();
            turnReport.Warehouses = new GenericRepository<TR_Warehouses>(dataContext).GetItems(x => x.TurnId == turnId).ToArray();
            turnReport.Barracks = new GenericRepository<TR_Barracks>(dataContext).GetItems(x => x.TurnId == turnId).ToArray();
            turnReport.TradingPortsAndCities = new GenericRepository<TR_TradingPortsAndCities>(dataContext).GetItems(x => x.TurnId == turnId).ToArray();
        }

        private IEnumerable<MovementItems> BuildCommanderMovementItems(IEnumerable<TR_Commanders> commanders)
        {
            return commanders.Select(x => new MovementItems
            {
                ItemNo = x.ItemNo,
                OriginalItemNo = x.ItemNo,
                MemberItemNos = new[] { x.ItemNo },
                FederationNo = FederationOverride(x.NewFederation, x.Federation),
                ItemType = ItemType.Commander,
                Description = x.Name + " (" + x.CommandCapacity + ")",
                MP = x.MP,
                OriginalMP = x.MP,
                X = x.X,
                Y = x.Y,
                Sphere = CalcSphere(x.X, x.Y)
            });
        }

        private IEnumerable<MovementItems> BuildBrigadeMovementItems(IEnumerable<TR_Brigades> brigades)
        {
            return brigades.Select(x =>
            {
                var x0 = AxisValue(x.X_OrState);
                var y0 = AxisValue(x.Y_OrFleet);
                return new MovementItems
                {
                    ItemNo = x.ItemNo,
                    OriginalItemNo = x.ItemNo,
                    MemberItemNos = new[] { x.ItemNo },
                    FederationNo = FederationOverride(x.NewFederation, x.Federation),
                    ItemType = ItemType.Brigade,
                    Description = x.Batt1Type + x.Batt1EF + " " + x.Batt2Type + x.Batt2EF + " " + x.Batt3Type + x.Batt3EF + " " + x.Batt4Type + x.Batt4EF + " " + x.Batt5Type + x.Batt5EF + " " + x.Batt6Type + x.Batt6EF + " " + x.Batt7Type + x.Batt7EF,
                    MP = x.MP,
                    OriginalMP = x.MP,
                    X = x0,
                    Y = y0,
                    Sphere = CalcSphere(x0, y0)
                };
            });
        }

        private IEnumerable<MovementItems> BuildWarshipMovementItems(IEnumerable<TR_Warships> warships)
        {
            return warships.Select(x => new MovementItems
            {
                ItemNo = x.ItemNo,
                OriginalItemNo = x.ItemNo,
                MemberItemNos = new[] { x.ItemNo },
                FederationNo = FederationOverride(x.NewFleetNo, x.FleetNo),
                ItemType = ItemType.Warship,
                ShipTypeNo = x.Type,
                Description = x.Name,
                MP = x.MP,
                OriginalMP = x.MP,
                X = x.X,
                Y = x.Y,
                Sphere = CalcSphere(x.X, x.Y)
            });
        }

        private IEnumerable<MovementItems> BuildMerchantShipMovementItems(IEnumerable<TR_MerchantShips> merchantShips)
        {
            return merchantShips.Select(x => new MovementItems
            {
                ItemNo = x.ItemNo,
                OriginalItemNo = x.ItemNo,
                MemberItemNos = new[] { x.ItemNo },
                FederationNo = FederationOverride(x.NewFleetNo, x.FleetNo),
                ItemType = ItemType.MerchantShip,
                ShipTypeNo = x.Type,
                Description = ItemType.MerchantShip.ToString(),
                MP = x.MP,
                OriginalMP = x.MP,
                X = x.X,
                Y = x.Y,
                Sphere = CalcSphere(x.X, x.Y)
            });
        }

        private IEnumerable<MovementItems> BuildBaggageTrainMovementItems(IEnumerable<TR_BaggageTrains> baggageTrains)
        {
            return baggageTrains.Select(x => new MovementItems
            {
                ItemNo = x.ItemNo,
                OriginalItemNo = x.ItemNo,
                MemberItemNos = new[] { x.ItemNo },
                FederationNo = FederationOverride(x.NewFederation, x.FederationNo),
                ItemType = ItemType.BaggageTrain,
                Description = ItemType.BaggageTrain.ToString(),
                MP = x.MP,
                OriginalMP = x.MP,
                X = x.X,
                Y = x.Y,
                Sphere = CalcSphere(x.X, x.Y)
            });
        }

        private IEnumerable<MovementItems> BuildSpyMovementItems(IEnumerable<TR_Spies> spies)
        {
            return spies.Select(x => new MovementItems
            {
                ItemNo = x.ItemNo,
                OriginalItemNo = x.ItemNo,
                MemberItemNos = new[] { x.ItemNo },
                FederationNo = FederationOverride(x.NewFederation),
                ItemType = ItemType.Spy,
                Description = ItemType.Spy.ToString(),
                MP = SpyMovementPoints,
                OriginalMP = SpyMovementPoints,
                X = x.X,
                Y = x.Y,
                Sphere = CalcSphere(x.X, x.Y)
            });
        }

        private static List<MovementItems> NormalizeFederations(List<MovementItems> movementItems)
        {
            var federationMinMp = movementItems
                .Where(x => x.FederationNo.HasValue)
                .GroupBy(x => x.FederationNo.Value)
                .ToDictionary(g => g.Key, g => g.Min(x => x.MP));

            var federationMemberNos = movementItems
                .Where(x => x.FederationNo.HasValue)
                .GroupBy(x => x.FederationNo.Value)
                .ToDictionary(g => g.Key, g => g.SelectMany(x => x.MemberItemNos ?? new[] { x.ItemNo }).Distinct().ToArray());

            return movementItems
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
        }

        public int AxisValue(string axisValue)
        {
            int parsed;
            return Int32.TryParse(axisValue, out parsed) ? parsed : 0;
        }

        private ArmyPosition[] getTRArmyPositions(AusterlitzDbContext dataContext, string turnId)
        {
            var tableExists = dataContext.Database.SqlQuery<int>(
                @"SELECT COUNT(1)
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'TR_ArmyPositions'").SingleOrDefault() > 0;
            if (!tableExists)
            {
                return new ArmyPosition[0];
            }

            return dataContext.Database.SqlQuery<ArmyPosition>(@"
SELECT
    TurnId,
    X,
    Y,
    State,
    Bat
FROM dbo.TR_ArmyPositions
WHERE TurnId = @turnId
ORDER BY Y, X, State",
                new SqlParameter("@turnId", turnId ?? string.Empty)).ToArray();
        }

        private EpidemicPosition[] getTREpidemics(AusterlitzDbContext dataContext, string turnId)
        {
            var tableExists = dataContext.Database.SqlQuery<int>(
                @"SELECT COUNT(1)
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'TR_Epidemics'").SingleOrDefault() > 0;
            if (!tableExists)
            {
                return new EpidemicPosition[0];
            }

            return dataContext.Database.SqlQuery<EpidemicPosition>(@"
SELECT
    TurnId,
    X,
    Y,
    State
FROM dbo.TR_Epidemics
WHERE TurnId = @turnId
ORDER BY Y, X, State",
                new SqlParameter("@turnId", turnId ?? string.Empty)).ToArray();
        }

        private TurnOrderError[] getTRTurnOrderErrors(AusterlitzDbContext dataContext, string turnId)
        {
            var turnErrors = new List<TurnOrderError>();
            var turnErrorsTableExists = dataContext.Database.SqlQuery<int>(
                @"SELECT COUNT(1)
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'TR_TurnOrderErrors'").SingleOrDefault() > 0;
            if (!turnErrorsTableExists)
            {
                return turnErrors.ToArray();
            }

            var referenceTableExists = dataContext.Database.SqlQuery<int>(
                @"SELECT COUNT(1)
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'REF_TurnErrorCodes'").SingleOrDefault() > 0;

            var sql = referenceTableExists
                ? @"
SELECT
    E.TurnOrderErrorId,
    E.TurnId,
    E.SectionNo,
    E.OrderNo,
    E.ErrorCode,
    COALESCE(R.[Message], 'Unknown error code') AS ErrorMessage,
    E.RawToken
FROM dbo.TR_TurnOrderErrors E
LEFT JOIN dbo.REF_TurnErrorCodes R
    ON R.SectionNo = E.SectionNo
   AND R.ErrorCode = E.ErrorCode
WHERE E.TurnId = @turnId
ORDER BY E.SectionNo, E.OrderNo, E.ErrorCode"
                : @"
SELECT
    E.TurnOrderErrorId,
    E.TurnId,
    E.SectionNo,
    E.OrderNo,
    E.ErrorCode,
    'Unknown error code' AS ErrorMessage,
    E.RawToken
FROM dbo.TR_TurnOrderErrors E
WHERE E.TurnId = @turnId
ORDER BY E.SectionNo, E.OrderNo, E.ErrorCode";

            var connection = dataContext.Database.Connection;
            if (connection.State != System.Data.ConnectionState.Open)
            {
                connection.Open();
            }

            using (var command = connection.CreateCommand())
            {
                command.CommandText = sql;
                command.CommandType = System.Data.CommandType.Text;
                command.Parameters.Add(new SqlParameter("@turnId", turnId ?? string.Empty));

                using (var reader = command.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        turnErrors.Add(new TurnOrderError
                        {
                            TurnOrderErrorId = reader["TurnOrderErrorId"] == DBNull.Value ? 0 : Convert.ToInt32(reader["TurnOrderErrorId"]),
                            TurnId = reader["TurnId"] == DBNull.Value ? string.Empty : reader["TurnId"].ToString(),
                            SectionNo = reader["SectionNo"] == DBNull.Value ? 0 : Convert.ToInt32(reader["SectionNo"]),
                            OrderNo = reader["OrderNo"] == DBNull.Value ? 0 : Convert.ToInt32(reader["OrderNo"]),
                            ErrorCode = reader["ErrorCode"] == DBNull.Value ? 0 : Convert.ToInt32(reader["ErrorCode"]),
                            Message = reader["ErrorMessage"] == DBNull.Value ? "Unknown error code" : reader["ErrorMessage"].ToString(),
                            RawToken = reader["RawToken"] == DBNull.Value ? string.Empty : reader["RawToken"].ToString()
                        });
                    }
                }
            }

            return turnErrors.ToArray();
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
