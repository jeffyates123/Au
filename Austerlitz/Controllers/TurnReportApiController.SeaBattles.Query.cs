using Austerlitz.DAL;
using Austerlitz.Models.TurnReport;
using System.Data.SqlClient;
using System.Linq;

namespace Austerlitz.Controllers
{
    public partial class TurnReportApiController
    {
        public SeaBattleDetails[] getTRSeaBattles(string turnId)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var battleRows = dataContext.Database.SqlQuery<SeaBattleRow>(@"
SELECT
    TurnId, SeaBattleNo, GroupAName, GroupBName, StateA, StateB, X, Y, WinnerGroup, WinnerText,
    GroupATonnageBegin, GroupATonnageEnd, GroupATonnageLossPct,
    GroupAMarinesBegin, GroupAMarinesEnd, GroupAMarinesLossPct, GroupAAverageLossPct,
    GroupBTonnageBegin, GroupBTonnageEnd, GroupBTonnageLossPct,
    GroupBMarinesBegin, GroupBMarinesEnd, GroupBMarinesLossPct, GroupBAverageLossPct
FROM dbo.TR_SeaBattles
WHERE TurnId = @turnId
ORDER BY SeaBattleNo", new SqlParameter("@turnId", turnId ?? string.Empty)).ToArray();

                var shipRows = dataContext.Database.SqlQuery<SeaBattleShipRow>(@"
SELECT
    TurnId, SeaBattleNo, GroupSide, Phase, ShipKind, ReportShipNo, FinalItemNo, Type, Name, Tonnage, Marines, Brigade, ConditionPct, Goods1, Goods2
FROM dbo.TR_SeaBattleShips
WHERE TurnId = @turnId
ORDER BY SeaBattleNo, GroupSide, Phase, ShipKind, ISNULL(ReportShipNo, 0), ISNULL(FinalItemNo, 0)",
                    new SqlParameter("@turnId", turnId ?? string.Empty)).ToArray();

                var longRangeRows = dataContext.Database.SqlQuery<SeaBattleLongRangeRow>(@"
SELECT
    TurnId, SeaBattleNo, RoundNo, GroupSide, ReportShipNo, ShipType, Tonnage, Marines, EnemyShipNo
FROM dbo.TR_SeaBattleLongRangeActions
WHERE TurnId = @turnId
ORDER BY SeaBattleNo, RoundNo, GroupSide, ReportShipNo",
                    new SqlParameter("@turnId", turnId ?? string.Empty)).ToArray();

                var boardingRows = dataContext.Database.SqlQuery<SeaBattleBoardingRow>(@"
SELECT
    TurnId, SeaBattleNo, RoundNo, ActionNo, AttackerShipNo, AttackerGroupSide, AttackerMarines, AttackerOutcome, DefenderShipNo, DefenderGroupSide, DefenderMarines, DefenderOutcome
FROM dbo.TR_SeaBattleBoardingActions
WHERE TurnId = @turnId
ORDER BY SeaBattleNo, RoundNo, ActionNo",
                    new SqlParameter("@turnId", turnId ?? string.Empty)).ToArray();

                var merchantCaptureRows = dataContext.Database.SqlQuery<SeaBattleMerchantCaptureRow>(@"
SELECT
    TurnId, SeaBattleNo, RoundNo, CapturedShipNo, CapturedByShipNo
FROM dbo.TR_SeaBattleMerchantCaptures
WHERE TurnId = @turnId
ORDER BY SeaBattleNo, RoundNo, CapturedShipNo",
                    new SqlParameter("@turnId", turnId ?? string.Empty)).ToArray();

                return battleRows.Select(battle => new SeaBattleDetails
                {
                    SeaBattleNo = battle.SeaBattleNo,
                    GroupAName = battle.GroupAName,
                    GroupBName = battle.GroupBName,
                    StateA = battle.StateA,
                    StateB = battle.StateB,
                    X = battle.X,
                    Y = battle.Y,
                    WinnerGroup = battle.WinnerGroup,
                    WinnerText = battle.WinnerText,
                    Summary = new SeaBattleSummary
                    {
                        GroupA = new SeaBattleGroupSummary
                        {
                            TonnageBegin = battle.GroupATonnageBegin,
                            TonnageEnd = battle.GroupATonnageEnd,
                            TonnageLossPct = battle.GroupATonnageLossPct,
                            MarinesBegin = battle.GroupAMarinesBegin,
                            MarinesEnd = battle.GroupAMarinesEnd,
                            MarinesLossPct = battle.GroupAMarinesLossPct,
                            AverageLossPct = battle.GroupAAverageLossPct
                        },
                        GroupB = new SeaBattleGroupSummary
                        {
                            TonnageBegin = battle.GroupBTonnageBegin,
                            TonnageEnd = battle.GroupBTonnageEnd,
                            TonnageLossPct = battle.GroupBTonnageLossPct,
                            MarinesBegin = battle.GroupBMarinesBegin,
                            MarinesEnd = battle.GroupBMarinesEnd,
                            MarinesLossPct = battle.GroupBMarinesLossPct,
                            AverageLossPct = battle.GroupBAverageLossPct
                        }
                    },
                    Ships = shipRows
                        .Where(x => x.SeaBattleNo == battle.SeaBattleNo)
                        .Select(x => new SeaBattleShip
                        {
                            GroupSide = x.GroupSide,
                            Phase = x.Phase,
                            ShipKind = x.ShipKind,
                            ReportShipNo = x.ReportShipNo,
                            FinalItemNo = x.FinalItemNo,
                            Type = x.Type,
                            Name = x.Name,
                            Tonnage = x.Tonnage,
                            Marines = x.Marines,
                            Brigade = x.Brigade,
                            ConditionPct = x.ConditionPct,
                            Goods1 = x.Goods1,
                            Goods2 = x.Goods2
                        }).ToArray(),
                    LongRangeActions = longRangeRows
                        .Where(x => x.SeaBattleNo == battle.SeaBattleNo)
                        .Select(x => new SeaBattleLongRangeAction
                        {
                            RoundNo = x.RoundNo,
                            GroupSide = x.GroupSide,
                            ReportShipNo = x.ReportShipNo,
                            ShipType = x.ShipType,
                            Tonnage = x.Tonnage,
                            Marines = x.Marines,
                            EnemyShipNo = x.EnemyShipNo
                        }).ToArray(),
                    BoardingActions = boardingRows
                        .Where(x => x.SeaBattleNo == battle.SeaBattleNo)
                        .Select(x => new SeaBattleBoardingAction
                        {
                            RoundNo = x.RoundNo,
                            ActionNo = x.ActionNo,
                            AttackerShipNo = x.AttackerShipNo,
                            AttackerGroupSide = x.AttackerGroupSide,
                            AttackerMarines = x.AttackerMarines,
                            AttackerOutcome = x.AttackerOutcome,
                            DefenderShipNo = x.DefenderShipNo,
                            DefenderGroupSide = x.DefenderGroupSide,
                            DefenderMarines = x.DefenderMarines,
                            DefenderOutcome = x.DefenderOutcome
                        }).ToArray(),
                    MerchantCaptures = merchantCaptureRows
                        .Where(x => x.SeaBattleNo == battle.SeaBattleNo)
                        .Select(x => new SeaBattleMerchantCapture
                        {
                            RoundNo = x.RoundNo,
                            CapturedShipNo = x.CapturedShipNo,
                            CapturedByShipNo = x.CapturedByShipNo
                        }).ToArray()
                }).ToArray();
            }
        }

