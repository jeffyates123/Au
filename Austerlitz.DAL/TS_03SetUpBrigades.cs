//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated from a template.
//
//     Manual changes to this file may cause unexpected behavior in your application.
//     Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace Austerlitz.DAL
{
    using System;
    using System.Collections.Generic;
    
    public partial class TS_03SetUpBrigades
    {
        public TS_03SetUpBrigades()
        {
            this.Batt6 = 0;
            this.Batt7 = 0;
            this.BrigadeName = "<Brigade Name>";
        }
    
        public string TurnId { get; set; }
        public int OrderNo { get; set; }
        public Nullable<int> Depot { get; set; }
        public Nullable<int> Batt1 { get; set; }
        public Nullable<int> Batt2 { get; set; }
        public Nullable<int> Batt3 { get; set; }
        public Nullable<int> Batt4 { get; set; }
        public Nullable<int> Batt5 { get; set; }
        public Nullable<int> Batt6 { get; set; }
        public Nullable<int> Batt7 { get; set; }
        public string BrigadeName { get; set; }
    }
}
