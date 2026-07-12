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

        public TS_00TurnDetails[] GetTSTurnDetails(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_00TurnDetails>(dataContext);
                var tsItems = listRepository.GetItems(x => x.TurnId == turnId);

                if (tsItems.Count() == 0)
                {
                    var newItems = new TS_00TurnDetails[1];

                    for (var itemCount = 1; itemCount <= newItems.Count(); itemCount++)
                    {
                        TS_00TurnDetails item = new TS_00TurnDetails() { TurnId = turnId};
                        newItems[itemCount - 1] = item;
                    }

                    listRepository.InsertRange(newItems);
                    dataContext.SaveChanges();
                    tsItems = listRepository.GetItems(x => x.TurnId == turnId);
                }
                return tsItems.ToArray();
            }
        }

        public TS_01TransferGoods[] GetTSTransferGoods(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_01TransferGoods>(dataContext);
                var tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);

                if (tsItems.Count() == 0)
                {
                    var newItems = new TS_01TransferGoods[10];

                    for (var itemCount = 1; itemCount <= newItems.Count(); itemCount++)
                    {
                        TS_01TransferGoods item = new TS_01TransferGoods() { TurnId = turnId, OrderNo = itemCount };
                        newItems[itemCount - 1] = item;
                    }

                    listRepository.InsertRange(newItems);
                    dataContext.SaveChanges();
                    tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);
                }
                return tsItems.ToArray();
            }
        }

        public TS_02DemolishItems[] GetTSDemolishItems(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_02DemolishItems>(dataContext);
                var tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);

                if (tsItems.Count() == 0)
                {
                    var newItems = new TS_02DemolishItems[6];

                    for (var itemCount = 1; itemCount <= newItems.Count(); itemCount++)
                    {
                        TS_02DemolishItems item = new TS_02DemolishItems() { TurnId = turnId, OrderNo = itemCount };
                        newItems[itemCount - 1] = item;
                    }

                    listRepository.InsertRange(newItems);
                    dataContext.SaveChanges();
                    tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);
                }
                return tsItems.ToArray();
            }
        }

        public TS_03SetUpBrigades[] GetTSSetUpBrigades(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_03SetUpBrigades>(dataContext);
                var tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);

                if (tsItems.Count() == 0)
                {
                    var newItems = new TS_03SetUpBrigades[8];

                    for (var itemCount = 1; itemCount <= newItems.Count(); itemCount++)
                    {
                        TS_03SetUpBrigades item = new TS_03SetUpBrigades() { TurnId = turnId, OrderNo = itemCount };
                        newItems[itemCount - 1] = item;
                    }

                    listRepository.InsertRange(newItems);
                    dataContext.SaveChanges();
                    tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);
                }
                return tsItems.ToArray();
            }
        }

        public TS_04SetUpAdditionalBrigades[] GetTSSetUpAdditionalBrigades(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_04SetUpAdditionalBrigades>(dataContext);
                var tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);

                if (tsItems.Count() == 0)
                {
                    var newItems = new TS_04SetUpAdditionalBrigades[6];

                    for (var itemCount = 1; itemCount <= newItems.Count(); itemCount++)
                    {
                        TS_04SetUpAdditionalBrigades item = new TS_04SetUpAdditionalBrigades() { TurnId = turnId, OrderNo = itemCount };
                        newItems[itemCount - 1] = item;
                    }

                    listRepository.InsertRange(newItems);
                    dataContext.SaveChanges();
                    tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);
                }
                return tsItems.ToArray();
            }
        }

        public TS_05IncreaseHeadcount[] GetTSIncreaseHeadcount(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_05IncreaseHeadcount>(dataContext);
                var tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);

                if (tsItems.Count() == 0)
                {
                    var newItems = new TS_05IncreaseHeadcount[12];

                    for (var itemCount = 1; itemCount <= newItems.Count(); itemCount++)
                    {
                        TS_05IncreaseHeadcount item = new TS_05IncreaseHeadcount() { TurnId = turnId, OrderNo = itemCount };
                        newItems[itemCount - 1] = item;
                    }

                    listRepository.InsertRange(newItems);
                    dataContext.SaveChanges();
                    tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);
                }
                return tsItems.ToArray();
            }
        }

        public TS_06IncreaseBrigadeXP[] GetTSIncreaseBrigadeXP(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_06IncreaseBrigadeXP>(dataContext);
                var tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);

                if (tsItems.Count() == 0)
                {
                    var newItems = new TS_06IncreaseBrigadeXP[16];

                    for (var itemCount = 1; itemCount <= newItems.Count(); itemCount++)
                    {
                        TS_06IncreaseBrigadeXP item = new TS_06IncreaseBrigadeXP() { TurnId = turnId, OrderNo = itemCount };
                        newItems[itemCount - 1] = item;
                    }

                    listRepository.InsertRange(newItems);
                    dataContext.SaveChanges();
                    tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);
                }
                return tsItems.ToArray();
            }
        }

        public TS_07ExchangeBattalions[] GetTSExchangeBattalions(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_07ExchangeBattalions>(dataContext);
                var tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);

                if (tsItems.Count() == 0)
                {
                    var newItems = new TS_07ExchangeBattalions[4];

                    for (var itemCount = 1; itemCount <= newItems.Count(); itemCount++)
                    {
                        TS_07ExchangeBattalions item = new TS_07ExchangeBattalions() { TurnId = turnId, OrderNo = itemCount };
                        newItems[itemCount - 1] = item;
                    }

                    listRepository.InsertRange(newItems);
                    dataContext.SaveChanges();
                    tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);
                }
                return tsItems.ToArray();
            }
        }

        public TS_08MergeBattalions[] GetTSMergeBattalions(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_08MergeBattalions>(dataContext);
                var tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);

                if (tsItems.Count() == 0)
                {
                    var newItems = new TS_08MergeBattalions[8];

                    for (var itemCount = 1; itemCount <= newItems.Count(); itemCount++)
                    {
                        TS_08MergeBattalions item = new TS_08MergeBattalions() { TurnId = turnId, OrderNo = itemCount };
                        newItems[itemCount - 1] = item;
                    }

                    listRepository.InsertRange(newItems);
                    dataContext.SaveChanges();
                    tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);
                }
                return tsItems.ToArray();
            }
        }

        public TS_09RepairShips_BaggageTrains[] GetTSRepairShips_BaggageTrains(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_09RepairShips_BaggageTrains>(dataContext);
                var tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);

                if (tsItems.Count() == 0)
                {
                    var newItems = new TS_09RepairShips_BaggageTrains[6];

                    for (var itemCount = 1; itemCount <= newItems.Count(); itemCount++)
                    {
                        TS_09RepairShips_BaggageTrains item = new TS_09RepairShips_BaggageTrains() { TurnId = turnId, OrderNo = itemCount };
                        newItems[itemCount - 1] = item;
                    }

                    listRepository.InsertRange(newItems);
                    dataContext.SaveChanges();
                    tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);
                }
                return tsItems.ToArray();
            }
        }

        public TS_10BuildShips[] GetTSBuildShips(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_10BuildShips>(dataContext);
                var tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);

                if (tsItems.Count() == 0)
                {
                    var newItems = new TS_10BuildShips[8];

                    for (var itemCount = 1; itemCount <= newItems.Count(); itemCount++)
                    {
                        TS_10BuildShips item = new TS_10BuildShips() { TurnId = turnId, OrderNo = itemCount };
                        newItems[itemCount - 1] = item;
                    }

                    listRepository.InsertRange(newItems);
                    dataContext.SaveChanges();
                    tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);
                }
                return tsItems.ToArray();
            }
        }

        public TS_11BuildBaggageTrain[] GetTSBuildBaggageTrain(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_11BuildBaggageTrain>(dataContext);
                var tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);

                if (tsItems.Count() == 0)
                {
                    var newItems = new TS_11BuildBaggageTrain[4];

                    for (var itemCount = 1; itemCount <= newItems.Count(); itemCount++)
                    {
                        TS_11BuildBaggageTrain item = new TS_11BuildBaggageTrain() { TurnId = turnId, OrderNo = itemCount };
                        newItems[itemCount - 1] = item;
                    }

                    listRepository.InsertRange(newItems);
                    dataContext.SaveChanges();
                    tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);
                }
                return tsItems.ToArray();
            }
        }

        public TS_12IncreasePopulationDensity[] GetTSIncreasePopulationDensity(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_12IncreasePopulationDensity>(dataContext);
                var tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);

                if (tsItems.Count() == 0)
                {
                    var newItems = new TS_12IncreasePopulationDensity[7];

                    for (var itemCount = 1; itemCount <= newItems.Count(); itemCount++)
                    {
                        TS_12IncreasePopulationDensity item = new TS_12IncreasePopulationDensity() { TurnId = turnId, OrderNo = itemCount };
                        newItems[itemCount - 1] = item;
                    }

                    listRepository.InsertRange(newItems);
                    dataContext.SaveChanges();
                    tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);
                }
                return tsItems.ToArray();
            }
        }

        public TS_13BuildProductionSites[] GetTSBuildProductionSites(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_13BuildProductionSites>(dataContext);
                var tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);

                if (tsItems.Count() == 0)
                {
                    var newItems = new TS_13BuildProductionSites[10];

                    for (var itemCount = 1; itemCount <= newItems.Count(); itemCount++)
                    {
                        TS_13BuildProductionSites item = new TS_13BuildProductionSites() { TurnId = turnId, OrderNo = itemCount };
                        newItems[itemCount - 1] = item;
                    }

                    listRepository.InsertRange(newItems);
                    dataContext.SaveChanges();
                    tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);
                }
                return tsItems.ToArray();
            }
        }

        public TS_14FormFederations[] GetTSFormFederations(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_14FormFederations>(dataContext);
                var tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);

                if (tsItems.Count() == 0)
                {
                    var newItems = new TS_14FormFederations[21];

                    for (var itemCount = 1; itemCount <= newItems.Count(); itemCount++)
                    {
                        TS_14FormFederations item = new TS_14FormFederations() { TurnId = turnId, OrderNo = itemCount };
                        newItems[itemCount - 1] = item;
                    }

                    listRepository.InsertRange(newItems);
                    dataContext.SaveChanges();
                    tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);
                }
                return tsItems.ToArray();
            }
        }

        public TS_15CoastalDefence[] GetTSCoastalDefence(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_15CoastalDefence>(dataContext);
                var tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);

                if (tsItems.Count() == 0)
                {
                    var newItems = new TS_15CoastalDefence[5];

                    for (var itemCount = 1; itemCount <= newItems.Count(); itemCount++)
                    {
                        TS_15CoastalDefence item = new TS_15CoastalDefence() { TurnId = turnId, OrderNo = itemCount };
                        newItems[itemCount - 1] = item;
                    }

                    listRepository.InsertRange(newItems);
                    dataContext.SaveChanges();
                    tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);
                }
                return tsItems.ToArray();
            }
        }

        public TS_16SeaBlockade[] GetTSSeaBlockade(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_16SeaBlockade>(dataContext);
                var tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);

                if (tsItems.Count() == 0)
                {
                    var newItems = new TS_16SeaBlockade[3];

                    for (var itemCount = 1; itemCount <= newItems.Count(); itemCount++)
                    {
                        TS_16SeaBlockade item = new TS_16SeaBlockade() { TurnId = turnId, OrderNo = itemCount };
                        newItems[itemCount - 1] = item;
                    }

                    listRepository.InsertRange(newItems);
                    dataContext.SaveChanges();
                    tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);
                }
                return tsItems.ToArray();
            }
        }

        public TS_17TradeAndLoading1[] GetTSTradeAndLoading1(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_17TradeAndLoading1>(dataContext);
                var tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);

                if (tsItems.Count() == 0)
                {
                    var newItems = new TS_17TradeAndLoading1[18];

                    for (var itemCount = 1; itemCount <= newItems.Count(); itemCount++)
                    {
                        TS_17TradeAndLoading1 item = new TS_17TradeAndLoading1() { TurnId = turnId, OrderNo = itemCount };
                        newItems[itemCount - 1] = item;
                    }

                    listRepository.InsertRange(newItems);
                    dataContext.SaveChanges();
                    tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);
                }
                return tsItems.ToArray();
            }
        }

        public TS_18Movement[] GetTSMovement(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_18Movement>(dataContext);
                var tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);

                if (tsItems.Count() == 0)
                {
                    var newItems = new TS_18Movement[30];

                    for (var itemCount = 1; itemCount <= newItems.Count(); itemCount++)
                    {
                        TS_18Movement item = new TS_18Movement() { TurnId = turnId, OrderNo = itemCount };
                        newItems[itemCount - 1] = item;
                    }

                    listRepository.InsertRange(newItems);
                    dataContext.SaveChanges();
                    tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);
                }
                return tsItems.ToArray();
            }
        }

        public TS_19TradeAndLoading2[] GetTSTradeAndLoading2(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_19TradeAndLoading2>(dataContext);
                var tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);

                if (tsItems.Count() == 0)
                {
                    var newItems = new TS_19TradeAndLoading2[18];

                    for (var itemCount = 1; itemCount <= newItems.Count(); itemCount++)
                    {
                        TS_19TradeAndLoading2 item = new TS_19TradeAndLoading2() { TurnId = turnId, OrderNo = itemCount };
                        newItems[itemCount - 1] = item;
                    }

                    listRepository.InsertRange(newItems);
                    dataContext.SaveChanges();
                    tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);
                }
                return tsItems.ToArray();
            }
        }

        public TS_20Boarding[] GetTSBoarding(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_20Boarding>(dataContext);
                var tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);

                if (tsItems.Count() == 0)
                {
                    var newItems = new TS_20Boarding[16];

                    for (var itemCount = 1; itemCount <= newItems.Count(); itemCount++)
                    {
                        TS_20Boarding item = new TS_20Boarding() { TurnId = turnId, OrderNo = itemCount };
                        newItems[itemCount - 1] = item;
                    }

                    listRepository.InsertRange(newItems);
                    dataContext.SaveChanges();
                    tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);
                }
                return tsItems.ToArray();
            }
        }

        public TS_21HandOverTerritory[] GetTSHandOverTerritory(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_21HandOverTerritory>(dataContext);
                var tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);

                if (tsItems.Count() == 0)
                {
                    var newItems = new TS_21HandOverTerritory[6];

                    for (var itemCount = 1; itemCount <= newItems.Count(); itemCount++)
                    {
                        TS_21HandOverTerritory item = new TS_21HandOverTerritory() { TurnId = turnId, OrderNo = itemCount };
                        newItems[itemCount - 1] = item;
                    }

                    listRepository.InsertRange(newItems);
                    dataContext.SaveChanges();
                    tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);
                }
                return tsItems.ToArray();
            }
        }

        public TS_22ChangeNames[] GetTSChangeNames(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_22ChangeNames>(dataContext);
                var tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);

                if (tsItems.Count() == 0)
                {
                    var newItems = new TS_22ChangeNames[4];

                    for (var itemCount = 1; itemCount <= newItems.Count(); itemCount++)
                    {
                        TS_22ChangeNames item = new TS_22ChangeNames() { TurnId = turnId, OrderNo = itemCount };
                        newItems[itemCount - 1] = item;
                    }

                    listRepository.InsertRange(newItems);
                    dataContext.SaveChanges();
                    tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);
                }
                return tsItems.ToArray();
            }
        }

        public TS_23ChangeStateRelationships[] GetTSChangeStateRelationships(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_23ChangeStateRelationships>(dataContext);
                var tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);

                if (tsItems.Count() == 0)
                {
                    var newItems = new TS_23ChangeStateRelationships[4];

                    for (var itemCount = 1; itemCount <= newItems.Count(); itemCount++)
                    {
                        TS_23ChangeStateRelationships item = new TS_23ChangeStateRelationships() { TurnId = turnId, OrderNo = itemCount };
                        newItems[itemCount - 1] = item;
                    }

                    listRepository.InsertRange(newItems);
                    dataContext.SaveChanges();
                    tsItems = listRepository.GetItems(x => x.TurnId == turnId).OrderBy(y => y.OrderNo);
                }
                return tsItems.ToArray();
            }
        }

        public void EnsureAllTurnsheetSectionsSeeded(string turnId)
        {
            if (string.IsNullOrWhiteSpace(turnId))
            {
                return;
            }

            using (var dataContext = new AusterlitzDbContext())
            {
                EnsureAllTurnsheetSectionsSeeded(dataContext, turnId);
                dataContext.SaveChanges();
            }
        }

        private void EnsureAllTurnsheetSectionsSeeded(AusterlitzDbContext dataContext, string turnId)
        {
            EnsureSectionRows<TS_01TransferGoods>(dataContext, turnId, Ts01MaxRows);
            EnsureSectionRows<TS_02DemolishItems>(dataContext, turnId, Ts02MaxRows);
            EnsureSectionRows<TS_03SetUpBrigades>(dataContext, turnId, Ts03MaxRows);
            EnsureSectionRows<TS_04SetUpAdditionalBrigades>(dataContext, turnId, Ts04MaxRows);
            EnsureSectionRows<TS_05IncreaseHeadcount>(dataContext, turnId, Ts05MaxRows);
            EnsureSectionRows<TS_06IncreaseBrigadeXP>(dataContext, turnId, Ts06MaxRows);
            EnsureSectionRows<TS_07ExchangeBattalions>(dataContext, turnId, Ts07MaxRows);
            EnsureSectionRows<TS_08MergeBattalions>(dataContext, turnId, Ts08MaxRows);
            EnsureSectionRows<TS_09RepairShips_BaggageTrains>(dataContext, turnId, Ts09MaxRows);
            EnsureSectionRows<TS_10BuildShips>(dataContext, turnId, Ts10MaxRows);
            EnsureSectionRows<TS_11BuildBaggageTrain>(dataContext, turnId, Ts11MaxRows);
            EnsureSectionRows<TS_12IncreasePopulationDensity>(dataContext, turnId, Ts12MaxRows);
            EnsureSectionRows<TS_13BuildProductionSites>(dataContext, turnId, Ts13MaxRows);
            EnsureSectionRows<TS_14FormFederations>(dataContext, turnId, Ts14MaxRows);
            EnsureSectionRows<TS_15CoastalDefence>(dataContext, turnId, Ts15MaxRows);
            EnsureSectionRows<TS_16SeaBlockade>(dataContext, turnId, Ts16MaxRows);
            EnsureSectionRows<TS_17TradeAndLoading1>(dataContext, turnId, Ts17MaxRows);
            EnsureSectionRows<TS_18Movement>(dataContext, turnId, Ts18MaxRows);
            EnsureSectionRows<TS_19TradeAndLoading2>(dataContext, turnId, Ts19MaxRows);
            EnsureSectionRows<TS_20Boarding>(dataContext, turnId, Ts20MaxRows);
            EnsureSectionRows<TS_21HandOverTerritory>(dataContext, turnId, Ts21MaxRows);
            EnsureSectionRows<TS_22ChangeNames>(dataContext, turnId, Ts22MaxRows);
            EnsureSectionRows<TS_23ChangeStateRelationships>(dataContext, turnId, Ts23MaxRows);
        }

        private void EnsureSectionRows<T>(AusterlitzDbContext dataContext, string turnId, int maxRows) where T : class, ITurnSheetEntity, new()
        {
            var listRepository = new GenericRepository<T>(dataContext);
            var existingOrderNos = new HashSet<int>(
                listRepository.GetItems(x => x.TurnId == turnId).Select(x => x.OrderNo));

            var missingRows = new List<T>();
            for (var orderNo = 1; orderNo <= maxRows; orderNo++)
            {
                if (existingOrderNos.Contains(orderNo))
                {
                    continue;
                }

                missingRows.Add(new T
                {
                    TurnId = turnId,
                    OrderNo = orderNo
                });
            }

            if (missingRows.Count > 0)
            {
                listRepository.InsertRange(missingRows.ToArray());
            }
        }

        public int ClearTurnOrders(string turnId)
        {
            if (string.IsNullOrWhiteSpace(turnId))
            {
                return 0;
            }

            using (var dataContext = new AusterlitzDbContext())
            {
                var deletedRows = 0;
                deletedRows += ClearTurnOrderSet<TS_01TransferGoods>(dataContext, turnId);
                deletedRows += ClearTurnOrderSet<TS_02DemolishItems>(dataContext, turnId);
                deletedRows += ClearTurnOrderSet<TS_03SetUpBrigades>(dataContext, turnId);
                deletedRows += ClearTurnOrderSet<TS_04SetUpAdditionalBrigades>(dataContext, turnId);
                deletedRows += ClearTurnOrderSet<TS_05IncreaseHeadcount>(dataContext, turnId);
                deletedRows += ClearTurnOrderSet<TS_06IncreaseBrigadeXP>(dataContext, turnId);
                deletedRows += ClearTurnOrderSet<TS_07ExchangeBattalions>(dataContext, turnId);
                deletedRows += ClearTurnOrderSet<TS_08MergeBattalions>(dataContext, turnId);
                deletedRows += ClearTurnOrderSet<TS_09RepairShips_BaggageTrains>(dataContext, turnId);
                deletedRows += ClearTurnOrderSet<TS_10BuildShips>(dataContext, turnId);
                deletedRows += ClearTurnOrderSet<TS_11BuildBaggageTrain>(dataContext, turnId);
                deletedRows += ClearTurnOrderSet<TS_12IncreasePopulationDensity>(dataContext, turnId);
                deletedRows += ClearTurnOrderSet<TS_13BuildProductionSites>(dataContext, turnId);
                deletedRows += ClearTurnOrderSet<TS_14FormFederations>(dataContext, turnId);
                deletedRows += ClearTurnOrderSet<TS_15CoastalDefence>(dataContext, turnId);
                deletedRows += ClearTurnOrderSet<TS_16SeaBlockade>(dataContext, turnId);
                deletedRows += ClearTurnOrderSet<TS_17TradeAndLoading1>(dataContext, turnId);
                deletedRows += ClearTurnOrderSet<TS_18Movement>(dataContext, turnId);
                deletedRows += ClearTurnOrderSet<TS_19TradeAndLoading2>(dataContext, turnId);
                deletedRows += ClearTurnOrderSet<TS_20Boarding>(dataContext, turnId);
                deletedRows += ClearTurnOrderSet<TS_21HandOverTerritory>(dataContext, turnId);
                deletedRows += ClearTurnOrderSet<TS_22ChangeNames>(dataContext, turnId);
                deletedRows += ClearTurnOrderSet<TS_23ChangeStateRelationships>(dataContext, turnId);
                ClearOrderDrivenEconomyComputedSummary(dataContext, turnId);

                EnsureAllTurnsheetSectionsSeeded(dataContext, turnId);
                dataContext.SaveChanges();
                return deletedRows;
            }
        }

        private void ClearOrderDrivenEconomyComputedSummary(AusterlitzDbContext dataContext, string turnId)
        {
            if (dataContext == null || string.IsNullOrWhiteSpace(turnId))
            {
                return;
            }

            dataContext.Database.ExecuteSqlCommand(@"
IF OBJECT_ID('dbo.TR_EconomyComputedSummary', 'U') IS NOT NULL
BEGIN
    UPDATE dbo.TR_EconomyComputedSummary
    SET
        ArmyBuildingLd = 0,
        ArmyTrainingLd = 0,
        NavyBuildRepairLd = 0,
        ProductionBuildLd = 0,
        TransferToEuropeLd = 0,
        TransferFromEuropeLd = 0,
        TransferToCaribbeanLd = 0,
        TransferFromCaribbeanLd = 0,
        TransferToIndiaLd = 0,
        TransferFromIndiaLd = 0,
        DirectSellingLd = 0,
        DirectBuyingLd = 0,
        BuildFundsAvailableLd =
            ISNULL(StartingRevenueLd, 0) -
            (
                ISNULL(ArmyMaintLd, 0) +
                ISNULL(NavyMaintLd, 0) +
                ISNULL(ProductionMaintLd, 0) +
                ISNULL(LdInBarracks, 0)
            ),
        ProjectedNextMonthLd =
            ISNULL(StartingRevenueLd, 0) +
            ISNULL(TaxesLd, 0) +
            ISNULL(LdProduction, 0) -
            ISNULL(ProductionMaintLd, 0) -
            ISNULL(ArmyMaintLd, 0) -
            ISNULL(NavyMaintLd, 0),
        ComputedVersion = 0,
        ComputedAtUtc = GETUTCDATE()
    WHERE TurnId = @turnId;
END",
                new SqlParameter("@turnId", turnId));
        }

        private int ClearTurnOrderSet<T>(AusterlitzDbContext dataContext, string turnId) where T : class, ITurnSheetEntity
        {
            var listRepository = new TurnSheetRepository<T>(dataContext);
            return listRepository.DeleteByTurnId(turnId);
        }

        public TS_00TurnDetails PostTSTurnDetails(TS_00TurnDetails tsPostedRecords)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new GenericRepository<TS_00TurnDetails>(dataContext);
                listRepository.Insert(tsPostedRecords);
                var result = listRepository.GetItems(x => x.TurnId==tsPostedRecords.TurnId);
                dataContext.SaveChanges();
                return result.ToArray()[0];
            }
        }

        public TS_01TransferGoods[] PostTSTransferGoods(TS_01TransferGoods[] tsPostedRecords)
        {
            return SaveSectionRows(tsPostedRecords, Ts01MaxRows, "TS_01");
        }

        public TS_02DemolishItems[] PostTSDemolishItems(TS_02DemolishItems[] tsPostedRecords)
        {
            if (tsPostedRecords != null)
            {
                foreach (var record in tsPostedRecords)
                {
                    if (record == null)
                    {
                        continue;
                    }

                    if (record.BrigadeNo.HasValue && (record.BrigadeNo.Value < 1 || record.BrigadeNo.Value > 7))
                    {
                        record.BrigadeNo = null;
                    }
                }
            }

            return SaveSectionRows(tsPostedRecords, Ts02MaxRows, "TS_02");
        }

        public TS_03SetUpBrigades[] PostTSSetUpBrigades(TS_03SetUpBrigades[] tsPostedRecords)
        {
            // Truncate BrigadeName to max 15 chars to satisfy database constraint.
            if (tsPostedRecords != null)
            {
                foreach (var record in tsPostedRecords)
                {
                    if (!string.IsNullOrEmpty(record.BrigadeName) && record.BrigadeName.Length > 15)
                    {
                        record.BrigadeName = record.BrigadeName.Substring(0, 15);
                    }
                }
            }

            return SaveSectionRows(tsPostedRecords, Ts03MaxRows, "TS_03");
        }

        public TS_04SetUpAdditionalBrigades[] PostTSSetUpAdditionalBrigades(TS_04SetUpAdditionalBrigades[] tsPostedRecords)
        {
            return SaveSectionRows(tsPostedRecords, Ts04MaxRows, "TS_04");
        }

        public TS_05IncreaseHeadcount[] PostTSIncreaseHeadcount(TS_05IncreaseHeadcount[] tsPostedRecords)
        {
            return SaveSectionRows(tsPostedRecords, Ts05MaxRows, "TS_05");
        }


        public TS_06IncreaseBrigadeXP[] PostTSIncreaseBrigadeXP(TS_06IncreaseBrigadeXP[] tsPostedRecords)
        {
            return SaveSectionRows(tsPostedRecords, Ts06MaxRows, "TS_06");
        }

        public TS_07ExchangeBattalions[] PostTSExchangeBattalions(TS_07ExchangeBattalions[] tsPostedRecords)
        {
            return SaveSectionRows(tsPostedRecords, Ts07MaxRows, "TS_07");
        }

        public TS_08MergeBattalions[] PostTSMergeBattalions(TS_08MergeBattalions[] tsPostedRecords)
        {
            return SaveSectionRows(tsPostedRecords, Ts08MaxRows, "TS_08");
        }

        public TS_09RepairShips_BaggageTrains[] PostTSRepairShips_BaggageTrains(TS_09RepairShips_BaggageTrains[] tsPostedRecords)
        {
            return SaveSectionRows(tsPostedRecords, Ts09MaxRows, "TS_09");
        }

        public TS_10BuildShips[] PostTSBuildShips(TS_10BuildShips[] tsPostedRecords)
        {
            // Warships: type <= 25. Merchants: type >= 31 must not have a name.
            if (tsPostedRecords != null)
            {
                foreach (var row in tsPostedRecords)
                {
                    if (row != null && row.ShipType.HasValue && row.ShipType.Value >= 31)
                    {
                        row.Name_WarshipOnly = null;
                    }
                }
            }

            return SaveSectionRows(tsPostedRecords, Ts10MaxRows, "TS_10");
        }

        public TS_11BuildBaggageTrain[] PostTSBuildBaggageTrain(TS_11BuildBaggageTrain[] tsPostedRecords)
        {
            return SaveSectionRows(tsPostedRecords, Ts11MaxRows, "TS_11");
        }

        public TS_12IncreasePopulationDensity[] PostTSIncreasePopulationDensity(TS_12IncreasePopulationDensity[] tsPostedRecords)
        {
            return SaveSectionRows(tsPostedRecords, Ts12MaxRows, "TS_12");
        }

        public TS_13BuildProductionSites[] PostTSBuildProductionSites(TS_13BuildProductionSites[] tsPostedRecords)
        {
            return SaveSectionRows(tsPostedRecords, Ts13MaxRows, "TS_13");
        }

        public TS_14FormFederations[] PostTSFormFederations(TS_14FormFederations[] tsPostedRecords)
        {
            return SaveSectionRows(tsPostedRecords, Ts14MaxRows, "TS_14");
        }

        public TS_15CoastalDefence[] PostTSCoastalDefence(TS_15CoastalDefence[] tsPostedRecords)
        {
            return SaveSectionRows(tsPostedRecords, Ts15MaxRows, "TS_15");
        }

        public TS_16SeaBlockade[] PostTSSeaBlockade(TS_16SeaBlockade[] tsPostedRecords)
        {
            return SaveSectionRows(tsPostedRecords, Ts16MaxRows, "TS_16");
        }

        public TS_17TradeAndLoading1[] PostTSTradeAndLoading1(TS_17TradeAndLoading1[] tsPostedRecords)
        {
            return SaveSectionRows(tsPostedRecords, Ts17MaxRows, "TS_17");
        }

        public TS_18Movement[] PostTSMovement(TS_18Movement[] tsPostedRecords)
        {
            return SaveSectionRows(tsPostedRecords, Ts18MaxRows, "TS_18");
        }

        public TS_19TradeAndLoading2[] PostTSTradeAndLoading2(TS_19TradeAndLoading2[] tsPostedRecords)
        {
            return SaveSectionRows(tsPostedRecords, Ts19MaxRows, "TS_19");
        }

        public TS_20Boarding[] PostTSBoarding(TS_20Boarding[] tsPostedRecords)
        {
            return SaveSectionRows(tsPostedRecords, Ts20MaxRows, "TS_20");
        }

        public TS_21HandOverTerritory[] PostTSHandOverTerritory(TS_21HandOverTerritory[] tsPostedRecords)
        {
            return SaveSectionRows(tsPostedRecords, Ts21MaxRows, "TS_21");
        }

        public TS_22ChangeNames[] PostTSChangeNames(TS_22ChangeNames[] tsPostedRecords)
        {
            return SaveSectionRows(tsPostedRecords, Ts22MaxRows, "TS_22");
        }

        public TS_23ChangeStateRelationships[] PostTSChangeStateRelationships(TS_23ChangeStateRelationships[] tsPostedRecords)
        {
            return SaveSectionRows(tsPostedRecords, Ts23MaxRows, "TS_23");
        }

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
