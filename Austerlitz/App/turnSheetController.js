austerlitzModule.controller("turnSheetController", function ($scope, $routeParams, turnSheetFactory) {

    turnSheetFactory.getTSFullTurnDetails('306EFeb1808').then(function (turnsheet) {
        $scope.turnsheet = turnsheet;
    });

});
