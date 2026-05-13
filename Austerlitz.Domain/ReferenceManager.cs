using Austerlitz.DAL;
using Austerlitz.DAL.Management;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Austerlitz.Domain.Models;


namespace Austerlitz.Domain
{
    public class ReferenceManager
    {
        public REF_ArmyList[] GetArmyList(string state = "E")
        {
            using (var dataContext = new AusterlitzDbContext())
            {
                var armyListRepository = new Austerlitz.DAL.Management.GenericRepository<REF_ArmyList>(dataContext);

                IEnumerable<REF_ArmyList> armyList = armyListRepository
                    .GetItems(x => x.State == state )
                    .OrderBy(y => y.ItemNo);

                return armyList.ToArray();
            }
        }

        public RulesCatalog GetRulesCatalog()
        {
            var rtn = new RulesCatalog();

            using (var dataContext = new AusterlitzDbContext())
            {
                rtn.ArmyList = dataContext.REF_ArmyList.ToArray();
                rtn.Population = dataContext.REF_Population.ToArray();
                rtn.ProductionSites = dataContext.REF_ProductionSites.ToArray();
                rtn.Ships = dataContext.REF_Ships.ToArray();
                rtn.States = dataContext.REF_States.ToArray();
                rtn.Terrain = dataContext.REF_Terrain.ToArray();
                rtn.UnitWeightsRates = dataContext.REF_UnitWeightsRates.ToArray();
                rtn.PoliticalMapCoordinates = dataContext.REF_PoliticalMapCoordinates.ToArray();
            }

            return rtn;
        }
    }
}
