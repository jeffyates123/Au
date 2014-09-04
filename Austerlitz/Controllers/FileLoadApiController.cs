using Austerlitz.DAL;
using Austerlitz.Models;
using Austerlitz.Models.SimBattle;
using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;

namespace Austerlitz.Controllers
{

    public class FileLoadApiController : ApiController
    {
        //////http://stackoverflow.com/questions/10320232/how-to-accept-a-file-post-asp-net-mvc-4-webapi?lq=1

        [HttpPost]
        public void FilePost()  
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

            loadTurnReport(filePath);
        }

        private void loadTurnReport(string filePath, string turnId = "test")
        {
            AusterlitzDbContext _auDB = new AusterlitzDbContext();

            SimBattleVm simBattleVm = new SimBattleVm();
            var lineList = loadTurnFile(filePath);
            var lineLocation = 0;


            //lineLocation = loadHostStateDetails(lineList, simBattleVm, lineLocation);

            cleanUpTurnReport(lineList);

            //lineLocation = loadWarehouses();
            //lineLocation = loadBarracks(lineList, lineLocation);
            //lineLocation = loadCommanders();
            lineLocation = loadBrigades(lineList, lineLocation, _auDB, turnId);
            //lineLocation = loadWarships();
            //lineLocation = loadMerchantShips();
            //lineLocation = loadBaggageTrains();
            //lineLocation = loadSpies();
            //lineLocation = loadStateRelationships();
            //lineLocation = loadTradingPortsAndCities();

            // SAVE THIS TO THE DATABASE!!!
            lineLocation = loadSimBattleMap(lineList, simBattleVm, lineLocation);
            lineLocation = loadSimArmies(lineList, simBattleVm, lineLocation);
            // SAVE THIS TO THE DATABASE!!!

            lineLocation = loadTRMap(lineList, lineLocation, _auDB, turnId);
        }

        private void cleanUpTurnReport(ArrayList lineList)
        {
            for (int lineLocation = lineList.Count - 1; lineLocation >= 0; lineLocation--)
            {
                var lineToProcess = lineList[lineLocation].ToString();

                if ((lineToProcess.IndexOf(" Page") != -1)
                    || (lineToProcess.IndexOf(" The Rise of the Eagle") != -1)
                    || (lineToProcess.IndexOf("              Month:") != -1)
                    || (lineToProcess.IndexOf("AUSTERLITZ   Game:") != -1))
                {
                    lineList.RemoveAt(lineLocation);
                }
            }
        }

