﻿using Austerlitz.DAL;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Austerlitz.Domain
{
    public class BrigadeCalculator
    {
        //public TS_03SetUpBrigades[] CalculateCostTSSetUpBrigades(string turnId)
        //{
        //    AusterlitzDbContext _auDB = new AusterlitzDbContext();

        //    //var referenceManager = new ReferenceManager();
        //    //var turnSheetManager = new Austerlitz.Domain.TurnSheetManager();

        //    //var armyList = referenceManager.GetArmyList();

        //    //var existingRecords = turnSheetManager.GetTSTransferGoods(turnId).Where(x=>x.TurnSheetSectionNo==(int)TurnSheetSection.SetUpBrigades);
        //    //_auDB.TS_01TransferGoods.RemoveRange(existingRecords);

        //    //TS_03SetUpBrigades[] transferGoods = turnSheetManager.GetTSSetUpBrigades(setupBrigades[0].TurnId).ToArray();

        //    ////foreach (TS_03SetUpBrigades setupBrigade in setupBrigades)
        //    ////{

        //    //    addTurnSheetSetUpBattalionCosts(transferGoods[0], setupBrigade.Batt1, armyList);
        //    //    addTurnSheetSetUpBattalionCosts(transferGoods[0], setupBrigade.Batt2, armyList);
        //    //    addTurnSheetSetUpBattalionCosts(transferGoods[0], setupBrigade.Batt3, armyList);
        //    //    addTurnSheetSetUpBattalionCosts(transferGoods[0], setupBrigade.Batt4, armyList);
        //    //    addTurnSheetSetUpBattalionCosts(transferGoods[0], setupBrigade.Batt5, armyList);
        //    //    //addTurnSheetSetUpBattalionCosts(transferGoods[0], setupBrigade.Batt6, armyList);
        //    //    //addTurnSheetSetUpBattalionCosts(transferGoods[0], setupBrigade.Batt7, armyList);
        //    //};
        //    //return transferGoods;
        //}


        private TS_01TransferGoods addTurnSheetSetUpBattalionCosts(TS_01TransferGoods transferGood, int setupBattalionItemNo, IQueryable<REF_ArmyList> armyList)
        {
            if (setupBattalionItemNo > 0)
            {
                // just calculated for the total and put in one warehouse for now until we select the barrackno too
                var armyListBrigade = armyList.FirstOrDefault(x => x.ItemNo == setupBattalionItemNo);

                transferGood.Citizens = transferGood.Citizens + 800;
                transferGood.EcPts = transferGood.EcPts + armyListBrigade.EcPtsPer25 * 32; //* need to get the armylists
                transferGood.Louisdore = transferGood.Louisdore + armyListBrigade.Cost * 800;
                if (armyListBrigade.IsCavalry)
                    transferGood.Horses = transferGood.Horses + 800;
            }

            return transferGood;
        }
    }
}
