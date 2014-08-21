using Austerlitz.DAL;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;

namespace Austerlitz.Controllers
{
    public class TurnSheetApiController : ApiController
    {

        public TS_03SetUpBrigades[] GetTurnSheetSetUpBrigades(string turnId)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();

            return turnReportManager.GetTurnSheetSetUpBrigades(turnId);
        }

        [HttpPost]
        public TS_03SetUpBrigades[] PostTurnSheetSetUpBrigades(TS_03SetUpBrigades[] saveRecords)
        {
            var turnReportManager = new Austerlitz.Domain.TurnSheetManager();

            var saveResult = turnReportManager.PostTurnSheetSetUpBrigades(saveRecords);

            return saveResult;
        }


        //public REF_ArmyList[] GetArmyList()
        //{
        //    var refManager = new Austerlitz.DAL.Management.RefManager();

        //    return (from user in refManager.ArmyListRepository.Get() select user).ToArray();
        //}



        //public TS_01TransferGoods[] GetSetUpBrigadesCost(TS_03SetUpBrigades[] turnSheetSetUpBrigades) {

        //    var turnReportManager = new Austerlitz.DAL.Management.TurnReportManager();

        //    return turnReportManager.GetTurnSheetSetUpBrigadesCosts(turnSheetSetUpBrigades).ToArray();
        //}

    }
}