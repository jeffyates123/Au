using Austerlitz.DAL;
using Austerlitz.Services;
using System.Collections;
using System.Collections.Generic;
using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
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
        private static readonly IDictionary<string, Action<Austerlitz.Domain.TurnSheetManager, object[]>> ImportSectionHandlers =
            new Dictionary<string, Action<Austerlitz.Domain.TurnSheetManager, object[]>>(StringComparer.OrdinalIgnoreCase)
            {
                { "TS_01", (m, r) => m.PostTSTransferGoods(ToRows<TS_01TransferGoods>(r)) },
                { "TS_02", (m, r) => m.PostTSDemolishItems(ToRows<TS_02DemolishItems>(r)) },
                { "TS_03", (m, r) => m.PostTSSetUpBrigades(ToRows<TS_03SetUpBrigades>(r)) },
                { "TS_04", (m, r) => m.PostTSSetUpAdditionalBrigades(ToRows<TS_04SetUpAdditionalBrigades>(r)) },
                { "TS_05", (m, r) => m.PostTSIncreaseHeadcount(ToRows<TS_05IncreaseHeadcount>(r)) },
                { "TS_06", (m, r) => m.PostTSIncreaseBrigadeXP(ToRows<TS_06IncreaseBrigadeXP>(r)) },
                { "TS_07", (m, r) => m.PostTSExchangeBattalions(ToRows<TS_07ExchangeBattalions>(r)) },
                { "TS_08", (m, r) => m.PostTSMergeBattalions(ToRows<TS_08MergeBattalions>(r)) },
                { "TS_09", (m, r) => m.PostTSRepairShips_BaggageTrains(ToRows<TS_09RepairShips_BaggageTrains>(r)) },
                { "TS_10", (m, r) => m.PostTSBuildShips(ToRows<TS_10BuildShips>(r)) },
                { "TS_11", (m, r) => m.PostTSBuildBaggageTrain(ToRows<TS_11BuildBaggageTrain>(r)) },
                { "TS_12", (m, r) => m.PostTSIncreasePopulationDensity(ToRows<TS_12IncreasePopulationDensity>(r)) },
                { "TS_13", (m, r) => m.PostTSBuildProductionSites(ToRows<TS_13BuildProductionSites>(r)) },
                { "TS_14", (m, r) => m.PostTSFormFederations(ToRows<TS_14FormFederations>(r)) },
                { "TS_15", (m, r) => m.PostTSCoastalDefence(ToRows<TS_15CoastalDefence>(r)) },
                { "TS_16", (m, r) => m.PostTSSeaBlockade(ToRows<TS_16SeaBlockade>(r)) },
                { "TS_17", (m, r) => m.PostTSTradeAndLoading1(ToRows<TS_17TradeAndLoading1>(r)) },
                { "TS_18", (m, r) => m.PostTSMovement(ToRows<TS_18Movement>(r)) },
                { "TS_19", (m, r) => m.PostTSTradeAndLoading2(ToRows<TS_19TradeAndLoading2>(r)) },
                { "TS_20", (m, r) => m.PostTSBoarding(ToRows<TS_20Boarding>(r)) },
                { "TS_21", (m, r) => m.PostTSHandOverTerritory(ToRows<TS_21HandOverTerritory>(r)) },
                { "TS_22", (m, r) => m.PostTSChangeNames(ToRows<TS_22ChangeNames>(r)) },
                { "TS_23", (m, r) => m.PostTSChangeStateRelationships(ToRows<TS_23ChangeStateRelationships>(r)) }
            };

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

        public TS_00TurnDetails[] GetAllTurnsList()
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();
            return turnReportManager.GetAllTurnsList();
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
        public System.Web.Http.IHttpActionResult PostSaveTurnsheetSpreadsheet(string turnId)
        {
            return SaveTurnsheetSpreadsheet(turnId);
        }

        [HttpPost]
        public async Task<IHttpActionResult> PostImportTurnsheetSpreadsheet(string turnId)
        {
            if (string.IsNullOrWhiteSpace(turnId))
            {
                return BadRequest("TurnId is required.");
            }

            if (!Request.Content.IsMimeMultipartContent())
            {
                return ResponseMessage(Request.CreateResponse(HttpStatusCode.UnsupportedMediaType, "Expected multipart/form-data."));
            }

            try
            {
                var provider = new MultipartMemoryStreamProvider();
                await Request.Content.ReadAsMultipartAsync(provider);

                Stream workbookStream = null;
                foreach (var part in provider.Contents)
                {
                    var disposition = part.Headers.ContentDisposition;
                    if (disposition == null || string.IsNullOrWhiteSpace(disposition.FileName))
                    {
                        continue;
                    }

                    var bytes = await part.ReadAsByteArrayAsync();
                    workbookStream = new MemoryStream(bytes);
                    break;
                }

                if (workbookStream == null)
                {
                    return BadRequest("No spreadsheet file found in upload.");
                }

                var turnSheetManager = new Austerlitz.Domain.TurnSheetManager();
                var turnsheetExcelService = new TurnsheetExcelService();
                var deletedRows = turnSheetManager.ClearTurnOrders(turnId);

                TurnsheetExcelService.ImportResult importResult;
                using (workbookStream)
                {
                    importResult = turnsheetExcelService.LoadTurnsheet(turnId, workbookStream);
                }

                var succeededSections = new List<string>();
                var failedSections = new List<object>();
                var importedRowCounts = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

                foreach (var section in importResult.Sections)
                {
                    if (section == null || string.IsNullOrWhiteSpace(section.SectionKey))
                    {
                        continue;
                    }

                    importedRowCounts[section.SectionKey] = section.ImportedRowCount;

                    if (!string.IsNullOrWhiteSpace(section.Error))
                    {
                        failedSections.Add(new
                        {
                            section = section.SectionKey,
                            message = section.Error
                        });
                        continue;
                    }

                    try
                    {
                        SaveImportedSection(turnSheetManager, section.SectionKey, section.Rows);
                        succeededSections.Add(section.SectionKey);
                    }
                    catch (Exception ex)
                    {
                        failedSections.Add(new
                        {
                            section = section.SectionKey,
                            message = ex.Message
                        });
                    }
                }

                var summary = "Imported " + succeededSections.Count + " sections";
                if (failedSections.Count > 0)
                {
                    summary += "; " + failedSections.Count + " sections failed.";
                }
                else
                {
                    summary += " successfully.";
                }

                return Ok(new
                {
                    turnId = turnId,
                    deletedRows = deletedRows,
                    succeededSections = succeededSections,
                    failedSections = failedSections,
                    importedRowCounts = importedRowCounts,
                    message = summary
                });
            }
            catch (Exception ex)
            {
                return Content(HttpStatusCode.InternalServerError, BuildExceptionDetail(ex));
            }
        }

        [HttpPost]
        public System.Web.Http.IHttpActionResult SaveTurnsheetSpreadsheet(string turnId)
        {
            if (string.IsNullOrWhiteSpace(turnId))
            {
                return Ok(false);
            }

            try
            {
                var turnSheetManager = new Austerlitz.Domain.TurnSheetManager();
                var turnsheetExcelService = new Austerlitz.Services.TurnsheetExcelService();

                turnsheetExcelService.SaveTurnsheet(turnId, new[]
                {
                    new Austerlitz.Services.TurnsheetExcelService.SectionRows("TS_01", turnSheetManager.GetTSTransferGoods(turnId)),
                    new Austerlitz.Services.TurnsheetExcelService.SectionRows("TS_02", turnSheetManager.GetTSDemolishItems(turnId)),
                    new Austerlitz.Services.TurnsheetExcelService.SectionRows("TS_03", turnSheetManager.GetTSSetUpBrigades(turnId)),
                    new Austerlitz.Services.TurnsheetExcelService.SectionRows("TS_04", turnSheetManager.GetTSSetUpAdditionalBrigades(turnId)),
                    new Austerlitz.Services.TurnsheetExcelService.SectionRows("TS_05", turnSheetManager.GetTSIncreaseHeadcount(turnId)),
                    new Austerlitz.Services.TurnsheetExcelService.SectionRows("TS_06", turnSheetManager.GetTSIncreaseBrigadeXP(turnId)),
                    new Austerlitz.Services.TurnsheetExcelService.SectionRows("TS_07", turnSheetManager.GetTSExchangeBattalions(turnId)),
                    new Austerlitz.Services.TurnsheetExcelService.SectionRows("TS_08", turnSheetManager.GetTSMergeBattalions(turnId)),
                    new Austerlitz.Services.TurnsheetExcelService.SectionRows("TS_09", turnSheetManager.GetTSRepairShips_BaggageTrains(turnId)),
                    new Austerlitz.Services.TurnsheetExcelService.SectionRows("TS_10", turnSheetManager.GetTSBuildShips(turnId)),
                    new Austerlitz.Services.TurnsheetExcelService.SectionRows("TS_11", turnSheetManager.GetTSBuildBaggageTrain(turnId)),
                    new Austerlitz.Services.TurnsheetExcelService.SectionRows("TS_12", turnSheetManager.GetTSIncreasePopulationDensity(turnId)),
                    new Austerlitz.Services.TurnsheetExcelService.SectionRows("TS_13", turnSheetManager.GetTSBuildProductionSites(turnId)),
                    new Austerlitz.Services.TurnsheetExcelService.SectionRows("TS_14", turnSheetManager.GetTSFormFederations(turnId)),
                    new Austerlitz.Services.TurnsheetExcelService.SectionRows("TS_15", turnSheetManager.GetTSCoastalDefence(turnId)),
                    new Austerlitz.Services.TurnsheetExcelService.SectionRows("TS_16", turnSheetManager.GetTSSeaBlockade(turnId)),
                    new Austerlitz.Services.TurnsheetExcelService.SectionRows("TS_17", turnSheetManager.GetTSTradeAndLoading1(turnId)),
                    new Austerlitz.Services.TurnsheetExcelService.SectionRows("TS_18", turnSheetManager.GetTSMovement(turnId)),
                    new Austerlitz.Services.TurnsheetExcelService.SectionRows("TS_19", turnSheetManager.GetTSTradeAndLoading2(turnId)),
                    new Austerlitz.Services.TurnsheetExcelService.SectionRows("TS_20", turnSheetManager.GetTSBoarding(turnId)),
                    new Austerlitz.Services.TurnsheetExcelService.SectionRows("TS_21", turnSheetManager.GetTSHandOverTerritory(turnId)),
                    new Austerlitz.Services.TurnsheetExcelService.SectionRows("TS_22", turnSheetManager.GetTSChangeNames(turnId)),
                    new Austerlitz.Services.TurnsheetExcelService.SectionRows("TS_23", turnSheetManager.GetTSChangeStateRelationships(turnId))
                });

                return Ok(true);
            }
            catch (System.Exception ex)
            {
                return Content(System.Net.HttpStatusCode.InternalServerError, BuildExceptionDetail(ex));
            }
        }

        private static void SaveImportedSection(Austerlitz.Domain.TurnSheetManager turnSheetManager, string sectionKey, object[] rows)
        {
            Action<Austerlitz.Domain.TurnSheetManager, object[]> handler;
            if (!ImportSectionHandlers.TryGetValue(sectionKey ?? string.Empty, out handler))
            {
                throw new InvalidOperationException("Unknown section key: " + sectionKey + ".");
            }

            handler(turnSheetManager, rows);
        }

        private static T[] ToRows<T>(object[] rows) where T : class
        {
            return (rows ?? new object[0]).OfType<T>().ToArray();
        }

        private static string BuildExceptionDetail(Exception ex)
        {
            var sb = new StringBuilder();
            for (var e = ex; e != null; e = e.InnerException)
            {
                sb.AppendLine(e.GetType().FullName + ": " + e.Message);
                sb.AppendLine(e.StackTrace);
                sb.AppendLine("---");
            }

            return sb.ToString();
        }

        [HttpPost]
        public System.Web.Http.IHttpActionResult PostClearTurnOrders(string turnId)
        {
            if (string.IsNullOrWhiteSpace(turnId))
            {
                return BadRequest("TurnId is required.");
            }

            try
            {
                var turnSheetManager = new Austerlitz.Domain.TurnSheetManager();
                var deletedRows = turnSheetManager.ClearTurnOrders(turnId);
                return Ok(new { deletedRows = deletedRows });
            }
            catch (System.Exception ex)
            {
                return Content(System.Net.HttpStatusCode.InternalServerError, BuildExceptionDetail(ex));
            }
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