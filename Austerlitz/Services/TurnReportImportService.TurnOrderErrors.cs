using Austerlitz.DAL;
using Austerlitz.Models;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;

namespace Austerlitz.Services
{
    public partial class TurnReportImportService
    {
        private static readonly Regex TurnOrderErrorRegex = new Regex(
            @"(?<section>\d{1,2})\s+(?<order>\d{1,2})\s+(?<error>\d{1,2})--",
            RegexOptions.Compiled);

        private void SaveTurnOrderErrors(ArrayList lineList, AusterlitzDbContext auDB, string turnId)
        {
            EnsureTurnOrderErrorTables(auDB);
            auDB.Database.ExecuteSqlCommand("DELETE FROM dbo.TR_TurnOrderErrors WHERE TurnId = @p0", turnId);

            var parsedErrors = ParseTurnOrderErrors(lineList);
            foreach (var parsedError in parsedErrors)
            {
                auDB.Database.ExecuteSqlCommand(@"
INSERT INTO dbo.TR_TurnOrderErrors (TurnId, SectionNo, OrderNo, ErrorCode, RawToken)
VALUES (@TurnId, @SectionNo, @OrderNo, @ErrorCode, @RawToken)",
                    new SqlParameter("@TurnId", turnId ?? string.Empty),
                    new SqlParameter("@SectionNo", parsedError.SectionNo),
                    new SqlParameter("@OrderNo", parsedError.OrderNo),
                    new SqlParameter("@ErrorCode", parsedError.ErrorCode),
                    new SqlParameter("@RawToken", parsedError.RawToken ?? string.Empty));
            }
        }

        private List<ParsedTurnOrderError> ParseTurnOrderErrors(ArrayList lineList)
        {
            var parsedErrors = new List<ParsedTurnOrderError>();
            if (lineList == null || lineList.Count == 0)
            {
                return parsedErrors;
            }

            var startLine = GetTurnOrderErrorStartLine(lineList);
            if (startLine < 0)
            {
                return parsedErrors;
            }

            var dedupe = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            for (var i = startLine; i < lineList.Count; i++)
            {
                var line = (lineList[i] ?? string.Empty).ToString();
                if (string.IsNullOrWhiteSpace(line))
                {
                    continue;
                }

                var matches = TurnOrderErrorRegex.Matches(line);
                foreach (Match match in matches)
                {
                    if (!match.Success)
                    {
                        continue;
                    }

                    var sectionNo = ParseDigitsToInt(match.Groups["section"].Value);
                    var orderNo = ParseDigitsToInt(match.Groups["order"].Value);
                    var errorCode = ParseDigitsToInt(match.Groups["error"].Value);
                    if (sectionNo <= 0 || orderNo <= 0 || errorCode <= 0)
                    {
                        continue;
                    }

                    var dedupeKey = sectionNo + "|" + orderNo + "|" + errorCode;
                    if (!dedupe.Add(dedupeKey))
                    {
                        continue;
                    }

                    parsedErrors.Add(new ParsedTurnOrderError
                    {
                        SectionNo = sectionNo,
                        OrderNo = orderNo,
                        ErrorCode = errorCode,
                        RawToken = (match.Value ?? string.Empty).Trim()
                    });
                }
            }

            return parsedErrors;
        }

        private int GetTurnOrderErrorStartLine(ArrayList lineList)
        {
            for (var i = 0; i < lineList.Count; i++)
            {
                var line = (lineList[i] ?? string.Empty).ToString();
                if (Regex.IsMatch(line, @"^-{20,}\s*$"))
                {
                    return i + 1;
                }
            }

            return -1;
        }

        private void EnsureTurnOrderErrorTables(AusterlitzDbContext auDB)
        {
            auDB.Database.ExecuteSqlCommand(@"
IF OBJECT_ID('dbo.TR_TurnOrderErrors', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TR_TurnOrderErrors (
        TurnOrderErrorId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        TurnId NVARCHAR(16) NOT NULL,
        SectionNo SMALLINT NOT NULL,
        OrderNo SMALLINT NOT NULL,
        ErrorCode SMALLINT NOT NULL,
        RawToken NVARCHAR(32) NULL
    );
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.TR_TurnOrderErrors')
      AND name = 'UX_TR_TurnOrderErrors_TurnSectionOrderError'
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_TR_TurnOrderErrors_TurnSectionOrderError
        ON dbo.TR_TurnOrderErrors (TurnId, SectionNo, OrderNo, ErrorCode);
END;

IF OBJECT_ID('dbo.REF_TurnErrorCodes', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.REF_TurnErrorCodes (
        SectionNo SMALLINT NOT NULL,
        ErrorCode SMALLINT NOT NULL,
        [Message] NVARCHAR(500) NOT NULL,
        CONSTRAINT PK_REF_TurnErrorCodes PRIMARY KEY (SectionNo, ErrorCode)
    );
END;");
        }

        private void EnsureArmyPositionsTable(AusterlitzDbContext auDB)
        {
            auDB.Database.ExecuteSqlCommand(@"
IF OBJECT_ID('dbo.TR_ArmyPositions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TR_ArmyPositions (
        TurnId VARCHAR(13) NOT NULL,
        X INT NOT NULL,
        Y INT NOT NULL,
        State VARCHAR(1) NOT NULL,
        Bat INT NOT NULL,
        CONSTRAINT PK_TR_ArmyPositions PRIMARY KEY (TurnId, X, Y, State)
    );
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.TR_ArmyPositions')
      AND name = 'IX_TR_ArmyPositions_TurnId'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_TR_ArmyPositions_TurnId
        ON dbo.TR_ArmyPositions (TurnId);
END;");
        }

        private void EnsureEpidemicsTable(AusterlitzDbContext auDB)
        {
            auDB.Database.ExecuteSqlCommand(@"
IF OBJECT_ID('dbo.TR_Epidemics', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TR_Epidemics (
        TurnId VARCHAR(13) NOT NULL,
        X INT NOT NULL,
        Y INT NOT NULL,
        State VARCHAR(1) NOT NULL,
        CONSTRAINT PK_TR_Epidemics PRIMARY KEY (TurnId, X, Y, State)
    );
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.TR_Epidemics')
      AND name = 'IX_TR_Epidemics_TurnId'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_TR_Epidemics_TurnId
        ON dbo.TR_Epidemics (TurnId);
END;");
        }

        private class ParsedTurnOrderError
        {
            public int SectionNo { get; set; }
            public int OrderNo { get; set; }
            public int ErrorCode { get; set; }
            public string RawToken { get; set; }
        }
    }
}
