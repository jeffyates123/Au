austerlitzModule.controller("menuController", function ($scope, turnSheetFactory, turnReportFactory) {

    $scope.init = function () {
        $scope.NEWturnID = '306EFeb1808';
        $scope.getTSFullTurnDetails($scope.NEWturnID);
        $scope.getTRFullTurnDetails($scope.NEWturnID);

        turnSheetFactory.getAllTSTurnDetails().then(function (tsTurnList) {
            $scope.tsTurnList = tsTurnList;
        });
    };

    $scope.getTSFullTurnDetails = function (turnId) {
        $scope.NEWturnID = turnId;
        turnSheetFactory.getTSFullTurnDetails(turnId).then(function (turnSheet) {
            $scope.turnSheet = turnSheet;
        });
    };

    $scope.getTRFullTurnDetails = function (turnId) {
        $scope.NEWturnID = turnId;
        turnReportFactory.getTRFullTurnDetails(turnId).then(function (turnReport) {
            $scope.turnReport = turnReport;
        });
    };
});
