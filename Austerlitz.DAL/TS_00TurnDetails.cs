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
    
    public partial class TS_00TurnDetails
    {
        public string TurnId { get; set; }
        public string State { get; set; }
        public string GameNo { get; set; }
        public string Month { get; set; }
        public Nullable<int> Year { get; set; }
        public string PlayerName { get; set; }
        public string AccountNo { get; set; }
        public Nullable<System.DateTime> ProcessDate { get; set; }
        public Nullable<int> FundsSentCash { get; set; }
        public Nullable<int> FundsSentCheque { get; set; }
        public Nullable<int> FundsSentPO { get; set; }
    }
}
