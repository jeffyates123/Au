austerlitzModule.factory('turnReportFactory', function ($http, $q) {
    return {
        getMapCoordinates: function () {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnReportApi/getMapCoordinates?turnId=Test').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        //getMapProdSiteCoordinates: function () {
        //    var deferred = $q.defer();
        //    $http.get('/Austerlitz/api/TurnReportApi/getMapProdSiteCoordinates?turnId=Test').success(deferred.resolve).error(deferred.reject);
        //    return deferred.promise;
        //},
    }
});
