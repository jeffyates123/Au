austerlitzModule.controller("menuController", function ($scope, turnSheetFactory, rulesCatalogFactory, turnDataLoaderService, masterData) {
    $scope.masterData = masterData;

    $scope.init = function () {
        $scope.masterData.turnId = '306EJan1808';
        $scope.masterData.getTSFullTurnDetails();
        $scope.masterData.getTRFullTurnDetails();
        $scope.getAllTurnsList();
        $scope.getRulesCatalog();
    };

    $scope.getAllTurnsList = function () {
        turnSheetFactory.getAllTurnsList().then(function (turnsList) {
            $scope.masterData.turnsList = turnsList;
        });
    };

    $scope.masterData.getTSFullTurnDetails = function () {
         return turnDataLoaderService.loadTS($scope.masterData, $scope.masterData.turnId);
    };

    $scope.masterData.getTRFullTurnDetails = function () {
        return turnDataLoaderService.loadTR($scope.masterData, $scope.masterData.turnId);
    };

    $scope.getRulesCatalog = function () {
        rulesCatalogFactory.getRulesCatalog().then(function (rulesCatalog) {
            $scope.masterData.rulesCatalog = rulesCatalog;
        });
    };
});
