using Austerlitz.DAL;
using ClosedXML.Excel;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Web.Hosting;

namespace Austerlitz.Services
{
    public partial class TurnsheetExcelService
    {
        public ImportResult LoadTurnsheet(string turnId, Stream workbookStream)
        {
            if (string.IsNullOrWhiteSpace(turnId))
            {
                throw new ArgumentException("turnId is required.", nameof(turnId));
            }

            if (workbookStream == null)
            {
                throw new ArgumentNullException(nameof(workbookStream));
            }

            var sectionResults = new List<ImportSectionRows>();
            using (var workbook = new XLWorkbook(workbookStream))
            {
                var sheet = workbook.Worksheet(1);
                ValidateStrictTemplateAnchors(sheet);
                foreach (var layout in Layouts)
                {
                    var section = new ImportSectionRows
                    {
                        SectionKey = layout.SectionKey,
                        Rows = new object[0],
                        Error = null,
                        ImportedRowCount = 0
                    };

                    try
                    {
                        section.Rows = ReadSection(sheet, layout, turnId);
                        section.ImportedRowCount = CountImportedRows(section.Rows, layout);
                    }
                    catch (Exception ex)
                    {
                        section.Error = ex.Message;
                    }

                    sectionResults.Add(section);
                }
            }

            return new ImportResult
            {
                Sections = sectionResults.ToArray()
            };
        }

