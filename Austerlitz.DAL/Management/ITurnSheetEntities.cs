using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Austerlitz.DAL
{
    //http://www.remondo.net/repository-pattern-example-csharp/

    public interface ITurnSheetEntity
    {
        string TurnId { get; set; }
        int OrderNo { get; set; }
    }

    public partial class TS_01TransferGoods : ITurnSheetEntity { }
    public partial class TS_02DemolishItems : ITurnSheetEntity { }
    public partial class TS_03SetUpBrigades : ITurnSheetEntity { }
    public partial class TS_04SetUpAdditionalBrigades : ITurnSheetEntity { }
    public partial class TS_05IncreaseHeadcount : ITurnSheetEntity { }
    public partial class TS_06IncreaseBrigadeXP : ITurnSheetEntity { }
    public partial class TS_07ExchangeBattalions : ITurnSheetEntity { }
    public partial class TS_08MergeBattalions : ITurnSheetEntity { }
    public partial class TS_09RepairShips_BaggageTrains : ITurnSheetEntity { }
    public partial class TS_10BuildShips : ITurnSheetEntity { }
    public partial class TS_11BuildBaggageTrain : ITurnSheetEntity { }
    public partial class TS_12IncreasePopulationDensity : ITurnSheetEntity { }
    public partial class TS_13BuildProductionSites : ITurnSheetEntity { }
    public partial class TS_14FormFederations : ITurnSheetEntity { }
    public partial class TS_15CoastalDefence : ITurnSheetEntity { }
    public partial class TS_16SeaBlockade : ITurnSheetEntity { }
    public partial class TS_17TradeAndLoading1 : ITurnSheetEntity { }
    public partial class TS_18Movement : ITurnSheetEntity { }
    public partial class TS_19TradeAndLoading2 : ITurnSheetEntity { }
    public partial class TS_20Boarding : ITurnSheetEntity { }
    public partial class TS_21HandOverTerritory : ITurnSheetEntity { }
    public partial class TS_22ChangeNames : ITurnSheetEntity { }
    public partial class TS_23ChangeStateRelationships : ITurnSheetEntity { }
}
