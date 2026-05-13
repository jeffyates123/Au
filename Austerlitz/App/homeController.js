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
        url: '/Api/FileLoadApi/FilePost',
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
        error: function (xhr, status, err) {
            var detail = xhr.responseText || err || status || "";
            if (detail.length > 500)
                detail = detail.substring(0, 500) + "…";
            scope.$apply(function () {
                scope.fileLoading = false;
            });
            alert("Error while invoking the Web API" + (xhr.status ? " (" + xhr.status + ")" : "") + (detail ? ": " + detail : ""));
        },
        contentType: false,
        processData: false
    });
};

austerlitzModule.controller("homeController", function ($scope, $routeParams, turnDataLoaderService, masterData) {
    $scope.fileLoading = false;
    $scope.selectedTurnDetails = {};
    $scope.masterData = masterData;

    $scope.loadTurnFromDataBase = function () {
    
        $scope.masterData.turnId = $scope.selectedTurnDetails.turnId;

        turnDataLoaderService.loadTurn($scope.masterData, $scope.masterData.turnId);
    }
});