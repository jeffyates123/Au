using Austerlitz.DAL;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.OleDb;
using System.IO;
using System.Linq;
using System.Web.Hosting;

namespace Austerlitz.Services
{
    public class TurnsheetExcelService
    {
        private const string TemplateFileName = "Excel Turnsheet.xlsx";
        private const string WorksheetName = "Sheet1$";
        private const int BuildProductionSitesSectionHeaderRowFallback = 158;
        private const int BuildProductionSitesDataRowOffset = 3;
        private const int FormFederationsSectionHeaderRowFallback = 169;
        private const int FormFederationsDataRowOffset = 3;
        private const int MovementSectionHeaderRowFallback = 213;
        private const int MovementDataRowOffset = 3;

        public void SaveBuildProductionSitesSection(string turnId, IEnumerable<TS_13BuildProductionSites> buildProductionSiteRows)
        {
            if (string.IsNullOrWhiteSpace(turnId))
            {
                throw new ArgumentException("turnId is required.", nameof(turnId));
            }

            var rows = buildProductionSiteRows == null ? new TS_13BuildProductionSites[0] : buildProductionSiteRows.OrderBy(x => x.OrderNo).ToArray();

            var workbookPath = GetOrCreateTurnsheetPath(turnId);
            using (var connection = new OleDbConnection(BuildConnectionString(workbookPath)))
            {
                connection.Open();

                var headerRow = FindRowByFirstColumnValue(connection, "(13) Build Production Sites") ?? BuildProductionSitesSectionHeaderRowFallback;
                var firstDataRow = headerRow + BuildProductionSitesDataRowOffset;

                for (var orderNo = 1; orderNo <= 10; orderNo++)
                {
                    var row = rows.SingleOrDefault(x => x.OrderNo == orderNo) ?? new TS_13BuildProductionSites { TurnId = turnId, OrderNo = orderNo };
                    WriteBuildProductionSiteRow(connection, firstDataRow + orderNo - 3, orderNo, row);
                }
            }
        }

        public void SaveFormFederationsSection(string turnId, IEnumerable<TS_14FormFederations> formFederationRows)
        {
            if (string.IsNullOrWhiteSpace(turnId))
            {
                throw new ArgumentException("turnId is required.", nameof(turnId));
            }

            var rows = formFederationRows == null ? new TS_14FormFederations[0] : formFederationRows.OrderBy(x => x.OrderNo).ToArray();

            var workbookPath = GetOrCreateTurnsheetPath(turnId);
            using (var connection = new OleDbConnection(BuildConnectionString(workbookPath)))
            {
                connection.Open();

                var headerRow = FindRowByFirstColumnValue(connection, "(14) Form Federations") ?? FormFederationsSectionHeaderRowFallback;
                var firstDataRow = headerRow + FormFederationsDataRowOffset;

                for (var orderNo = 1; orderNo <= 21; orderNo++)
                {
                    var row = rows.SingleOrDefault(x => x.OrderNo == orderNo) ?? new TS_14FormFederations { TurnId = turnId, OrderNo = orderNo };
                    WriteFormFederationRow(connection, firstDataRow + orderNo - 3, row);
                }
            }
        }

        public void SaveMovementSection(string turnId, IEnumerable<TS_18Movement> movementRows)
        {
            if (string.IsNullOrWhiteSpace(turnId))
            {
                throw new ArgumentException("turnId is required.", nameof(turnId));
            }

            var rows = movementRows == null ? new TS_18Movement[0] : movementRows.OrderBy(x => x.OrderNo).ToArray();

            var workbookPath = GetOrCreateTurnsheetPath(turnId);
            using (var connection = new OleDbConnection(BuildConnectionString(workbookPath)))
            {
                connection.Open();

                var headerRow = FindRowByFirstColumnValue(connection, "(18) Movement") ?? MovementSectionHeaderRowFallback;
                var firstDataRow = headerRow + MovementDataRowOffset;

                for (var orderNo = 1; orderNo <= 30; orderNo++)
                {
                    var row = rows.SingleOrDefault(x => x.OrderNo == orderNo) ?? new TS_18Movement { TurnId = turnId, OrderNo = orderNo };
                    WriteMovementRow(connection, firstDataRow + orderNo - 3, orderNo, row);
                }
            }
        }

