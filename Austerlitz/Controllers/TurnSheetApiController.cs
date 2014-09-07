using Austerlitz.DAL;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;

namespace Austerlitz.Controllers
{
    //public partial class TurnSheetApiController<T> : ApiController where T : class, ITurnSheetEntity
    //{
    //    [HttpPost]
    //    public void PostTSRecords(T[] saveRecords)
    //    {
    //        var turnReportManager = new Austerlitz.Domain.TurnSheetManager<T>();

    //        turnReportManager.PostTSRecords(saveRecords);
    //    }
    //}

    public partial class TurnSheetApiController : ApiController
    {
        public Austerlitz.Models.TurnSheet GetTSFullTurnDetails(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            var turnSheet = new Austerlitz.Models.TurnSheet();

            turnSheet.TSTurnDetails = turnReportManager.GetTSTurnDetails(turnId); 

            turnSheet.TSTransferGoods = turnReportManager.GetTSTransferGoods(turnId);
            turnSheet.TSDemolishItems = turnReportManager.GetTSDemolishItems(turnId);
            turnSheet.TSSetUpBrigades = turnReportManager.GetTSSetUpBrigades(turnId);
            turnSheet.TSSetUpAdditionalBrigades = turnReportManager.GetTSSetUpAdditionalBrigades(turnId);
            turnSheet.TSIncreaseHeadcount = turnReportManager.GetTSIncreaseHeadcount(turnId);
            turnSheet.TSIncreaseBrigadeXP = turnReportManager.GetTSIncreaseBrigadeXP(turnId);
            turnSheet.TSExchangeBattalions = turnReportManager.GetTSExchangeBattalions(turnId);
            turnSheet.TSMergeBattalions = turnReportManager.GetTSMergeBattalions(turnId);
            turnSheet.TSRepairShips_BaggageTrains = turnReportManager.GetTSRepairShips_BaggageTrains(turnId);
            turnSheet.TSBuildShips = turnReportManager.GetTSBuildShips(turnId);
            turnSheet.TSBuildBaggageTrain = turnReportManager.GetTSBuildBaggageTrain(turnId);
            turnSheet.TSIncreasePopulationDensity = turnReportManager.GetTSIncreasePopulationDensity(turnId);
            turnSheet.TSBuildProductionSites = turnReportManager.GetTSBuildProductionSites(turnId);
            turnSheet.TSFormFederations = turnReportManager.GetTSFormFederations(turnId);
            turnSheet.TSCoastalDefence = turnReportManager.GetTSCoastalDefence(turnId);
            turnSheet.TSSeaBlockade = turnReportManager.GetTSSeaBlockade(turnId);
            turnSheet.TSTradeAndLoading1 = turnReportManager.GetTSTradeAndLoading1(turnId);
            turnSheet.TSMovement = turnReportManager.GetTSMovement(turnId);
            turnSheet.TSTradeAndLoading2 = turnReportManager.GetTSTradeAndLoading2(turnId);
            turnSheet.TSBoarding = turnReportManager.GetTSBoarding(turnId);
            turnSheet.TSHandOverTerritory = turnReportManager.GetTSHandOverTerritory(turnId);
            turnSheet.TSChangeNames = turnReportManager.GetTSChangeNames(turnId);
            turnSheet.TSChangeStateRelationships = turnReportManager.GetTSChangeStateRelationships(turnId);

            return turnSheet;
        }

        public TS_00TurnDetails[] GetAllTSTurnDetails()
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetAllTSTurnDetails();
        }

        public TS_00TurnDetails[] GetTSTurnDetails(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetTSTurnDetails(turnId);
        }

        public TS_01TransferGoods[] GetTSTransferGoods(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetTSTransferGoods(turnId);
        }

        public TS_02DemolishItems[] GetTSDemolishItems(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetTSDemolishItems(turnId);
        }

        public TS_03SetUpBrigades[] GetTSSetUpBrigades(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetTSSetUpBrigades(turnId);
        }

        public TS_04SetUpAdditionalBrigades[] GetTSSetUpAdditionalBrigades(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetTSSetUpAdditionalBrigades(turnId);
        }

        public TS_05IncreaseHeadcount[] GetTSIncreaseHeadcount(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetTSIncreaseHeadcount(turnId);
        }

        public TS_06IncreaseBrigadeXP[] GetTSIncreaseBrigadeXP(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetTSIncreaseBrigadeXP(turnId);
        }

        public TS_07ExchangeBattalions[] GetTSExchangeBattalions(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetTSExchangeBattalions(turnId);
        }

        public TS_08MergeBattalions[] GetTSMergeBattalions(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetTSMergeBattalions(turnId);
        }

        public TS_09RepairShips_BaggageTrains[] GetTSRepairShips_BaggageTrains(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetTSRepairShips_BaggageTrains(turnId);
        }

        public TS_10BuildShips[] GetTSBuildShips(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetTSBuildShips(turnId);
        }

        public TS_11BuildBaggageTrain[] GetTSBuildBaggageTrain(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetTSBuildBaggageTrain(turnId);
        }

        public TS_12IncreasePopulationDensity[] GetTSIncreasePopulationDensity(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetTSIncreasePopulationDensity(turnId);
        }

        public TS_13BuildProductionSites[] GetTSBuildProductionSites(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetTSBuildProductionSites(turnId);
        }

        public TS_14FormFederations[] GetTSFormFederations(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetTSFormFederations(turnId);
        }

        public TS_15CoastalDefence[] GetTSCoastalDefence(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetTSCoastalDefence(turnId);
        }

        public TS_16SeaBlockade[] GetTSSeaBlockade(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetTSSeaBlockade(turnId);
        }

