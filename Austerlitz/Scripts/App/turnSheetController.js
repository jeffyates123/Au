austerlitzModule.controller("turnSheetController", function ($scope, $routeParams, turnSheetFactory) {

    turnSheetFactory.getTSFullTurnDetails().then(function (turnsheet) {
        $scope.turnsheet = turnsheet;

        //$scope.listTurnDetails = turnsheet.TSTurnDetails;
        //$scope.listTransferGoods = turnsheet.TSTransferGoods;
        //$scope.listDemolishItems= turnsheet.TSDemolishItems;
        //$scope.listSetUpBrigades= turnsheet.TSSetUpBrigades;
        //$scope.listSetUpAdditionalBrigades= turnsheet.TSSetUpAdditionalBrigades;
        //$scope.listIncreaseHeadcount= turnsheet.TSIncreaseHeadcount;
        //$scope.listIncreaseBrigadeXP= turnsheet.TSIncreaseBrigadeXP;
        //$scope.listExchangeBattalions= turnsheet.TSExchangeBattalions;
        //$scope.listMergeBattalions = turnsheet.TSMergeBattalions;
        //$scope.listRepairShips_BaggageTrains = turnsheet.TSRepairShips_BaggageTrains;
        //$scope.listBuildShips = turnsheet.TSBuildShips;
        //$scope.listBuildBaggageTrain = turnsheet.TSBuildBaggageTrain;
        //$scope.listIncreasePopulationDensity = turnsheet.TSIncreasePopulationDensity;
        //$scope.listBuildProductionSites = turnsheet.TSBuildProductionSites;
        //$scope.listFormFederations = turnsheet.TSFormFederations;
        //$scope.listCoastalDefence = turnsheet.TSCoastalDefence;
        //$scope.listSeaBlockade = turnsheet.TSSeaBlockade;
        //$scope.listTradeAndLoading2 = turnsheet.TSTradeAndLoading2;
        //$scope.listMovement = turnsheet.TSMovement;
        //$scope.listBoarding = turnsheet.TSBoarding;
        //$scope.listHandOverTerritory = turnsheet.TSHandOverTerritory;
        //$scope.listChangeNames = turnsheet.TSChangeNames;
        //$scope.listChangeStateRelationships = turnsheet.TSChangeStateRelationships;
    });

});
