"use strict";

austerlitzModule.factory("landUnitsDisplayFactory", function () {
  return {
    attach: function ($scope) {

      $scope.compareBrigadeRowsForDisplay = function (left, right) {
        var sphereCompare =
          $scope.getSphereSortOrder(left) - $scope.getSphereSortOrder(right);
        if (sphereCompare !== 0) {
          return sphereCompare;
        }

        var leftFederation = $scope.getFederationSortNo(left);
        var rightFederation = $scope.getFederationSortNo(right);
        var leftHasFederation = leftFederation > 0;
        var rightHasFederation = rightFederation > 0;

        if (leftHasFederation !== rightHasFederation) {
          return leftHasFederation ? 1 : -1;
        }

        if (leftHasFederation && leftFederation !== rightFederation) {
          return leftFederation - rightFederation;
        }

        return $scope.getUnitSortNo(left) - $scope.getUnitSortNo(right);
      };

      $scope.getSphereSortOrder = function (brigade) {
        switch ($scope.getLandUnitSphere(brigade)) {
          case "Europe":
            return 1;
          case "Caribbean":
            return 2;
          case "India":
            return 3;
          default:
            return 99;
        }
      };

      $scope.getFederationSortNo = function (brigade) {
        var federationNo = parseInt(brigade && brigade.fed, 10);
        return isNaN(federationNo) ? 0 : federationNo;
      };

      $scope.getUnitSortNo = function (brigade) {
        var unitNo = parseInt(brigade && brigade.id, 10);
        return isNaN(unitNo) ? 0 : unitNo;
      };

      $scope.compareCommanderRowsForDisplay = function (left, right) {
        return $scope.getUnitSortNo(left) - $scope.getUnitSortNo(right);
      };

      $scope.formatPosition = function (brigade) {
        var x = $scope.trimValue(brigade.x_OrState);
        var y = $scope.trimValue(brigade.y_OrFleet);
        if (!x && !y) {
          return "";
        }
        return x + "/" + y;
      };

      $scope.formatFederation = function (federation) {
        return federation && federation !== 0 ? federation : "";
      };

      $scope.formatCommanderBoarded = function (boardedValue) {
        var parsed = parseInt(boardedValue, 10);
        return !isNaN(parsed) && parsed > 0 ? "Yes" : "";
      };

      $scope.getBrigadeBoardingFleetNo = function (brigadeSource) {
        var directBoarded = parseInt(brigadeSource && brigadeSource.boarded, 10);
        if (!isNaN(directBoarded) && directBoarded > 0) {
          return directBoarded;
        }

        var xStateText = $scope.trimValue(brigadeSource && brigadeSource.x_OrState);
        var xStateNumeric = parseInt(xStateText, 10);
        var fleetNo = parseInt(brigadeSource && brigadeSource.y_OrFleet, 10);
        var hasNonNumericState = xStateText && (isNaN(xStateNumeric) || xStateNumeric <= 0);
        if (hasNonNumericState && !isNaN(fleetNo) && fleetNo >= 11 && fleetNo <= 30) {
          return fleetNo;
        }

        return 0;
      };

      $scope.getLandUnitPositionKey = function (unit) {
        if (!unit) {
          return "";
        }

        if (unit.position) {
          return $scope.trimValue(unit.position);
        }

        if (!unit.source) {
          return "";
        }

        var x =
          unit.source.x_OrState != null ? unit.source.x_OrState : unit.source.x;
        var y =
          unit.source.y_OrFleet != null ? unit.source.y_OrFleet : unit.source.y;
        return $scope.formatPosition({ x_OrState: x, y_OrFleet: y });
      };

      $scope.togglePositionFilter = function (unit) {
        var positionKey = $scope.getLandUnitPositionKey(unit);
        if (!positionKey) {
          return;
        }

        var sphereKey = $scope.getLandUnitSphere(unit);
        if (!sphereKey || sphereKey === "Unknown") {
          sphereKey = "All";
        }

        if ($scope.positionFilter === positionKey) {
          $scope.positionFilter = null;
          $scope.selectedSphere = sphereKey;
          $scope.onSphereChanged();
          return;
        }

        if (
          !$scope.positionFilter &&
          sphereKey !== "All" &&
          $scope.selectedSphere === sphereKey
        ) {
          $scope.positionFilter = positionKey;
          $scope.refreshCommanderPairRows();
          $scope.refreshFederationSummaryPairRows();
          return;
        }

        $scope.selectedSphere = sphereKey;
        $scope.positionFilter = positionKey;
        $scope.onSphereChanged();
      };

      $scope.clearPositionFilter = function () {
        $scope.positionFilter = null;
        $scope.selectedSphere = "All";
        $scope.onSphereChanged();
      };

      $scope.matchesPositionFilter = function (unit) {
        if (!$scope.positionFilter) {
          return true;
        }

        return $scope.getLandUnitPositionKey(unit) === $scope.positionFilter;
      };

      $scope.getStateColor = function () {
        var stateCode = (
          $scope.masterData && $scope.masterData.selectedState
            ? $scope.masterData.selectedState
            : ""
        )
          .toString()
          .trim()
          .toUpperCase();
        var stateColors = {
          A: "rgb(198, 23, 23)",
          B: "rgb(51,153,102)",
          D: "rgb(255, 204, 153)",
          E: "rgb(234, 230, 21)",
          F: "rgb(47, 164, 231)",
          G: "rgb(135, 219, 106)",
          H: "rgb(255, 106, 0)",
          I: "rgb(0, 255, 0)",
          K: "rgb(181, 36, 165)",
          M: "rgb(206, 203, 83)",
          N: "rgb(128, 128, 0)",
          P: "rgb(128, 128, 128)",
          R: "rgb(192, 192, 192)",
          S: "rgb(255, 255, 153)",
          T: "black",
          W: "rgb(0, 128, 0)",
        };

        return {
          backgroundColor: stateColors[stateCode] || "#777777",
          textColor: stateCode === "T" ? "rgb(192, 192, 192)" : "#111111",
        };
      };

      $scope.trimValue = function (value) {
        return value == null ? "" : value.toString().trim();
      };
    },
  };
});
