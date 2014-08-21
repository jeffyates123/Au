using Austerlitz.DAL;
using Austerlitz.DAL.Management;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Austerlitz.Domain
{
    public class TurnSheetManager
    {

        public TS_03SetUpBrigades[] GetTurnSheetSetUpBrigades(string turnId)
        {
            var tsItems = new TS_03SetUpBrigades[8];

            for (var itemCount = 1; itemCount <= tsItems.Count(); itemCount++)
            {
                TS_03SetUpBrigades item = new TS_03SetUpBrigades() { TurnId = turnId, OrderNo = itemCount };
                tsItems[itemCount - 1] = item;
            }
            return tsItems;
        }

        public TS_03SetUpBrigades[] PostTurnSheetSetUpBrigades(TS_03SetUpBrigades[] setUpBrigadeCosts)
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var setUpBrigadeCost = new TurnSheetRepository<TS_03SetUpBrigades>(dataContext);

                var result = setUpBrigadeCost.SaveRange(setUpBrigadeCosts);

                return result.ToArray();
            }
        }
    }
}