        private static string BuildConnectionString(string filePath)
        {
            return string.Format("Provider=Microsoft.ACE.OLEDB.12.0;Data Source={0};Extended Properties=\"Excel 12.0 Xml;HDR=NO;IMEX=0\";", filePath);
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

        private static int? FindRowByFirstColumnValue(OleDbConnection connection, string containsText)
        {
            var command = connection.CreateCommand();
            command.CommandText = string.Format("SELECT * FROM [{0}A1:A500]", WorksheetName);

            using (var reader = command.ExecuteReader())
            {
                // ACE treats first row as header for this range shape.
                var row = 2;
                while (reader != null && reader.Read())
                {
                    var value = reader[0] == DBNull.Value ? string.Empty : reader[0].ToString();
                    if (!string.IsNullOrWhiteSpace(value) && value.IndexOf(containsText, StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        return row;
                    }
                    row++;
                }
            }

            return null;
        }

        private static void WriteMovementRow(OleDbConnection connection, int excelRow, int orderNo, TS_18Movement movement)
        {
            //WriteCell(connection, excelRow, "A", orderNo.ToString());
            WriteCell(connection, excelRow, "B", ToExcelValue(movement.ItemNo));
            WriteCell(connection, excelRow, "C", ToExcelValue(movement.Direction1));
            WriteCell(connection, excelRow, "D", ToExcelValue(movement.Distance1));
            WriteCell(connection, excelRow, "E", ToExcelValue(movement.Direction2));
            WriteCell(connection, excelRow, "F", ToExcelValue(movement.Distance2));
            WriteCell(connection, excelRow, "G", ToExcelValue(movement.Direction3));
            WriteCell(connection, excelRow, "H", ToExcelValue(movement.Distance3));
        }

        private static void WriteBuildProductionSiteRow(OleDbConnection connection, int excelRow, int orderNo, TS_13BuildProductionSites row)
        {
            //WriteCell(connection, excelRow, "A", orderNo.ToString());
            WriteCell(connection, excelRow, "B", ToExcelValue(row.ProdSiteType));
            WriteCell(connection, excelRow, "C", ToExcelValue(row.X));
            WriteCell(connection, excelRow, "D", ToExcelValue(row.Y));
        }

        private static void WriteFormFederationRow(OleDbConnection connection, int excelRow, TS_14FormFederations row)
        {
            //WriteCell(connection, excelRow, "A", orderNo.ToString());
            WriteCell(connection, excelRow, "B", ToExcelValue(row.ItemNo));
            WriteCell(connection, excelRow, "C", ToExcelValue(row.Federation_Fleet));
        }

        private static void WriteCell(OleDbConnection connection, int excelRow, string column, string value)
        {
            var singleRowRange = string.Format("[{0}{1}{2}:{1}{2}]", WorksheetName, column, excelRow);
            if (TryUpsertRangeCell(connection, singleRowRange, value))
            {
                return;
            }

            if (excelRow > 1)
            {
                var twoRowRange = string.Format("[{0}{1}{2}:{1}{3}]", WorksheetName, column, excelRow - 1, excelRow);
                if (TryUpsertRangeCell(connection, twoRowRange, value))
                {
                    return;
                }
            }

            throw new InvalidOperationException(string.Format("Excel cell write affected 0 rows for {0}{1}.", column, excelRow));
        }

        private static bool TryUpsertRangeCell(OleDbConnection connection, string range, string value)
        {
            try
            {
                var headerProbe = connection.CreateCommand();
                headerProbe.CommandText = string.Format("SELECT * FROM {0}", range);

                string fieldName;
                using (var reader = headerProbe.ExecuteReader())
                {
                    if (reader == null || reader.FieldCount == 0)
                    {
                        return false;
                    }

                    fieldName = reader.GetName(0);
                }

                if (string.IsNullOrWhiteSpace(fieldName))
                {
                    fieldName = "F1";
                }

                var escapedFieldName = fieldName.Replace("]", "]]");
                var safeValue = value ?? string.Empty;

                var update = connection.CreateCommand();
                update.CommandText = string.Format("UPDATE {0} SET [{1}] = ?", range, escapedFieldName);
                update.Parameters.AddWithValue("@p1", safeValue);

                var affected = update.ExecuteNonQuery();
                if (affected > 0)
                {
                    return true;
                }

                // ACE sometimes reports 0 updated rows for range writes even though target is valid.
                var insert = connection.CreateCommand();
                insert.CommandText = string.Format("INSERT INTO {0} ([{1}]) VALUES (?)", range, escapedFieldName);
                insert.Parameters.AddWithValue("@p1", safeValue);

                return insert.ExecuteNonQuery() > 0;
            }
            catch (OleDbException)
            {
                return false;
            }
        }

        private static string ToExcelValue(int? value)
        {
            return value.HasValue ? value.Value.ToString() : string.Empty;
        }
    }
}