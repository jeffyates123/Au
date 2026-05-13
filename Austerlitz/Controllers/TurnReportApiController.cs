using Austerlitz.DAL;
using Austerlitz.DAL.Management;
using Austerlitz.Models.TurnReport;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;

namespace Austerlitz.Controllers
{
    public class TurnReportApiController : ApiController
    {
        private int dummy;

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

                List<MovementItems> movementItems = turnReport.Commanders.Select(x => new MovementItems() { ItemNo = x.ItemNo, ItemType = ItemType.Commander, Description = "Commander (" + x.CommandCapacity + "): " + x.Name, MP = x.MP, X = x.X, Y = x.Y, Sphere = CalcSphere(x.X, x.Y) }).ToList();
                var dummy = 0;

                movementItems.AddRange(turnReport.Brigades.Select(x => new MovementItems() 
                { ItemNo = x.ItemNo, ItemType = ItemType.Brigade, 
                    Description = x.Batt1Type + x.Batt1EF + " " + x.Batt2Type + x.Batt2EF + " " + x.Batt3Type + x.Batt3EF + " " + x.Batt4Type + x.Batt4EF + " " + x.Batt5Type + x.Batt5EF + " " + x.Batt6Type + x.Batt6EF + " " + x.Batt7Type + x.Batt7EF,
                    MP = x.MP
                    , X = AxisValue(x.X_OrState)
                    , Y = AxisValue(x.Y_OrFleet)
                    , Sphere = CalcSphere(AxisValue(x.X_OrState), AxisValue(x.Y_OrFleet))
                }).ToList());

                // can add more union stuff here if necessary, not sure it makes much difference
                movementItems.AddRange(turnReport.Warships.Select(x => new MovementItems() { ItemNo = x.ItemNo, ItemType = ItemType.Warship, Description="Warship: " + x.Name, MP = x.MP, X = x.X, Y = x.Y, Sphere = CalcSphere(x.X, x.Y) }).ToList());
                movementItems.AddRange(turnReport.MerchantShips.Select(x => new MovementItems() { ItemNo = x.ItemNo, ItemType = ItemType.MerchantShip, Description = ItemType.MerchantShip.ToString(), MP = x.MP, X = x.X, Y = x.Y, Sphere = CalcSphere(x.X, x.Y) }).ToList());
                movementItems.AddRange(turnReport.BaggageTrains.Select(x => new MovementItems() { ItemNo = x.ItemNo, ItemType = ItemType.BaggageTrain, Description = ItemType.BaggageTrain.ToString(), MP = x.MP, X = x.X, Y = x.Y, Sphere = CalcSphere(x.X, x.Y) }).ToList());
                movementItems.AddRange(turnReport.Spies.Select(x => new MovementItems() { ItemNo = x.ItemNo, ItemType = ItemType.Spy, Description = ItemType.Spy.ToString(), MP = 75, X = x.X, Y = x.Y, Sphere = CalcSphere(x.X,x.Y)}).ToList());

                turnReport.MovementItemList = movementItems.ToArray();
                turnReport.MapCoordinates = GetMapCoordinates(turnId, movementItems);

                return turnReport;
            }
        }

        public int AxisValue(string axisValue)
        {
            return Int32.TryParse(axisValue, out dummy) ? int.Parse(axisValue) : 0;
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
