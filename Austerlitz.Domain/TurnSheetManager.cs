using Austerlitz.DAL;
using Austerlitz.DAL.Management;
using System;
using System.Collections.Generic;
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
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new TurnSheetRepository<TS_01TransferGoods>(dataContext);
                var result = listRepository.SaveRange(tsPostedRecords);
                return result.ToArray();
            }
        }

        public TS_02DemolishItems[] PostTSDemolishItems(TS_02DemolishItems[] tsPostedRecords)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new TurnSheetRepository<TS_02DemolishItems>(dataContext);
                var result = listRepository.SaveRange(tsPostedRecords);
                return result.ToArray();
            }
        }

        public TS_03SetUpBrigades[] PostTSSetUpBrigades(TS_03SetUpBrigades[] tsPostedRecords)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new TurnSheetRepository<TS_03SetUpBrigades>(dataContext);
                var result = listRepository.SaveRange(tsPostedRecords);
                return result.ToArray();
            }
        }

        public TS_04SetUpAdditionalBrigades[] PostTSSetUpAdditionalBrigades(TS_04SetUpAdditionalBrigades[] tsPostedRecords)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new TurnSheetRepository<TS_04SetUpAdditionalBrigades>(dataContext);
                var result = listRepository.SaveRange(tsPostedRecords);
                return result.ToArray();
            }
        }

        public TS_05IncreaseHeadcount[] PostTSIncreaseHeadcount(TS_05IncreaseHeadcount[] tsPostedRecords)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new TurnSheetRepository<TS_05IncreaseHeadcount>(dataContext);
                var result = listRepository.SaveRange(tsPostedRecords);
                return result.ToArray();
            }
        }


        public TS_06IncreaseBrigadeXP[] PostTSIncreaseBrigadeXP(TS_06IncreaseBrigadeXP[] tsPostedRecords)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new TurnSheetRepository<TS_06IncreaseBrigadeXP>(dataContext);
                var result = listRepository.SaveRange(tsPostedRecords);
                return result.ToArray();
            }
        }

        public TS_07ExchangeBattalions[] PostTSExchangeBattalions(TS_07ExchangeBattalions[] tsPostedRecords)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new TurnSheetRepository<TS_07ExchangeBattalions>(dataContext);
                var result = listRepository.SaveRange(tsPostedRecords);
                return result.ToArray();
            }
        }

        public TS_08MergeBattalions[] PostTSMergeBattalions(TS_08MergeBattalions[] tsPostedRecords)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new TurnSheetRepository<TS_08MergeBattalions>(dataContext);
                var result = listRepository.SaveRange(tsPostedRecords);
                return result.ToArray();
            }
        }

        public TS_09RepairShips_BaggageTrains[] PostTSRepairShips_BaggageTrains(TS_09RepairShips_BaggageTrains[] tsPostedRecords)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new TurnSheetRepository<TS_09RepairShips_BaggageTrains>(dataContext);
                var result = listRepository.SaveRange(tsPostedRecords);
                return result.ToArray();
            }
        }

        public TS_10BuildShips[] PostTSBuildShips(TS_10BuildShips[] tsPostedRecords)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new TurnSheetRepository<TS_10BuildShips>(dataContext);
                var result = listRepository.SaveRange(tsPostedRecords);
                return result.ToArray();
            }
        }

        public TS_11BuildBaggageTrain[] PostTSBuildBaggageTrain(TS_11BuildBaggageTrain[] tsPostedRecords)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new TurnSheetRepository<TS_11BuildBaggageTrain>(dataContext);
                var result = listRepository.SaveRange(tsPostedRecords);
                return result.ToArray();
            }
        }

        public TS_12IncreasePopulationDensity[] PostTSIncreasePopulationDensity(TS_12IncreasePopulationDensity[] tsPostedRecords)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new TurnSheetRepository<TS_12IncreasePopulationDensity>(dataContext);
                var result = listRepository.SaveRange(tsPostedRecords);
                return result.ToArray();
            }
        }

        public TS_13BuildProductionSites[] PostTSBuildProductionSites(TS_13BuildProductionSites[] tsPostedRecords)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new TurnSheetRepository<TS_13BuildProductionSites>(dataContext);
                var result = listRepository.SaveRange(tsPostedRecords);
                return result.ToArray();
            }
        }

        public TS_14FormFederations[] PostTSFormFederations(TS_14FormFederations[] tsPostedRecords)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new TurnSheetRepository<TS_14FormFederations>(dataContext);
                var result = listRepository.SaveRange(tsPostedRecords);
                return result.ToArray();
            }
        }

        public TS_15CoastalDefence[] PostTSCoastalDefence(TS_15CoastalDefence[] tsPostedRecords)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new TurnSheetRepository<TS_15CoastalDefence>(dataContext);
                var result = listRepository.SaveRange(tsPostedRecords);
                return result.ToArray();
            }
        }

        public TS_16SeaBlockade[] PostTSSeaBlockade(TS_16SeaBlockade[] tsPostedRecords)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new TurnSheetRepository<TS_16SeaBlockade>(dataContext);
                var result = listRepository.SaveRange(tsPostedRecords);
                return result.ToArray();
            }
        }

        public TS_17TradeAndLoading1[] PostTSTradeAndLoading1(TS_17TradeAndLoading1[] tsPostedRecords)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new TurnSheetRepository<TS_17TradeAndLoading1>(dataContext);
                var result = listRepository.SaveRange(tsPostedRecords);
                return result.ToArray();
            }
        }

        public TS_18Movement[] PostTSMovement(TS_18Movement[] tsPostedRecords)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new TurnSheetRepository<TS_18Movement>(dataContext);
                var result = listRepository.SaveRange(tsPostedRecords);
                return result.ToArray();
            }
        }

        public TS_19TradeAndLoading2[] PostTSTradeAndLoading2(TS_19TradeAndLoading2[] tsPostedRecords)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new TurnSheetRepository<TS_19TradeAndLoading2>(dataContext);
                var result = listRepository.SaveRange(tsPostedRecords);
                return result.ToArray();
            }
        }

        public TS_20Boarding[] PostTSBoarding(TS_20Boarding[] tsPostedRecords)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new TurnSheetRepository<TS_20Boarding>(dataContext);
                var result = listRepository.SaveRange(tsPostedRecords);
                return result.ToArray();
            }
        }

        public TS_21HandOverTerritory[] PostTSHandOverTerritory(TS_21HandOverTerritory[] tsPostedRecords)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new TurnSheetRepository<TS_21HandOverTerritory>(dataContext);
                var result = listRepository.SaveRange(tsPostedRecords);
                return result.ToArray();
            }
        }

        public TS_22ChangeNames[] PostTSChangeNames(TS_22ChangeNames[] tsPostedRecords)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new TurnSheetRepository<TS_22ChangeNames>(dataContext);
                var result = listRepository.SaveRange(tsPostedRecords);
                return result.ToArray();
            }
        }

        public TS_23ChangeStateRelationships[] PostTSChangeStateRelationships(TS_23ChangeStateRelationships[] tsPostedRecords)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var listRepository = new TurnSheetRepository<TS_23ChangeStateRelationships>(dataContext);
                var result = listRepository.SaveRange(tsPostedRecords);
                return result.ToArray();
            }
        }
    }
}
