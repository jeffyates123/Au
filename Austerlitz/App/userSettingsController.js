'use strict';

austerlitzModule.controller('userSettingsController', function ($scope, $rootScope, masterData) {
    $scope.masterData = masterData;
    $scope.userSettings = {
        wideScreenEnabled: masterData.getWideScreenEnabled ? masterData.getWideScreenEnabled() : true
    };

    $scope.onWideScreenChanged = function () {
        var isEnabled = $scope.userSettings.wideScreenEnabled === true;
        if ($scope.masterData.setWideScreenEnabled) {
            $scope.masterData.setWideScreenEnabled(isEnabled);
        } else {
            $scope.masterData.wideScreenEnabled = isEnabled;
        }

        $rootScope.$broadcast('userSettings:wideScreenChanged', { isEnabled: isEnabled });
    };
});
