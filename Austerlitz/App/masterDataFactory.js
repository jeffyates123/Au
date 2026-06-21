austerlitzModule.factory("masterData", function (turnSheetFactory, turnReportFactory) {
    var selectedTurnStorageKey = 'austerlitz.selectedTurnId';
    var selectedGameNoStorageKey = 'austerlitz.selectedGameNo';
    var selectedStateStorageKey = 'austerlitz.selectedState';
    var selectedMonthYearStorageKey = 'austerlitz.selectedMonthYear';
    var wideScreenStorageKey = 'austerlitz.userSettings.wideScreenEnabled';

    var readStoredValue = function (storageKey) {
        try {
            return window.localStorage.getItem(storageKey);
        }
        catch (e) {
            return null;
        }
    };

    var writeStoredValue = function (storageKey, value) {
        if (!value) {
            return;
        }

        try {
            window.localStorage.setItem(storageKey, value);
        }
        catch (e) {
        }
    };

    var readStoredTurnId = function () {
        return readStoredValue(selectedTurnStorageKey);
    };

    var writeStoredTurnId = function (turnId) {
        writeStoredValue(selectedTurnStorageKey, turnId);
    };

    var masterData = {
        turnId: readStoredTurnId() || 'Unknown',
        selectedGameNo: readStoredValue(selectedGameNoStorageKey),
        selectedState: readStoredValue(selectedStateStorageKey),
        selectedMonthYear: readStoredValue(selectedMonthYearStorageKey),
        wideScreenEnabled: readStoredValue(wideScreenStorageKey) == null
            ? true
            : readStoredValue(wideScreenStorageKey) === '1',
        turnsList: {},
        turnSheet: {},
        turnReport: {},
        RulesCatalog: {},
        getSelectedTurnId: function () {
            return readStoredTurnId();
        },
        setSelectedTurnId: function (turnId) {
            if (!turnId) {
                return;
            }

            this.turnId = turnId;
            writeStoredTurnId(turnId);
        },
        setSelectedTurnFilters: function (gameNo, state, monthYear) {
            this.selectedGameNo = gameNo || null;
            this.selectedState = state || null;
            this.selectedMonthYear = monthYear || null;

            writeStoredValue(selectedGameNoStorageKey, this.selectedGameNo);
            writeStoredValue(selectedStateStorageKey, this.selectedState);
            writeStoredValue(selectedMonthYearStorageKey, this.selectedMonthYear);
        },
        getWideScreenEnabled: function () {
            var storedValue = readStoredValue(wideScreenStorageKey);
            if (storedValue == null) {
                return true;
            }

            return storedValue === '1';
        },
        setWideScreenEnabled: function (isEnabled) {
            this.wideScreenEnabled = isEnabled === true;
            writeStoredValue(wideScreenStorageKey, this.wideScreenEnabled ? '1' : '0');
        }
    };

    return masterData;
});