        public TS_17TradeAndLoading1[] GetTSTradeAndLoading1(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetTSTradeAndLoading1(turnId);
        }

        public TS_18Movement[] GetTSMovement(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetTSMovement(turnId);
        }

        public TS_19TradeAndLoading2[] GetTSTradeAndLoading2(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetTSTradeAndLoading2(turnId);
        }

        public TS_20Boarding[] GetTSBoarding(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetTSBoarding(turnId);
        }

        public TS_21HandOverTerritory[] GetTSHandOverTerritory(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetTSHandOverTerritory(turnId);
        }

        public TS_22ChangeNames[] GetTSChangeNames(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetTSChangeNames(turnId);
        }

        public TS_23ChangeStateRelationships[] GetTSChangeStateRelationships(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetTSChangeStateRelationships(turnId);
        }

        [HttpPost]
        public TS_00TurnDetails PostTSTurnDetails(TS_00TurnDetails saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.PostTSTurnDetails(saveRecords);
        }

        [HttpPost]
        public TS_01TransferGoods[] PostTSTransferGoods(TS_01TransferGoods[] saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.PostTSTransferGoods(saveRecords);
        }
        [HttpPost]
        public TS_02DemolishItems[] PostTSDemolishItems(TS_02DemolishItems[] saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.PostTSDemolishItems(saveRecords);
        }
        [HttpPost]
        public TS_03SetUpBrigades[] PostTSSetUpBrigades(TS_03SetUpBrigades[] saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.PostTSSetUpBrigades(saveRecords);
        }
        [HttpPost]
        public TS_04SetUpAdditionalBrigades[] PostTSSetUpAdditionalBrigades(TS_04SetUpAdditionalBrigades[] saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.PostTSSetUpAdditionalBrigades(saveRecords);
        }
        [HttpPost]
        public TS_05IncreaseHeadcount[] PostTSIncreaseHeadcount(TS_05IncreaseHeadcount[] saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.PostTSIncreaseHeadcount(saveRecords);
        }
        [HttpPost]
        public TS_06IncreaseBrigadeXP[] PostTSIncreaseBrigadeXP(TS_06IncreaseBrigadeXP[] saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.PostTSIncreaseBrigadeXP(saveRecords);
        }

        [HttpPost]
        public TS_07ExchangeBattalions[] PostTSExchangeBattalions(TS_07ExchangeBattalions[] saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.PostTSExchangeBattalions(saveRecords);
        }


        [HttpPost]
        public TS_08MergeBattalions[] PostTSMergeBattalions(TS_08MergeBattalions[] saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.PostTSMergeBattalions(saveRecords);
        }

        [HttpPost]
        public TS_09RepairShips_BaggageTrains[] PostTSRepairShips_BaggageTrains(TS_09RepairShips_BaggageTrains[] saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.PostTSRepairShips_BaggageTrains(saveRecords);
        }

        [HttpPost]
        public TS_10BuildShips[] PostTSBuildShips(TS_10BuildShips[] saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.PostTSBuildShips(saveRecords);
        }

        [HttpPost]
        public TS_11BuildBaggageTrain[] PostTSBuildBaggageTrain(TS_11BuildBaggageTrain[] saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.PostTSBuildBaggageTrain(saveRecords);
        }

        [HttpPost]
        public TS_12IncreasePopulationDensity[] PostTSIncreasePopulationDensity(TS_12IncreasePopulationDensity[] saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.PostTSIncreasePopulationDensity(saveRecords);
        }

        [HttpPost]
        public TS_13BuildProductionSites[] PostTSBuildProductionSites(TS_13BuildProductionSites[] saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.PostTSBuildProductionSites(saveRecords);
        }

        [HttpPost]
        public TS_14FormFederations[] PostTSFormFederations(TS_14FormFederations[] saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.PostTSFormFederations(saveRecords);
        }

        [HttpPost]
        public TS_15CoastalDefence[] PostTSCoastalDefence(TS_15CoastalDefence[] saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.PostTSCoastalDefence(saveRecords);
        }

        [HttpPost]
        public TS_16SeaBlockade[] PostTSSeaBlockade(TS_16SeaBlockade[] saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.PostTSSeaBlockade(saveRecords);
        }

        [HttpPost]
        public TS_17TradeAndLoading1[] PostTSTradeAndLoading1(TS_17TradeAndLoading1[] saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.PostTSTradeAndLoading1(saveRecords);
        }

        [HttpPost]
        public TS_18Movement[] PostTSMovement(TS_18Movement[] saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.PostTSMovement(saveRecords);
        }

        [HttpPost]
        public TS_19TradeAndLoading2[] PostTSTradeAndLoading2(TS_19TradeAndLoading2[] saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.PostTSTradeAndLoading2(saveRecords);
        }

        [HttpPost]
        public TS_20Boarding[] PostTSBoarding(TS_20Boarding[] saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.PostTSBoarding(saveRecords);
        }

        [HttpPost]
        public TS_21HandOverTerritory[] PostTSHandOverTerritory(TS_21HandOverTerritory[] saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.PostTSHandOverTerritory(saveRecords);
        }

        [HttpPost]
        public TS_22ChangeNames[] PostTSChangeNames(TS_22ChangeNames[] saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.PostTSChangeNames(saveRecords);
        }

        [HttpPost]
        public TS_23ChangeStateRelationships[] PostTSChangeStateRelationships(TS_23ChangeStateRelationships[] saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.PostTSChangeStateRelationships(saveRecords);
        }
    }
}