using Austerlitz.DAL;
using Austerlitz.DAL.Management;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Austerlitz.Domain
{
    //public partial class TurnSheetManager<T> where T: class, ITurnSheetEntity
    //{
    //    public T[] PostTSRecords(T[] tsPostedRecords)
    //    {
    //        using (var dataContext = new AusterlitzDbContext())
    //        {
    //            var listRepository = new TurnSheetRepository<T>(dataContext);
    //            var result = listRepository.SaveRange(tsPostedRecords);
    //            return result.ToArray();
    //        }
    //    }
    //}

    public partial class TurnSheetManager
    {
        public TS_00TurnDetails[] GetAllTurnsList()
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_00TurnDetails>(dataContext);
                var tsItems = listRepository.Get().Where(x => x != null && !string.IsNullOrWhiteSpace(x.TurnId));

                var orderedItems = tsItems
                    .OrderByDescending(GetGameSortKey)
                    .ThenByDescending(GetTurnSortKey)
                    .ThenBy(x => GetStateCode(x))
                    .ToArray();

                return orderedItems;
            }
        }

        private string GetGameNo(TS_00TurnDetails turn)
        {
            if (turn == null)
            {
                return string.Empty;
            }

            if (!string.IsNullOrWhiteSpace(turn.GameNo))
            {
                return turn.GameNo.Trim();
            }

            return !string.IsNullOrWhiteSpace(turn.TurnId) && turn.TurnId.Length >= 3
                ? turn.TurnId.Substring(0, 3)
                : string.Empty;
        }

        private string GetStateCode(TS_00TurnDetails turn)
        {
            if (turn == null)
            {
                return string.Empty;
            }

            if (!string.IsNullOrWhiteSpace(turn.State))
            {
                return turn.State.Trim();
            }

            return !string.IsNullOrWhiteSpace(turn.TurnId) && turn.TurnId.Length >= 4
                ? turn.TurnId.Substring(3, 1)
                : string.Empty;
        }

        private int GetGameSortKey(TS_00TurnDetails turn)
        {
            var gameNo = GetGameNo(turn);
            int parsed;
            return int.TryParse(gameNo, out parsed) ? parsed : 0;
        }

        private int GetTurnSortKey(TS_00TurnDetails turn)
        {
            if (turn == null)
            {
                return 0;
            }

            var year = turn.Year ?? GetYearFromTurnId(turn.TurnId);
            var monthNo = GetMonthNumber(!string.IsNullOrWhiteSpace(turn.Month) ? turn.Month : GetMonthFromTurnId(turn.TurnId));
            return (year * 100) + monthNo;
        }

        private int GetYearFromTurnId(string turnId)
        {
            if (string.IsNullOrWhiteSpace(turnId) || turnId.Length < 8)
            {
                return 0;
            }

            int year;
            return int.TryParse(turnId.Substring(turnId.Length - 4), out year) ? year : 0;
        }

        private string GetMonthFromTurnId(string turnId)
        {
            if (string.IsNullOrWhiteSpace(turnId) || turnId.Length < 8)
            {
                return string.Empty;
            }

            return turnId.Substring(4, turnId.Length - 8);
        }

        private int GetMonthNumber(string month)
        {
            switch (month.Trim().ToUpper())
            {
                case "JAN": return 1;
                case "FEB": return 2;
                case "MAR": return 3;
                case "APR": return 4;
                case "MAY": return 5;
                case "JUN": return 6;
                case "JUL": return 7;
                case "AUG": return 8;
                case "SEP": return 9;
                case "OCT": return 10;
                case "NOV": return 11;
                case "DEC": return 12;
                default: return 0;
            }
        }

        private const int Ts01MaxRows = 10;
        private const int Ts02MaxRows = 6;
        private const int Ts03MaxRows = 8;
        private const int Ts04MaxRows = 6;
        private const int Ts05MaxRows = 12;
        private const int Ts06MaxRows = 16;
        private const int Ts07MaxRows = 4;
        private const int Ts08MaxRows = 8;
        private const int Ts09MaxRows = 6;
        private const int Ts10MaxRows = 8;
        private const int Ts11MaxRows = 4;
        private const int Ts12MaxRows = 7;
        private const int Ts13MaxRows = 10;
        private const int Ts14MaxRows = 21;
        private const int Ts15MaxRows = 5;
        private const int Ts16MaxRows = 3;
        private const int Ts17MaxRows = 18;
        private const int Ts18MaxRows = 30;
        private const int Ts19MaxRows = 18;
        private const int Ts20MaxRows = 16;
        private const int Ts21MaxRows = 6;
        private const int Ts22MaxRows = 4;
        private const int Ts23MaxRows = 4;

        private T[] SaveSectionRows<T>(T[] tsPostedRecords, int maxRows, string sectionCode) where T : class, ITurnSheetEntity, new()
        {
            ValidateTurnSheetRows(tsPostedRecords, maxRows, sectionCode);

            using (var dataContext = new AusterlitzDbContext())
            {
                var turnId = tsPostedRecords[0].TurnId;
                EnsureSectionRows<T>(dataContext, turnId, maxRows);
                dataContext.SaveChanges();

                var listRepository = new TurnSheetRepository<T>(dataContext);
                var result = listRepository.SaveRange(tsPostedRecords).OrderBy(x => x.OrderNo);
                return result.ToArray();
            }
        }

        private void ValidateTurnSheetRows<T>(T[] tsPostedRecords, int maxRows, string sectionCode) where T : class, ITurnSheetEntity
        {
            if (tsPostedRecords == null || tsPostedRecords.Length == 0)
            {
                throw new ArgumentException(sectionCode + " rows are required.", nameof(tsPostedRecords));
            }

            if (tsPostedRecords.Any(x => x == null))
            {
                throw new ArgumentException(sectionCode + " rows cannot contain null entries.", nameof(tsPostedRecords));
            }

            var turnId = tsPostedRecords[0].TurnId;
            if (string.IsNullOrWhiteSpace(turnId))
            {
                throw new ArgumentException(sectionCode + " TurnId is required.", nameof(tsPostedRecords));
            }

            if (tsPostedRecords.Any(x => string.IsNullOrWhiteSpace(x.TurnId) || !string.Equals(x.TurnId, turnId, StringComparison.OrdinalIgnoreCase)))
            {
                throw new ArgumentException(sectionCode + " rows must all use the same TurnId.", nameof(tsPostedRecords));
            }

            if (tsPostedRecords.Any(x => x.OrderNo < 1 || x.OrderNo > maxRows))
            {
                throw new ArgumentException(sectionCode + " OrderNo must be between 1 and " + maxRows + ".", nameof(tsPostedRecords));
            }

            if (tsPostedRecords.GroupBy(x => x.OrderNo).Any(g => g.Count() > 1))
            {
                throw new ArgumentException(sectionCode + " rows cannot contain duplicate OrderNo values.", nameof(tsPostedRecords));
            }
        }
    }
}
