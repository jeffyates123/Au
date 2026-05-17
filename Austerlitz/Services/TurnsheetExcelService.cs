using Austerlitz.DAL;
using ClosedXML.Excel;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web.Hosting;

namespace Austerlitz.Services
{
    public class TurnsheetExcelService
    {
        private const string TemplateFileName = "Excel Turnsheet.xlsx";

        private const int TransferGoodsFirstDataRow = 12;
        private const int SetUpBrigadesFirstDataRow = 34;
        private const int BuildProductionSitesFirstDataRow = 143;
        private const int FormFederationsFirstDataRow = 156;
        private const int MovementFirstDataRow = 215;

        public void SaveTransferGoodsSection(string turnId, IEnumerable<TS_01TransferGoods> transferGoodsRows)
        {
            var rows = NormalizeRows(transferGoodsRows);
            EditWorkbook(turnId, sheet =>
            {
                for (var orderNo = 1; orderNo <= 10; orderNo++)
                {
                    var row = orderNo <= rows.Length ? rows[orderNo - 1] : new TS_01TransferGoods { TurnId = turnId, OrderNo = orderNo };
                    var excelRow = TransferGoodsFirstDataRow + orderNo - 1;
                    WritePositiveNumber(sheet, excelRow, 2, row.From);
                    WritePositiveNumber(sheet, excelRow, 3, row.To);
                    WritePositiveNumber(sheet, excelRow, 4, row.Louisdore);
                    WritePositiveNumber(sheet, excelRow, 5, row.Citizens);
                    WritePositiveNumber(sheet, excelRow, 6, row.EcPts);
                    WritePositiveNumber(sheet, excelRow, 7, row.Wood);
                    WritePositiveNumber(sheet, excelRow, 8, row.Horses);
                    WritePositiveNumber(sheet, excelRow, 9, row.Textiles);
                }
            });
        }

        public void SaveSetUpBrigadesSection(string turnId, IEnumerable<TS_03SetUpBrigades> setUpBrigadesRows)
        {
            var rows = NormalizeRows(setUpBrigadesRows);
            EditWorkbook(turnId, sheet =>
            {
                for (var orderNo = 1; orderNo <= 8; orderNo++)
                {
                    var row = orderNo <= rows.Length ? rows[orderNo - 1] : new TS_03SetUpBrigades { TurnId = turnId, OrderNo = orderNo };
                    var excelRow = SetUpBrigadesFirstDataRow + orderNo - 1;
                    WriteNumber(sheet, excelRow, 2, row.Depot);
                    WriteNumber(sheet, excelRow, 3, row.Batt1);
                    WriteNumber(sheet, excelRow, 4, row.Batt2);
                    WriteNumber(sheet, excelRow, 5, row.Batt3);
                    WriteNumber(sheet, excelRow, 6, row.Batt4);
                    WriteNumber(sheet, excelRow, 7, row.Batt5);
                    WriteNumber(sheet, excelRow, 8, row.Batt6);
                    WriteNumber(sheet, excelRow, 9, row.Batt7);
                    WriteText(sheet, excelRow, 10, row.BrigadeName);
                }
            });
        }

        public void SaveBuildProductionSitesSection(string turnId, IEnumerable<TS_13BuildProductionSites> buildProductionSiteRows)
        {
            var rows = NormalizeRows(buildProductionSiteRows);
            EditWorkbook(turnId, sheet =>
            {
                for (var orderNo = 1; orderNo <= 10; orderNo++)
                {
                    var row = orderNo <= rows.Length ? rows[orderNo - 1] : new TS_13BuildProductionSites { TurnId = turnId, OrderNo = orderNo };
                    var excelRow = BuildProductionSitesFirstDataRow + orderNo - 1;
                    WriteNumber(sheet, excelRow, 2, row.ProdSiteType);
                    WriteNumber(sheet, excelRow, 3, row.X);
                    WriteNumber(sheet, excelRow, 4, row.Y);
                }
            });
        }

