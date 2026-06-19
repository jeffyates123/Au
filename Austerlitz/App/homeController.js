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
        success: function (result) {

            alert("File Load was successful");

            //http://stackoverflow.com/questions/15112584/using-scope-watch-and-scope-apply//

            scope.$apply(function () {
                var loadedTurnId = (result && (result.turnId || result.TurnId)) ? (result.turnId || result.TurnId) : null;
                if (loadedTurnId && scope.masterData && scope.masterData.setSelectedTurnId) {
                    scope.masterData.setSelectedTurnId(loadedTurnId);
                }

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

window.sendTurnsheetImportFile = function (file) {
    var scope = angular.element($("#homePanel")).scope();
    if (!scope || !scope.importTurnsheetSpreadsheet) {
        return;
    }

    scope.$apply(function () {
        scope.importTurnsheetSpreadsheet(file);
    });
};

austerlitzModule.controller("homeController", function ($scope, $route, turnDataLoaderService, turnSheetFactory, masterData) {
    $scope.fileLoading = false;
    $scope.turnsheetImportLoading = false;
    $scope.masterData = masterData;

    $scope.importTurnsheetSpreadsheet = function (file) {
        if (!file) {
            alert('Select a turnsheet spreadsheet file to import.');
            return;
        }

        var turnId = $scope.masterData ? $scope.masterData.turnId : null;
        if (!turnId || turnId === 'Unknown') {
            alert('Select a valid turn before importing a turnsheet spreadsheet.');
            return;
        }

        $scope.turnsheetImportLoading = true;
        turnSheetFactory.importTurnsheetSpreadsheet(turnId, file).then(function (result) {
            var failedSections = result && result.failedSections ? result.failedSections : [];
            var summary = result && result.message ? result.message : 'Turnsheet import completed.';
            if (failedSections.length > 0) {
                var failureText = failedSections.map(function (x) {
                    var section = x && (x.section || x.Section) ? (x.section || x.Section) : 'Unknown';
                    var message = x && (x.message || x.Message) ? (x.message || x.Message) : 'Unknown error';
                    return section + ': ' + message;
                }).join('\n');
                summary += '\n\nFailed sections:\n' + failureText;
            }

            turnDataLoaderService.loadTurn($scope.masterData, turnId).finally(function () {
                $scope.turnsheetImportLoading = false;
                if ($route && $route.reload) {
                    $route.reload();
                }
                alert(summary);
            });
        }, function (error) {
            var detail = (error && error.data) ? error.data : '';
            $scope.turnsheetImportLoading = false;
            alert('Turnsheet import failed.' + (detail ? ' ' + detail : ''));
        });
    };
});