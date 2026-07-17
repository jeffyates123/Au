using Austerlitz.DAL;
using System;
using System.Data.SqlClient;
using System.Linq;
using System.Web.Http;

namespace Austerlitz.Controllers
{
    public partial class TurnReportApiController
    {
        [HttpGet]
        public EconomyComputedSummaryDto getTREconomyComputedSummary(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                EnsureEconomyComputedSummaryTable(dataContext);
                return new EconomyComputedSummaryDto
                {
                    TurnId = turnId,
                    Rows = dataContext.Database.SqlQuery<EconomyComputedSummaryRow>(@"
SELECT
    TurnId,
    Sphere,
    ComputedAtUtc,
    ComputedVersion,
    StartingRevenueLd,
    ArmyMaintLd,
    NavyMaintLd,
    ProductionMaintLd,
    ArmyBuildingLd,
    ArmyTrainingLd,
    NavyBuildRepairLd,
    ProductionBuildLd,
    LdInBarracks,
    BuildFundsAvailableLd,
    TransferToEuropeLd,
    TransferFromEuropeLd,
    TransferToCaribbeanLd,
    TransferFromCaribbeanLd,
    TransferToIndiaLd,
    TransferFromIndiaLd,
    DirectSellingLd,
    DirectBuyingLd,
    TaxesLd,
    LdProduction,
    ProjectedNextMonthLd
FROM dbo.TR_EconomyComputedSummary
WHERE TurnId = @turnId
ORDER BY Sphere", new SqlParameter("@turnId", turnId ?? string.Empty)).ToArray()
                };
            }
        }

        [HttpPost]
        public IHttpActionResult saveTREconomyComputedSummary(EconomyComputedSummaryDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.TurnId))
            {
                return BadRequest("TurnId is required.");
            }

            var rows = request.Rows ?? new EconomyComputedSummaryRow[0];
            using (var dataContext = new AusterlitzDbContext())
            {
                EnsureEconomyComputedSummaryTable(dataContext);
                foreach (var row in rows.Where(x => x != null && !string.IsNullOrWhiteSpace(x.Sphere)))
                {
                    dataContext.Database.ExecuteSqlCommand(@"
MERGE dbo.TR_EconomyComputedSummary AS target
USING (SELECT @TurnId AS TurnId, @Sphere AS Sphere) AS source
ON target.TurnId = source.TurnId AND target.Sphere = source.Sphere
WHEN MATCHED THEN
    UPDATE SET
        ComputedAtUtc = @ComputedAtUtc,
        ComputedVersion = @ComputedVersion,
        StartingRevenueLd = @StartingRevenueLd,
        ArmyMaintLd = @ArmyMaintLd,
        NavyMaintLd = @NavyMaintLd,
        ProductionMaintLd = @ProductionMaintLd,
        ArmyBuildingLd = @ArmyBuildingLd,
        ArmyTrainingLd = @ArmyTrainingLd,
        NavyBuildRepairLd = @NavyBuildRepairLd,
        ProductionBuildLd = @ProductionBuildLd,
        LdInBarracks = @LdInBarracks,
        BuildFundsAvailableLd = @BuildFundsAvailableLd,
        TransferToEuropeLd = @TransferToEuropeLd,
        TransferFromEuropeLd = @TransferFromEuropeLd,
        TransferToCaribbeanLd = @TransferToCaribbeanLd,
        TransferFromCaribbeanLd = @TransferFromCaribbeanLd,
        TransferToIndiaLd = @TransferToIndiaLd,
        TransferFromIndiaLd = @TransferFromIndiaLd,
        DirectSellingLd = @DirectSellingLd,
        DirectBuyingLd = @DirectBuyingLd,
        TaxesLd = @TaxesLd,
        LdProduction = @LdProduction,
        ProjectedNextMonthLd = @ProjectedNextMonthLd
WHEN NOT MATCHED THEN
    INSERT (
        TurnId, Sphere, ComputedAtUtc, ComputedVersion,
        StartingRevenueLd, ArmyMaintLd, NavyMaintLd, ProductionMaintLd,
        ArmyBuildingLd, ArmyTrainingLd, NavyBuildRepairLd, ProductionBuildLd,
        LdInBarracks, BuildFundsAvailableLd, TransferToEuropeLd, TransferFromEuropeLd,
        TransferToCaribbeanLd, TransferFromCaribbeanLd, TransferToIndiaLd, TransferFromIndiaLd,
        DirectSellingLd, DirectBuyingLd, TaxesLd, LdProduction, ProjectedNextMonthLd
    ) VALUES (
        @TurnId, @Sphere, @ComputedAtUtc, @ComputedVersion,
        @StartingRevenueLd, @ArmyMaintLd, @NavyMaintLd, @ProductionMaintLd,
        @ArmyBuildingLd, @ArmyTrainingLd, @NavyBuildRepairLd, @ProductionBuildLd,
        @LdInBarracks, @BuildFundsAvailableLd, @TransferToEuropeLd, @TransferFromEuropeLd,
        @TransferToCaribbeanLd, @TransferFromCaribbeanLd, @TransferToIndiaLd, @TransferFromIndiaLd,
        @DirectSellingLd, @DirectBuyingLd, @TaxesLd, @LdProduction, @ProjectedNextMonthLd
    );",
                        new SqlParameter("@TurnId", request.TurnId ?? string.Empty),
                        new SqlParameter("@Sphere", row.Sphere ?? string.Empty),
                        new SqlParameter("@ComputedAtUtc", (object)row.ComputedAtUtc ?? DBNull.Value),
                        new SqlParameter("@ComputedVersion", (object)row.ComputedVersion ?? DBNull.Value),
                        new SqlParameter("@StartingRevenueLd", row.StartingRevenueLd),
                        new SqlParameter("@ArmyMaintLd", row.ArmyMaintLd),
                        new SqlParameter("@NavyMaintLd", row.NavyMaintLd),
                        new SqlParameter("@ProductionMaintLd", row.ProductionMaintLd),
                        new SqlParameter("@ArmyBuildingLd", row.ArmyBuildingLd),
                        new SqlParameter("@ArmyTrainingLd", row.ArmyTrainingLd),
                        new SqlParameter("@NavyBuildRepairLd", row.NavyBuildRepairLd),
                        new SqlParameter("@ProductionBuildLd", row.ProductionBuildLd),
                        new SqlParameter("@LdInBarracks", row.LdInBarracks),
                        new SqlParameter("@BuildFundsAvailableLd", row.BuildFundsAvailableLd),
                        new SqlParameter("@TransferToEuropeLd", row.TransferToEuropeLd),
                        new SqlParameter("@TransferFromEuropeLd", row.TransferFromEuropeLd),
                        new SqlParameter("@TransferToCaribbeanLd", row.TransferToCaribbeanLd),
                        new SqlParameter("@TransferFromCaribbeanLd", row.TransferFromCaribbeanLd),
                        new SqlParameter("@TransferToIndiaLd", row.TransferToIndiaLd),
                        new SqlParameter("@TransferFromIndiaLd", row.TransferFromIndiaLd),
                        new SqlParameter("@DirectSellingLd", row.DirectSellingLd),
                        new SqlParameter("@DirectBuyingLd", row.DirectBuyingLd),
                        new SqlParameter("@TaxesLd", row.TaxesLd),
                        new SqlParameter("@LdProduction", row.LdProduction),
                        new SqlParameter("@ProjectedNextMonthLd", row.ProjectedNextMonthLd));
                }
            }

