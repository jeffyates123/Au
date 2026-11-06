using System;

namespace Austerlitz.Services
{
    public static class TurnReportImportParsingUtils
    {
        public static int? ParseTurnIntNullable(string lineToProcess, int startLocation, int length)
        {
            try
            {
                var stringToParse = lineToProcess.Substring(startLocation, length);
                if (stringToParse.IndexOf("-") != -1)
                {
                    return null;
                }

                return int.Parse(stringToParse);
            }
            catch (Exception ex)
            {
                throw new Exception("parseTurnIntNullable: " + ex.Message, ex);
            }
        }

        public static int ParseTurnInt(string stringToProcess, int startLocation, int length)
        {
            try
            {
                return int.Parse(stringToProcess.Substring(startLocation, length));
            }
            catch (Exception ex)
            {
                throw new Exception("parseTurnInt: " + ex.Message, ex);
            }
        }

        public static string GetStateLetter(string stateName)
        {
            switch (stateName)
            {
                case "Austria":
                case "Austria-Hungary":
                    return "A";
                case "Conf. of the Rhine":
                case "Confederation of Rhine":
                case "Confederation of the Rhine":
                    return "B";
                case "Denmark":
                    return "D";
                case "Spain":
                    return "E";
                case "France":
                    return "F";
                case "Great Britain":
                    return "G";
                case "Holland":
                    return "H";
                case "Italy":
                    return "I";
                case "Portugal":
                case "Kingdom of Portugal":
                    return "K";
                case "Morocco":
                    return "M";
                case "Naples":
                    return "N";
                case "Prussia":
                    return "P";
                case "Russia":
                    return "R";
                case "Sweden":
                    return "S";
                case "Ottoman Empire":
                    return "T";
                case "Warsaw":
                case "Duchy of Warsaw":
                    return "W";
                default:
                    return "E";
            }
        }

        public static bool TryGetStateLetter(string stateName, out string stateLetter)
        {
            if (string.IsNullOrWhiteSpace(stateName))
            {
                stateLetter = null;
                return false;
            }

            switch (stateName.Trim())
            {
                case "Austria":
                case "Austria-Hungary":
                    stateLetter = "A";
                    return true;
                case "Conf. of the Rhine":
                case "Confederation of Rhine":
                case "Confederation of the Rhine":
                    stateLetter = "B";
                    return true;
                case "Denmark":
                    stateLetter = "D";
                    return true;
                case "Spain":
                    stateLetter = "E";
                    return true;
                case "France":
                    stateLetter = "F";
                    return true;
                case "Great Britain":
                    stateLetter = "G";
                    return true;
                case "Holland":
                    stateLetter = "H";
                    return true;
                case "Italy":
                    stateLetter = "I";
                    return true;
                case "Portugal":
                case "Kingdom of Portugal":
                    stateLetter = "K";
                    return true;
                case "Morocco":
                    stateLetter = "M";
                    return true;
                case "Naples":
                    stateLetter = "N";
                    return true;
                case "Prussia":
                    stateLetter = "P";
                    return true;
                case "Russia":
                    stateLetter = "R";
                    return true;
                case "Sweden":
                    stateLetter = "S";
                    return true;
                case "Ottoman Empire":
                    stateLetter = "T";
                    return true;
                case "Warsaw":
                case "Duchy of Warsaw":
                    stateLetter = "W";
                    return true;
                default:
                    stateLetter = null;
                    return false;
            }
        }
    }
}
