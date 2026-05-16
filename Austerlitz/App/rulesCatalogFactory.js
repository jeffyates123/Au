austerlitzModule.factory('rulesCatalogFactory', function ($http, $q) {
    return {
        getArmyList: function (state) {
            var deferred = $q.defer();
            var stateFilter = state ? ('?state=' + encodeURIComponent(state)) : '';
            $http.get('/Api/RulesCatalogApi/getArmyList' + stateFilter).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getRefProductionSites: function () {
            var deferred = $q.defer();
            $http.get('/Api/RulesCatalogApi/getRefProductionSites').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getRefStates: function () {
            var deferred = $q.defer();
            $http.get('/Api/RulesCatalogApi/getRefStates').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getRefTerrain: function () {
            var deferred = $q.defer();
            $http.get('/Api/RulesCatalogApi/getRefTerrain').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getRulesCatalog: function () {
            var deferred = $q.defer();
            $http.get('/Api/RulesCatalogApi/getRulesCatalog').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
    }
});