            return Ok(getTREconomyComputedSummary(request.TurnId));
        }

        private void EnsureEconomyComputedSummaryTable(AusterlitzDbContext dataContext)
        {
            dataContext.Database.ExecuteSqlCommand(@"
IF OBJECT_ID('dbo.TR_EconomyComputedSummary', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TR_EconomyComputedSummary (
        TurnId NVARCHAR(16) NOT NULL,
        Sphere NVARCHAR(16) NOT NULL,
        ComputedAtUtc DATETIME NULL,
        ComputedVersion INT NULL,
        StartingRevenueLd BIGINT NOT NULL DEFAULT 0,
        ArmyMaintLd BIGINT NOT NULL DEFAULT 0,
        NavyMaintLd BIGINT NOT NULL DEFAULT 0,
        ProductionMaintLd BIGINT NOT NULL DEFAULT 0,
        ArmyBuildingLd BIGINT NOT NULL DEFAULT 0,
        ArmyTrainingLd BIGINT NOT NULL DEFAULT 0,
        NavyBuildRepairLd BIGINT NOT NULL DEFAULT 0,
        ProductionBuildLd BIGINT NOT NULL DEFAULT 0,
        LdInBarracks BIGINT NOT NULL DEFAULT 0,
        BuildFundsAvailableLd BIGINT NOT NULL DEFAULT 0,
        TransferToEuropeLd BIGINT NOT NULL DEFAULT 0,
        TransferFromEuropeLd BIGINT NOT NULL DEFAULT 0,
        TransferToCaribbeanLd BIGINT NOT NULL DEFAULT 0,
        TransferFromCaribbeanLd BIGINT NOT NULL DEFAULT 0,
        TransferToIndiaLd BIGINT NOT NULL DEFAULT 0,
        TransferFromIndiaLd BIGINT NOT NULL DEFAULT 0,
        DirectSellingLd BIGINT NOT NULL DEFAULT 0,
        DirectBuyingLd BIGINT NOT NULL DEFAULT 0,
        TaxesLd BIGINT NOT NULL DEFAULT 0,
        LdProduction BIGINT NOT NULL DEFAULT 0,
        ProjectedNextMonthLd BIGINT NOT NULL DEFAULT 0,
        CONSTRAINT PK_TR_EconomyComputedSummary PRIMARY KEY (TurnId, Sphere)
    );
END");
        }

        public class EconomyComputedSummaryDto
        {
            public string TurnId { get; set; }
            public EconomyComputedSummaryRow[] Rows { get; set; }
        }

        public class EconomyComputedSummaryRow
        {
            public string TurnId { get; set; }
            public string Sphere { get; set; }
            public DateTime? ComputedAtUtc { get; set; }
            public int? ComputedVersion { get; set; }
            public long StartingRevenueLd { get; set; }
            public long ArmyMaintLd { get; set; }
            public long NavyMaintLd { get; set; }
            public long ProductionMaintLd { get; set; }
            public long ArmyBuildingLd { get; set; }
            public long ArmyTrainingLd { get; set; }
            public long NavyBuildRepairLd { get; set; }
            public long ProductionBuildLd { get; set; }
            public long LdInBarracks { get; set; }
            public long BuildFundsAvailableLd { get; set; }
            public long TransferToEuropeLd { get; set; }
            public long TransferFromEuropeLd { get; set; }
            public long TransferToCaribbeanLd { get; set; }
            public long TransferFromCaribbeanLd { get; set; }
            public long TransferToIndiaLd { get; set; }
            public long TransferFromIndiaLd { get; set; }
            public long DirectSellingLd { get; set; }
            public long DirectBuyingLd { get; set; }
            public long TaxesLd { get; set; }
            public long LdProduction { get; set; }
            public long ProjectedNextMonthLd { get; set; }
        }
    }
}
