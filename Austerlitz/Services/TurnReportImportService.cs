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
                SaveTurnHeaderDetails(lineList, auDB, turnId);
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
                lineLocation = LoadSeaBattles(lineList, lineLocation, auDB, turnId);


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
                    string state;
                    if (!TurnReportImportParsingUtils.TryGetStateLetter(stateName, out state))
                    {
                        state = GetStateLetterFromCompactHeader(lineList, lineLocation, gameNo);
                    }
                    if (string.IsNullOrWhiteSpace(state))
                    {
                        continue;
                    }

                    var monthLine = lineList[nextContentLine].ToString();
                    var monthMatch = Regex.Match(monthLine, @"Month:\s*(?<month>[A-Za-z]{3})[A-Za-z]*\s+(?<year>\d{4})");
                    if (!monthMatch.Success)
                    {
                        continue;
                    }

                    var month = monthMatch.Groups["month"].Value;
                    var year = monthMatch.Groups["year"].Value;
                    var turnId = gameNo + state + month + year;

                    var existingTurn = auDB.TS_00TurnDetails.FirstOrDefault(x => x.TurnId == turnId);
                    if (existingTurn == null)
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

        private static void SaveTurnHeaderDetails(ArrayList lineList, AusterlitzDbContext auDB, string turnId)
        {
            if (lineList == null || auDB == null || string.IsNullOrWhiteSpace(turnId))
            {
                return;
            }

            var turnHeader = ExtractTurnHeaderValues(lineList);
            var turnDetails = auDB.TS_00TurnDetails.FirstOrDefault(x => x.TurnId == turnId);
            if (turnDetails == null)
            {
                return;
            }

            if (!string.IsNullOrWhiteSpace(turnHeader.GameNo))
            {
                turnDetails.GameNo = turnHeader.GameNo;
            }
            else if (string.IsNullOrWhiteSpace(turnDetails.GameNo) && turnId.Length >= 3)
            {
                turnDetails.GameNo = turnId.Substring(0, 3);
            }

            if (!string.IsNullOrWhiteSpace(turnHeader.State))
            {
                turnDetails.State = turnHeader.State;
            }
            else if (string.IsNullOrWhiteSpace(turnDetails.State) && turnId.Length >= 4)
            {
                turnDetails.State = turnId.Substring(3, 1);
            }

            if (!string.IsNullOrWhiteSpace(turnHeader.AccountNo))
            {
                turnDetails.AccountNo = turnHeader.AccountNo;
            }

            if (!string.IsNullOrWhiteSpace(turnHeader.PlayerName))
            {
                turnDetails.PlayerName = turnHeader.PlayerName;
            }

            if (turnHeader.ProcessDate.HasValue)
            {
                turnDetails.ProcessDate = turnHeader.ProcessDate.Value;
            }

            auDB.SaveChanges();
        }

        private static TurnHeaderValues ExtractTurnHeaderValues(ArrayList lineList)
        {
            var result = new TurnHeaderValues();
            if (lineList == null || lineList.Count == 0)
            {
                return result;
            }

            var gameHeaderLineIndex = -1;
            for (var i = 0; i < lineList.Count; i++)
            {
                var line = (lineList[i] ?? string.Empty).ToString();
                if (line.IndexOf("AUSTERLITZ   Game:", StringComparison.Ordinal) != -1)
                {
                    gameHeaderLineIndex = i;
                    var gameMatch = Regex.Match(line, @"Game:\s*AU-(?<gameNo>\d{3})(?<state>.*)$");
                    if (gameMatch.Success)
                    {
                        result.GameNo = gameMatch.Groups["gameNo"].Value;
                        string stateLetter;
                        if (TurnReportImportParsingUtils.TryGetStateLetter(gameMatch.Groups["state"].Value.Trim(), out stateLetter))
                        {
                            result.State = stateLetter;
                        }
                    }
                    break;
                }
            }

            if (string.IsNullOrWhiteSpace(result.State))
            {
                result.State = GetStateLetterFromCompactHeader(lineList, gameHeaderLineIndex >= 0 ? gameHeaderLineIndex : 0, result.GameNo);
            }

            var accountRegex = new Regex(@"ACCOUNT:\s*(?<account>\d+)", RegexOptions.IgnoreCase);
            var playerRegex = new Regex(@"^\s*(?:Mr|Mrs|Miss|Ms|Dr)\.?\s+(?<name>[^@]+?)\.?\s*$", RegexOptions.IgnoreCase);
            var processDateRegex = new Regex(@"Next turn due:\s*[A-Za-z]+\s+(?<day>\d{1,2})(?:ST|ND|RD|TH)\s+(?<month>[A-Za-z]+)", RegexOptions.IgnoreCase);

            for (var i = 0; i < lineList.Count; i++)
            {
                var line = (lineList[i] ?? string.Empty).ToString();

                if (string.IsNullOrWhiteSpace(result.AccountNo))
                {
                    var accountMatch = accountRegex.Match(line);
                    if (accountMatch.Success)
                    {
                        result.AccountNo = accountMatch.Groups["account"].Value;
                    }
                }

                if (string.IsNullOrWhiteSpace(result.PlayerName))
                {
                    var playerMatch = playerRegex.Match(line);
                    if (playerMatch.Success)
                    {
                        result.PlayerName = playerMatch.Groups["name"].Value.Trim();
                    }
                }

                if (!result.ProcessDate.HasValue)
                {
                    var processDateMatch = processDateRegex.Match(line);
                    if (processDateMatch.Success)
                    {
                        result.ProcessDate = BuildProcessDate(processDateMatch.Groups["day"].Value, processDateMatch.Groups["month"].Value);
                    }
                }
            }

            return result;
        }

        private static DateTime? BuildProcessDate(string dayText, string monthText)
        {
            int day;
            if (!int.TryParse(dayText, out day))
            {
                return null;
            }

            if (day < 1 || day > 31)
            {
                return null;
            }

            DateTime monthDate;
            var monthFormats = new[] { "MMMM", "MMM" };
            if (!DateTime.TryParseExact(monthText, monthFormats, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.AllowWhiteSpaces, out monthDate))
            {
                return null;
            }

            try
            {
                return new DateTime(2000, monthDate.Month, day);
            }
            catch
            {
                return null;
            }
        }

        private static string GetStateLetterFromCompactHeader(ArrayList lineList, int startIndex, string gameNo)
        {
            if (lineList == null || lineList.Count == 0)
            {
                return null;
            }

            var endIndex = Math.Min(lineList.Count - 1, Math.Max(startIndex + 40, 40));
            var compactHeaderRegex = string.IsNullOrWhiteSpace(gameNo)
                ? new Regex(@"\bAU\s*\d{3}\s*(?<state>[A-Z])\b", RegexOptions.IgnoreCase)
                : new Regex(@"\bAU\s*" + Regex.Escape(gameNo) + @"\s*(?<state>[A-Z])\b", RegexOptions.IgnoreCase);

            for (var i = Math.Max(startIndex, 0); i <= endIndex; i++)
            {
                var line = (lineList[i] ?? string.Empty).ToString();
                var compactMatch = compactHeaderRegex.Match(line);
                if (compactMatch.Success)
                {
                    return compactMatch.Groups["state"].Value.Trim().ToUpperInvariant();
                }
            }

            return null;
        }

        private sealed class TurnHeaderValues
        {
            public string State { get; set; }
            public string GameNo { get; set; }
            public string PlayerName { get; set; }
            public string AccountNo { get; set; }
            public DateTime? ProcessDate { get; set; }
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