        private class SeaBattleRow
        {
            public string TurnId { get; set; }
            public int SeaBattleNo { get; set; }
            public string GroupAName { get; set; }
            public string GroupBName { get; set; }
            public string StateA { get; set; }
            public string StateB { get; set; }
            public int X { get; set; }
            public int Y { get; set; }
            public string WinnerGroup { get; set; }
            public string WinnerText { get; set; }
            public int GroupATonnageBegin { get; set; }
            public int GroupATonnageEnd { get; set; }
            public decimal GroupATonnageLossPct { get; set; }
            public int GroupAMarinesBegin { get; set; }
            public int GroupAMarinesEnd { get; set; }
            public decimal GroupAMarinesLossPct { get; set; }
            public decimal GroupAAverageLossPct { get; set; }
            public int GroupBTonnageBegin { get; set; }
            public int GroupBTonnageEnd { get; set; }
            public decimal GroupBTonnageLossPct { get; set; }
            public int GroupBMarinesBegin { get; set; }
            public int GroupBMarinesEnd { get; set; }
            public decimal GroupBMarinesLossPct { get; set; }
            public decimal GroupBAverageLossPct { get; set; }
        }

        private class SeaBattleShipRow
        {
            public string TurnId { get; set; }
            public int SeaBattleNo { get; set; }
            public string GroupSide { get; set; }
            public string Phase { get; set; }
            public string ShipKind { get; set; }
            public int? ReportShipNo { get; set; }
            public int? FinalItemNo { get; set; }
            public int? Type { get; set; }
            public string Name { get; set; }
            public int? Tonnage { get; set; }
            public int? Marines { get; set; }
            public string Brigade { get; set; }
            public int? ConditionPct { get; set; }
            public int? Goods1 { get; set; }
            public int? Goods2 { get; set; }
        }

        private class SeaBattleLongRangeRow
        {
            public string TurnId { get; set; }
            public int SeaBattleNo { get; set; }
            public int RoundNo { get; set; }
            public string GroupSide { get; set; }
            public int ReportShipNo { get; set; }
            public int ShipType { get; set; }
            public int Tonnage { get; set; }
            public int Marines { get; set; }
            public int EnemyShipNo { get; set; }
        }

        private class SeaBattleBoardingRow
        {
            public string TurnId { get; set; }
            public int SeaBattleNo { get; set; }
            public int RoundNo { get; set; }
            public int ActionNo { get; set; }
            public int AttackerShipNo { get; set; }
            public string AttackerGroupSide { get; set; }
            public int AttackerMarines { get; set; }
            public string AttackerOutcome { get; set; }
            public int DefenderShipNo { get; set; }
            public string DefenderGroupSide { get; set; }
            public int DefenderMarines { get; set; }
            public string DefenderOutcome { get; set; }
        }

        private class SeaBattleMerchantCaptureRow
        {
            public string TurnId { get; set; }
            public int SeaBattleNo { get; set; }
            public int RoundNo { get; set; }
            public int CapturedShipNo { get; set; }
            public int CapturedByShipNo { get; set; }
        }
    }
}
