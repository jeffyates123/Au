using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Austerlitz.Models.SimBattle
{
    public class SimBattleVm
    {
        public VmMapCoordinate[][] Map { get; set; }
        
        public VmCoordinate[] StrategicPointsA { get; set; }
        public VmCoordinate[] StrategicPointsB { get; set; }

        public int GameNo { get; set; }
        public string State { get; set; }
        public string StateLetter { get; set; }

        public Army ArmyA { get; set; }
        public Army ArmyB { get; set; }
    }
}