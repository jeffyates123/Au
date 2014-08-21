using Austerlitz.DAL;
using Austerlitz.DAL.Management;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;


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
    }
}