        public void SaveFormFederationsSection(string turnId, IEnumerable<TS_14FormFederations> formFederationRows)
        {
            var rows = NormalizeRows(formFederationRows);
            EditWorkbook(turnId, sheet =>
            {
                for (var orderNo = 1; orderNo <= 21; orderNo++)
                {
                    var row = orderNo <= rows.Length ? rows[orderNo - 1] : new TS_14FormFederations { TurnId = turnId, OrderNo = orderNo };
                    var excelRow = FormFederationsFirstDataRow + orderNo - 1;
                    WriteNumber(sheet, excelRow, 2, row.ItemNo);
                    WriteNumber(sheet, excelRow, 3, row.Federation_Fleet);
                }
            });
        }

        public void SaveMovementSection(string turnId, IEnumerable<TS_18Movement> movementRows)
        {
            var rows = NormalizeRows(movementRows);
            EditWorkbook(turnId, sheet =>
            {
                for (var orderNo = 1; orderNo <= 30; orderNo++)
                {
                    var row = orderNo <= rows.Length ? rows[orderNo - 1] : new TS_18Movement { TurnId = turnId, OrderNo = orderNo };
                    var excelRow = MovementFirstDataRow + orderNo - 1;
                    WriteNumber(sheet, excelRow, 2, row.ItemNo);
                    WriteNumber(sheet, excelRow, 3, row.Direction1);
                    WriteNumber(sheet, excelRow, 4, row.Distance1);
                    WriteNumber(sheet, excelRow, 5, row.Direction2);
                    WriteNumber(sheet, excelRow, 6, row.Distance2);
                    WriteNumber(sheet, excelRow, 7, row.Direction3);
                    WriteNumber(sheet, excelRow, 8, row.Distance3);
                }
            });
        }

        private static void EditWorkbook(string turnId, Action<IXLWorksheet> edit)
        {
            if (string.IsNullOrWhiteSpace(turnId))
            {
                throw new ArgumentException("turnId is required.", nameof(turnId));
            }

            var workbookPath = GetOrCreateTurnsheetPath(turnId);
            using (var workbook = new XLWorkbook(workbookPath))
            {
                var sheet = workbook.Worksheet(1);
                edit(sheet);
                workbook.Save();
            }
        }

        private static T[] NormalizeRows<T>(IEnumerable<T> rows)
        {
            return rows == null ? new T[0] : rows.ToArray();
        }

        private static void WriteNumber(IXLWorksheet sheet, int row, int column, int? value)
        {
            var cell = sheet.Cell(row, column);
            if (value.HasValue)
            {
                cell.Value = value.Value;
            }
            else
            {
                cell.Clear(XLClearOptions.Contents);
            }
        }

        private static void WritePositiveNumber(IXLWorksheet sheet, int row, int column, int? value)
        {
            var cell = sheet.Cell(row, column);
            if (value.HasValue && value.Value > 0)
            {
                cell.Value = value.Value;
            }
            else
            {
                cell.Clear(XLClearOptions.Contents);
            }
        }

        private static void WriteText(IXLWorksheet sheet, int row, int column, string value)
        {
            var cell = sheet.Cell(row, column);
            if (string.IsNullOrWhiteSpace(value))
            {
                cell.Clear(XLClearOptions.Contents);
            }
            else
            {
                cell.Value = value;
            }
        }

        private static string GetOrCreateTurnsheetPath(string turnId)
        {
            var turnsDirectory = HostingEnvironment.MapPath("~/Turns");
            if (string.IsNullOrWhiteSpace(turnsDirectory))
            {
                throw new InvalidOperationException("Unable to locate ~/Turns directory.");
            }

            if (!Directory.Exists(turnsDirectory))
            {
                Directory.CreateDirectory(turnsDirectory);
            }

            var templatePath = Path.Combine(turnsDirectory, TemplateFileName);
            if (!File.Exists(templatePath))
            {
                throw new FileNotFoundException("Excel turnsheet template was not found.", templatePath);
            }

            var targetPath = Path.Combine(turnsDirectory, turnId + ".xlsx");
            if (!File.Exists(targetPath))
            {
                File.Copy(templatePath, targetPath, false);
            }

            return targetPath;
        }
    }
}
