austerlitzModule.factory("masterData", function (turnSheetFactory, turnReportFactory) {
    return {
        turnId: 'Unknown',
        turnsList: {},
        turnSheet: {},
        turnReport: {},
        RulesCatalog: {}
    }
});