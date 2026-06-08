using Austerlitz.DAL;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Http;

namespace Austerlitz.Controllers
{
    public class DebugSqlApiController : ApiController
    {
        private const int DefaultTop = 200;
        private const int MaxTop = 2000;

        public class DebugMathBattleHeaderRow
        {
            public string TurnId { get; set; }
            public int MathBattleNo { get; set; }
            public string StateA { get; set; }
            public string StateB { get; set; }
            public string Terrain { get; set; }
            public bool IsEstimated { get; set; }
        }

        public class DebugArmyListRow
        {
            public int ItemNo { get; set; }
            public string State { get; set; }
            public string Name { get; set; }
            public string ShortName { get; set; }
            public decimal? EF { get; set; }
            public decimal? LR { get; set; }
            public decimal? RG { get; set; }
            public decimal? HC { get; set; }
            public decimal? LR_Points { get; set; }
            public decimal? HC_Points { get; set; }
            public decimal? Total_Points { get; set; }
            public string Formation { get; set; }
            public string TroopSpecification { get; set; }
        }

        public class DebugTerrainFactorRow
        {
            public string TerrainId { get; set; }
            public string TroopType { get; set; }
            public decimal TF { get; set; }
        }

        public class DebugMathBattleBrigadeRow
        {
            public int MathBattleBrigadeId { get; set; }
            public string State { get; set; }
            public string Name { get; set; }
            public string Phase { get; set; }
            public string Batt1Type { get; set; }
            public string Batt2Type { get; set; }
            public string Batt3Type { get; set; }
            public string Batt4Type { get; set; }
            public string Batt5Type { get; set; }
            public string Batt6Type { get; set; }
            public string Batt7Type { get; set; }
        }

        private bool IsLocalOnlyRequest()
        {
            return HttpContext.Current != null
                && HttpContext.Current.Request != null
                && HttpContext.Current.Request.IsLocal;
        }

        private int NormalizeTop(int top)
        {
            if (top <= 0) return DefaultTop;
            return top > MaxTop ? MaxTop : top;
        }

        private bool IsSafeSqlIdentifier(string identifier)
        {
            if (string.IsNullOrWhiteSpace(identifier)) return false;
            foreach (char ch in identifier)
            {
                bool ok = char.IsLetterOrDigit(ch) || ch == '_' || ch == '.';
                if (!ok) return false;
            }
            return true;
        }

        private bool IsReadOnlyQuery(string sql)
        {
            if (string.IsNullOrWhiteSpace(sql)) return false;

            var text = sql.Trim();
            var upper = text.ToUpperInvariant();

            if (!(upper.StartsWith("SELECT") || upper.StartsWith("WITH")))
            {
                return false;
            }

            if (upper.Contains(";")) return false;

            string[] blocked = new[]
            {
                " INSERT ",
                " UPDATE ",
                " DELETE ",
                " DROP ",
                " ALTER ",
                " CREATE ",
                " MERGE ",
                " TRUNCATE ",
                " EXEC ",
                " EXECUTE ",
                " XP_",
                " SP_"
            };

            var padded = " " + upper + " ";
            return !blocked.Any(token => padded.Contains(token));
        }

        private object ExecuteQuery(AusterlitzDbContext dataContext, string sql)
        {
            var connection = dataContext.Database.Connection;
            if (connection.State != ConnectionState.Open)
            {
                connection.Open();
            }

            using (var command = connection.CreateCommand())
            {
                command.CommandText = sql;
                command.CommandType = CommandType.Text;
                command.CommandTimeout = 120;

                using (var reader = command.ExecuteReader())
                {
                    var columns = new List<string>();
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        columns.Add(reader.GetName(i));
                    }

                    var rows = new List<Dictionary<string, object>>();
                    while (reader.Read())
                    {
                        var row = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);
                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                        }
                        rows.Add(row);
                    }

