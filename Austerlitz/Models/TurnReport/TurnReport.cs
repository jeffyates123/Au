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
    }
}