using Austerlitz.DAL;
using ClosedXML.Excel;
using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Web.Hosting;

namespace Austerlitz.Services
{
    public class TurnsheetExcelService
    {
        private const string TemplateFileName = "Excel Turnsheet.xlsx";

        private static readonly SectionLayout[] Layouts =
        {
            Layout("TS_01", 12, 10, Col(2, "From"), Col(3, "To"), Col(4, "Louisdore"), Col(5, "Citizens"), Col(6, "EcPts"), Col(7, "Wood"), Col(8, "Horses"), Col(9, "Textiles")),
            Layout("TS_02", 25, 6, Col(2, "ItemNo")),
            Layout("TS_03", 34, 8, Col(2, "Depot"), Col(3, "Batt1"), Col(4, "Batt2"), Col(5, "Batt3"), Col(6, "Batt4"), Col(7, "Batt5"), Col(8, "Batt6"), Col(9, "Batt7"), Col(10, "BrigadeName")),
            Layout("TS_04", 45, 6, Col(2, "BrigadeNo"), Col(3, "BattType")),
            Layout("TS_05", 54, 12, Col(2, "BrigadeOrFederation"), Col(3, "IncreaseAmount")),
            Layout("TS_06", 69, 16, Col(2, "BrigadeOrFederation")),
            Layout("TS_07", 88, 4, Col(2, "BrigadeA"), Col(3, "BattA"), Col(4, "BrigadeB"), Col(5, "BattB")),
            Layout("TS_08", 95, 8, Col(2, "BridageA"), Col(3, "BattA"), Col(4, "BrigadeB"), Col(5, "BattB")),
            Layout("TS_09", 106, 6, Col(2, "ItemNo")),
            Layout("TS_10", 115, 8, Col(2, "Shipyard"), Col(3, "ShipType"), Col(4, "Name_WarshipOnly")),
            Layout("TS_11", 126, 4, Col(2, "Barracks")),
            Layout("TS_12", 133, 7, Col(2, "X"), Col(3, "Y")),
            Layout("TS_13", 143, 10, Col(2, "ProdSiteType"), Col(3, "X"), Col(4, "Y")),
            Layout("TS_14", 156, 21, Col(2, "ItemNo"), Col(3, "Federation_Fleet")),
            Layout("TS_15", 180, 5, Col(2, "FleetNo")),
            Layout("TS_16", 188, 3, Col(2, "FleetNo"), Col(3, "StateA_Or_Fleet0"), Col(4, "StateB"), Col(5, "StateC"), Col(6, "StateD"), Col(7, "StateE")),
            Layout("TS_17", 194, 18, Col(2, "Goods"), Col(3, "Quantity"), Col(4, "From"), Col(5, "To")),
            Layout("TS_18", 215, 30, Col(2, "ItemNo"), Col(3, "Direction1"), Col(4, "Distance1"), Col(5, "Direction2"), Col(6, "Distance2"), Col(7, "Direction3"), Col(8, "Distance3")),
            Layout("TS_19", 248, 18, Col(2, "Goods"), Col(3, "Quantity"), Col(4, "Source"), Col(5, "Destination")),
            Layout("TS_20", 269, 16, Col(2, "Command"), Col(3, "ItemNo"), Col(4, "FleetNo"), Col(5, "FleetOwner")),
            Layout("TS_21", 288, 6, Col(2, "State"), Col(3, GetHandOverTerritoryTarget)),
            Layout("TS_22", 297, 4, Col(2, "ItemNo"), Col(3, "Name")),
            Layout("TS_23", 304, 4, Col(2, "State"), Col(3, "Relationship"))
        };

        public void SaveTurnsheet(string turnId, IEnumerable<SectionRows> sections)
        {
            if (string.IsNullOrWhiteSpace(turnId))
            {
                throw new ArgumentException("turnId is required.", nameof(turnId));
            }

            var rowsBySection = (sections ?? new SectionRows[0])
                .Where(x => x != null && !string.IsNullOrWhiteSpace(x.SectionKey))
                .ToDictionary(x => x.SectionKey, x => x.Rows ?? new object[0], StringComparer.OrdinalIgnoreCase);

            var workbookPath = GetOrCreateTurnsheetPath(turnId);
            using (var workbook = new XLWorkbook(workbookPath))
            {
                var sheet = workbook.Worksheet(1);
                foreach (var layout in Layouts)
                {
                    IEnumerable rows;
                    rowsBySection.TryGetValue(layout.SectionKey, out rows);
                    WriteSection(sheet, layout, rows);
                }

                workbook.Save();
            }
        }

