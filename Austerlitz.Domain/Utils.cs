using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Austerlitz.Domain
{
    public enum TurnSheetSection
    {
        TransferGoods=1,
        DemolishItems=2,
        SetUpBrigades=3,
        SetUpAdditionalBattalions=4,
        IncreaseHeadCount=5,
        IncreaseBrigadeExperience=6,
        ExchangeBattalions=7,
        MergeBattalions=8,
        RepairShipsAndBaggageTrains=9,
        BuildShips=10,
        BuildBaggageTrains=11,
        IncreasePopulationDensity=12,
        BuildProductionSites=13,
        FormFederations=14,
        CoastalDefence=15,
        SeaBlockade=16,
        TradeAndLoading1=17,
        Movement=18,
        TradeAndLoading2=19,
        Boarding=20,
        HandOverTerritory=21,
        ChangeNames=22,
        ChangeStateRelationships=23
    }


    public static class Utils
    {
        //306EFeb1808

        public static string getState(string turnId)
        {
            return turnId.Substring(3, 1);
        }

        public static string getGameNo(string turnId)
        {
            return turnId.Substring(0, 3);
        }

        public static string getMonth(string turnId)
        {
            return turnId.Substring(4, 3);
        }

        public static string getYear(string turnId)
        {
            return turnId.Substring(6, 4);
        }
    }
}
