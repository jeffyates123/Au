using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Austerlitz.Models.TurnReport
{
    public class DisplayCoordinate
    {
        public string TurnId { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
        public string State { get; set; }
        public string ProductionSite { get; set; }
        public string Population { get; set; }
        public string Owner { get; set; }
        public string Terrain { get; set; }
        public string Bonus { get; set; }
        public string displayField { get; set; }
    }
}