        private int loadHostStateDetails(ArrayList lineList, SimBattleVm simBattleVm, int lineLocation)
        {

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                var lineToProcess = lineList[lineLocation].ToString();

                if (lineToProcess.IndexOf(" AUSTERLITZ   Game: AU-") != -1)
                {
                    simBattleVm.State = lineToProcess.Substring(lineToProcess.IndexOf(" AUSTERLITZ   Game: AU-") + 26).Trim();
                }

                if (lineToProcess.IndexOf("* Supersonic Games * PO Box 1812, Galston, KA4 8WA *") != -1)
                {
                    lineToProcess = lineList[lineLocation+1].ToString();
                    simBattleVm.GameNo = int.Parse(lineToProcess.Substring(lineToProcess.IndexOf("AU ")+3,3).Trim());
                    simBattleVm.StateLetter = lineToProcess.Substring(lineToProcess.IndexOf("AU ")+7,1).Trim();
                    break;
                }
            }
            return lineLocation;
        }
        


        private int loadStateRelationships()
        {
            return 0;
        }

        private int loadWarehouses()
        {
            return 0;
        }

        private int loadBarracks()
        {
            return 0;
        }

        private int loadCommanders()
        {
            return 0;
        }

        private int? parseTurnIntNullable(string lineToProcess, int startLocation, int length)
        {
            var stringToParse = lineToProcess.Substring(startLocation, length);

            if (stringToParse.IndexOf("-") != -1)
            {
                return null;
            }
            else
            {
                return int.Parse(stringToParse);
            }
        }

        private int parseTurnInt(string stringToProcess, int startLocation, int length)
        {
            return int.Parse(stringToProcess.Substring(startLocation, length));
        }

        private int loadTRMap(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId = "test")
        {
            bool locationFound = false;
            int xStart = 0;
        
            var coordinatesOnALine = new TR_MapCoordinates[40];
            var y = 0;

            var mapBoundaryEurope1 = "    1  2  3  4  5  6  7  8  9";
            var mapBoundaryEurope2 = "   41 42 43 44 45 46 47 48 49 50";
            var mapBoundaryCarribean = "    1  2  3  4  5  6  7  8  9 10";
            var mapBoundaryIndies = "   51 52 53 54 55 56 57 58 59 60";
            var mapBoundaryText = mapBoundaryEurope1;

            // delete all the existing coordinate ... in future, dont do this as should only load once...
            var existingCoordinates = auDB.TR_MapCoordinates.Where(z => z.TurnId == turnId);
            auDB.TR_MapCoordinates.RemoveRange(existingCoordinates);

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
                            break; 
                    }
                    else
                    {
                        locationFound = true;
                        lineLocation = lineLocation + 1; //skip 1 lines 
                        lineToProcess = lineList[lineLocation].ToString();

                        if (mapBoundaryText == mapBoundaryEurope1)
                        {
                            xStart = 1;
                            y = 1;
                        } 
                        else if (mapBoundaryText == mapBoundaryEurope2) {
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
                        var newCoordinate = new TR_MapCoordinates();
                        string coordinate = lineToProcess.Substring(3 + (x - xStart) * 3, 3);

                        newCoordinate.X = x;
                        newCoordinate.Y = y;
                        newCoordinate.TurnId = "Test";
                        newCoordinate.State = coordinate.Substring(0, 1);
                        newCoordinate.Population = coordinate.Substring(1, 1);
                        newCoordinate.ProductionSite = coordinate.Substring(2, 1);
                        coordinatesOnALine[x - xStart] = newCoordinate;
                    }

                    auDB.TR_MapCoordinates.AddRange(coordinatesOnALine);
                    auDB.SaveChanges();
                    y++;
                }
            }

            return lineLocation;
        }
        

        private int loadBrigades(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId = "test")
        {
            //Brigades
            //No.   Name              x/ y  MP  Fd  Battalion 1  Battalion 2  Battalion 3  Battalion 4  Battalion 5  Battalion 6  Battalion 7
            //1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
            //         1         2         3         4         5         6         7         8         9        10        11        12        13
            //4125  COLONIAL-BRIG 1  B  13  32   0    Ca  4 800    Ca  4 800    Kt  6 800    Mc  4 800    Cc  4 800    Cc  4 800    --  - ---

            bool locationFound = false;

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                var lineToProcess = lineList[lineLocation].ToString();

                if (lineToProcess.IndexOf("Brigades") != -1)
                {
                    locationFound = true;
                    lineLocation = lineLocation + 2; //skip two lines and switch on brigadeCapture
                    lineToProcess = lineList[lineLocation].ToString();

                    // delete all the existing brigades ... in future, dont do this as should only load once...
                    var existingBrigades = auDB.TR_Brigades.Where(x => x.TurnId == turnId);
                    auDB.TR_Brigades.RemoveRange(existingBrigades);
                }

                if (locationFound)
                {
                    if (lineToProcess.IndexOf("Pay:") != -1)
                        break;

                    var newBrigade = new TR_Brigades();

                    newBrigade.TurnId = "test";
                    newBrigade.ItemNo = parseTurnInt(lineToProcess, 0, 4);
                    newBrigade.Name = lineToProcess.Substring(6, 16);
                    newBrigade.CoordinateX_OrState = lineToProcess.Substring(23, 2);
                    newBrigade.CoordinateY_OrFleet = lineToProcess.Substring(26, 2);
                    newBrigade.MP = parseTurnInt(lineToProcess, 30, 2);
                    newBrigade.Federation = parseTurnInt(lineToProcess, 34, 2);
                    newBrigade.Batt1Type = lineToProcess.Substring(40, 2);
                    newBrigade.Batt1EF = parseTurnIntNullable(lineToProcess, 44, 2);
                    newBrigade.Batt1Size = parseTurnIntNullable(lineToProcess, 46, 3);
                    newBrigade.Batt2Type = lineToProcess.Substring(53, 2);
                    newBrigade.Batt2EF = parseTurnIntNullable(lineToProcess, 57, 2);
                    newBrigade.Batt2Size = parseTurnIntNullable(lineToProcess, 59, 3);
                    newBrigade.Batt3Type = lineToProcess.Substring(66, 2);
                    newBrigade.Batt3EF = parseTurnIntNullable(lineToProcess, 70, 2);
                    newBrigade.Batt3Size = parseTurnIntNullable(lineToProcess, 72, 3);
                    newBrigade.Batt4Type = lineToProcess.Substring(79, 2);
                    newBrigade.Batt4EF = parseTurnIntNullable(lineToProcess, 83, 2);
                    newBrigade.Batt4Size = parseTurnIntNullable(lineToProcess, 85, 3);
                    newBrigade.Batt5Type = lineToProcess.Substring(92, 2);
                    newBrigade.Batt5EF = parseTurnIntNullable(lineToProcess, 96, 2);
                    newBrigade.Batt5Size = parseTurnIntNullable(lineToProcess, 98, 3);
                    newBrigade.Batt6Type = lineToProcess.Substring(105, 2);
                    newBrigade.Batt6EF = parseTurnIntNullable(lineToProcess, 109, 2);
                    newBrigade.Batt6Size = parseTurnIntNullable(lineToProcess, 111, 3);
                    newBrigade.Batt7Type = lineToProcess.Substring(118, 2);
                    newBrigade.Batt7EF = parseTurnIntNullable(lineToProcess, 122, 2);
                    newBrigade.Batt7Size = parseTurnIntNullable(lineToProcess, 124, 3);

                    auDB.TR_Brigades.Add(newBrigade);
                    auDB.SaveChanges();
                }
            }

            return lineLocation;
        }

        private int loadWarships()
        {
            return 0;
        }

        private int loadMerchantShips()
        {
            return 0;
        }

        private int loadBaggageTrains()
        {
            return 0;
        }

        private int loadSpies()
        {
            return 0;
        }

        private int loadTradingPortsAndCities()
        {
            return 0;
        }


        


        private int loadSimArmies(ArrayList lineList, SimBattleVm simBattleVm, int lineLocation)
        {
            var armyA = new Army();
            var armyB = new Army();

            simBattleVm.ArmyA = armyA;
            simBattleVm.ArmyB = armyB;

            lineLocation = loadSimArmy(armyA, lineList, lineLocation);
            lineLocation = loadSimArmy(armyB, lineList, lineLocation);

            return lineLocation;
        }


        private int loadSimArmy(Army army, ArrayList lineList, int lineLocation)
        {
            var batGroups = new List<BattalionGroup>();
            int dummyValue;

            bool bArmyFound = false;
            bool bArmyProcessed = false;

            int batGroupNo = 0;

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                var lineToProcess = lineList[lineLocation].ToString();

                if (!bArmyFound && !bArmyProcessed)
                {
                    if (lineToProcess.IndexOf("Command Capability") != -1)
                    {
                        army.Commander = new Commander();
                        army.Commander.CommanderName = lineToProcess.Substring(0, 25).Trim();
                        army.Commander.Capability = int.Parse(lineToProcess.Substring(49, 2));
                    }

                    if (lineToProcess.IndexOf("Battalion Groups of ") != -1)
                    {
                        bArmyFound = true;
                        army.State = lineToProcess.Replace("Battalion Groups of ", "").Trim();
                        lineLocation += 2;
                        lineToProcess = lineList[lineLocation].ToString();
                    }
                }

                if (bArmyFound && !bArmyProcessed)
                {
                    if (!int.TryParse(lineToProcess.Substring(0, 3), out dummyValue)) // integer not found on battalions line first 3 characters, must be end of battalions
                    {
                        bArmyProcessed = true;
                        army.BattalionGroups = batGroups.ToArray();
                        batGroups.Clear();
                        lineLocation--;
                        break;
                    }

                    for (var bt = 0; bt <= 2 && lineToProcess.Length >= (45 * bt); bt++)
                    {
                        var batGroupStr = lineToProcess.Substring(45 * bt, 40);

                        batGroupNo++;
                        batGroups.Add(processSimBattalionGroup(batGroupStr));
                    }
                }
            }
            return lineLocation;
        }

        private BattalionGroup processSimBattalionGroup(string battalionGroupStr) 
        {
            BattalionGroup batGroup = new BattalionGroup();
            var battalions = new Battalion[4];

            batGroup.Federation = int.Parse(battalionGroupStr.Substring(0, 3));

            batGroup.BattGroup = batGroup.Federation <= 110 ? batGroup.Federation : 0;

            batGroup.Type = battalionGroupStr.Substring(5, 2);
            batGroup.TotalEF = decimal.Parse(battalionGroupStr.Replace(",",".").Substring(36, 4));
            batGroup.Dest0 = new VmCoordinate();
            batGroup.Dest1 = new VmCoordinate();
            batGroup.Dest2 = new VmCoordinate();
            batGroup.StartAttack = 0;
            batGroup.Battalions = battalions;

            for (var bt = 0; bt <= 3; bt++)
            {
                battalions[bt] = processSimBattalion(battalionGroupStr.Substring(8+(7*bt), 6));
            }

            batGroup.TotalSize = battalions.Sum(x => x.size);

            batGroup.Formation = 1;

            var noBatsNotEmpty = battalions.Count(x => x.size > 0);

            batGroup.PercentMaxSize = decimal.Round((batGroup.TotalSize / (noBatsNotEmpty * 800M)) * 100,0);

            return batGroup;
        }

        private Battalion processSimBattalion(string battalionStr)
        {
            var newBattalion = new Battalion();

            var effect = battalionStr.Substring(0, 2);
            if (effect.IndexOf("-") == -1)
            {
                newBattalion.EF = Int16.Parse(effect);
                newBattalion.size = Int16.Parse(battalionStr.Substring(3, 3));
                
            }
            return newBattalion;
        }

        private int loadSimBattleMap(ArrayList lineList, SimBattleVm simBattleVm, int lineLocation)
        {

            // SAVE THIS TO THE DATABASE!!!
            var simBattleMap = new VmMapCoordinate[41][];
            bool bSimMapFound = false;

            simBattleVm.Map = simBattleMap;

            int x, y = 0;

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                if (!bSimMapFound && lineList[lineLocation].ToString().IndexOf("The Battle field") != -1)
                {
                    bSimMapFound = true;
                    lineLocation += 1;
                    y = 0;
                }

                if (bSimMapFound)
                {
                    if (y > 40) break;

                    var lineToProcess = lineList[lineLocation].ToString();

                    var lineCoords = new VmMapCoordinate[46];

                    for (x = 0; x <= 45 && y <= 40; x++)
                    {
                        var coord = new VmMapCoordinate();

                        if (x > 0 && y > 0)
                        {
                            coord.Terrain = lineToProcess.Substring(x * 3 + 3, 1);
                            coord.Height = Int16.Parse(lineToProcess.Substring(x * 3 + 4, 1));
                        }
                        coord.X = x;
                        coord.Y = y;

                        lineCoords[x] = coord;
                    }
                    simBattleMap[y] = lineCoords;
                    y = y + 1;
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

    }
}
