
austerlitzModule.factory('turnSheetFactory', function ($http, $q) {
    return {
        postTSRecords: function (tsRecords, tsType) {
            var deferred = $q.defer();
            $http.post('/Austerlitz/api/TurnSheetApi/postTS' + tsType, JSON.stringify(tsRecords),
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
            getAllTSTurnDetails: function () {
                var deferred = $q.defer();
                $http.get('/Austerlitz/api/TurnSheetApi/getAllTSTurnDetails').success(deferred.resolve).error(deferred.reject);
                return deferred.promise;
    },        getTSFullTurnDetails: function (turnId) {
        var deferred = $q.defer();
        $http.get('/Austerlitz/api/TurnSheetApi/getTSFullTurnDetails?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
        return deferred.promise;
    },
        getTSTurnDetails: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/getTSTurnDetails?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSTransferGoods: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/getTSTransferGoods?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSDemolishItems: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/GetTSDemolishItems?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSSetUpBrigades: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/getTSSetUpBrigades?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSSetUpAdditionalBrigades: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/getTSSetUpAdditionalBrigades?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSIncreaseHeadcount: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/getTSIncreaseHeadcount?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSIncreaseBrigadeXP: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/getTSIncreaseBrigadeXP?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSExchangeBattalions: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/getTSExchangeBattalions?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSMergeBattalions: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/getTSMergeBattalions?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSRepairShips_BaggageTrains: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/getTSRepairShips_BaggageTrains?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSBuildShips: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/getTSBuildShips?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSBuildBaggageTrain: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/getTSBuildBaggageTrain?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSIncreasePopulationDensity: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/getTSIncreasePopulationDensity?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSBuildProductionSites: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/getTSBuildProductionSites?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSFormFederations: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/getTSFormFederations?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSCoastalDefence: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/getTSCoastalDefence?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSSeaBlockade: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/getTSSeaBlockade?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSTradeAndLoading1: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/getTSTradeAndLoading1?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSMovement: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/getTSMovement?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        postTSMovement: function (tsRecords) {
            var deferred = $q.defer();
            $http.post('/Austerlitz/api/TurnSheetApi/postTSMovement', JSON.stringify(tsRecords),
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSTradeAndLoading2: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/getTSTradeAndLoading2?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSBoarding: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/getTSBoarding?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSHandOverTerritory: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/getTSHandOverTerritory?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSChangeNames: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/getTSChangeNames?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSChangeStateRelationships: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/getTSChangeStateRelationships?turnId=' + '306EFeb1808').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        postTurnSheetSetUpBrigades: function (turnSheetSetUpBrigades) {
            var deferred = $q.defer();
            $http.post('/Austerlitz/api/TurnSheetApi/postTurnSheetSetUpBrigades', JSON.stringify(turnSheetSetUpBrigades),
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
    }
});