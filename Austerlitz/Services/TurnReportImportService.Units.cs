using Austerlitz.DAL;
using Austerlitz.Models;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;

namespace Austerlitz.Services
{
    public partial class TurnReportImportService
    {
        private int LoadCommanders(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                bool sectionFound;
                var commanders = ParseCommanders(lineList, ref lineLocation, turnId, out sectionFound);
                if (!sectionFound)
                {
                    return lineLocation;
                }

                var existingRecords = auDB.TR_Commanders.Where(x => x.TurnId == turnId);
                auDB.TR_Commanders.RemoveRange(existingRecords);
                auDB.TR_Commanders.AddRange(commanders);
                auDB.SaveChanges();
                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadCommanders: " + ex.Message, ex);
            }
        }

        private static List<TR_Commanders> ParseCommanders(ArrayList lineList, ref int lineLocation, string turnId, out bool sectionFound)
        {
            var commanders = new List<TR_Commanders>();
            sectionFound = false;

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                var lineToProcess = lineList[lineLocation].ToString();
                if (lineToProcess.IndexOf("Commander") != -1)
                {
                    sectionFound = true;
                    lineLocation += 2;
                    lineToProcess = lineList[lineLocation].ToString();
                }

                if (!sectionFound)
                {
                    continue;
                }

                if (lineToProcess.IndexOf("Pay") != -1)
                {
                    break;
                }

                // The commander table prints two commanders per report line, side by side.
                commanders.Add(ParseCommanderColumn(lineToProcess, 0, turnId));
                if (lineToProcess.Length > 65)
                {
                    commanders.Add(ParseCommanderColumn(lineToProcess, 63, turnId));
                }
            }