                    return new
                    {
                        columns = columns,
                        rows = rows,
                        rowCount = rows.Count
                    };
                }
            }
        }

        [HttpGet]
        public IHttpActionResult GetTables(string schema = "dbo")
        {
            if (!IsLocalOnlyRequest())
            {
                return Content(HttpStatusCode.Forbidden, "Debug endpoint is local-only.");
            }

            var normalizedSchema = (schema ?? "dbo").Trim();
            if (!IsSafeSqlIdentifier(normalizedSchema))
            {
                return BadRequest("Invalid schema.");
            }

            using (var dataContext = new AusterlitzDbContext())
            {
                var tables = dataContext.Database.SqlQuery<string>(@"
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA = @schema
ORDER BY TABLE_NAME", new SqlParameter("@schema", normalizedSchema)).ToArray();

                return Ok(new
                {
                    schema = normalizedSchema,
                    tables = tables
                });
            }
        }

        [HttpGet]
        public IHttpActionResult GetTable(string table, int top = DefaultTop)
        {
            if (!IsLocalOnlyRequest())
            {
                return Content(HttpStatusCode.Forbidden, "Debug endpoint is local-only.");
            }

            if (!IsSafeSqlIdentifier(table))
            {
                return BadRequest("Invalid table name.");
            }

            var normalizedTop = NormalizeTop(top);
            var fullyQualifiedTable = table.Contains(".") ? table : ("dbo." + table);
            var sql = "SELECT TOP (" + normalizedTop + ") * FROM " + fullyQualifiedTable;

            using (var dataContext = new AusterlitzDbContext())
            {
                return Ok(new
                {
                    table = fullyQualifiedTable,
                    top = normalizedTop,
                    result = ExecuteQuery(dataContext, sql)
                });
            }
        }

        [HttpGet]
        public IHttpActionResult Query(string sql)
        {
            if (!IsLocalOnlyRequest())
            {
                return Content(HttpStatusCode.Forbidden, "Debug endpoint is local-only.");
            }

            if (!IsReadOnlyQuery(sql))
            {
                return BadRequest("Only single read-only SELECT/WITH queries are allowed.");
            }

            using (var dataContext = new AusterlitzDbContext())
            {
                return Ok(new
                {
                    sql = sql,
                    result = ExecuteQuery(dataContext, sql)
                });
            }
        }

        [HttpGet]
        public IHttpActionResult GetMathBattleTerrainDebug(
            string turnId,
            int mathBattleNo,
            string state = null,
            string shortName = null,
            string terrainId = null)
        {
            if (!IsLocalOnlyRequest())
            {
                return Content(HttpStatusCode.Forbidden, "Debug endpoint is local-only.");
            }

            if (string.IsNullOrWhiteSpace(turnId) || mathBattleNo <= 0)
            {
                return BadRequest("turnId and mathBattleNo are required.");
            }

            var normalizedState = (state ?? "G").Trim().ToUpperInvariant();
            var normalizedShortName = (shortName ?? "Mi").Trim().ToUpperInvariant();

            using (var dataContext = new AusterlitzDbContext())
            {
                var battle = dataContext.Database.SqlQuery<DebugMathBattleHeaderRow>(@"
SELECT TOP 1
    TurnId,
    MathBattleNo,
    StateA,
    StateB,
    Terrain,
    IsEstimated
FROM dbo.TR_MathBattleResultActual
WHERE TurnId = @turnId AND MathBattleNo = @mathBattleNo",
                    new SqlParameter("@turnId", turnId),
                    new SqlParameter("@mathBattleNo", mathBattleNo)).FirstOrDefault();

                var selectedTerrain = ((terrainId ?? (battle != null ? battle.Terrain : null)) ?? "").Trim().ToUpperInvariant();

                var armyListRows = dataContext.Database.SqlQuery<DebugArmyListRow>(@"
SELECT
    ItemNo,
    State,
    Name,
    ShortName,
    EF,
    LR,
    RG,
    HC,
    LR_Points,
    HC_Points,
    Total_Points,
    Formation,
    TroopSpecification
FROM dbo.REF_ArmyList
WHERE State = @state AND UPPER(LTRIM(RTRIM(ShortName))) = @shortName
ORDER BY ItemNo",
                    new SqlParameter("@state", normalizedState),
                    new SqlParameter("@shortName", normalizedShortName)).ToArray();

                var terrainFactorRows = dataContext.Database.SqlQuery<DebugTerrainFactorRow>(@"
SELECT
    TerrainId,
    TroopType,
    CAST(TF AS decimal(10,2)) AS TF
FROM dbo.REF_Terrain_Factor
WHERE TerrainId = @terrainId
ORDER BY TroopType",
                    new SqlParameter("@terrainId", selectedTerrain)).ToArray();

                var brigadeRows = dataContext.Database.SqlQuery<DebugMathBattleBrigadeRow>(@"
SELECT
    MathBattleBrigadeId,
    State,
    Name,
    Phase,
    Batt1Type,
    Batt2Type,
    Batt3Type,
    Batt4Type,
    Batt5Type,
    Batt6Type,
    Batt7Type
FROM dbo.TR_MathBattleBrigades
WHERE TurnId = @turnId AND MathBattleNo = @mathBattleNo
ORDER BY State, Phase, Name",
                    new SqlParameter("@turnId", turnId),
                    new SqlParameter("@mathBattleNo", mathBattleNo)).ToArray();

                return Ok(new
                {
                    Requested = new
                    {
                        turnId = turnId,
                        mathBattleNo = mathBattleNo,
                        state = normalizedState,
                        shortName = normalizedShortName,
                        terrainId = selectedTerrain
                    },
                    Battle = battle,
                    ArmyListRows = armyListRows,
                    TerrainFactorRows = terrainFactorRows,
                    MathBattleBrigades = brigadeRows
                });
            }
        }
    }
}
