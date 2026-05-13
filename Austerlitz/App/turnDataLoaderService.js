austerlitzModule.factory("turnDataLoaderService", function ($q, turnSheetFactory, turnReportFactory) {
    var service = {};

    service.loadTS = function (masterData, turnId) {
        masterData.turnSheet = null;
        return turnSheetFactory.getTSFullTurnDetails(turnId).then(function (turnSheet) {
            masterData.turnSheet = turnSheet;
            return turnSheet;
        });
    };

    service.loadTR = function (masterData, turnId) {
        masterData.turnReport = null;
        return turnReportFactory.getTRFullTurnDetails(turnId).then(function (turnReport) {
            masterData.turnReport = turnReport;
            return turnReport;
        });
    };

    service.loadTurn = function (masterData, turnId) {
        return $q.all([
            service.loadTS(masterData, turnId),
            service.loadTR(masterData, turnId)
        ]).finally(function () {

        });
    };

    return service;
});
