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
    public partial class TurnSheetManager
    {
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
    }
}
