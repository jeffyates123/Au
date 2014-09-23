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

        private void loadTurnReport(string filePath)
        {
            AusterlitzDbContext _auDB = new AusterlitzDbContext();

            SimBattleVm simBattleVm = new SimBattleVm();
            var lineList = loadTurnFile(filePath);
            var lineLocation = 0;

            var turnId = getTurnId(lineList, lineLocation, _auDB);

            cleanUpTurnReport(lineList);

            lineLocation = loadWarehouses(lineList, lineLocation, _auDB, turnId);
            lineLocation = loadBarracks(lineList, lineLocation, _auDB, turnId);
            lineLocation = loadCommanders(lineList, lineLocation, _auDB, turnId);
            lineLocation = loadBrigades(lineList, lineLocation, _auDB, turnId);
            lineLocation = loadWarships(lineList, lineLocation, _auDB, turnId);
            lineLocation = loadMerchantShips(lineList, lineLocation, _auDB, turnId);
            lineLocation = loadBaggageTrains(lineList, lineLocation, _auDB, turnId);
            lineLocation = loadSpies(lineList, lineLocation, _auDB, turnId);
            lineLocation = loadStateRelationships(lineList, lineLocation, _auDB, turnId);
            lineLocation = loadTradingPortsAndCities(lineList, lineLocation, _auDB, turnId);

            // SAVE THIS TO THE DATABASE!!!
            //lineLocation = loadSimBattleMap(lineList, simBattleVm, lineLocation);
            //lineLocation = loadSimArmies(lineList, simBattleVm, lineLocation);
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
                    || (lineToProcess.IndexOf("AUSTERLITZ   Game:") != -1)
                    || (lineToProcess.Length == 0))
                {
                    lineList.RemoveAt(lineLocation);
                }
            }
        }

        private string getTurnId(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB)
        {
            var turnId = "NotFound12345";

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                var lineToProcess = lineList[lineLocation].ToString();

                if (lineToProcess.IndexOf("AUSTERLITZ   Game:") != -1)
                {
                    //lineLocation = lineLocation + 3; //skip two lines and switch on brigadeCapture
                    lineToProcess = lineList[lineLocation].ToString();

                    var gameNo = lineToProcess.Substring(23,3);
                    var state = getStateLetter(lineToProcess.Substring(52).TrimEnd());

                    lineLocation ++;
                    lineToProcess = lineList[lineLocation].ToString();

                    var month = lineToProcess.Substring(21,3).TrimEnd();
                    var year = lineToProcess.Substring(lineToProcess.Length-4, 4);

                    turnId = gameNo + state + month + year;

                    var existingTurn = auDB.TS_00TurnDetails.Where(x => x.TurnId == turnId);
                    if (existingTurn.Count() == 0)
                    {
                        var newTurn = new TS_00TurnDetails();
                        newTurn.TurnId = turnId;

                        auDB.TS_00TurnDetails.Add(newTurn);
                        auDB.SaveChanges();
                    }


                    break;
                }
            }
            return turnId;
        }

        private int loadStateRelationships(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
//            bool locationFound = false;

            //for (; lineLocation < lineList.Count; lineLocation++)
            //{
            //    var lineToProcess = lineList[lineLocation].ToString();

            //    if (lineToProcess.IndexOf("Relationships to foreign nations") != -1)
            //    {
            //        locationFound = true;
            //        lineLocation = lineLocation + 1; 
            //        lineToProcess = lineList[lineLocation].ToString();

            //        // delete all the existing brigades ... in future, dont do this as should only load once...
            //        var existingRecords = auDB.TR_StateRelationships.Where(x => x.TurnId == turnId);
            //        auDB.TR_StateRelationships.RemoveRange(existingRecords);
                
            //        //1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
            //        //         1         2         3         4         5         6         7         8         9         0         11        12     

            //        var war
                    
            //        lineToProcess.IndexOf("War to:")

                    
            //        newWarehouse.TurnId = turnId;
            //        newWarehouse.ItemNo = parseTurnInt(lineToProcess, 1, 1);
            //        newWarehouse.WarehouseName = lineToProcess.Substring(15, 6);

            //        auDB.TR_Warehouses.Add(newWarehouse);
            //        auDB.SaveChanges();
            //    }
            //}

            return lineLocation;
        }

        private int loadWarehouses(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {

            bool locationFound = false;

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                var lineToProcess = lineList[lineLocation].ToString();

                if (lineToProcess.IndexOf("Warehouses") != -1)
                {
                    locationFound = true;
                    lineLocation = lineLocation + 3; //skip two lines and switch on brigadeCapture
                    lineToProcess = lineList[lineLocation].ToString();

                    // delete all the existing brigades ... in future, dont do this as should only load once...
                    var existingWarehouses = auDB.TR_Warehouses.Where(x => x.TurnId == turnId);
                    auDB.TR_Warehouses.RemoveRange(existingWarehouses);
                }

                if (locationFound)
                {
                    if (lineToProcess.IndexOf("Barracks") != -1 || lineToProcess.IndexOf("No. Typ  x/ y") != -1)
                        break;

                    var newWarehouse = new TR_Warehouses();

                    //Warehouses
                    //          Inhabitants  -Foreign       Mny   Citz   EcPt   Food    Stn   Wood    Ore   Zinc   Hors   Text   Wool   Gold   Wine
                    //                                     -10-   -11-   -13-   -16-   -18-   -19-   -20-   -21-   -22-   -23-   -24-   -29-   -30-
                    //1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
                    //         1         2         3         4         5         6         7         8         9         0         11        12     
                    //-1- Europe     409041   190928    6864769  23885  10037  10717  17758   1435      0      0  11463    176    766     10      2
                    //-2- Carib           0        0          0    156      0      0      0      0      0      0      0      0      0      0      0
                    //-3- India       25920        0      80400  24910      0    192   4522    614     47      0   3145     49     23      0     36

                    newWarehouse.TurnId = turnId;
                    newWarehouse.ItemNo = parseTurnInt(lineToProcess, 1, 1);
                    newWarehouse.WarehouseName = lineToProcess.Substring(15, 6);
                    newWarehouse.Inhabitants = parseTurnInt(lineToProcess, 14, 8);
                    newWarehouse.Foreign = parseTurnInt(lineToProcess, 23, 8);
                    newWarehouse.Money = parseTurnInt(lineToProcess, 33, 9); 
                    newWarehouse.Citizens = parseTurnInt(lineToProcess, 43, 6);
                    newWarehouse.EcPts = parseTurnInt(lineToProcess, 50, 6);
                    newWarehouse.Food = parseTurnInt(lineToProcess, 57, 6);
                    newWarehouse.Stone = parseTurnInt(lineToProcess, 64, 6);
                    newWarehouse.Wood = parseTurnInt(lineToProcess, 71, 6);
                    newWarehouse.Ore = parseTurnInt(lineToProcess, 78, 6);
                    newWarehouse.Zinc = parseTurnInt(lineToProcess, 85, 6);
                    newWarehouse.Horses = parseTurnInt(lineToProcess, 92, 6);
                    newWarehouse.Textiles = parseTurnInt(lineToProcess, 99, 6);
                    newWarehouse.Wool = parseTurnInt(lineToProcess, 106, 6);
                    newWarehouse.Gold = parseTurnInt(lineToProcess, 113, 6);
                    newWarehouse.Wine = parseTurnInt(lineToProcess, 120, 5);

                    auDB.TR_Warehouses.Add(newWarehouse);
                    auDB.SaveChanges();
                }
            }

            return lineLocation;
        }

        private int loadBarracks(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            bool locationFound = false;

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                var lineToProcess = lineList[lineLocation].ToString();

                if (lineToProcess.IndexOf("No. Typ  x/ y") != -1)
                {
                    locationFound = true;
                    lineLocation = lineLocation + 2; //skip two lines and switch on brigadeCapture
                    lineToProcess = lineList[lineLocation].ToString();

                    var existingRecords = auDB.TR_Barracks.Where(x => x.TurnId == turnId);
                    auDB.TR_Barracks.RemoveRange(existingRecords);
                }

                if (locationFound)
                {
                    //No. Typ  x/ y        Mny   Citz   EcPt   Wood   Hors   Text F"     No. Typ  x/ y        Mny   Citz   EcPt   Wood   Hors   Text F"
                    //                    -10-   -11-   -13-   -19-   -22-   -23-                           -10-   -11-   -13-   -19-   -22-   -23-  
                    //1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
                    //         1         2         3         4         5         6         7         8         9         0         11        12     
                    //203 Eur 13/41    1736000      0     96      0      0      0 2     301 Eur  7/34          0      0      0      0      0      0 0
                    //305 Eur 18/41          0      0      0      0      0      0 0
                    //231 Car  9/84          0      0      0      0      0      0 0     233 Car 22/80          0      0      0      0      0      0 0
                    //234 Car 26/92          0      0      0      0      0      0 0
                    //337 Ind 90/84          0      0      0      0      0      0 0
                    if (lineToProcess.IndexOf("Production sites") != -1)
                        break;

                    var newRecord = new TR_Barracks();

                    newRecord.TurnId = turnId;
                    newRecord.ItemNo = parseTurnInt(lineToProcess, 0, 3);
                    newRecord.Type = lineToProcess.Substring(4, 3);
                    newRecord.X = parseTurnInt(lineToProcess, 8, 2);
                    newRecord.Y = parseTurnInt(lineToProcess, 11, 2);
                    newRecord.Money = parseTurnInt(lineToProcess, 16, 9); 
                    newRecord.Citizens = parseTurnInt(lineToProcess, 26, 6);
                    newRecord.EcPts = parseTurnInt(lineToProcess, 33, 6);
                    newRecord.Wood = parseTurnInt(lineToProcess, 40, 6);
                    newRecord.Horses = parseTurnInt(lineToProcess, 47, 6);
                    newRecord.Text = parseTurnInt(lineToProcess, 54, 6);
                    newRecord.FortressSize = parseTurnInt(lineToProcess, 60, 1);

                    auDB.TR_Barracks.Add(newRecord);

//No. Typ  x/ y        Mny   Citz   EcPt   Wood   Hors   Text F"     No. Typ  x/ y        Mny   Citz   EcPt   Wood   Hors   Text F"
//                    -10-   -11-   -13-   -19-   -22-   -23-                           -10-   -11-   -13-   -19-   -22-   -23-  
//1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
//         1         2         3         4         5         6         7         8         9         0         11        12     
//203 Eur 13/41    1736000      0     96      0      0      0 2     301 Eur  7/34          0      0      0      0      0      0 0
//305 Eur 18/41          0      0      0      0      0      0 0
//231 Car  9/84          0      0      0      0      0      0 0     233 Car 22/80          0      0      0      0      0      0 0

                    if (lineToProcess.Length > 67)
                    {
                        newRecord = new TR_Barracks();
                        newRecord.TurnId = turnId;
                        newRecord.ItemNo = parseTurnInt(lineToProcess, 66, 3);
                        newRecord.Type = lineToProcess.Substring(70, 3);
                        newRecord.X = parseTurnInt(lineToProcess, 74, 2);
                        newRecord.Y = parseTurnInt(lineToProcess, 77, 2);
                        newRecord.Money = parseTurnInt(lineToProcess, 82, 9);
                        newRecord.Citizens = parseTurnInt(lineToProcess, 92, 6);
                        newRecord.EcPts = parseTurnInt(lineToProcess, 99, 6);
                        newRecord.Wood = parseTurnInt(lineToProcess, 106, 6);
                        newRecord.Horses = parseTurnInt(lineToProcess, 113, 6);
                        newRecord.Text = parseTurnInt(lineToProcess, 120, 6);
                        newRecord.FortressSize = parseTurnInt(lineToProcess, 126, 1);
                        auDB.TR_Barracks.Add(newRecord);
                    }
                    auDB.SaveChanges();
                }
            }

            return lineLocation;
        }

        private int loadCommanders(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            bool locationFound = false;

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                var lineToProcess = lineList[lineLocation].ToString();

                if (lineToProcess.IndexOf("Commander") != -1)
                {
                    locationFound = true;
                    lineLocation = lineLocation + 2; //skip two lines and switch on line Capture
                    lineToProcess = lineList[lineLocation].ToString();

                    var existingRecords = auDB.TR_Commanders.Where(x => x.TurnId == turnId);
                    auDB.TR_Commanders.RemoveRange(existingRecords);
                }

                if (locationFound)
                {
                    if (lineToProcess.IndexOf("Pay") != -1)
                        break;

                    var newRecord = new TR_Commanders();

                    //Commander
                    //No. Rank            Name              x/ y  Brd Fd MP ComC     No. Rank            Name              x/ y  Brd Fd MP ComC
                    //         1         2         3         4         5         6         7         8         9         0         11        12     
                    //1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
                    // 1  Field Marshal   Y. CUESTA        13/41 ----  0 75  18       2  Lieut General   CASTANOS           Brd 1076  0 75  14
                    // 3  Major-General   CONDE DE RAMON    6/81 ---- 71 75  10       4  Brigadier       DE LA ROMANA       Brd 1062  0 75   8
                    //Pay 140000 Louisdore                    if (lineToProcess.IndexOf("Production sites") != -1)

                    newRecord.TurnId = turnId;
                    newRecord.ItemNo = parseTurnInt(lineToProcess, 0, 2);
                    newRecord.Rank = lineToProcess.Substring(4, 14);
                    newRecord.Name = lineToProcess.Substring(20, 15);

                    if (lineToProcess.Substring(43, 4) == "----")
                    {
                        newRecord.X = parseTurnInt(lineToProcess, 37, 2);
                        newRecord.Y = parseTurnInt(lineToProcess, 40, 2);
                    }
                    else 
                    { 
                        newRecord.Boarded = parseTurnInt(lineToProcess, 43, 4);
                    }

                    newRecord.Federation = parseTurnInt(lineToProcess, 48, 2);
                    newRecord.MP = parseTurnInt(lineToProcess, 51, 2);
                    newRecord.CommandCapacity = parseTurnInt(lineToProcess, 55, 2);

                    auDB.TR_Commanders.Add(newRecord);

                    if (lineToProcess.Length > 65)
                    {
                        newRecord = new TR_Commanders();

                        newRecord.TurnId = turnId;
                        newRecord.ItemNo = parseTurnInt(lineToProcess, 63, 2);
                        newRecord.Rank = lineToProcess.Substring(67, 14);
                        newRecord.Name = lineToProcess.Substring(83, 15);

                        if (lineToProcess.Substring(106,4) == "----")
                        {
                            newRecord.X = parseTurnInt(lineToProcess, 100, 2);
                            newRecord.Y = parseTurnInt(lineToProcess, 103, 2);
                        }
                        else
                        {
                            newRecord.Boarded = parseTurnInt(lineToProcess, 106, 4);
                        }

                        newRecord.Federation = parseTurnInt(lineToProcess, 111, 2);
                        newRecord.MP = parseTurnInt(lineToProcess, 114, 2);
                        newRecord.CommandCapacity = parseTurnInt(lineToProcess, 118, 2);

                        auDB.TR_Commanders.Add(newRecord);
                    }
                    auDB.SaveChanges();
                }
            }

            return lineLocation;
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

        private int loadTRMap(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
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
                        newCoordinate.TurnId = turnId;
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
        

        private int loadBrigades(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
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
                    lineLocation = lineLocation + 2; //skip two lines and switch on brigadeCapture
                    lineToProcess = lineList[lineLocation].ToString();

                    // delete all the existing brigades ... in future, dont do this as should only load once...
                    if (!locationFound)
                    {
                        locationFound = true;
                        var existingBrigades = auDB.TR_Brigades.Where(x => x.TurnId == turnId);
                        auDB.TR_Brigades.RemoveRange(existingBrigades);
                    } 
                }

                if (locationFound)
                {
                    if (lineToProcess.IndexOf("Pay:") != -1)
                        break;

                    var newBrigade = new TR_Brigades();

                    newBrigade.TurnId = turnId;
                    newBrigade.ItemNo = parseTurnInt(lineToProcess, 0, 4);
                    newBrigade.Name = lineToProcess.Substring(6, 16);
                    newBrigade.X_OrState = lineToProcess.Substring(23, 2);
                    newBrigade.Y_OrFleet = lineToProcess.Substring(26, 2);
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

        private int loadWarships(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId) {
        //Warships
        //No. Type  Name             x/y Flt MP Cond Age  Mar   Brigade        No. Type  Name             x/y Flt MP Cond Age  Mar   Brigade
        //1049  25  S. TRINIDAD     18/41  0 20 100%  11 1100    0    0        1050  23  SANTA ANA       18/41  0 20 100%   9  950    0    0
        //1051  23  RAYO             7/34  0 20 100%   7  950    0    0        1052  21  NEPTUNO         18/41  0 25 100%  17  800    0    0
            bool locationFound = false;

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                var lineToProcess = lineList[lineLocation].ToString();

                if (lineToProcess.IndexOf("Warships") != -1)
                {
                    locationFound = true;
                    lineLocation = lineLocation + 2; //skip two lines and switch on brigadeCapture
                    lineToProcess = lineList[lineLocation].ToString();

                    var existingRecords = auDB.TR_Warships.Where(x => x.TurnId == turnId);
                    auDB.TR_Warships.RemoveRange(existingRecords);
                }

                if (locationFound)
                {
                    //Warships
                    //No. Type  Name             x/y Flt MP Cond Age  Mar   Brigade        No. Type  Name             x/y Flt MP Cond Age  Mar   Brigade
                    //         1         2         3         4         5         6         7         8         9         0         11        12     
                    //1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
                    //1049  25  S. TRINIDAD     18/41  0 20 100%  11 1100    0    0        1050  23  SANTA ANA       18/41  0 20 100%   9  950    0    0
                    if (lineToProcess.IndexOf("Merchant Ships") != -1)
                        break;

                    var newRecord = new TR_Warships();

                    newRecord.TurnId = turnId;
                    newRecord.ItemNo = parseTurnInt(lineToProcess, 0, 4);
                    newRecord.Type = parseTurnInt(lineToProcess, 6, 2);
                    newRecord.Name = lineToProcess.Substring(10, 15);
                    newRecord.X = parseTurnInt(lineToProcess, 26, 2);
                    newRecord.Y = parseTurnInt(lineToProcess, 29, 2);
                    newRecord.FleetNo = parseTurnInt(lineToProcess, 32, 2);
                    newRecord.MP = parseTurnInt(lineToProcess, 35, 2);
                    newRecord.Condition = parseTurnInt(lineToProcess, 38, 3);
                    newRecord.Age = parseTurnInt(lineToProcess, 44, 2);
                    newRecord.Marines = parseTurnInt(lineToProcess, 47, 4);
                    newRecord.Brigade1 = parseTurnInt(lineToProcess, 52, 4);
                    newRecord.Brigade2 = parseTurnInt(lineToProcess, 57, 4);

                    auDB.TR_Warships.Add(newRecord);

//No. Type  Name             x/y Flt MP Cond Age  Mar   Brigade        No. Type  Name             x/y Flt MP Cond Age  Mar   Brigade
//         1         2         3         4         5         6         7         8         9         0         11        12     
//1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
//1049  25  S. TRINIDAD     18/41  0 20 100%  11 1100    0    0        1050  23  SANTA ANA       18/41  0 20 100%   9  950    0    0

                    if (lineToProcess.Length > 69)
                    {
                        newRecord = new TR_Warships();

                        newRecord.TurnId = turnId;
                        newRecord.ItemNo = parseTurnInt(lineToProcess, 69, 4);
                        newRecord.Type = parseTurnInt(lineToProcess, 75, 2);
                        newRecord.Name = lineToProcess.Substring(79, 15);
                        newRecord.X = parseTurnInt(lineToProcess, 95, 2);
                        newRecord.Y = parseTurnInt(lineToProcess, 98, 2);
                        newRecord.FleetNo = parseTurnInt(lineToProcess, 101, 2);
                        newRecord.MP = parseTurnInt(lineToProcess, 104, 2);
                        newRecord.Condition = parseTurnInt(lineToProcess, 107, 3);
                        newRecord.Age = parseTurnInt(lineToProcess, 113, 2);
                        newRecord.Marines = parseTurnInt(lineToProcess, 116, 4);
                        newRecord.Brigade1 = parseTurnInt(lineToProcess, 121, 4);
                        newRecord.Brigade2 = parseTurnInt(lineToProcess, 126, 4);

                        auDB.TR_Warships.Add(newRecord);
                    }
                    auDB.SaveChanges();
                }
            }

            return lineLocation;
        }

        private int loadMerchantShips(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId) {
            bool locationFound = false;

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                var lineToProcess = lineList[lineLocation].ToString();

                if (lineToProcess.IndexOf("Merchant Ships") != -1)
                {
                    locationFound = true;
                    lineLocation = lineLocation + 2; //skip two lines and switch on brigadeCapture
                    lineToProcess = lineList[lineLocation].ToString();

                    var existingRecords = auDB.TR_MerchantShips.Where(x => x.TurnId == turnId);
                    auDB.TR_MerchantShips.RemoveRange(existingRecords);
                }

                if (locationFound)
                {
                    //Merchant Ships
                    //No. Type  x/ y Fl MP Cond Age  Gds   Qty  Gds   Qty      Mny          No. Type  x/ y Fl MP Cond Age  Gds   Qty  Gds   Qty      Mny
                    //1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
                    //         1         2         3         4         5         6         7         8         9         0         11        12     
                    //1077  35 18/41  0 30 100%   6    0     0    0     0        0          1078  35  7/34  0 30 100%  11    0     0    0     0        0 
                    if (lineToProcess.IndexOf("Maintenance costs") != -1)
                        break;

                    var newRecord = new TR_MerchantShips();

                    newRecord.TurnId = turnId;
                    newRecord.ItemNo = parseTurnInt(lineToProcess, 0, 4);
                    newRecord.Type = parseTurnInt(lineToProcess, 6, 2);
                    newRecord.X = parseTurnInt(lineToProcess, 9, 2);
                    newRecord.Y = parseTurnInt(lineToProcess, 12, 2);
                    newRecord.FleetNo = parseTurnInt(lineToProcess, 15, 2);
                    newRecord.MP = parseTurnInt(lineToProcess, 18, 2);
                    newRecord.Condition = parseTurnInt(lineToProcess, 21, 3);
                    newRecord.Age = parseTurnInt(lineToProcess, 27, 2);
                    newRecord.Goods1 = parseTurnInt(lineToProcess, 32, 2);
                    newRecord.Quantity1 = parseTurnInt(lineToProcess, 35, 5);
                    newRecord.Goods2 = parseTurnInt(lineToProcess, 43, 2);
                    newRecord.Quantity1 = parseTurnInt(lineToProcess, 46, 5);
                    newRecord.Money = parseTurnInt(lineToProcess, 52, 9);

                    auDB.TR_MerchantShips.Add(newRecord);

                    //No. Type  x/ y Fl MP Cond Age  Gds   Qty  Gds   Qty      Mny          No. Type  x/ y Fl MP Cond Age  Gds   Qty  Gds   Qty      Mny
                    //1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
                    //         1         2         3         4         5         6         7         8         9         0         11        12     
                    //1077  35 18/41  0 30 100%   6    0     0    0     0        0          1078  35  7/34  0 30 100%  11    0     0    0     0        0 

                    if (lineToProcess.Length > 69)
                    {
                        newRecord = new TR_MerchantShips();

                        newRecord.TurnId = turnId;
                        newRecord.ItemNo = parseTurnInt(lineToProcess, 70, 4);
                        newRecord.Type = parseTurnInt(lineToProcess, 76, 2);
                        newRecord.X = parseTurnInt(lineToProcess, 79, 2);
                        newRecord.Y = parseTurnInt(lineToProcess, 82, 2);
                        newRecord.FleetNo = parseTurnInt(lineToProcess, 85, 2);
                        newRecord.MP = parseTurnInt(lineToProcess, 88, 2);
                        newRecord.Condition = parseTurnInt(lineToProcess, 91, 3);
                        newRecord.Age = parseTurnInt(lineToProcess, 97, 2);
                        newRecord.Goods1 = parseTurnInt(lineToProcess, 102, 2);
                        newRecord.Quantity1 = parseTurnInt(lineToProcess, 105, 5);
                        newRecord.Goods2 = parseTurnInt(lineToProcess, 113, 2);
                        newRecord.Quantity1 = parseTurnInt(lineToProcess, 116, 5);
                        newRecord.Money = parseTurnInt(lineToProcess, 122, 9);

                        auDB.TR_MerchantShips.Add(newRecord);
                    }
                    auDB.SaveChanges();
                }
            }

            return lineLocation;
        }

        private int loadBaggageTrains(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId) {
            bool locationFound = false;

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                var lineToProcess = lineList[lineLocation].ToString();

                if (lineToProcess.IndexOf("Baggage Trains") != -1)
                {
                    locationFound = true;
                    lineLocation = lineLocation + 2; //skip two lines and switch on brigadeCapture
                    lineToProcess = lineList[lineLocation].ToString();

                    var existingRecords = auDB.TR_BaggageTrains.Where(x => x.TurnId == turnId);
                    auDB.TR_BaggageTrains.RemoveRange(existingRecords);
                }

                if (locationFound)
                {
                    if (lineToProcess.IndexOf("Spies") != -1)
                        break;

                    var newRecord = new TR_BaggageTrains();

                    newRecord.TurnId = turnId;
                    newRecord.ItemNo = parseTurnInt(lineToProcess, 0, 4);
                    newRecord.X = parseTurnInt(lineToProcess, 5, 2);
                    newRecord.Y = parseTurnInt(lineToProcess, 8, 2);
                    newRecord.FederationNo = parseTurnInt(lineToProcess, 11, 2);
                    newRecord.MP = parseTurnInt(lineToProcess, 14, 2);
                    newRecord.Condition = parseTurnInt(lineToProcess, 17, 3);
                    newRecord.Goods1 = parseTurnInt(lineToProcess, 25, 2);
                    newRecord.Quantity1 = parseTurnInt(lineToProcess, 28, 5);
                    newRecord.Goods2 = parseTurnInt(lineToProcess, 37, 2);
                    newRecord.Quantity2 = parseTurnInt(lineToProcess, 40, 5);
                    newRecord.Money = parseTurnInt(lineToProcess, 46, 10);

                    auDB.TR_BaggageTrains.Add(newRecord);

//Baggage Trains
//No.   x/ y Fd MP Cond   Gds   Qty   Gds   Qty        Mny            No.   x/ y Fd MP Cond   Gds   Qty   Gds   Qty        Mny
//1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
//         1         2         3         4         5         6         7         8         9         0         11        12     
//7004 28/20  0 74  99%    22   264    19   487     689451            7019  7/34  0 75 100%     0     0     0     0          0
//Spies             

                    if (lineToProcess.Length > 69)
                    {
                        newRecord = new TR_BaggageTrains();

                        newRecord.TurnId = turnId;
                        newRecord.ItemNo = parseTurnInt(lineToProcess, 68, 4);
                        newRecord.X = parseTurnInt(lineToProcess, 73, 2);
                        newRecord.Y = parseTurnInt(lineToProcess, 76, 2);
                        newRecord.FederationNo = parseTurnInt(lineToProcess, 79, 2);
                        newRecord.MP = parseTurnInt(lineToProcess, 82, 2);
                        newRecord.Condition = parseTurnInt(lineToProcess, 85, 3);
                        newRecord.Goods1 = parseTurnInt(lineToProcess, 93, 2);
                        newRecord.Quantity1 = parseTurnInt(lineToProcess, 96, 5);
                        newRecord.Goods2 = parseTurnInt(lineToProcess, 105, 2);
                        newRecord.Quantity2 = parseTurnInt(lineToProcess, 108, 5);
                        newRecord.Money = parseTurnInt(lineToProcess, 114, 10);

                        auDB.TR_BaggageTrains.Add(newRecord);
                    }
                    auDB.SaveChanges();
                }
            }

            return lineLocation;
        }

        private int loadSpies(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            bool locationFound = false;

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                var lineToProcess = lineList[lineLocation].ToString();

                if (lineToProcess.IndexOf("Spies") != -1)
                {
                    lineLocation = lineLocation + 2; //skip two lines and switch on brigadeCapture
                    lineToProcess = lineList[lineLocation].ToString();

                    if (!locationFound)
                    {
                        locationFound = true;
                        var existingRecords = auDB.TR_Spies.Where(x => x.TurnId == turnId);
                        auDB.TR_Spies.RemoveRange(existingRecords);
                    } 
                }

                if (locationFound)
                {

                    if (lineToProcess.IndexOf("Relationship of") != -1 || lineToProcess.IndexOf("Army positions") != -1)
                        break;

                    var newRecord = new TR_Spies();

    //Spies
    //No.  x/ y  Brd    Reports                                                                                                       Fort:
    //1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
    //         1         2         3         4         5         6         7         8         9        10        11        12        13
    // 91  5/41 ----  90 Battalions,    8 War- &    0 merchant Ships at position,    0 Brigades &    0 Ships in vicinity    mediu
    // 92  9/46 ----   0 Battalions,    4 War- &    3 merchant Ships at position,    0 Brigades &    0 Ships in vicinity    mediu

                    newRecord.TurnId = turnId;
                    newRecord.ItemNo = parseTurnInt(lineToProcess, 1, 2);
                    newRecord.X = parseTurnInt(lineToProcess,4, 2);
                    newRecord.Y = parseTurnInt(lineToProcess, 7, 2);

                    if (lineToProcess.Substring(10, 4) != "----")
                    {
                        newRecord.Boarded = parseTurnInt(lineToProcess, 10, 4);
                    }

                    newRecord.Report = lineToProcess.Substring(16, 107);

                    auDB.TR_Spies.Add(newRecord);
                    auDB.SaveChanges();
                }
            }

            return lineLocation;
        }

        private int loadTradingPortsAndCities(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            bool locationFound = false;

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                var lineToProcess = lineList[lineLocation].ToString();

                if (lineToProcess.IndexOf("Trading Ports & Cities") != -1)
                {
                    locationFound = true;
                    lineLocation = lineLocation + 3; //skip two lines and switch on brigadeCapture
                    lineToProcess = lineList[lineLocation].ToString();

                    // delete all the existing brigades ... in future, dont do this as should only load once...
                    var existingRecords = auDB.TR_TradingPortsAndCities.Where(x => x.TurnId == turnId);
                    auDB.TR_TradingPortsAndCities.RemoveRange(existingRecords);
                }

                if (locationFound)
                {
                    if (lineToProcess.IndexOf("Austria-Hungary -") != -1)
                        break;

                    var newRecord = new TR_TradingPortsAndCities();

                    //Warehouses
                    //          Inhabitants  -Foreign       Mny   Citz   EcPt   Food    Stn   Wood    Ore   Zinc   Hors   Text   Wool   Gold   Wine
                    //                                     -10-   -11-   -13-   -16-   -18-   -19-   -20-   -21-   -22-   -23-   -24-   -29-   -30-
                    //-1- Europe     409041   190928    6864769  23885  10037  10717  17758   1435      0      0  11463    176    766     10      2
                    //1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
                    //         1         2         3         4         5         6         7         8         9         0         11        12     
                    // No   x/ y   City             Rate   EcPt   Food    Stn   Wood    Ore   Zinc   Hors   Text   Wool   Gold   Wine
                    //101   5/41  Lisbon              6     535   1204      0   1089      3      3   2509     29    116     10    100

                    newRecord.TurnId = turnId;
                    newRecord.ItemNo = parseTurnInt(lineToProcess, 0, 3);
                    newRecord.X = parseTurnInt(lineToProcess, 5, 2);
                    newRecord.Y = parseTurnInt(lineToProcess, 8, 2);
                    
                    newRecord.Name = lineToProcess.Substring(12, 16);
                    newRecord.Rate = parseTurnInt(lineToProcess, 32, 1);
                    newRecord.EctPts = parseTurnInt(lineToProcess, 34, 7); 
                    newRecord.Food = parseTurnInt(lineToProcess, 42, 6);
                    newRecord.Stone = parseTurnInt(lineToProcess, 49, 6);
                    newRecord.Wood = parseTurnInt(lineToProcess, 56, 6);
                    newRecord.Ore = parseTurnInt(lineToProcess, 63, 6);
                    newRecord.Zinc = parseTurnInt(lineToProcess, 70, 6);
                    newRecord.Horses = parseTurnInt(lineToProcess, 77, 6);
                    newRecord.Textiles = parseTurnInt(lineToProcess, 84, 6);
                    newRecord.Wool = parseTurnInt(lineToProcess, 91, 6);
                    newRecord.Gold = parseTurnInt(lineToProcess, 98, 6);
                    newRecord.Wine = parseTurnInt(lineToProcess, 105, 6);

                    auDB.TR_TradingPortsAndCities.Add(newRecord);
                    auDB.SaveChanges();
                }
            }

            return lineLocation;
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

        private string getStateLetter(string stateName)
        {
            switch (stateName)
            {
                case "France":
                    return "F";
                case "Spain":
                    return "E";
                case "Portugal":
                    return "K";
                case "Holland":
                    return "H";
                case "Russia":
                    return "R";
                case "Austria":
                    return "A";
                case "Rhine":
                    return "B";
                default:
                    return "E";
            }
        }

    }
}
