austerlitzModule.factory('turnSheetFactory', function ($http, $q) {
    return {
        getTurnSheetSetUpBrigades: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnSheetApi/getTurnSheetSetUpBrigades?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
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

        }
    }
});