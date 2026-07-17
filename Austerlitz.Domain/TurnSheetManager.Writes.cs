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
    }
}
