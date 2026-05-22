'use strict';

austerlitzModule.controller('sectionPlaceholderController', function ($scope, $routeParams, masterData) {
    $scope.masterData = masterData;
    $scope.sectionName = formatSectionName($routeParams.sectionName);

    function formatSectionName(sectionName) {
        if (!sectionName) {
            return 'Section';
        }

        return sectionName
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/[-_]+/g, ' ');
    }
});
