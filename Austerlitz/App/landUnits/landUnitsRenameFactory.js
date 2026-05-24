'use strict';

austerlitzModule.factory('landUnitsRenameFactory', function () {
    return {
        attach: function ($scope, turnSheetFactory) {
            $scope.persistRenameOrder = function (brigade, newName) {
                    turnSheetFactory.getTSChangeNames($scope.masterData.turnId).then(function (rows) {
                        var targetRow = $scope.findMatchingRenameRow(rows, brigade.id)
                            || $scope.findNextEmptyTurnSheetRow(rows, ['itemNo', 'name']);
            
                        if (!targetRow) {
                            targetRow = { turnId: $scope.masterData.turnId, orderNo: (rows || []).length + 1 };
                            rows.push(targetRow);
                        }
            
                        targetRow.turnId = $scope.masterData.turnId;
                        targetRow.itemNo = brigade.id;
                        targetRow.name = newName;
            
                        return turnSheetFactory.postTSRecords(rows, 'ChangeNames').then(angular.noop, $scope.showTurnSheetOrderError);
                    }, $scope.showTurnSheetOrderError);
                };

            $scope.beginRenameBrigade = function (brigade) {
                    if (!brigade) {
                        return;
                    }
            
                    brigade.isRenaming = true;
                    brigade.pendingName = brigade.name;
                };

            $scope.onRenameKeydown = function ($event, brigade) {
                    if ($event.keyCode === 13) {
                        $event.preventDefault();
                        $scope.applyRenameBrigade(brigade);
                    }
                    else if ($event.keyCode === 27) {
                        $event.preventDefault();
                        $scope.cancelRenameBrigade(brigade);
                    }
                };

            $scope.applyRenameBrigade = function (brigade) {
                    if (!brigade || !brigade.isRenaming) {
                        return;
                    }
            
                    var newName = $scope.trimValue(brigade.pendingName).substr(0, 15);
                    if (!newName) {
                        newName = brigade.name;
                    }
            
                    brigade.name = newName;
                    brigade.isRenaming = false;
                    brigade.pendingName = null;
                    $scope.persistRenameOrder(brigade, newName);
                };

            $scope.cancelRenameBrigade = function (brigade) {
                    if (!brigade) {
                        return;
                    }
            
                    brigade.isRenaming = false;
                    brigade.pendingName = null;
                };

        }
    };
});
