'use strict';

function sendFile(file) {
    console.log(file.type);

    var data = new FormData();
    data.append("file1", file);
    var scope = angular.element($("#homePanel")).scope();
    scope.$apply(function () {
        scope.fileLoading = true;
    });

    $.ajax({
        type: 'post',
        url: '/Austerlitz/api/FileLoadApi/FilePost',
        data: data,
        success: function () {

            alert("File Load was successful");

            //http://stackoverflow.com/questions/15112584/using-scope-watch-and-scope-apply//

            scope.$apply(function () {
                //scope.myVar = scope.myVar + 1; // trigger a change in a watched data cell which does stuff
                scope.init(); // or call a function directly instead?
                scope.fileLoading = false;
            });
        },
        error: function () {
            alert("Error while invoking the Web API");
        },
        contentType: false,
        processData: false
    });
};

austerlitzModule.controller("homeController", function ($scope, $routeParams, turnSheetFactory, turnReportFactory) {
    //$scope.myVar = 1;
    //$scope.$watch('myVar', function () {
    //    alert('myVarChanged' + $scope.myVar);
    //    $scope.init();
    //});
    $scope.fileLoading = false;
    $scope.selectedTurnId = "";

    turnSheetFactory.getAllTSTurnDetails().then(function (tsTurnList) {
        $scope.tsTurnList = tsTurnList;
    });
    $scope.turnDetailsBeingLoaded = false;

    turnSheetFactory.getTSFullTurnDetails($scope.selectedTurnId).then(function (turnSheet) {
        $scope.turnSheet = turnSheet;
    });

    turnReportFactory.getTRFullTurnDetails($scope.selectedTurnId).then(function (turnReport) {
        $scope.turnReport = turnReport;
    });

    $scope.loadTurnFromDataBase = function () {
        $scope.turnDetailsBeingLoaded = true;
        $scope.selectedTurnId = $scope.selectedTurnDetails.turnId;

        turnSheetFactory.getTSFullTurnDetails($scope.selectedTurnId).then(function (turnSheet) {
            $scope.turnSheet = turnSheet;
        });

        turnReportFactory.getTRFullTurnDetails($scope.selectedTurnId).then(function (turnReport) {
            $scope.turnReport = turnReport;
        });
    }
});