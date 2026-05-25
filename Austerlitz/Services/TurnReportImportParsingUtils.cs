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
                case "Ottoman Empire":
                    return "T";
                case "Confederation of Rhine":
                    return "B";
                case "Great Britain":
                    return "G";
                default:
                    return "E";
            }
        }
    }
}
