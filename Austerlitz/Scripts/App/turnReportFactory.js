﻿austerlitzModule.factory('turnReportFactory', function ($http, $q) {
    return {
        getTRFullTurnDetails: function () {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/TurnReportApi/getTRFullTurnDetails?turnId=Test').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
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
