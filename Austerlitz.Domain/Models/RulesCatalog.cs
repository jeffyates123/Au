using Austerlitz.DAL;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Austerlitz.Domain.Models
{
    public class RulesCatalog
    {
        public REF_ArmyList[] ArmyList { get; set; }
        public REF_Population[] Population { get; set; }
        public REF_ProductionSites[] ProductionSites { get; set; }
        public REF_Ships[] Ships { get; set; }
        public REF_States[] States { get; set; }
        public REF_Terrain[] Terrain { get; set; }
        public REF_UnitWeightsRates[] UnitWeightsRates { get; set; }
        public REF_PoliticalMapCoordinates[] PoliticalMapCoordinates { get; set; }
    }
}