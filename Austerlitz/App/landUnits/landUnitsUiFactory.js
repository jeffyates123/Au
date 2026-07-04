"use strict";

austerlitzModule.factory("landUnitsUiFactory", function () {
  return {
    attach: function ($scope) {
      $scope.toggleBrigadeFlag = function (brigade, flagName) {
        if (!brigade) {
          return;
        }

        brigade[flagName] = !brigade[flagName];
        brigade.resources = $scope.calculatePlaceholderResources();
      };

      $scope.getBrigadeToggleStyle = function (isSelected) {
        if (!isSelected) {
          return {};
        }

        var stateColor = $scope.getStateColor();
        return {
          "background-color": stateColor.backgroundColor,
          color: stateColor.textColor,
          "border-color": stateColor.backgroundColor,
        };
      };

      $scope.getBoardingButtonLabel = function (unit) {
        var unloadDirection = parseInt(unit && unit.unloadDirection, 10);
        if (!isNaN(unloadDirection) && [1, 3, 5, 7, 9].indexOf(unloadDirection) >= 0) {
          return "Unload (" + unloadDirection + ")";
        }

        if (!unit || !unit.boardingSelected) {
          return "Board";
        }

        var transportNo = parseInt(unit.boardingFleetNo, 10);
        return !isNaN(transportNo) && transportNo > 0
          ? transportNo.toString()
          : "Board";
      };

      $scope.selectBrigadeAction = function (actionName, brigade) {
        if (actionName === "Form Federation") {
          $scope.openFormFederationModal(brigade);
          return;
        }

        var brigadeName =
          brigade && brigade.name ? brigade.name : "selected brigade";
        alert(actionName + " for " + brigadeName + " is not implemented yet.");
      };
    },
  };
});
