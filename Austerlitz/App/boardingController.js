austerlitzModule.controller("boardingController", function ($scope, $routeParams, rulesCatalogFactory, turnSheetFactory, masterData) {

    $scope.masterData = masterData;

    $scope.displayedCollection = [].concat($scope.masterData.turnReport.merchantShips || []);

    $scope.$watch('displayedCollection', function (newVal) {
        if (!angular.isArray(newVal)) return;
        newVal.forEach(function (r) {
            if (r && r.isSelected) {
                console.log(r);
            }
        });
    }, true);
});
