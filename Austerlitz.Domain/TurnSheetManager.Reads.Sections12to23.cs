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
    }
}
