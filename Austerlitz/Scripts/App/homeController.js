'use strict';

function sendFile(file) {
    console.log(file.type);

    var data = new FormData();
    data.append("file1", file);

    $.ajax({
        type: 'post',
        url: '/Austerlitz/api/FileLoadApi/FilePost',
        data: data,
        success: function () {

            alert("File Load was successful");

            //http://stackoverflow.com/questions/15112584/using-scope-watch-and-scope-apply//
            //var scope = angular.element($("#mapPanel")).scope();
            //scope.$apply(function () {
            //    //                console.log(JSON.stringify(results, null, 2));
            //    if (!results.armyA.state) {
            //        results = "";
            //    } else {
            //        scope.results = results;
            //        scope.toggleHostArmy();
            //    }
            //});
        },
        error: function () {
            alert("Error while invoking the Web API");
        },
        contentType: false,
        processData: false
    });
};

austerlitzModule.controller("homeController", function ($scope, $routeParams, turnSheetFactory, turnReportFactory) {
    
    turnSheetFactory.getTSFullTurnDetails().then(function (turnSheet) {
        $scope.turnSheet = turnSheet;
    });

    turnReportFactory.getTRFullTurnDetails().then(function (turnReport) {
        $scope.turnReport = turnReport;
    });

});