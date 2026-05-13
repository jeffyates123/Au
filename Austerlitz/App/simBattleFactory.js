austerlitzModule.factory('simBattleFactory', function ($http, $q) {
    return {
        postNewSimBattle: function (data) {
            var deferred = $q.defer();
            $http.post('/Api/FileSaveApi/PostNewSimBattle', JSON.stringify(data),
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        }
    }
});