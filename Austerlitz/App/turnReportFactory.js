austerlitzModule.factory('turnReportFactory', function ($http, $q) {
    return {
        getTRFullTurnDetails: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnReportApi/getTRFullTurnDetails?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getMapCoordinates: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnReportApi/getMapCoordinates?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTRMathBattles: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnReportApi/getTRMathBattles?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        saveTRMathBattleBrigadeCalcs: function (turnId, rows) {
            var deferred = $q.defer();
            $http.post('/Api/TurnReportApi/saveTRMathBattleBrigadeCalcs', {
                turnId: turnId,
                rows: rows || []
            }).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        }
    }
});
