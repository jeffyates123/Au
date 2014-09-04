austerlitzModule.factory('rulesCatalogFactory', function ($http, $q) {
    return {
        getArmyList: function () {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/RulesCatalogApi/getArmyList').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getRefProductionSites: function () {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/RulesCatalogApi/getRefProductionSites').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getRefStates: function () {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/RulesCatalogApi/getRefStates').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getRefTerrain: function () {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/RulesCatalogApi/getRefTerrain').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
    }
});
