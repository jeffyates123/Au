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
        getTREconomyComputedSummary: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnReportApi/getTREconomyComputedSummary?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        saveTREconomyComputedSummary: function (summaryPayload) {
            var deferred = $q.defer();
            $http.post('/Api/TurnReportApi/saveTREconomyComputedSummary', summaryPayload || {}).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTRMathBattles: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnReportApi/getTRMathBattles?turnId=' + turnId).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTRErrors: function (turnId) {
            var deferred = $q.defer();
            $http.get('/Api/TurnReportApi/getTRFullTurnDetails?turnId=' + turnId).success(function (turnReport) {
                if (turnReport && turnReport.errors) {
                    deferred.resolve(turnReport.errors);
                    return;
                }
                deferred.resolve([]);
            }).error(deferred.reject);
            return deferred.promise;
        },
        saveTRMathBattleBrigadeCalcs: function (turnId, rows, mathBattleNo) {
            var deferred = $q.defer();
            $http.post('/Api/TurnReportApi/saveTRMathBattleBrigadeCalcs', {
                turnId: turnId,
                rows: rows || [],
                mathBattleNo: mathBattleNo
            }).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        createTREstimatedMathBattle: function (turnId, sourceMathBattleNo, sourcePhase) {
            var deferred = $q.defer();
            $http.post('/Api/TurnReportApi/createTREstimatedMathBattle', {
                turnId: turnId,
                sourceMathBattleNo: sourceMathBattleNo,
                sourcePhase: sourcePhase
            }).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        getTRMathBattleFederationCandidates: function (turnId, sourceMathBattleNo, replaceState) {
            var deferred = $q.defer();
            $http.post('/Api/TurnReportApi/getTRMathBattleFederationCandidates', {
                turnId: turnId,
                sourceMathBattleNo: sourceMathBattleNo,
                replaceState: replaceState
            }).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        },
        createTRFederationEstimatedMathBattle: function (turnId, sourceMathBattleNo, sourcePhase, replaceState, federationNo) {
            var deferred = $q.defer();
            $http.post('/Api/TurnReportApi/createTRFederationEstimatedMathBattle', {
                turnId: turnId,
                sourceMathBattleNo: sourceMathBattleNo,
                sourcePhase: sourcePhase,
                replaceState: replaceState,
                federationNo: federationNo
            }).success(deferred.resolve).error(deferred.reject);
            return deferred.promise;
        }
    }
});
