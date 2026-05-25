using Austerlitz.DAL;
using Austerlitz.Models;
using Austerlitz.Models.SimBattle;
using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace Austerlitz.Services
{
    public class TurnReportImportService
    {
        public string LoadTurnReport(string filePath)
        {
            try
            {
                var auDB = new AusterlitzDbContext();
                var simBattleVm = new SimBattleVm();
                var lineList = LoadTurnFile(filePath);
                var lineLocation = 0;

                var turnId = GetTurnId(lineList, lineLocation, auDB);
                CleanUpTurnReport(lineList);

                lineLocation = LoadWarehouses(lineList, lineLocation, auDB, turnId);
                lineLocation = LoadBarracks(lineList, lineLocation, auDB, turnId);
                lineLocation = LoadCommanders(lineList, lineLocation, auDB, turnId);
                lineLocation = LoadBrigades(lineList, lineLocation, auDB, turnId);
                lineLocation = LoadWarships(lineList, lineLocation, auDB, turnId);
                lineLocation = LoadMerchantShips(lineList, lineLocation, auDB, turnId);
                lineLocation = LoadBaggageTrains(lineList, lineLocation, auDB, turnId);
                lineLocation = LoadSpies(lineList, lineLocation, auDB, turnId);
                lineLocation = LoadStateRelationships(lineList, lineLocation, auDB, turnId);
                lineLocation = LoadTradingPortsAndCities(lineList, lineLocation, auDB, turnId);

                // SAVE THIS TO THE DATABASE!!!
                // lineLocation = LoadSimBattleMap(lineList, simBattleVm, lineLocation);
                // lineLocation = LoadSimArmies(lineList, simBattleVm, lineLocation);

                lineLocation = LoadTRMap(lineList, lineLocation, auDB, turnId);
                return turnId;
            }
            catch (Exception ex)
            {
                throw new Exception("loadTurnReport: " + ex.Message, ex);
            }
        }

        private void CleanUpTurnReport(ArrayList lineList)
        {
            try
            {
                for (var lineLocation = lineList.Count - 1; lineLocation >= 0; lineLocation--)
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
            catch (Exception ex)
            {
                throw new Exception("cleanUpTurnReport: " + ex.Message, ex);
            }
        }

        private string GetTurnId(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB)
        {
            try
            {
                var turnId = "NotFound12345";
                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    if (lineToProcess.IndexOf("AUSTERLITZ   Game:") == -1)
                    {
                        continue;
                    }

                    var gameNo = lineToProcess.Substring(23, 3);
                    var state = TurnReportImportParsingUtils.GetStateLetter(lineToProcess.Substring(30).TrimStart().TrimEnd());

                    lineLocation++;
                    lineToProcess = lineList[lineLocation].ToString();
                    var month = lineToProcess.Substring(21, 3).TrimEnd();
                    var year = lineToProcess.Substring(lineToProcess.Length - 4, 4);
                    turnId = gameNo + state + month + year;

                    var existingTurn = auDB.TS_00TurnDetails.Where(x => x.TurnId == turnId);
                    if (existingTurn.Count() == 0)
                    {
                        var newTurn = new TS_00TurnDetails { TurnId = turnId };
                        auDB.TS_00TurnDetails.Add(newTurn);
                        auDB.SaveChanges();

                        var turnSheetManager = new Austerlitz.Domain.TurnSheetManager();
                        turnSheetManager.EnsureAllTurnsheetSectionsSeeded(turnId);
                    }

                    break;
                }

                return turnId;
            }
            catch (Exception ex)
            {
                throw new Exception("getTurnId: " + ex.Message, ex);
            }
        }

        private int LoadStateRelationships(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadStateRelationships: " + ex.Message, ex);
            }
        }

        private int LoadWarehouses(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                var locationFound = false;
                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    if (lineToProcess.IndexOf("Warehouses") != -1)
                    {
                        locationFound = true;
                        lineLocation += 3;
                        lineToProcess = lineList[lineLocation].ToString();
                        var existingWarehouses = auDB.TR_Warehouses.Where(x => x.TurnId == turnId);
                        auDB.TR_Warehouses.RemoveRange(existingWarehouses);
                    }

                    if (!locationFound)
                    {
                        continue;
                    }

                    if (lineToProcess.IndexOf("Barracks") != -1 || lineToProcess.IndexOf("No. Typ  x/ y") != -1)
                    {
                        break;
                    }

                    var newWarehouse = new TR_Warehouses
                    {
                        TurnId = turnId,
                        ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 1, 1),
                        WarehouseName = lineToProcess.Substring(15, 6),
                        Inhabitants = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 14, 8),
                        Foreign = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 23, 8),
                        Money = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 33, 9),
                        Citizens = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 43, 6),
                        EcPts = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 50, 6),
                        Food = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 57, 6),
                        Stone = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 64, 6),
                        Wood = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 71, 6),
                        Ore = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 78, 6),
                        Zinc = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 85, 6),
                        Horses = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 92, 6),
                        Textiles = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 99, 6),
                        Wool = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 106, 6),
                        Gold = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 113, 6),
                        Wine = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 120, 5)
                    };

                    auDB.TR_Warehouses.Add(newWarehouse);
                    auDB.SaveChanges();
                }

                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadWarehouses: " + ex.Message, ex);
            }
        }

        private int LoadBarracks(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                var locationFound = false;
                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    if (lineToProcess.IndexOf("No. Typ  x/ y") != -1)
                    {
                        locationFound = true;
                        lineLocation += 2;
                        lineToProcess = lineList[lineLocation].ToString();
                        var existingRecords = auDB.TR_Barracks.Where(x => x.TurnId == turnId);
                        auDB.TR_Barracks.RemoveRange(existingRecords);
                    }

                    if (!locationFound)
                    {
                        continue;
                    }

                    if (lineToProcess.IndexOf("Production sites") != -1)
                    {
                        break;
                    }

                    var newRecord = new TR_Barracks
                    {
                        TurnId = turnId,
                        ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 0, 3),
                        Type = lineToProcess.Substring(4, 3),
                        X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 8, 2),
                        Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 11, 2),
                        Money = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 16, 9),
                        Citizens = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 26, 6),
                        EcPts = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 33, 6),
                        Wood = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 40, 6),
                        Horses = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 47, 6),
                        Text = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 54, 6),
                        FortressSize = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 60, 1)
                    };

                    auDB.TR_Barracks.Add(newRecord);
                    if (lineToProcess.Length > 67)
                    {
                        newRecord = new TR_Barracks
                        {
                            TurnId = turnId,
                            ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 66, 3),
                            Type = lineToProcess.Substring(70, 3),
                            X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 74, 2),
                            Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 77, 2),
                            Money = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 82, 9),
                            Citizens = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 92, 6),
                            EcPts = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 99, 6),
                            Wood = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 106, 6),
                            Horses = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 113, 6),
                            Text = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 120, 6),
                            FortressSize = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 126, 1)
                        };
                        auDB.TR_Barracks.Add(newRecord);
                    }

                    auDB.SaveChanges();
                }

                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadBarracks: " + ex.Message, ex);
            }
        }

        private int LoadCommanders(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                var locationFound = false;
                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    if (lineToProcess.IndexOf("Commander") != -1)
                    {
                        locationFound = true;
                        lineLocation += 2;
                        lineToProcess = lineList[lineLocation].ToString();
                        var existingRecords = auDB.TR_Commanders.Where(x => x.TurnId == turnId);
                        auDB.TR_Commanders.RemoveRange(existingRecords);
                    }

                    if (!locationFound)
                    {
                        continue;
                    }

                    if (lineToProcess.IndexOf("Pay") != -1)
                    {
                        break;
                    }

                    var newRecord = new TR_Commanders
                    {
                        TurnId = turnId,
                        ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 0, 2),
                        Rank = lineToProcess.Substring(4, 14),
                        Name = lineToProcess.Substring(20, 15),
                        Federation = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 48, 2),
                        MP = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 51, 2),
                        CommandCapacity = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 55, 2)
                    };

                    if (lineToProcess.Substring(43, 4) == "----")
                    {
                        newRecord.X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 37, 2);
                        newRecord.Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 40, 2);
                    }
                    else
                    {
                        newRecord.Boarded = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 43, 4);
                    }

                    auDB.TR_Commanders.Add(newRecord);
                    if (lineToProcess.Length > 65)
                    {
                        newRecord = new TR_Commanders
                        {
                            TurnId = turnId,
                            ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 63, 2),
                            Rank = lineToProcess.Substring(67, 14),
                            Name = lineToProcess.Substring(83, 15),
                            Federation = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 111, 2),
                            MP = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 114, 2),
                            CommandCapacity = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 118, 2)
                        };

                        if (lineToProcess.Substring(106, 4) == "----")
                        {
                            newRecord.X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 100, 2);
                            newRecord.Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 103, 2);
                        }
                        else
                        {
                            newRecord.Boarded = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 106, 4);
                        }

                        auDB.TR_Commanders.Add(newRecord);
                    }

                    auDB.SaveChanges();
                }

                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadCommanders: " + ex.Message, ex);
            }
        }

        private int LoadTRMap(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                var locationFound = false;
                var xStart = 0;
                var coordinatesOnALine = new TR_MapCoordinates[40];
                var y = 0;

                const string mapBoundaryEurope1 = "    1  2  3  4  5  6  7  8  9";
                const string mapBoundaryEurope2 = "   41 42 43 44 45 46 47 48 49 50";
                const string mapBoundaryCarribean = "    1  2  3  4  5  6  7  8  9 10";
                const string mapBoundaryIndies = "   51 52 53 54 55 56 57 58 59 60";
                var mapBoundaryText = mapBoundaryEurope1;

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
                            if (mapBoundaryText == mapBoundaryEurope1) mapBoundaryText = mapBoundaryEurope2;
                            else if (mapBoundaryText == mapBoundaryEurope2) mapBoundaryText = mapBoundaryCarribean;
                            else if (mapBoundaryText == mapBoundaryCarribean) mapBoundaryText = mapBoundaryIndies;
                            else if (mapBoundaryText == mapBoundaryIndies) break;
                        }
                        else
                        {
                            locationFound = true;
                            lineLocation += 1;
                            lineToProcess = lineList[lineLocation].ToString();
                            if (mapBoundaryText == mapBoundaryEurope1) { xStart = 1; y = 1; }
                            else if (mapBoundaryText == mapBoundaryEurope2) { xStart = 41; y = 1; }
                            else if (mapBoundaryText == mapBoundaryCarribean) { xStart = 1; y = 70; }
                            else if (mapBoundaryText == mapBoundaryIndies) { xStart = 51; y = 70; }
                        }
                    }

                    if (!locationFound)
                    {
                        continue;
                    }

                    if (lineToProcess.IndexOf(mapBoundaryText) != -1)
                    {
                        break;
                    }

                    for (var x = xStart; x < xStart + 40; x++)
                    {
                        var coordinate = lineToProcess.Substring(3 + (x - xStart) * 3, 3);
                        var newCoordinate = new TR_MapCoordinates
                        {
                            X = x,
                            Y = y,
                            TurnId = turnId,
                            State = coordinate.Substring(0, 1),
                            Population = coordinate.Substring(1, 1),
                            ProductionSite = coordinate.Substring(2, 1)
                        };
                        coordinatesOnALine[x - xStart] = newCoordinate;
                    }

                    auDB.TR_MapCoordinates.AddRange(coordinatesOnALine);
                    auDB.SaveChanges();
                    y++;
                }

                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadTRMap: " + ex.Message, ex);
            }
        }

        private int LoadBrigades(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                var locationFound = false;
                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    if (lineToProcess.IndexOf("Brigades") != -1)
                    {
                        lineLocation += 2;
                        lineToProcess = lineList[lineLocation].ToString();
                        if (!locationFound)
                        {
                            locationFound = true;
                            var existingBrigades = auDB.TR_Brigades.Where(x => x.TurnId == turnId);
                            auDB.TR_Brigades.RemoveRange(existingBrigades);
                        }
                    }

                    if (!locationFound)
                    {
                        continue;
                    }

                    if (lineToProcess.IndexOf("Pay:") != -1)
                    {
                        break;
                    }

                    var newBrigade = new TR_Brigades
                    {
                        TurnId = turnId,
                        ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 0, 4),
                        Name = lineToProcess.Substring(6, 16),
                        X_OrState = lineToProcess.Substring(23, 2),
                        Y_OrFleet = lineToProcess.Substring(26, 2),
                        MP = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 30, 2),
                        Federation = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 34, 2),
                        Batt1Type = lineToProcess.Substring(40, 2),
                        Batt1EF = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 43, 2),
                        Batt1Size = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 46, 3),
                        Batt2Type = lineToProcess.Substring(53, 2),
                        Batt2EF = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 56, 2),
                        Batt2Size = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 59, 3),
                        Batt3Type = lineToProcess.Substring(66, 2),
                        Batt3EF = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 69, 2),
                        Batt3Size = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 72, 3),
                        Batt4Type = lineToProcess.Substring(79, 2),
                        Batt4EF = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 82, 2),
                        Batt4Size = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 85, 3),
                        Batt5Type = lineToProcess.Substring(92, 2),
                        Batt5EF = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 95, 2),
                        Batt5Size = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 98, 3),
                        Batt6Type = lineToProcess.Substring(105, 2),
                        Batt6EF = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 108, 2),
                        Batt6Size = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 111, 3),
                        Batt7Type = lineToProcess.Substring(118, 2),
                        Batt7EF = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 121, 2),
                        Batt7Size = TurnReportImportParsingUtils.ParseTurnIntNullable(lineToProcess, 124, 3)
                    };

                    auDB.TR_Brigades.Add(newBrigade);
                    auDB.SaveChanges();
                }

                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadBrigades: " + ex.Message, ex);
            }
        }

        private int LoadWarships(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                var locationFound = false;
                var originalLineLocation = lineLocation;
                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    if (lineToProcess.IndexOf("Warships") != -1)
                    {
                        locationFound = true;
                        lineLocation += 2;
                        lineToProcess = lineList[lineLocation].ToString();
                        var existingRecords = auDB.TR_Warships.Where(x => x.TurnId == turnId);
                        auDB.TR_Warships.RemoveRange(existingRecords);
                    }

                    if (!locationFound)
                    {
                        continue;
                    }

                    if (lineToProcess.IndexOf("Merchant Ships") != -1)
                    {
                        break;
                    }

                    var newRecord = new TR_Warships
                    {
                        TurnId = turnId,
                        ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 0, 4),
                        Type = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 6, 2),
                        Name = lineToProcess.Substring(10, 15),
                        X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 26, 2),
                        Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 29, 2),
                        FleetNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 32, 2),
                        MP = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 35, 2),
                        Condition = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 38, 3),
                        Age = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 44, 2),
                        Marines = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 47, 4),
                        Brigade1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 52, 4),
                        Brigade2 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 57, 4)
                    };

                    auDB.TR_Warships.Add(newRecord);
                    if (lineToProcess.Length > 69)
                    {
                        newRecord = new TR_Warships
                        {
                            TurnId = turnId,
                            ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 69, 4),
                            Type = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 75, 2),
                            Name = lineToProcess.Substring(79, 15),
                            X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 95, 2),
                            Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 98, 2),
                            FleetNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 101, 2),
                            MP = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 104, 2),
                            Condition = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 107, 3),
                            Age = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 113, 2),
                            Marines = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 116, 4),
                            Brigade1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 121, 4),
                            Brigade2 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 126, 4)
                        };
                        auDB.TR_Warships.Add(newRecord);
                    }

                    auDB.SaveChanges();
                }

                return locationFound ? lineLocation : originalLineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadWarships: " + ex.Message, ex);
            }
        }

        private int LoadMerchantShips(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                var locationFound = false;
                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    if (lineToProcess.IndexOf("Merchant Ships") != -1)
                    {
                        locationFound = true;
                        lineLocation += 2;
                        lineToProcess = lineList[lineLocation].ToString();
                        var existingRecords = auDB.TR_MerchantShips.Where(x => x.TurnId == turnId);
                        auDB.TR_MerchantShips.RemoveRange(existingRecords);
                    }

                    if (!locationFound)
                    {
                        continue;
                    }

                    if (lineToProcess.IndexOf("Maintenance costs") != -1)
                    {
                        break;
                    }

                    var newRecord = new TR_MerchantShips
                    {
                        TurnId = turnId,
                        ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 0, 4),
                        Type = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 6, 2),
                        X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 9, 2),
                        Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 12, 2),
                        FleetNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 15, 2),
                        MP = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 18, 2),
                        Condition = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 21, 3),
                        Age = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 27, 2),
                        Goods1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 32, 2),
                        Quantity1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 35, 5),
                        Goods2 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 43, 2),
                        Money = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 52, 9)
                    };
                    newRecord.Quantity1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 46, 5);
                    auDB.TR_MerchantShips.Add(newRecord);

                    if (lineToProcess.Length > 69)
                    {
                        newRecord = new TR_MerchantShips
                        {
                            TurnId = turnId,
                            ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 70, 4),
                            Type = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 76, 2),
                            X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 79, 2),
                            Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 82, 2),
                            FleetNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 85, 2),
                            MP = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 88, 2),
                            Condition = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 91, 3),
                            Age = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 97, 2),
                            Goods1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 102, 2),
                            Quantity1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 105, 5),
                            Goods2 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 113, 2),
                            Money = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 122, 9)
                        };
                        newRecord.Quantity1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 116, 5);
                        auDB.TR_MerchantShips.Add(newRecord);
                    }

                    auDB.SaveChanges();
                }

                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadMerchantShips: " + ex.Message, ex);
            }
        }

        private int LoadBaggageTrains(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                var locationFound = false;
                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    if (lineToProcess.IndexOf("Baggage Trains") != -1)
                    {
                        locationFound = true;
                        lineLocation += 2;
                        lineToProcess = lineList[lineLocation].ToString();
                        var existingRecords = auDB.TR_BaggageTrains.Where(x => x.TurnId == turnId);
                        auDB.TR_BaggageTrains.RemoveRange(existingRecords);
                    }

                    if (!locationFound)
                    {
                        continue;
                    }

                    if (lineToProcess.IndexOf("Spies") != -1)
                    {
                        break;
                    }

                    var newRecord = new TR_BaggageTrains
                    {
                        TurnId = turnId,
                        ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 0, 4),
                        X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 5, 2),
                        Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 8, 2),
                        FederationNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 11, 2),
                        MP = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 14, 2),
                        Condition = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 17, 3),
                        Goods1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 25, 2),
                        Quantity1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 28, 5),
                        Goods2 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 37, 2),
                        Quantity2 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 40, 5),
                        Money = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 46, 10)
                    };
                    auDB.TR_BaggageTrains.Add(newRecord);

                    if (lineToProcess.Length > 69)
                    {
                        newRecord = new TR_BaggageTrains
                        {
                            TurnId = turnId,
                            ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 68, 4),
                            X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 73, 2),
                            Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 76, 2),
                            FederationNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 79, 2),
                            MP = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 82, 2),
                            Condition = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 85, 3),
                            Goods1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 93, 2),
                            Quantity1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 96, 5),
                            Goods2 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 105, 2),
                            Quantity2 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 108, 5),
                            Money = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 114, 10)
                        };
                        auDB.TR_BaggageTrains.Add(newRecord);
                    }

                    auDB.SaveChanges();
                }

                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadBaggageTrains: " + ex.Message, ex);
            }
        }

        private int LoadSpies(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                var locationFound = false;
                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    if (lineToProcess.IndexOf("Spies") != -1)
                    {
                        lineLocation += 2;
                        lineToProcess = lineList[lineLocation].ToString();
                        if (!locationFound)
                        {
                            locationFound = true;
                            var existingRecords = auDB.TR_Spies.Where(x => x.TurnId == turnId);
                            auDB.TR_Spies.RemoveRange(existingRecords);
                        }
                    }

                    if (!locationFound)
                    {
                        continue;
                    }

                    if (lineToProcess.IndexOf("Relationship of") != -1 || lineToProcess.IndexOf("Army positions") != -1)
                    {
                        break;
                    }

                    var newRecord = new TR_Spies
                    {
                        TurnId = turnId,
                        ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 1, 2),
                        X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 4, 2),
                        Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 7, 2),
                        Report = lineToProcess.Substring(16, 107)
                    };

                    if (lineToProcess.Substring(10, 4) != "----")
                    {
                        newRecord.Boarded = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 10, 4);
                    }

                    auDB.TR_Spies.Add(newRecord);
                    auDB.SaveChanges();
                }

                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadSpies: " + ex.Message, ex);
            }
        }

        private int LoadTradingPortsAndCities(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                var locationFound = false;
                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    if (lineToProcess.IndexOf("Trading Ports & Cities") != -1)
                    {
                        locationFound = true;
                        lineLocation += 3;
                        lineToProcess = lineList[lineLocation].ToString();
                        var existingRecords = auDB.TR_TradingPortsAndCities.Where(x => x.TurnId == turnId);
                        auDB.TR_TradingPortsAndCities.RemoveRange(existingRecords);
                    }

                    if (!locationFound)
                    {
                        continue;
                    }

                    if (lineToProcess.IndexOf("Austria-Hungary -") != -1 || lineToProcess.IndexOf("     (1)") != -1)
                    {
                        break;
                    }

                    var newRecord = new TR_TradingPortsAndCities
                    {
                        TurnId = turnId,
                        ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 0, 3),
                        X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 5, 2),
                        Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 8, 2),
                        Name = lineToProcess.Substring(12, 16),
                        Rate = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 32, 1),
                        EctPts = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 34, 7),
                        Food = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 42, 6),
                        Stone = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 49, 6),
                        Wood = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 56, 6),
                        Ore = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 63, 6),
                        Zinc = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 70, 6),
                        Horses = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 77, 6),
                        Textiles = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 84, 6),
                        Wool = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 91, 6),
                        Gold = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 98, 6),
                        Wine = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 105, 6)
                    };

                    auDB.TR_TradingPortsAndCities.Add(newRecord);
                    auDB.SaveChanges();
                }

                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadTradingPortsAndCities: " + ex.Message, ex);
            }
        }

        private int LoadSimArmies(ArrayList lineList, SimBattleVm simBattleVm, int lineLocation)
        {
            var armyA = new Army();
            var armyB = new Army();
            simBattleVm.ArmyA = armyA;
            simBattleVm.ArmyB = armyB;
            lineLocation = LoadSimArmy(armyA, lineList, lineLocation);
            lineLocation = LoadSimArmy(armyB, lineList, lineLocation);
            return lineLocation;
        }

        private int LoadSimArmy(Army army, ArrayList lineList, int lineLocation)
        {
            var batGroups = new List<BattalionGroup>();
            int dummyValue;
            var bArmyFound = false;
            var bArmyProcessed = false;

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                var lineToProcess = lineList[lineLocation].ToString();
                if (!bArmyFound && !bArmyProcessed)
                {
                    if (lineToProcess.IndexOf("Command Capability") != -1)
                    {
                        army.Commander = new Commander
                        {
                            CommanderName = lineToProcess.Substring(0, 25).Trim(),
                            Capability = int.Parse(lineToProcess.Substring(49, 2))
                        };
                    }

                    if (lineToProcess.IndexOf("Battalion Groups of ") != -1)
                    {
                        bArmyFound = true;
                        army.State = lineToProcess.Replace("Battalion Groups of ", "").Trim();
                        lineLocation += 2;
                        lineToProcess = lineList[lineLocation].ToString();
                    }
                }

                if (!bArmyFound || bArmyProcessed)
                {
                    continue;
                }

                if (!int.TryParse(lineToProcess.Substring(0, 3), out dummyValue))
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
                    batGroups.Add(ProcessSimBattalionGroup(batGroupStr));
                }
            }

            return lineLocation;
        }

        private BattalionGroup ProcessSimBattalionGroup(string battalionGroupStr)
        {
            var battalions = new Battalion[4];
            var batGroup = new BattalionGroup
            {
                Federation = int.Parse(battalionGroupStr.Substring(0, 3)),
                Type = battalionGroupStr.Substring(5, 2),
                TotalEF = decimal.Parse(battalionGroupStr.Replace(",", ".").Substring(36, 4)),
                Dest0 = new VmCoordinate(),
                Dest1 = new VmCoordinate(),
                Dest2 = new VmCoordinate(),
                StartAttack = 0,
                Battalions = battalions,
                Formation = 1
            };

            batGroup.BattGroup = batGroup.Federation <= 110 ? batGroup.Federation : 0;
            for (var bt = 0; bt <= 3; bt++)
            {
                battalions[bt] = ProcessSimBattalion(battalionGroupStr.Substring(8 + (7 * bt), 6));
            }

            batGroup.TotalSize = battalions.Sum(x => x.size);
            var noBatsNotEmpty = battalions.Count(x => x.size > 0);
            batGroup.PercentMaxSize = decimal.Round((batGroup.TotalSize / (noBatsNotEmpty * 800M)) * 100, 0);
            return batGroup;
        }

        private Battalion ProcessSimBattalion(string battalionStr)
        {
            var newBattalion = new Battalion();
            var effect = battalionStr.Substring(0, 2);
            if (effect.IndexOf("-") == -1)
            {
                newBattalion.EF = short.Parse(effect);
                newBattalion.size = short.Parse(battalionStr.Substring(3, 3));
            }

            return newBattalion;
        }

        private int LoadSimBattleMap(ArrayList lineList, SimBattleVm simBattleVm, int lineLocation)
        {
            var simBattleMap = new VmMapCoordinate[41][];
            var bSimMapFound = false;
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

                if (!bSimMapFound)
                {
                    continue;
                }

                if (y > 40)
                {
                    break;
                }

                var lineToProcess = lineList[lineLocation].ToString();
                var lineCoords = new VmMapCoordinate[46];
                for (x = 0; x <= 45 && y <= 40; x++)
                {
                    var coord = new VmMapCoordinate { X = x, Y = y };
                    if (x > 0 && y > 0)
                    {
                        coord.Terrain = lineToProcess.Substring(x * 3 + 3, 1);
                        coord.Height = short.Parse(lineToProcess.Substring(x * 3 + 4, 1));
                    }

                    lineCoords[x] = coord;
                }

                simBattleMap[y] = lineCoords;
                y = y + 1;
            }

            return lineLocation;
        }

        private ArrayList LoadTurnFile(string filePath)
        {
            var objReader = new StreamReader(filePath);
            string sLine = "";
            var arrText = new ArrayList();
            arrText.Add("");
            while (sLine != null)
            {
                sLine = objReader.ReadLine();
                if (sLine != null)
                {
                    arrText.Add(sLine);
                }
            }

            objReader.Close();
            return arrText;
        }
    }
}