        public sealed class SectionRows
        {
            public SectionRows(string sectionKey, IEnumerable rows)
            {
                SectionKey = sectionKey;
                Rows = rows;
            }

            public string SectionKey { get; private set; }
            public IEnumerable Rows { get; private set; }
        }

        private sealed class SectionLayout
        {
            public string SectionKey { get; set; }
            public int FirstDataRow { get; set; }
            public int MaxRows { get; set; }
            public ColumnMapping[] Columns { get; set; }
        }

        private sealed class ColumnMapping
        {
            public int Column { get; set; }
            public string PropertyName { get; set; }
            public Func<object, object> ValueFactory { get; set; }
        }

        private static SectionLayout Layout(string sectionKey, int firstDataRow, int maxRows, params ColumnMapping[] columns)
        {
            return new SectionLayout
            {
                SectionKey = sectionKey,
                FirstDataRow = firstDataRow,
                MaxRows = maxRows,
                Columns = columns
            };
        }

        private static ColumnMapping Col(int column, string propertyName)
        {
            return new ColumnMapping
            {
                Column = column,
                PropertyName = propertyName
            };
        }

        private static ColumnMapping Col(int column, Func<object, object> valueFactory)
        {
            return new ColumnMapping
            {
                Column = column,
                ValueFactory = valueFactory
            };
        }

        private static void WriteSection(IXLWorksheet sheet, SectionLayout layout, IEnumerable rows)
        {
            var rowsByOrderNo = GetRowsByOrderNo(rows);

            for (var orderNo = 1; orderNo <= layout.MaxRows; orderNo++)
            {
                object row;
                rowsByOrderNo.TryGetValue(orderNo, out row);

                foreach (var column in layout.Columns)
                {
                    WriteCell(sheet.Cell(layout.FirstDataRow + orderNo - 1, column.Column), GetMappedValue(row, column));
                }
            }
        }

        private static Dictionary<int, object> GetRowsByOrderNo(IEnumerable rows)
        {
            var rowsByOrderNo = new Dictionary<int, object>();
            if (rows == null)
            {
                return rowsByOrderNo;
            }

            var fallbackOrderNo = 1;
            foreach (var row in rows)
            {
                if (row == null)
                {
                    continue;
                }

                var orderNo = GetIntValue(row, "OrderNo") ?? fallbackOrderNo;
                rowsByOrderNo[orderNo] = row;
                fallbackOrderNo++;
            }

            return rowsByOrderNo;
        }

        private static object GetMappedValue(object row, ColumnMapping column)
        {
            if (row == null)
            {
                return null;
            }

            return column.ValueFactory != null
                ? column.ValueFactory(row)
                : GetPropertyValue(row, column.PropertyName);
        }

        private static object GetPropertyValue(object row, string propertyName)
        {
            if (row == null || string.IsNullOrWhiteSpace(propertyName))
            {
                return null;
            }

            var property = row.GetType().GetProperty(propertyName, BindingFlags.Instance | BindingFlags.Public | BindingFlags.IgnoreCase);
            return property == null ? null : property.GetValue(row, null);
        }

        private static int? GetIntValue(object row, string propertyName)
        {
            var value = GetPropertyValue(row, propertyName);
            if (value == null)
            {
                return null;
            }

            if (value is int)
            {
                return (int)value;
            }

            int parsed;
            return int.TryParse(value.ToString(), out parsed) ? parsed : (int?)null;
        }

        private static object GetHandOverTerritoryTarget(object row)
        {
            var shipNumber = GetIntValue(row, "ShipNumber");
            if (shipNumber.HasValue)
            {
                return shipNumber.Value;
            }

            var x = GetIntValue(row, "X");
            var y = GetIntValue(row, "Y");
            if (x.HasValue && y.HasValue)
            {
                return x.Value + "/" + y.Value;
            }

            return null;
        }

        private static void WriteCell(IXLCell cell, object value)
        {
            if (value == null || string.IsNullOrWhiteSpace(value.ToString()))
            {
                cell.Clear(XLClearOptions.Contents);
                return;
            }

            if (value is int)
            {
                cell.Value = (int)value;
                return;
            }

            if (value is long)
            {
                cell.Value = (long)value;
                return;
            }

            if (value is decimal)
            {
                cell.Value = (decimal)value;
                return;
            }

            if (value is double)
            {
                cell.Value = (double)value;
                return;
            }

            cell.Value = value.ToString();
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
