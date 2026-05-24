'use strict';

austerlitzModule.factory('landUnitsUiFactory', function () {
    return {
        attach: function ($scope) {
            $scope.toggleBrigadeFlag = function (brigade, flagName) {
                    if (!brigade) {
                        return;
                    }
            
                    brigade[flagName] = !brigade[flagName];
                    brigade.resources = $scope.calculatePlaceholderResources(brigade);
                };

            $scope.getBrigadeToggleStyle = function (isSelected) {
                    if (!isSelected) {
                        return {};
                    }
            
                    var stateColor = $scope.getStateColor();
                    return {
                        'background-color': stateColor.backgroundColor,
                        color: stateColor.textColor,
                        'border-color': stateColor.backgroundColor
                    };
                };

            $scope.selectBrigadeAction = function (actionName, brigade) {
                    if (actionName === 'Form Federation') {
                        $scope.openFormFederationModal(brigade);
                        return;
                    }
            
                    var brigadeName = brigade && brigade.name ? brigade.name : 'selected brigade';
                    alert(actionName + ' for ' + brigadeName + ' is not implemented yet.');
                };

        }
    };
});
