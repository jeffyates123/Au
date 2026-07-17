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
    }
}
