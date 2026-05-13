using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Austerlitz.Models.SimBattle
{
    public class Battalion
    {
        public int EF { get; set; }
        public int size { get; set; }
    }

    public class BattalionGroup
    {
        public int Federation { get; set; }
        public int BattGroup { get; set; }
        public VmCoordinate Dest0 { get; set; }
        public int StartAttack { get; set; }
        public int Order { get; set; }
        public int AddOrder { get; set; }
        public int Formation { get; set; }
        public VmCoordinate Dest1 { get; set; }
        public VmCoordinate Dest2 { get; set; }

        public int AltCondition {get;set;}
        public int AltOrder {get;set;}
        public int AltAddOrder {get;set;}
        public int AltFormation {get;set;}
        public VmCoordinate AltDest1 { get; set; }
        public VmCoordinate AltDest2 { get; set; }

        public string Type { get; set; } 
        public Battalion[] Battalions { get; set; }
        public decimal TotalEF { get; set; }
        public int TotalSize { get; set; }
        public decimal PercentMaxSize { get; set; }
        public bool IsDeployed { get; set; }
    }

    public class Commander
    {
        public string CommanderName { get; set; }
        public int Capability { get; set; }
        public int CommandIsInFed { get; set; }
    }

    public class TurnSheet
    {
        public int AuNo { get; set; }
        public int SimNo { get; set; }
        public DateTime DeadlineDate { get; set; }
    }

    public class Army
    {
        public string State { get; set; }
        public string PlayerAccountNo { get; set; }

        public Commander Commander { get; set; }
        
        public VmCoordinate FortressEntrenchments { get; set; }

        public BattalionGroup[] BattalionGroups { get; set; }
    }
}

