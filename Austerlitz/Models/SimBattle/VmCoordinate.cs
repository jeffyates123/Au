using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Austerlitz.Models.SimBattle
{
    public class VmCoordinate
    {
        public int X { get; set; }
        public int Y { get; set; }
    }

    public class VmMapCoordinate : VmCoordinate
    {
        public string Terrain { get; set; }
        public int Height { get; set; }
        public int Federation { get; set; }
    }
}