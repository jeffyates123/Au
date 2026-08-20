using Austerlitz.DAL;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Austerlitz.Models.TurnReport
{
    public enum ItemType
    {
        Commander,
        Brigade,
        Warship,
        MerchantShip,
        BaggageTrain,
        Spy
    }

    public class MovementItems
    {
        public int ItemNo { get; set; }
        public ItemType ItemType { get; set; }
        public int MP { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
    }

    public class MathBattlePhaseMetrics
    {
        public int StateAMen { get; set; }
        public int StateABattlePoints { get; set; }
        public int StateALosses { get; set; }
        public int StateBMen { get; set; }
        public int StateBBattlePoints { get; set; }
        public int StateBLosses { get; set; }
    }

    public class MathBattleBrigade
    {
        public int MathBattleBrigadeId { get; set; }
        public int MathBattleNo { get; set; }
        public string State { get; set; }
        public string Phase { get; set; }
        public string Name { get; set; }
        public int? CalcLR { get; set; }
        public int? CalcArtileery { get; set; }
        public int? CalcHC { get; set; }
        public int? CalcTotal { get; set; }
        public string Batt1Type { get; set; }
        public int? Batt1EF { get; set; }
        public int? Batt1Size { get; set; }
        public string Batt2Type { get; set; }
        public int? Batt2EF { get; set; }
        public int? Batt2Size { get; set; }
        public string Batt3Type { get; set; }
        public int? Batt3EF { get; set; }
        public int? Batt3Size { get; set; }
        public string Batt4Type { get; set; }
        public int? Batt4EF { get; set; }
        public int? Batt4Size { get; set; }
        public string Batt5Type { get; set; }
        public int? Batt5EF { get; set; }
        public int? Batt5Size { get; set; }
        public string Batt6Type { get; set; }
        public int? Batt6EF { get; set; }
        public int? Batt6Size { get; set; }
        public string Batt7Type { get; set; }
        public int? Batt7EF { get; set; }
        public int? Batt7Size { get; set; }
    }

    public class MathBattleDetails
    {
        public int MathBattleNo { get; set; }
        public bool IsEstimated { get; set; }
        public string StateA { get; set; }
        public string StateB { get; set; }
        public string Winner { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
        public string Terrain { get; set; }
        public int StateAMenTotal { get; set; }
        public int StateALossesTotal { get; set; }
        public int StateABattleRate { get; set; }
        public int StateBMenTotal { get; set; }
        public int StateBLossesTotal { get; set; }
        public int StateBBattleRate { get; set; }
        public MathBattlePhaseMetrics Art { get; set; }
        public MathBattlePhaseMetrics LR1 { get; set; }
        public MathBattlePhaseMetrics H2H1 { get; set; }
        public MathBattlePhaseMetrics H2H2 { get; set; }
        public MathBattlePhaseMetrics LR2 { get; set; }
        public MathBattleBrigade[] Brigades { get; set; }
    }

    public class SeaBattleGroupSummary
    {
        public int TonnageBegin { get; set; }
        public int TonnageEnd { get; set; }
        public decimal TonnageLossPct { get; set; }
        public int MarinesBegin { get; set; }
        public int MarinesEnd { get; set; }
        public decimal MarinesLossPct { get; set; }
        public decimal AverageLossPct { get; set; }
    }

    public class SeaBattleSummary
    {
        public SeaBattleGroupSummary GroupA { get; set; }
        public SeaBattleGroupSummary GroupB { get; set; }
    }

    public class SeaBattleShip
    {
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

    public class SeaBattleLongRangeAction
    {
        public int RoundNo { get; set; }
        public string GroupSide { get; set; }
        public int ReportShipNo { get; set; }
        public int ShipType { get; set; }
        public int Tonnage { get; set; }
        public int Marines { get; set; }
        public int EnemyShipNo { get; set; }
    }

    public class SeaBattleBoardingAction
    {
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

    public class SeaBattleMerchantCapture
    {
        public int RoundNo { get; set; }
        public int CapturedShipNo { get; set; }
        public int CapturedByShipNo { get; set; }
    }

    public class SeaBattleDetails
    {
        public int SeaBattleNo { get; set; }
        public string GroupAName { get; set; }
        public string GroupBName { get; set; }
        public string StateA { get; set; }
        public string StateB { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
        public string WinnerGroup { get; set; }
        public string WinnerText { get; set; }
        public SeaBattleSummary Summary { get; set; }
        public SeaBattleShip[] Ships { get; set; }
        public SeaBattleLongRangeAction[] LongRangeActions { get; set; }
        public SeaBattleBoardingAction[] BoardingActions { get; set; }
        public SeaBattleMerchantCapture[] MerchantCaptures { get; set; }
    }

    public class TurnOrderError
    {
        public int TurnOrderErrorId { get; set; }
        public string TurnId { get; set; }
        public int SectionNo { get; set; }
        public int OrderNo { get; set; }
        public int ErrorCode { get; set; }
        public string Message { get; set; }
        public string RawToken { get; set; }
    }

    public class ArmyPosition
    {
        public string TurnId { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
        public string State { get; set; }
        public int Bat { get; set; }
    }

    public class EpidemicPosition
    {
        public string TurnId { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
        public string State { get; set; }
    }

    public class TurnReport
    {
        public TR_StateRelationships[] StateRelationships;
        public TR_Warehouses[] Warehouses;
        public TR_Barracks[] Barracks;
        public TR_Commanders[] Commanders;
        public TR_Brigades[] Brigades;
        public TR_Warships[] Warships;
        public TR_MerchantShips[] MerchantShips;
        public TR_BaggageTrains[] BaggageTrains;
        public TR_Spies[] Spies;
        public ArmyPosition[] ArmyPositions;
        public EpidemicPosition[] Epidemics;
        public TR_TradingPortsAndCities[] TradingPortsAndCities;
        public TR_EconomySummary EconomySummary;
        public DisplayCoordinate[][] MapCoordinates;
        public MovementItems[] MovementItemList;
        public MathBattleDetails[] MathBattles;
        public SeaBattleDetails[] SeaBattles;
        public TurnOrderError[] Errors;
    }
}