        private static void ValidateStrictTemplateAnchors(IXLWorksheet sheet)
        {
            foreach (var layout in Layouts)
            {
                // If the worksheet includes a TS_XX marker in the row above the section,
                // enforce that it matches the expected section key.
                var anchorCell = sheet.Cell(layout.FirstDataRow - 1, 1);
                var anchorText = (anchorCell.GetString() ?? string.Empty).Trim();
                if (!anchorText.StartsWith("TS_", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                if (!string.Equals(anchorText, layout.SectionKey, StringComparison.OrdinalIgnoreCase))
                {
                    throw new FormatException(
                        "Template mismatch near row " + layout.FirstDataRow +
                        ": expected anchor '" + layout.SectionKey +
                        "' but found '" + anchorText + "'.");
                }
            }
        }

        private static object[] ReadSection(IXLWorksheet sheet, SectionLayout layout, string turnId)
        {
            Type rowType;
            if (!SectionTypes.TryGetValue(layout.SectionKey, out rowType))
            {
                throw new InvalidOperationException("No row type mapping exists for section " + layout.SectionKey + ".");
            }

            var rows = new object[layout.MaxRows];
            for (var orderNo = 1; orderNo <= layout.MaxRows; orderNo++)
            {
                var row = Activator.CreateInstance(rowType);
                SetPropertyValue(row, "TurnId", turnId);
                SetPropertyValue(row, "OrderNo", orderNo);

                foreach (var column in layout.Columns)
                {
                    var cell = sheet.Cell(layout.FirstDataRow + orderNo - 1, column.Column);
                    if (!string.IsNullOrWhiteSpace(column.PropertyName))
                    {
                        SetTypedPropertyValueFromCell(row, column.PropertyName, cell, layout.SectionKey, orderNo);
                    }
                    else if (string.Equals(layout.SectionKey, "TS_21", StringComparison.OrdinalIgnoreCase))
                    {
                        SetTS21TargetFromCell(row, cell, orderNo);
                    }
                }

                rows[orderNo - 1] = row;
            }

            return rows;
        }

        private static void SetTypedPropertyValueFromCell(object row, string propertyName, IXLCell cell, string sectionKey, int orderNo)
        {
            var property = row.GetType().GetProperty(propertyName, BindingFlags.Instance | BindingFlags.Public | BindingFlags.IgnoreCase);
            if (property == null || !property.CanWrite)
            {
                return;
            }

            var value = ConvertCellValue(cell, property.PropertyType, sectionKey, property.Name, orderNo);
            property.SetValue(row, value, null);
        }

        private static object ConvertCellValue(IXLCell cell, Type targetType, string sectionKey, string propertyName, int orderNo)
        {
            var underlyingType = Nullable.GetUnderlyingType(targetType) ?? targetType;
            var rawText = (cell.GetString() ?? string.Empty).Trim();
            if (rawText.Length == 0)
            {
                return underlyingType == typeof(string) || Nullable.GetUnderlyingType(targetType) != null
                    ? null
                    : Activator.CreateInstance(underlyingType);
            }

            if (underlyingType == typeof(string))
            {
                return rawText;
            }

            if (underlyingType == typeof(int))
            {
                int parsedInt;
                if (int.TryParse(rawText, NumberStyles.Integer, CultureInfo.InvariantCulture, out parsedInt))
                {
                    return parsedInt;
                }

                double parsedDouble;
                if (double.TryParse(rawText, NumberStyles.Float, CultureInfo.InvariantCulture, out parsedDouble)
                    && Math.Abs(parsedDouble % 1) < 0.000001)
                {
                    return Convert.ToInt32(parsedDouble);
                }

                throw new FormatException(sectionKey + " row " + orderNo + " has invalid integer for " + propertyName + ": '" + rawText + "'.");
            }

            if (underlyingType == typeof(long))
            {
                long parsedLong;
                if (long.TryParse(rawText, NumberStyles.Integer, CultureInfo.InvariantCulture, out parsedLong))
                {
                    return parsedLong;
                }

                throw new FormatException(sectionKey + " row " + orderNo + " has invalid long for " + propertyName + ": '" + rawText + "'.");
            }

            if (underlyingType == typeof(decimal))
            {
                decimal parsedDecimal;
                if (decimal.TryParse(rawText, NumberStyles.Float, CultureInfo.InvariantCulture, out parsedDecimal))
                {
                    return parsedDecimal;
                }

                throw new FormatException(sectionKey + " row " + orderNo + " has invalid decimal for " + propertyName + ": '" + rawText + "'.");
            }

            if (underlyingType == typeof(double))
            {
                double parsedDouble;
                if (double.TryParse(rawText, NumberStyles.Float, CultureInfo.InvariantCulture, out parsedDouble))
                {
                    return parsedDouble;
                }

                throw new FormatException(sectionKey + " row " + orderNo + " has invalid number for " + propertyName + ": '" + rawText + "'.");
            }

            return Convert.ChangeType(rawText, underlyingType, CultureInfo.InvariantCulture);
        }

        private static void SetTS21TargetFromCell(object row, IXLCell cell, int orderNo)
        {
            var target = (cell.GetString() ?? string.Empty).Trim();
            SetPropertyValue(row, "ShipNumber", null);
            SetPropertyValue(row, "X", null);
            SetPropertyValue(row, "Y", null);

            if (target.Length == 0)
            {
                return;
            }

            if (target.Contains("/"))
            {
                var parts = target.Split('/');
                if (parts.Length != 2)
                {
                    throw new FormatException("TS_21 row " + orderNo + " has invalid target '" + target + "'. Use ship no or X/Y.");
                }

                int x;
                int y;
                if (!int.TryParse(parts[0].Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out x)
                    || !int.TryParse(parts[1].Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out y))
                {
                    throw new FormatException("TS_21 row " + orderNo + " has invalid coordinates '" + target + "'.");
                }

                SetPropertyValue(row, "X", x);
                SetPropertyValue(row, "Y", y);
                return;
            }

            int shipNumber;
            if (!int.TryParse(target, NumberStyles.Integer, CultureInfo.InvariantCulture, out shipNumber))
            {
                throw new FormatException("TS_21 row " + orderNo + " has invalid target '" + target + "'. Use ship no or X/Y.");
            }

            SetPropertyValue(row, "ShipNumber", shipNumber);
        }

        private static int CountImportedRows(IEnumerable<object> rows, SectionLayout layout)
        {
            if (rows == null)
            {
                return 0;
            }

            var count = 0;
            foreach (var row in rows)
            {
                if (row == null)
                {
                    continue;
                }

                var hasValue = false;
                foreach (var column in layout.Columns)
                {
                    var value = GetMappedValue(row, column);
                    if (value != null && !string.IsNullOrWhiteSpace(value.ToString()))
                    {
                        hasValue = true;
                        break;
                    }
                }

                if (hasValue)
                {
                    count++;
                }
            }

            return count;
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
    }
}
