using System.ComponentModel.DataAnnotations;

namespace Austerlitz.DAL
{
    public class TR_EconomySummary
    {
        [Key]
        public string TurnId { get; set; }
        public int ProductionMaintenanceLd { get; set; }
        public int EuropeMaintenanceWorkers { get; set; }
        public int CaribbeanMaintenanceWorkers { get; set; }
        public int IndiaMaintenanceWorkers { get; set; }
        public int CommanderPayLd { get; set; }
        public int BrigadePayLd { get; set; }
        public int NavyMaintenanceLd { get; set; }
        public int NavyMaintenanceMarines { get; set; }
        public int BarracksCount { get; set; }
        public int FactoriesCount { get; set; }
        public int WeavingMillsCount { get; set; }
        public int MintsCount { get; set; }
        public int EstatesCount { get; set; }
        public int SheepFarmsCount { get; set; }
        public int HorseFarmsCount { get; set; }
        public int LumberCampsCount { get; set; }
        public int QuarriesCount { get; set; }
        public int MinesCount { get; set; }
        public int VineyardsCount { get; set; }
        public int FreeAreasCount { get; set; }
    }
}
