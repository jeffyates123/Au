using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Austerlitz.DAL.Management
{
    public class TurnSheetManager
    {
        
        public TS_03SetUpBrigades[] GetBlankTurnSheetSetUpBrigades(string turnId)
        {
            var TSItems = new TS_03SetUpBrigades[8];

            for (var itemCount = 1; itemCount <= TSItems.Count(); itemCount++)
            {
                TS_03SetUpBrigades item = new TS_03SetUpBrigades() { TurnId = turnId, OrderNo = itemCount };
            }
            return TSItems;
        }
        




        /*
         *         private TurnSheetRepository<TS_01TransferGoods> _transferGoodsRepository;
        public TurnSheetRepository<TS_01TransferGoods> TransferGoodsRepository
        {
            get
            {
                if (this._transferGoodsRepository == null)
                    this._transferGoodsRepository = new TurnSheetRepository<TS_01TransferGoods>(_austerlitzDbContext);
                return _transferGoodsRepository;
            }
        }

        private TurnSheetRepository<TS_02DemolishItems> _demolishItemsRepository;
        public TurnSheetRepository<TS_02DemolishItems> DemolishItemsRepository
        {
            get
            {
                if (this._demolishItemsRepository == null)
                    this._demolishItemsRepository = new TurnSheetRepository<TS_02DemolishItems>(_austerlitzDbContext);
                return _demolishItemsRepository;
            }
        }

        private TurnSheetRepository<TS_03SetUpBrigades> _setUpBrigadesRepository;
        public TurnSheetRepository<TS_03SetUpBrigades> SetUpBrigadesRepository
        {
            get
            {
                if (this._setUpBrigadesRepository == null)
                    this._setUpBrigadesRepository = new TurnSheetRepository<TS_03SetUpBrigades>(_austerlitzDbContext);
                return _setUpBrigadesRepository;
            }
        }

        private TurnSheetRepository<TS_04SetUpAdditionalBrigades> _setUpAdditionalBrigadesRepository;
        public TurnSheetRepository<TS_04SetUpAdditionalBrigades> SetUpAdditionalBrigadesRepository
        {
            get
            {
                if (this._setUpAdditionalBrigadesRepository == null)
                    this._setUpAdditionalBrigadesRepository = new TurnSheetRepository<TS_04SetUpAdditionalBrigades>(_austerlitzDbContext);
                return _setUpAdditionalBrigadesRepository;
            }
        }

        private TurnSheetRepository<TS_05IncreaseHeadcount> _increaseHeadcountRepository;
        public TurnSheetRepository<TS_05IncreaseHeadcount> IncreaseHeadcountRepository
        {
            get
            {
                if (this._increaseHeadcountRepository == null)
                    this._increaseHeadcountRepository = new TurnSheetRepository<TS_05IncreaseHeadcount>(_austerlitzDbContext);
                return _increaseHeadcountRepository;
            }
        }

        private TurnSheetRepository<TS_06IncreaseBrigadeXP> _increaseBrigadeXPRepository;
        public TurnSheetRepository<TS_06IncreaseBrigadeXP> IncreaseBrigadeXPRepository
        {
            get
            {
                if (this._increaseBrigadeXPRepository == null)
                    this._increaseBrigadeXPRepository = new TurnSheetRepository<TS_06IncreaseBrigadeXP>(_austerlitzDbContext);
                return _increaseBrigadeXPRepository;
            }
        }

        private TurnSheetRepository<TS_07ExchangeBattalions> _exchangeBattalionsRepository;
        public TurnSheetRepository<TS_07ExchangeBattalions> ExchangeBattalionsRepository
        {
            get
            {
                if (this._exchangeBattalionsRepository == null)
                    this._exchangeBattalionsRepository = new TurnSheetRepository<TS_07ExchangeBattalions>(_austerlitzDbContext);
                return _exchangeBattalionsRepository;
            }
        }
        
        private TurnSheetRepository<TS_08MergeBattalions> _mergeBattalionsRepository;
        public TurnSheetRepository<TS_08MergeBattalions> MergeBattalionsRepository
        {
            get
            {
                if (this._mergeBattalionsRepository == null)
                    this._mergeBattalionsRepository = new TurnSheetRepository<TS_08MergeBattalions>(_austerlitzDbContext);
                return _mergeBattalionsRepository;
            }
        }

        private TurnSheetRepository<TS_09RepairShips_BaggageTrains> _repairShips_BaggageTrainsRepository;
        public TurnSheetRepository<TS_09RepairShips_BaggageTrains> RepairShips_BaggageTrainsRepository
        {
            get
            {
                if (this._repairShips_BaggageTrainsRepository == null)
                    this._repairShips_BaggageTrainsRepository = new TurnSheetRepository<TS_09RepairShips_BaggageTrains>(_austerlitzDbContext);
                return _repairShips_BaggageTrainsRepository;
            }
        }

        private TurnSheetRepository<TS_10BuildShips> _buildShipsRepository;
        public TurnSheetRepository<TS_10BuildShips> BuildShipsRepository
        {
            get
            {
                if (this._buildShipsRepository == null)
                    this._buildShipsRepository = new TurnSheetRepository<TS_10BuildShips>(_austerlitzDbContext);
                return _buildShipsRepository;
            }
        }

        private TurnSheetRepository<TS_11BuildBaggageTrain> _buildBaggageTrainRepository;
        public TurnSheetRepository<TS_11BuildBaggageTrain> BuildBaggageTrainRepository
        {
            get
            {
                if (this._buildBaggageTrainRepository == null)
                    this._buildBaggageTrainRepository = new TurnSheetRepository<TS_11BuildBaggageTrain>(_austerlitzDbContext);
                return _buildBaggageTrainRepository;
            }
        }

        private TurnSheetRepository<TS_12IncreasePopulationDensity> _increasePopulationDensityRepository;
        public TurnSheetRepository<TS_12IncreasePopulationDensity> IncreasePopulationDensityRepository
        {
            get
            {
                if (this._increasePopulationDensityRepository == null)
                    this._increasePopulationDensityRepository = new TurnSheetRepository<TS_12IncreasePopulationDensity>(_austerlitzDbContext);
                return _increasePopulationDensityRepository;
            }
        }

        private TurnSheetRepository<TS_13BuildProductionSites> _buildProductionSitesRepository;
        public TurnSheetRepository<TS_13BuildProductionSites> BuildProductionSitesRepository
        {
            get
            {
                if (this._buildProductionSitesRepository == null)
                    this._buildProductionSitesRepository = new TurnSheetRepository<TS_13BuildProductionSites>(_austerlitzDbContext);
                return _buildProductionSitesRepository;
            }
        }

        private TurnSheetRepository<TS_14FormFederations> _formFederationsRepository;
        public TurnSheetRepository<TS_14FormFederations> FormFederationsRepository
        {
            get
            {
                if (this._formFederationsRepository == null)
                    this._formFederationsRepository = new TurnSheetRepository<TS_14FormFederations>(_austerlitzDbContext);
                return _formFederationsRepository;
            }
        }

        private TurnSheetRepository<TS_15CoastalDefence> _coastalDefenceRepository;
        public TurnSheetRepository<TS_15CoastalDefence> CoastalDefenceRepository
        {
            get
            {
                if (this._coastalDefenceRepository == null)
                    this._coastalDefenceRepository = new TurnSheetRepository<TS_15CoastalDefence>(_austerlitzDbContext);
                return _coastalDefenceRepository;
            }
        }

        private TurnSheetRepository<TS_16SeaBlockade> _seaBlockadeRepository;
        public TurnSheetRepository<TS_16SeaBlockade> SeaBlockadeRepository
        {
            get
            {
                if (this._seaBlockadeRepository == null)
                    this._seaBlockadeRepository = new TurnSheetRepository<TS_16SeaBlockade>(_austerlitzDbContext);
                return _seaBlockadeRepository;
            }
        }

        private TurnSheetRepository<TS_17TradeAndLoading1> _tradeAndLoading1Repository;
        public TurnSheetRepository<TS_17TradeAndLoading1> TradeAndLoading1Repository
        {
            get
            {
                if (this._tradeAndLoading1Repository == null)
                    this._tradeAndLoading1Repository = new TurnSheetRepository<TS_17TradeAndLoading1>(_austerlitzDbContext);
                return _tradeAndLoading1Repository;
            }
        }

        private TurnSheetRepository<TS_18Movement> _movementRepository;
        public TurnSheetRepository<TS_18Movement> MovementRepository
        {
            get
            {
                if (this._movementRepository == null)
                    this._movementRepository = new TurnSheetRepository<TS_18Movement>(_austerlitzDbContext);
                return _movementRepository;
            }
        }
        
        private TurnSheetRepository<TS_19TradeAndLoading2> _tradeAndLoading2Repository;
        public TurnSheetRepository<TS_19TradeAndLoading2> TradeAndLoading2Repository
        {
            get
            {
                if (this._tradeAndLoading2Repository == null)
                    this._tradeAndLoading2Repository = new TurnSheetRepository<TS_19TradeAndLoading2>(_austerlitzDbContext);
                return _tradeAndLoading2Repository;
            }
        }

        private TurnSheetRepository<TS_20Boarding> _boardingRepository;
        public TurnSheetRepository<TS_20Boarding> BoardingRepository
        {
            get
            {
                if (this._boardingRepository == null)
                    this._boardingRepository = new TurnSheetRepository<TS_20Boarding>(_austerlitzDbContext);
                return _boardingRepository;
            }
        }

        private TurnSheetRepository<TS_21HandOverTerritory> _handOverTerritoryRepository;
        public TurnSheetRepository<TS_21HandOverTerritory> HandOverTerritoryRepository
        {
            get
            {
                if (this._handOverTerritoryRepository == null)
                    this._handOverTerritoryRepository = new TurnSheetRepository<TS_21HandOverTerritory>(_austerlitzDbContext);
                return _handOverTerritoryRepository;
            }
        }

        private TurnSheetRepository<TS_22ChangeNames> _changeNamesRepository;
        public TurnSheetRepository<TS_22ChangeNames> ChangeNamesRepository
        {
            get
            {
                if (this._changeNamesRepository == null)
                    this._changeNamesRepository = new TurnSheetRepository<TS_22ChangeNames>(_austerlitzDbContext);
                return _changeNamesRepository;
            }
        }

        private TurnSheetRepository<TS_23ChangeStateRelationships> _changeStateRelationshipsRepository;
        public TurnSheetRepository<TS_23ChangeStateRelationships> ChangeStateRelationshipsRepository
        {
            get
            {
                if (this._changeStateRelationshipsRepository == null)
                    this._changeStateRelationshipsRepository = new TurnSheetRepository<TS_23ChangeStateRelationships>(_austerlitzDbContext);
                return _changeStateRelationshipsRepository;
            }
        }
*/
    }
}
