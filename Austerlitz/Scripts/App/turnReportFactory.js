austerlitzModule.factory('turnReportFactory', function ($http, $q) {
    return {
        getTRFullTurnDetails: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnReportApi/getTRFullTurnDetails?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getMapCoordinates: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnReportApi/getMapCoordinates?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        //getMapProdSiteCoordinates: function () {
        //    var deferred = $q.defer();
        //    $http.get('/Austerlitz/api/TurnReportApi/getMapProdSiteCoordinates?turnId=Test').success(deferred.resolve).error(deferred.reject);
        //    return deferred.promise;
        //},
    }
});
