austerlitzModule.factory('rulesCatalogFactory', function ($http, $q) {
    return {
        getArmyList: function () {
            var deferred = $q.defer();
            $http.get('/Austerlitz/api/RulesCatalogApi/getArmyList').success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
    }
});
