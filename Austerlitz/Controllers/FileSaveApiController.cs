using Austerlitz.Models;
using Austerlitz.Models.SimBattle;
using System;
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

    public class FileSaveApiController : ApiController
    {
        //////http://stackoverflow.com/questions/10320232/how-to-accept-a-file-post-asp-net-mvc-4-webapi?lq=1

        [HttpPost]
        public bool PostNewSimBattle(SimBattleVm SimBattleVM)
        {

            string filePath = HttpContext.Current.Server.MapPath("~/" + "newSimBattle.txt");
            string firstLine = "Fed   /  Batt Group  / Dest 1  / Start Attack / Order / Add Order / Formation / Dest 2 / Dest 3 | Alt Condition  / Order / Add Order / Formation / Dest 1 / Dest 2 " + System.Environment.NewLine;

            System.IO.File.WriteAllLines(
                filePath,
                SimBattleVM.ArmyB.BattalionGroups.Select(bg => (
                        string.Format("{0,6}/{1,14}/{2,9}/{3,14}/{4,7}/{5,11}/{6,11}/{7,8}/{8,8}|{9,16}/{10,7}/{11,11}/{12,11}/{13,8}/{14,8}",
                            bg.Federation,
                            prepareInt(bg.BattGroup),
                            prepareCoordinates(bg.Dest0),
                            bg.StartAttack,
                            prepareInt(bg.Order),
                            bg.AddOrder,
                            prepareInt(bg.Formation),
                            prepareCoordinates(bg.Dest1),
                            prepareCoordinates(bg.Dest2),
                            prepareInt(bg.AltCondition),
                            prepareInt(bg.AltOrder),
                            bg.AltAddOrder,
                            prepareInt(bg.AltFormation),
                            prepareCoordinates(bg.AltDest1),
                            prepareCoordinates(bg.AltDest2)
                        ))));

            string currentContent = String.Empty;
            if (File.Exists(filePath))
            {
                currentContent = File.ReadAllText(filePath);
            }
            File.WriteAllText(filePath, firstLine + currentContent);

            //using (StreamWriter _testData = new StreamWriter(filePath, true))
            //{
            //    //_testData.WriteLine(SimBattleVM.ArmyB.Commander.CommanderName.ToString()); // Write the file.
            //    _testData.WriteLine("Fed   /  Batt Group  / Dest 1  / Start Attack / Order / Add Order / Formation / Dest 2 / Dest 3 | Alt Condition  / Order / Add Order / Formation / Dest 1 / Dest 2 ");

            //    foreach (BattalionGroup bg in SimBattleVM.ArmyB.BattalionGroups) {
            //        _testData.WriteLine("{0,6}/{1,14}/{2,9}/{3,14}/{4,7}/{5,11}/{6,11}/{7,8}/{8,8}|{9,16}/{10,7}/{11,11}/{12,11}/{13,8}/{14,8}  ",
            //            bg.Federation,
            //            bg.BattGroup,
            //            prepareCoordinates(bg.Dest0),
            //            bg.StartAttack,
            //            bg.Order,
            //            bg.AddOrder,
            //            bg.Formation,
            //            prepareCoordinates(bg.Dest1),
            //            prepareCoordinates(bg.Dest2),
            //            bg.AltCondition,
            //            bg.AltOrder,
            //            bg.AltAddOrder,
            //            bg.AltFormation,
            //            prepareCoordinates(bg.AltDest1),
            //            prepareCoordinates(bg.AltDest2));
            //    }
            //    _testData.Flush();
            //}  

            return true;
        }

        private string prepareInt(int i) {
            return (i <= 0 ) ? " - " : i.ToString();
        }


        private string prepareCoordinates(VmCoordinate coord)
        {
            return (coord != null && coord.X > 0 && coord.Y > 0) ? coord.X + "/" + coord.Y : " ";
        }
    }
}