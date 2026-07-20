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
        public string LoadTurnReport(string filePath)
        {
            try
            {
                var auDB = new AusterlitzDbContext();
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
                lineLocation = LoadArmyPositions(lineList, lineLocation, auDB, turnId);
                lineLocation = LoadEpidemics(lineList, lineLocation, auDB, turnId);
                lineLocation = LoadStateRelationships(lineList, lineLocation, auDB, turnId);
                lineLocation = LoadTradingPortsAndCities(lineList, lineLocation, auDB, turnId);
                lineLocation = LoadMathBattles(lineList, lineLocation, auDB, turnId);


                lineLocation = LoadTRMap(lineList, lineLocation, auDB, turnId);
                SaveEconomySummary(lineList, auDB, turnId);
                SaveTurnOrderErrors(lineList, auDB, turnId);
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
                for (; lineLocation < lineList.Count; lineLocation++)
                {
                    var lineToProcess = lineList[lineLocation].ToString();
                    if (lineToProcess.IndexOf("AUSTERLITZ   Game:", StringComparison.Ordinal) == -1)
                    {
                        continue;
                    }

                    var gameMatch = Regex.Match(lineToProcess, @"Game:\s*AU-(?<gameNo>\d{3})(?<state>.*)$");
                    if (!gameMatch.Success)
                    {
                        continue;
                    }

                    var nextContentLine = MoveToNextLine(lineList, lineLocation + 1, x => !string.IsNullOrWhiteSpace(x));
                    if (nextContentLine < 0 || nextContentLine >= lineList.Count)
                    {
                        continue;
                    }

                    var gameNo = gameMatch.Groups["gameNo"].Value;
                    var stateName = gameMatch.Groups["state"].Value.Trim();
                    var state = TurnReportImportParsingUtils.GetStateLetter(stateName);

                    var monthLine = lineList[nextContentLine].ToString();
                    var monthMatch = Regex.Match(monthLine, @"Month:\s*(?<month>[A-Za-z]{3})[A-Za-z]*\s+(?<year>\d{4})");
                    if (!monthMatch.Success)
                    {
                        continue;
                    }

                    var month = monthMatch.Groups["month"].Value;
                    var year = monthMatch.Groups["year"].Value;
                    var turnId = gameNo + state + month + year;

                    var existingTurn = auDB.TS_00TurnDetails.Where(x => x.TurnId == turnId);
                    if (existingTurn.Count() == 0)
                    {
                        var newTurn = new TS_00TurnDetails { TurnId = turnId };
                        auDB.TS_00TurnDetails.Add(newTurn);
                        auDB.SaveChanges();

                        var turnSheetManager = new Austerlitz.Domain.TurnSheetManager();
                        turnSheetManager.EnsureAllTurnsheetSectionsSeeded(turnId);
                    }

                    return turnId;
                }

                throw new Exception("Unable to locate a valid turn header in imported file.");
            }
            catch (Exception ex)
            {
                throw new Exception("getTurnId: " + ex.Message, ex);
            }
        }

        private static int MoveToNextLine(ArrayList lineList, int start, Func<string, bool> predicate)
        {
            for (var i = start; i < lineList.Count; i++)
            {
                if (predicate(lineList[i].ToString()))
                {
                    return i;
                }
            }

            return -1;
        }

        private static int ParseTrailingInt(string text)
        {
            var match = Regex.Match(text, @"(\d+)\s*$");
            return match.Success ? ParseDigitsToInt(match.Groups[1].Value) : 0;
        }

        private static int ParseDigitsToInt(string text)
        {
            var digits = new string(text.Where(char.IsDigit).ToArray());
            if (string.IsNullOrWhiteSpace(digits))
            {
                return 0;
            }

            return int.Parse(digits);
        }

        private static string Truncate(string value, int maxLength)
        {
            if (string.IsNullOrEmpty(value))
            {
                return value;
            }

            return value.Length <= maxLength ? value : value.Substring(0, maxLength);
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
