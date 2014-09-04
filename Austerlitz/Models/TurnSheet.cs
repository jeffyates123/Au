using Austerlitz.DAL;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Austerlitz.Models
{
    public class TurnSheet
    {
        public TS_00TurnDetails[] TSTurnDetails { get; set; }
        public TS_01TransferGoods[] TSTransferGoods { get; set; }
        public TS_02DemolishItems[] TSDemolishItems { get; set; }
        public TS_03SetUpBrigades[] TSSetUpBrigades { get; set; }
        public TS_04SetUpAdditionalBrigades[] TSSetUpAdditionalBrigades { get; set; }
        public TS_05IncreaseHeadcount[] TSIncreaseHeadcount { get; set; }
        public TS_06IncreaseBrigadeXP[] TSIncreaseBrigadeXP { get; set; }
        public TS_07ExchangeBattalions[] TSExchangeBattalions { get; set; }
        public TS_08MergeBattalions[] TSMergeBattalions { get; set; }
        public TS_09RepairShips_BaggageTrains[] TSRepairShips_BaggageTrains { get; set; }
        public TS_10BuildShips[] TSBuildShips { get; set; }
        public TS_11BuildBaggageTrain[] TSBuildBaggageTrain { get; set; }
        public TS_12IncreasePopulationDensity[] TSIncreasePopulationDensity { get; set; }
        public TS_13BuildProductionSites[] TSBuildProductionSites { get; set; }
        public TS_14FormFederations[] TSFormFederations { get; set; }
        public TS_15CoastalDefence[] TSCoastalDefence { get; set; }
        public TS_16SeaBlockade[] TSSeaBlockade { get; set; }
        public TS_17TradeAndLoading1[] TSTradeAndLoading1 { get; set; }
        public TS_18Movement[] TSMovement { get; set; }
        public TS_19TradeAndLoading2[] TSTradeAndLoading2 { get; set; }
        public TS_20Boarding[] TSBoarding { get; set; }
        public TS_21HandOverTerritory[] TSHandOverTerritory { get; set; }
        public TS_22ChangeNames[] TSChangeNames { get; set; }
        public TS_23ChangeStateRelationships[] TSChangeStateRelationships { get; set; }
    }
}