            return commanders;
        }

        private static TR_Commanders ParseCommanderColumn(string lineToProcess, int offset, string turnId)
        {
            var commander = new TR_Commanders
            {
                TurnId = turnId,
                ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 0, 2),
                Rank = lineToProcess.Substring(offset + 4, 14),
                Name = lineToProcess.Substring(offset + 20, 15),
                Federation = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 48, 2),
                MP = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 51, 2),
                CommandCapacity = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 55, 2)
            };

            if (lineToProcess.Substring(offset + 43, 4) == "----")
            {
                commander.X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 37, 2);
                commander.Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 40, 2);
            }
            else
            {
                commander.Boarded = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 43, 4);
            }

            return commander;
        }

        private int LoadBrigades(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                bool sectionFound;
                var brigades = ParseBrigades(lineList, ref lineLocation, turnId, out sectionFound);
                if (!sectionFound)
                {
                    return lineLocation;
                }

                var existingBrigades = auDB.TR_Brigades.Where(x => x.TurnId == turnId);
                auDB.TR_Brigades.RemoveRange(existingBrigades);
                auDB.TR_Brigades.AddRange(brigades);
                auDB.SaveChanges();
                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadBrigades: " + ex.Message, ex);
            }
        }

        private static List<TR_Brigades> ParseBrigades(ArrayList lineList, ref int lineLocation, string turnId, out bool sectionFound)
        {
            var brigades = new List<TR_Brigades>();
            sectionFound = false;

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                var lineToProcess = lineList[lineLocation].ToString();

                // The brigades section spans multiple pages; every page repeats the
                // "Brigades" header, and each header is followed by two layout lines.
                if (lineToProcess.IndexOf("Brigades") != -1)
                {
                    sectionFound = true;
                    lineLocation += 2;
                    lineToProcess = lineList[lineLocation].ToString();
                }

                if (!sectionFound)
                {
                    continue;
                }

                if (lineToProcess.IndexOf("Pay:") != -1)
                {
                    break;
                }

                brigades.Add(new TR_Brigades
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
                });
            }

            return brigades;
        }

        private int LoadWarships(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                var originalLineLocation = lineLocation;
                bool sectionFound;
                var warships = ParseWarships(lineList, ref lineLocation, turnId, out sectionFound);
                if (!sectionFound)
                {
                    return originalLineLocation;
                }

                var existingRecords = auDB.TR_Warships.Where(x => x.TurnId == turnId);
                auDB.TR_Warships.RemoveRange(existingRecords);
                auDB.TR_Warships.AddRange(warships);
                auDB.SaveChanges();
                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadWarships: " + ex.Message, ex);
            }
        }

        private static List<TR_Warships> ParseWarships(ArrayList lineList, ref int lineLocation, string turnId, out bool sectionFound)
        {
            var warships = new List<TR_Warships>();
            sectionFound = false;

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                var lineToProcess = lineList[lineLocation].ToString();
                if (lineToProcess.IndexOf("Warships") != -1)
                {
                    sectionFound = true;
                    lineLocation += 2;
                    lineToProcess = lineList[lineLocation].ToString();
                }

                if (!sectionFound)
                {
                    continue;
                }

                if (lineToProcess.IndexOf("Merchant Ships") != -1)
                {
                    break;
                }

                // The warship table prints two warships per report line, side by side.
                warships.Add(ParseWarshipColumn(lineToProcess, 0, turnId));
                if (lineToProcess.Length > 69)
                {
                    warships.Add(ParseWarshipColumn(lineToProcess, 69, turnId));
                }
            }

            return warships;
        }

        private static TR_Warships ParseWarshipColumn(string lineToProcess, int offset, string turnId)
        {
            return new TR_Warships
            {
                TurnId = turnId,
                ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 0, 4),
                Type = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 6, 2),
                Name = lineToProcess.Substring(offset + 10, 15),
                X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 26, 2),
                Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 29, 2),
                FleetNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 32, 2),
                MP = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 35, 2),
                Condition = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 38, 3),
                Age = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 44, 2),
                Marines = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 47, 4),
                Brigade1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 52, 4),
                Brigade2 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 57, 4)
            };
        }

        private int LoadMerchantShips(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                bool sectionFound;
                var merchantShips = ParseMerchantShips(lineList, ref lineLocation, turnId, out sectionFound);
                if (!sectionFound)
                {
                    return lineLocation;
                }

                var existingRecords = auDB.TR_MerchantShips.Where(x => x.TurnId == turnId);
                auDB.TR_MerchantShips.RemoveRange(existingRecords);
                auDB.TR_MerchantShips.AddRange(merchantShips);
                auDB.SaveChanges();
                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadMerchantShips: " + ex.Message, ex);
            }
        }

        private static List<TR_MerchantShips> ParseMerchantShips(ArrayList lineList, ref int lineLocation, string turnId, out bool sectionFound)
        {
            var merchantShips = new List<TR_MerchantShips>();
            sectionFound = false;

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                var lineToProcess = lineList[lineLocation].ToString();
                if (lineToProcess.IndexOf("Merchant Ships") != -1)
                {
                    sectionFound = true;
                    lineLocation += 2;
                    lineToProcess = lineList[lineLocation].ToString();
                }

                if (!sectionFound)
                {
                    continue;
                }

                if (lineToProcess.IndexOf("Maintenance costs") != -1)
                {
                    break;
                }

                // The merchant ship table prints two ships per report line, side by side.
                merchantShips.Add(ParseMerchantShipColumn(lineToProcess, 0, turnId));
                if (lineToProcess.Length > 69)
                {
                    merchantShips.Add(ParseMerchantShipColumn(lineToProcess, 70, turnId));
                }
            }

            return merchantShips;
        }

        private static TR_MerchantShips ParseMerchantShipColumn(string lineToProcess, int offset, string turnId)
        {
            // NOTE: Quantity1 is read from the position after Goods2 and Quantity2 is
            // never populated. This mirrors the original import logic exactly; if the
            // Quantity2 column is ever needed it will need a deliberate fix here.
            return new TR_MerchantShips
            {
                TurnId = turnId,
                ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 0, 4),
                Type = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 6, 2),
                X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 9, 2),
                Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 12, 2),
                FleetNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 15, 2),
                MP = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 18, 2),
                Condition = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 21, 3),
                Age = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 27, 2),
                Goods1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 32, 2),
                Quantity1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 46, 5),
                Goods2 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 43, 2),
                Money = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 52, 9)
            };
        }

        private int LoadBaggageTrains(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                bool sectionFound;
                var baggageTrains = ParseBaggageTrains(lineList, ref lineLocation, turnId, out sectionFound);
                if (!sectionFound)
                {
                    return lineLocation;
                }

                var existingRecords = auDB.TR_BaggageTrains.Where(x => x.TurnId == turnId);
                auDB.TR_BaggageTrains.RemoveRange(existingRecords);
                auDB.TR_BaggageTrains.AddRange(baggageTrains);
                auDB.SaveChanges();
                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadBaggageTrains: " + ex.Message, ex);
            }
        }

        private static List<TR_BaggageTrains> ParseBaggageTrains(ArrayList lineList, ref int lineLocation, string turnId, out bool sectionFound)
        {
            var baggageTrains = new List<TR_BaggageTrains>();
            sectionFound = false;

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                var lineToProcess = lineList[lineLocation].ToString();
                if (lineToProcess.IndexOf("Baggage Trains") != -1)
                {
                    sectionFound = true;
                    lineLocation += 2;
                    lineToProcess = lineList[lineLocation].ToString();
                }

                if (!sectionFound)
                {
                    continue;
                }

                if (lineToProcess.IndexOf("Spies") != -1)
                {
                    break;
                }

                // The baggage train table prints two trains per report line, side by side.
                baggageTrains.Add(ParseBaggageTrainColumn(lineToProcess, 0, turnId));
                if (lineToProcess.Length > 69)
                {
                    baggageTrains.Add(ParseBaggageTrainColumn(lineToProcess, 68, turnId));
                }
            }

            return baggageTrains;
        }

        private static TR_BaggageTrains ParseBaggageTrainColumn(string lineToProcess, int offset, string turnId)
        {
            return new TR_BaggageTrains
            {
                TurnId = turnId,
                ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 0, 4),
                X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 5, 2),
                Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 8, 2),
                FederationNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 11, 2),
                MP = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 14, 2),
                Condition = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 17, 3),
                Goods1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 25, 2),
                Quantity1 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 28, 5),
                Goods2 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 37, 2),
                Quantity2 = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 40, 5),
                Money = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, offset + 46, 10)
            };
        }

        private int LoadSpies(ArrayList lineList, int lineLocation, AusterlitzDbContext auDB, string turnId)
        {
            try
            {
                bool sectionFound;
                var spies = ParseSpies(lineList, ref lineLocation, turnId, out sectionFound);
                if (!sectionFound)
                {
                    return lineLocation;
                }

                var existingRecords = auDB.TR_Spies.Where(x => x.TurnId == turnId);
                auDB.TR_Spies.RemoveRange(existingRecords);
                auDB.TR_Spies.AddRange(spies);
                auDB.SaveChanges();
                return lineLocation;
            }
            catch (Exception ex)
            {
                throw new Exception("loadSpies: " + ex.Message, ex);
            }
        }

        private static List<TR_Spies> ParseSpies(ArrayList lineList, ref int lineLocation, string turnId, out bool sectionFound)
        {
            var spies = new List<TR_Spies>();
            sectionFound = false;

            for (; lineLocation < lineList.Count; lineLocation++)
            {
                var lineToProcess = lineList[lineLocation].ToString();

                // The spies section spans multiple pages; every page repeats the
                // "Spies" header, and each header is followed by two layout lines.
                if (lineToProcess.IndexOf("Spies") != -1)
                {
                    sectionFound = true;
                    lineLocation += 2;
                    lineToProcess = lineList[lineLocation].ToString();
                }

                if (!sectionFound)
                {
                    continue;
                }

                if (lineToProcess.IndexOf("Relationship of") != -1 || lineToProcess.IndexOf("Army positions") != -1)
                {
                    break;
                }

                var spy = new TR_Spies
                {
                    TurnId = turnId,
                    ItemNo = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 1, 2),
                    X = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 4, 2),
                    Y = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 7, 2),
                    Report = lineToProcess.Substring(16, 107)
                };

                if (lineToProcess.Substring(10, 4) != "----")
                {
                    spy.Boarded = TurnReportImportParsingUtils.ParseTurnInt(lineToProcess, 10, 4);
                }

                spies.Add(spy);
            }

            return spies;
        }
    }
}
