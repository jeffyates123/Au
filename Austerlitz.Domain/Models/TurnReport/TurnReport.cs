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
        public int OriginalItemNo { get; set; }
        public int[] MemberItemNos { get; set; }
        public int? FederationNo { get; set; }
        public ItemType ItemType { get; set; }
        public int? ShipTypeNo { get; set; }
        public int? OriginalMP { get; set; }
        public string Description { get; set; }
        public  Sphere Sphere  { get; set; }
        public int MP { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
    }

    public enum Sphere
    {
        Europe,
        Carribbean,
        India,
        Unknown
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
        public string State { get; set; }
        public string Phase { get; set; }
        public string Name { get; set; }
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
        public TR_TradingPortsAndCities[] TradingPortsAndCities;
        public DisplayCoordinate[][] MapCoordinates;
        public MovementItems[] MovementItemList;
        public MathBattleDetails[] MathBattles;
    }
}