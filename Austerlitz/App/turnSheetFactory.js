
austerlitzModule.factory('turnSheetFactory', function ($http, $q) {
    return {
        postTSRecords: function (tsRecords, tsType) {
            var deferred = $q.defer();
            $http.post('/Api/TurnSheetApi/postTS' + tsType, JSON.stringify(tsRecords),
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        saveTurnsheetSpreadsheet: function (turnId) {
            var deferred = $q.defer();
            $http.post('/Api/TurnSheetApi/PostSaveTurnsheetSpreadsheet?turnId=' + encodeURIComponent(turnId || ''), null)
                .success(deferred.resolve)
                .error(deferred.reject);
            return deferred.promise;
        },
        getAllTurnsList: function () {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getAllTurnsList').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSFullTurnDetails: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getTSFullTurnDetails?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSTurnDetails: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getTSTurnDetails?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSTransferGoods: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getTSTransferGoods?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSDemolishItems: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/GetTSDemolishItems?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSSetUpBrigades: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getTSSetUpBrigades?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSSetUpAdditionalBrigades: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getTSSetUpAdditionalBrigades?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSIncreaseHeadcount: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getTSIncreaseHeadcount?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSIncreaseBrigadeXP: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getTSIncreaseBrigadeXP?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSExchangeBattalions: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getTSExchangeBattalions?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSMergeBattalions: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getTSMergeBattalions?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSRepairShips_BaggageTrains: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getTSRepairShips_BaggageTrains?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSBuildShips: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getTSBuildShips?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSBuildBaggageTrain: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getTSBuildBaggageTrain?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSIncreasePopulationDensity: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getTSIncreasePopulationDensity?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSBuildProductionSites: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getTSBuildProductionSites?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSFormFederations: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getTSFormFederations?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSCoastalDefence: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getTSCoastalDefence?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSSeaBlockade: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getTSSeaBlockade?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSTradeAndLoading1: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getTSTradeAndLoading1?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSMovement: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getTSMovement?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        postTSMovement: function (tsRecords) {
            var deferred = $q.defer();
            $http.post('/Api/TurnSheetApi/postTSMovement', JSON.stringify(tsRecords),
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSTradeAndLoading2: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getTSTradeAndLoading2?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSBoarding: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getTSBoarding?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSHandOverTerritory: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getTSHandOverTerritory?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSChangeNames: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getTSChangeNames?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTSChangeStateRelationships: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnSheetApi/getTSChangeStateRelationships?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        postTurnSheetSetUpBrigades: function (turnSheetSetUpBrigades) {
            var deferred = $q.defer();
            $http.post('/Api/TurnSheetApi/postTurnSheetSetUpBrigades', JSON.stringify(turnSheetSetUpBrigades),
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
    }
});