using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Austerlitz.DAL.Management
{
    public class RefManager
    {
        //private AusterlitzDbContext _austerlitzDbContext = new AusterlitzDbContext();
        //private GenericRepository<REF_ArmyList> _armyListRepository;

        //public GenericRepository<REF_ArmyList> ArmyListRepository
        //{
        //    get
        //    {
        //        if (this._armyListRepository == null)
        //            this._armyListRepository = new GenericRepository<REF_ArmyList>(_austerlitzDbContext);
        //        return _armyListRepository;
        //    }
        //}

        public RefManager()
        {
        }

       // public IQueryable<REF_ArmyList> GetArmyList(string State)
       // {
       //     var ae = new AusterlitzDbContext();

       //     IQueryable<REF_ArmyList> armyListQuery = from armylist in ae.REF_ArmyList
       //                                              where armylist.State == State
       //                                              select armylist;

       //     return armyListQuery;
       //}
    }
}
