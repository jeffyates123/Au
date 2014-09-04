using Austerlitz.DAL;
using Austerlitz.DAL.Management;
using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;

namespace Austerlitz.Controllers
{
    public class RulesCatalogApiController : ApiController
    {
        public class RuleCatalogItem
        {
            public int ItemNo { get; set; }
            public string Name { get; set; }
            public string Description { get; set; }
        }

        public REF_ArmyList[] GetArmyList(string state = "E")
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<REF_ArmyList>(dataContext);

                IEnumerable<REF_ArmyList> armyList = listRepository
                    .GetItems(x => x.State == state)
                    .OrderBy(y => y.ItemNo);

                return armyList.ToArray();
            }
        }

        public REF_ProductionSites[] GetRefProductionSites()
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<REF_ProductionSites>(dataContext);

                IEnumerable<REF_ProductionSites> rtnList = listRepository
                    .Get()
                    .OrderBy(y => y.SiteTypeNo);

                return rtnList.ToArray();
            }
        }

        public REF_Terrain[] GetRefTerrain()
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<REF_Terrain>(dataContext);

                IEnumerable<REF_Terrain> rtnList = listRepository
                    .Get();

                return rtnList.ToArray();
            }
        }

        public REF_States[] GetRefStates()
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<REF_States>(dataContext);

                IEnumerable<REF_States> rtnList = listRepository
                    .Get()
                    .OrderBy(y => y.State);

                return rtnList.ToArray();
            }
        }

        [HttpPost]
        public void RegionalMapFilePost()
        {
            HttpResponseMessage result = null;
            var httpRequest = HttpContext.Current.Request;
            string filePath = "";

            if (httpRequest.Files.Count > 0)
            {
                foreach (string file in httpRequest.Files)
                {
                    var postedFile = httpRequest.Files[file];
                    filePath = HttpContext.Current.Server.MapPath("~/" + postedFile.FileName);
                    postedFile.SaveAs(filePath);
                }
                result = Request.CreateResponse(HttpStatusCode.Created);
            }
            else
            {
                result = Request.CreateResponse(HttpStatusCode.BadRequest);
            }

            loadTurnReport(filePath); // return the map array to use at the front end :)... change to save to the database
        }

        private void loadTurnReport(string filePath)
        {
            AusterlitzDbContext _auDB = new AusterlitzDbContext();

            var lineList = loadTurnFile(filePath);
            var lineLocation = 0;

            lineLocation = loadPoliticalMap(lineList, lineLocation, _auDB);
        }


        private int loadPoliticalMap(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB)
        {
            bool locationFound = false;
            int xStart = 0;
            var coordinatesOnALine = new REF_PoliticalMapCoordinates[40];
            var y = 0;

            var mapBoundaryEurope1 = "    1  2  3  4  5  6  7  8  9";
            var mapBoundaryEurope2 = "   41 42 43 44 45 46 47 48 49 50";
            var mapBoundaryCarribean = "    1  2  3  4  5  6";
            var mapBoundaryIndies = "   51 52 53 54 55";
            var mapBoundaryText = mapBoundaryEurope1;

            // delete all the existing coordinate ... in future, dont do this as should only load once...
            var existingCoordinates = auDB.REF_PoliticalMapCoordinates;
            auDB.REF_PoliticalMapCoordinates.RemoveRange(existingCoordinates);

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                var lineToProcess = lineList[lineLocation].ToString();

                if (lineToProcess.IndexOf(mapBoundaryText) != -1)
                {
                    if (locationFound)
                    {
                        locationFound = false;
                        if (mapBoundaryText == mapBoundaryEurope1)
                            mapBoundaryText = mapBoundaryEurope2;
                        else if (mapBoundaryText == mapBoundaryEurope2)
                            mapBoundaryText = mapBoundaryCarribean;
                        else if (mapBoundaryText == mapBoundaryCarribean)
                            mapBoundaryText = mapBoundaryIndies;
                        else if (mapBoundaryText == mapBoundaryIndies)
                            break; // finished!
                    }
                    else
                    {
                        locationFound = true;
                        lineLocation = lineLocation + 1; //skip two lines and switch on brigadeCapture
                        lineToProcess = lineList[lineLocation].ToString();

                        if (mapBoundaryText == mapBoundaryEurope1)
                        {
                            xStart = 1;
                            y = 1;
                        }
                        else if (mapBoundaryText == mapBoundaryEurope2)
                        {
                            xStart = 41;
                            y = 1;
                        }
                        else if (mapBoundaryText == mapBoundaryCarribean)
                        {
                            xStart = 1;
                            y = 70;
                        }
                        else if (mapBoundaryText == mapBoundaryIndies)
                        {
                            xStart = 51;
                            y = 70;
                        }
                    }
                }

                if (locationFound)
                {
                    if (lineToProcess.IndexOf(mapBoundaryText) != -1)
                        break;

                    for (var x = xStart; x < xStart + 40; x++)
                    {
                        var newCoordinate = new REF_PoliticalMapCoordinates();
                        string coordinate = lineToProcess.Substring(3 + (x - xStart) * 3, 3);

                        newCoordinate.X = x;
                        newCoordinate.Y = y;
                        newCoordinate.Owner = coordinate.Substring(0, 1);
                        newCoordinate.Terrain = coordinate.Substring(1, 1);
                        newCoordinate.Bonus = coordinate.Substring(2, 1);
                        coordinatesOnALine[x - xStart] = newCoordinate;
                    }

                    auDB.REF_PoliticalMapCoordinates.AddRange(coordinatesOnALine);
                    auDB.SaveChanges();
                    y++;
                }
            }

            return lineLocation;
        }


        private ArrayList loadTurnFile(string filePath)
        {
            StreamReader objReader = new StreamReader(filePath);
            string sLine = "";
            ArrayList arrText = new ArrayList();

            arrText.Add(""); // add a blank line for Y = 0 axis
            while (sLine != null)
            {
                sLine = objReader.ReadLine();
                if (sLine != null)
                    arrText.Add(sLine);
            }
            objReader.Close();

            return arrText;
        }
        
        
        [System.Web.Http.HttpGet]
        public RuleCatalogItem[] GetAdditionalOrderList()
        {
            List<RuleCatalogItem> addOrderList = new List<RuleCatalogItem> {
                new RuleCatalogItem {ItemNo=-1, Name="Unchanged", Description="Keep current Additional Order setting"},

                new RuleCatalogItem {ItemNo=-1, Name="MANUAL: Specify Lead Federation", Description="Orders 41,42,43,44,45,46,47,48,51,52,53,54,55,56,57,58"},

                new RuleCatalogItem {ItemNo=-1, Name="No Additional Orders", Description="Orders 32, 34, 36, 39"},

                new RuleCatalogItem {ItemNo=-1, Name="MANUAL: Specify Minimum Distance: the federation must keep from the enemy.", Description="Orders 13"},

                new RuleCatalogItem {ItemNo=0, Name="Troop Types: all troop types", Description="Orders 11, 12, 31, 33"},
                new RuleCatalogItem {ItemNo=1, Name="Troop Types: infantry moving in a column.", Description="Orders 11, 12, 31, 33"},
                new RuleCatalogItem {ItemNo=2, Name="Troop Types: infantry moving in a line formation.", Description="Orders 11, 12, 31, 33"},
                new RuleCatalogItem {ItemNo=3, Name="Troop Types: skirmishing infantry.", Description="Orders 11, 12, 31, 33"},
                new RuleCatalogItem {ItemNo=4, Name="Troop Types: infantry in a square formation.", Description="Orders 11, 12, 31, 33"},
                new RuleCatalogItem {ItemNo=5, Name="Troop Types: fleeing infantry.", Description="Orders 11, 12, 31, 33"},
                new RuleCatalogItem {ItemNo=7, Name="Troop Types: infantry in line formation or in a column.", Description="Orders 11, 12, 31, 33"},
                new RuleCatalogItem {ItemNo=8, Name="Troop Types: skirmishing infantry or infantry in a line or column formation.", Description="Orders 11, 12, 31, 33"},
                new RuleCatalogItem {ItemNo=9, Name="Troop Types: infantry - any formation.", Description="Orders 11, 12, 31, 33"},
                new RuleCatalogItem {ItemNo=11, Name="Troop Types: cavalry in a column formation.", Description="Orders 11, 12, 31, 33"},
                new RuleCatalogItem {ItemNo=12, Name="Troop Types: cavalry in a line formation.", Description="Orders 11, 12, 31, 33"},
                new RuleCatalogItem {ItemNo=13, Name="Troop Types: skirmishing cavalry.", Description="Orders 11, 12, 31, 33"},
                new RuleCatalogItem {ItemNo=15, Name="Troop Types: fleeing cavalry.", Description="Orders 11, 12, 31, 33"},
                new RuleCatalogItem {ItemNo=19, Name="Troop Types: cavalry - all formations.", Description="Orders 11, 12, 31, 33"},
                new RuleCatalogItem {ItemNo=21, Name="Troop Types: artillery.", Description="Orders 11, 12, 31, 33"},
                new RuleCatalogItem {ItemNo=28, Name="Troop Types: all fleeing enemy federations.", Description="Orders 11, 12, 31, 33"},
                new RuleCatalogItem {ItemNo=29, Name="Troop Types: all troop types.", Description="Orders 11, 12, 31, 33"},
                new RuleCatalogItem {ItemNo=30, Name="Troop Types: no reaction to any troop type.", Description="Orders 11, 12, 31, 33"},

                new RuleCatalogItem {ItemNo=1, Name="Strategic Points: 1st - 2nd - 3rd strategic point.", Description="Orders 21, 22, 23, 24"},
                new RuleCatalogItem {ItemNo=2, Name="Strategic Points: 1st - 3rd - 2nd strategic point.", Description="Orders 21, 22, 23, 24"},
                new RuleCatalogItem {ItemNo=3, Name="Strategic Points: 2nd - 1st - 3rd strategic point.", Description="Orders 21, 22, 23, 24"},
                new RuleCatalogItem {ItemNo=4, Name="Strategic Points: 2nd - 3rd - 1st strategic point.", Description="Orders 21, 22, 23, 24"},
                new RuleCatalogItem {ItemNo=5, Name="Strategic Points: 3rd - 1st - 2nd strategic point.", Description="Orders 21, 22, 23, 24"},
                new RuleCatalogItem {ItemNo=6, Name="Strategic Points: 3rd - 2nd - 1st strategic point.", Description="Orders 21, 22, 23, 24"},
            };

            return addOrderList.ToArray(); //(x => x.Description.Contains(Order.ToString()))

        }

        public RuleCatalogItem[] GetFormationList()
        {
            return new RuleCatalogItem[5] {
                new RuleCatalogItem {ItemNo=-1, Name="Unchanged", Description="Keep current Formation setting"},
                new RuleCatalogItem {ItemNo=1, Name="Column", Description="40% (Poor) long range except Artillery (100%), Very easy Target (100%). 100% (Optimum) hand to hand combat except Artillery. "},
                new RuleCatalogItem {ItemNo=2, Name="Line", Description="80% (Reasonable) long range. Reasonably easy target (80%). Reasonable (60%) hand to hand combat."},
                new RuleCatalogItem {ItemNo=3, Name="Skirmish", Description="100% (Optimum) long range ability, Not easy target (50%). Poor (40%) hand to hand combat."},
                new RuleCatalogItem {ItemNo=4, Name="Square", Description="20% (Very Poor) long range, very easy target (100%). Poor (35%) hand to hand combat."},
            };
        }

        public RuleCatalogItem[] GetOrdersList()
        {
            return new RuleCatalogItem[37] {
                new RuleCatalogItem {ItemNo=-1, Name="Unchanged", Description="Keep current Order setting"},
                new RuleCatalogItem {ItemNo=1, Name = "Simplified, Order 11 with additional order 30.", Description = "The federation will march in the direction of the given destination and ignore all enemy federations on its way. If no destination are given the federation will stay on its current position and defend it."},
                new RuleCatalogItem {ItemNo=2, Name = "Simplified, Order 11, additional order 0.", Description = "The federation will move towards the given destination but it will attack all enemy troops in its line of sight in the beginning of a half-round if it can reach them with its Mps."},
                new RuleCatalogItem {ItemNo=3, Name = "Simplified, Order 12, additional order 0.", Description = "Same as order 2 but it will march in direction of a sighted enemy even if it cannot each it with its Mps in that half-round."},
                new RuleCatalogItem {ItemNo=4, Name = "Simplified, Order 31, additional order 0.", Description = "The federation will stay on its current position but should an enemy federation be in its line of sight at the beginning of a half-round it will attack it. After the end of the combat it will return to its previous position."},
                new RuleCatalogItem {ItemNo=5, Name = "Simplified, Order 13, additional order 5.", Description= "The federation will move towards the given destination, but should it sight an enemy federation that is closer than 5 co-ordinates then it will move back towards its own set-up-area and stay at a distance of 5 co-ordinates to the enemy."},
                new RuleCatalogItem {ItemNo=11,	Name = "Attack if in Reach", Description = "Will attack all troop types indicated in the additional order if they are within its simulated battle movement range (see 9. Army tables., p104) in one of the half-rounds."},
                new RuleCatalogItem {ItemNo=12, Name = "Attack on Sight", Description = "Will attack all troop types indicated in the additional order if they are in line of sight during a half-round (the enemy's distance does not affect on this order - if they are seen the battalion group will attempt to attack)"},
                new RuleCatalogItem {ItemNo=13, Name = "Staged Retreat", Description = "If enemy federations are closer than 'x' co-ordinates from the current position (in direction of the enemy set-up-area) then it will pull back 'x' co-ordinates towards its own set-up-area. The distance ‘x’ is to be written in the additional order. If no number is specified then the federation will attempt to keep a distance of 5."},
                new RuleCatalogItem {ItemNo=21, Name = "Attack All Enemy Strategic Points", Description = "Move towards the enemy's strategic points."},
                new RuleCatalogItem {ItemNo=22, Name = "Attack Unguarded Enemy Strategic Points", Description = "Move towards the enemy's strategic points if they are not occupied by enemy federations."},
                new RuleCatalogItem {ItemNo=23, Name = "Defend Own Strategic Pts", Description = "Move towards own strategic points."},
                new RuleCatalogItem {ItemNo=24, Name = "Recover Own Strategic Pts", Description = "Move towards own strategic points if they are captured by the enemy."},
                new RuleCatalogItem {ItemNo=31, Name = "Attack and Reform", Description = "The federation will attack the troop type indicated in the additional order (see 7.2.5.2.1., p77) if it is within its simulated battle movement range (see 9. Army tables., p104) during its own half-round. After the attack it will return to its previous position, if that position is listed as destination 1."},
                new RuleCatalogItem {ItemNo=32, Name = "Indiscriminate Fire Upon Enemy", Description = "The federation will move to the first indicated destination and shoot towards the second destination (see 7.2.5.3., p78) if an enemy federation or a fortress wall is situated there. If no destination 2 is given it will remain stationary and shoot towards destination 1."},
                new RuleCatalogItem {ItemNo=33, Name = "Selective Fire Upon Enemy", Description = "The federation moves toward the indicated destination (see 7.2.5.3., p78) and tries to shoot at those troop types indicated in the additional order (see 7.2.5.2.1., p77). (If specified troop type isn’t found the federation will find other targets.)"},
                new RuleCatalogItem {ItemNo=34, Name = "Retreat from Battlefield", Description = "The federation retreats until it reaches the furthest position back and then will flee from the battle field from round 15 onwards. It will try to avoid hand-to-hand combat and stay away from the enemy while retreating and while waiting to leave the battlefield.. (Please note, that your army will take extra casualties, on top of those suffered in the battle, when fleeing the field.)"},
                new RuleCatalogItem {ItemNo=36, Name = "Dig Entrenchment’s", Description = "The pioneer federation will try to move to the indicated destination and dig entrenchment’s there (see 7.2.11.2., p88)."},
                new RuleCatalogItem {ItemNo=37, Name = "Build Pontoon Bridge", Description = "The pioneer federation will move to the indicated destination and build a pontoon bridge across neighbouring river co-ordinates (see 7.2.11.3., p89)."},
                new RuleCatalogItem {ItemNo=38, Name = "Move and Destroy Entrenchment’s", Description = "The pioneer federation will move towards the indicated destination but if in the beginning of a half-round an enemy entrenchment is in its line of sight it will move towards that and try to destroy it (see 7.2.11.2., p88)."},
                new RuleCatalogItem {ItemNo=39, Name = "Move and Destroy Pontoon Bridges", Description = "The pioneer federation will move towards the indicated destination but if in the beginning of a half-round an enemy pontoon bridge is in its line of sight it will move towards it and try to destroy it (see 7.2.11.3., p89)."},
                new RuleCatalogItem {ItemNo=41,	Name="Detachment Order, Leading Fed NOT in combat: in front of" },
                new RuleCatalogItem {ItemNo=42,	Name="Detachment Order, Leading Fed NOT in combat: ahead and left of"},
                new RuleCatalogItem {ItemNo=43,	Name="Detachment Order, Leading Fed NOT in combat: right of"},
                new RuleCatalogItem {ItemNo=44,	Name="Detachment Order, Leading Fed NOT in combat: behind and right of"},
                new RuleCatalogItem {ItemNo=45,	Name="Detachment Order, Leading Fed NOT in combat: behind of"},
                new RuleCatalogItem {ItemNo=46,	Name="Detachment Order, Leading Fed NOT in combat: behind and left of"},
                new RuleCatalogItem {ItemNo=47,	Name="Detachment Order, Leading Fed NOT in combat: left of"},
                new RuleCatalogItem {ItemNo=48,	Name="Detachment Order, Leading Fed NOT in combat: ahead and right of"},
                new RuleCatalogItem {ItemNo=51,	Name="Detachment Order, Leading Fed in combat: in front of" },
                new RuleCatalogItem {ItemNo=52,	Name="Detachment Order, Leading Fed in combat: ahead and left of"},
                new RuleCatalogItem {ItemNo=53,	Name="Detachment Order, Leading Fed in combat: right of"},
                new RuleCatalogItem {ItemNo=54,	Name="Detachment Order, Leading Fed in combat: behind and right of"},
                new RuleCatalogItem {ItemNo=55,	Name="Detachment Order, Leading Fed in combat: behind of"},
                new RuleCatalogItem {ItemNo=56,	Name="Detachment Order, Leading Fed in combat: behind and left of"},
                new RuleCatalogItem {ItemNo=57,	Name="Detachment Order, Leading Fed in combat: left of"},
                new RuleCatalogItem {ItemNo=58,	Name="Detachment Order, Leading Fed in combat: ahead and right of"},
            };
        }
    }
}


