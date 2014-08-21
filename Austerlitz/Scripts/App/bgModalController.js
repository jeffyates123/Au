
austerlitzModule.factory('bgModalFactory', function ($http, $q) {
    return {
        getOrdersList: function () {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/RulesCatalogApi/getOrdersList').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getFormationList: function () {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/RulesCatalogApi/getFormationList').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },        
        getAdditionalOrderList: function () {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/RulesCatalogApi/getAdditionalOrderList').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getArmyList: function () {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/RulesCatalogApi/getArmyList').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },

    }
});

austerlitzModule.controller('bgModalController', function ($scope, $modal, $log, bgModalFactory) {

    //$scope.togglearmy = function () {
    //    alert('togglearmy');
    //};

    //$scope.$on('openbgModalEvent', function (event, type) { 
    $scope.pickFromList = function (chosenList) {

        switch (chosenList) {
            case 'order':
            case 'altOrder':
                $scope.size = "";
                $scope.items = bgModalFactory.getOrdersList();
                break;
            case 'formation':
            case 'altFormation':
                $scope.size = "";
                $scope.items = bgModalFactory.getFormationList();
                break;
            case 'additionalOrder':
            case 'altAdditionalOrder':
                $scope.size = "";
                $scope.items = bgModalFactory.getAdditionalOrderList();
                break;
            case 'armyList':
                $scope.size = "";
                $scope.items = bgModalFactory.getArmyList();
        };

        var modalInstance = $modal.open({
            templateUrl: 'Austerlitz/Templates/bgPickListTemplate.html',
            controller: ModalInstanceController,
            size: $scope.size,
            resolve: {
                items: function () {
                    return $scope.items;
                }
            }
        });

        modalInstance.result.then(function (selectedItem) {
            $scope.selected = selectedItem;
            // if selections have been made then populate appropriately
            $scope.$emit('populateBGGrid', selectedItem, chosenList);

        }, function () {
            $log.info('Modal dismissed at: ' + new Date());
        });

    };

    //$scope.bgRadio_onClick = function (bgRadio_Selected) {
    //    $scope.$broadcast('openbgModalEvent', bgRadio_Selected);
    //    console.log('Selected: ' + $scope.selected.itemNo);
    //};

});

// Please note that $modalInstance represents a modal window (instance) dependency.
// It is not the same as the $modal service used above.

var ModalInstanceController = function ($scope, $modalInstance, items) {

    $scope.items = items;
    $scope.selected = {
        item: $scope.items[0]
    };

    $scope.ok = function () {
        $modalInstance.close($scope.selected.item);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};