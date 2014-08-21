using Austerlitz.DAL;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Austerlitz.Models.TurnReport
{
    public class TurnReport
    {
        TR_StateRelationships[] StateRelationships;
        TR_Warehouses[] Warehouses;
        TR_Barracks[] Barracks;
        TR_Commanders[] Commanders;
        TR_Brigades[] Brigades;
        TR_Warships[] Warships;
        TR_MerchantShips[] MerchantShips;
        TR_BaggageTrains[] BaggageTrains;
        TR_Spies[] Spies;
        TR_TradingPortsAndCities[] TradingPortAndCities;
    }
}