"use strict";

austerlitzModule.factory("landUnitsTurnSheetFactory", function () {
  return {
    attach: function ($scope, turnSheetFactory) {
      $scope.turnSheetPairIncludesBattalion = function (
        row,
        brigade,
        battalion,
        brigadeAField,
        battAField,
        brigadeBField,
        battBField,
      ) {
        return (
          !!(row && brigade && battalion) &&
          (($scope.sameNullableInt(row[brigadeAField], brigade.id) &&
            $scope.sameNullableInt(row[battAField], battalion.slot)) ||
            ($scope.sameNullableInt(row[brigadeBField], brigade.id) &&
              $scope.sameNullableInt(row[battBField], battalion.slot)))
        );
      };

      $scope.clearTurnSheetPairRow = function (row, fields) {
        row.turnId = $scope.masterData.turnId;
        angular.forEach(fields, function (field) {
          row[field] = null;
        });
      };

      $scope.findMatchingFormFederationRow = function (rows, itemNo) {
        for (var i = 0; rows && i < rows.length; i++) {
          if ($scope.sameNullableInt(rows[i].itemNo, itemNo)) {
            return rows[i];
          }
        }

        return null;
      };

      $scope.findMatchingExchangeRow = function (
        rows,
        leftBrigade,
        leftBattalion,
        rightBrigade,
        rightBattalion,
      ) {
        return $scope.findMatchingPairRow(
          rows,
          leftBrigade.id,
          leftBattalion.slot,
          rightBrigade.id,
          rightBattalion.slot,
          "brigadeA",
          "battA",
          "brigadeB",
          "battB",
        );
      };

      $scope.findMatchingMergeRow = function (
        rows,
        sourceBrigade,
        sourceBattalion,
        targetBrigade,
        targetBattalion,
      ) {
        return $scope.findMatchingPairRow(
          rows,
          sourceBrigade.id,
          sourceBattalion.slot,
          targetBrigade.id,
          targetBattalion.slot,
          "bridageA",
          "battA",
          "brigadeB",
          "battB",
        );
      };

      $scope.findMatchingPairRow = function (
        rows,
        brigadeA,
        battA,
        brigadeB,
        battB,
        brigadeAField,
        battAField,
        brigadeBField,
        battBField,
      ) {
        for (var i = 0; rows && i < rows.length; i++) {
          var row = rows[i];
          var directMatch =
            $scope.sameNullableInt(row[brigadeAField], brigadeA) &&
            $scope.sameNullableInt(row[battAField], battA) &&
            $scope.sameNullableInt(row[brigadeBField], brigadeB) &&
            $scope.sameNullableInt(row[battBField], battB);
          var reverseMatch =
            $scope.sameNullableInt(row[brigadeAField], brigadeB) &&
            $scope.sameNullableInt(row[battAField], battB) &&
            $scope.sameNullableInt(row[brigadeBField], brigadeA) &&
            $scope.sameNullableInt(row[battBField], battA);

          if (directMatch || reverseMatch) {
            return row;
          }
        }

        return null;
      };

      $scope.findNextEmptyTurnSheetRow = function (rows, fields) {
        for (var i = 0; rows && i < rows.length; i++) {
          var row = rows[i];
          var hasValue = false;
          for (var f = 0; f < fields.length; f++) {
            if (row[fields[f]] != null && row[fields[f]] !== "") {
              hasValue = true;
              break;
            }
          }
          if (!hasValue) {
            return row;
          }
        }

        return null;
      };

      $scope.findMatchingBrigadeOrFederationRow = function (
        rows,
        brigadeOrFederation,
      ) {
        for (var i = 0; rows && i < rows.length; i++) {
          if (
            $scope.sameNullableInt(
              rows[i].brigadeOrFederation,
              brigadeOrFederation,
            )
          ) {
            return rows[i];
          }
        }

        return null;
      };

      $scope.getTurnSheetBrigadeOrFederationValue = function (brigade, scope) {
        if (!brigade) {
          return null;
        }

        var value = scope === "federation" ? brigade.fed : brigade.id;
        var parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
      };

      $scope.getFilledRowsInOrder = function (rows, fields) {
        return (rows || [])
          .filter(function (row) {
            return $scope.hasAnyTurnSheetValue(row, fields);
          })
          .sort(function (left, right) {
            return (
              (parseInt(left.orderNo, 10) || 0) -
              (parseInt(right.orderNo, 10) || 0)
            );
          });
      };

      $scope.hasAnyTurnSheetValue = function (row, fields) {
        if (!row) {
          return false;
        }

        for (var i = 0; i < fields.length; i++) {
          if (row[fields[i]] != null && row[fields[i]] !== "") {
            return true;
          }
        }

        return false;
      };

      $scope.findNextEmptyTurnSheetRowWithinLimit = function (
        rows,
        fields,
        maxRows,
      ) {
        rows = rows || [];
        for (var orderNo = 1; orderNo <= maxRows; orderNo++) {
          var row = $scope.findTurnSheetRowByOrderNo(rows, orderNo);
          if (!row) {
            row = { turnId: $scope.masterData.turnId, orderNo: orderNo };
            rows.push(row);
            return row;
          }

          if (!$scope.hasAnyTurnSheetValue(row, fields)) {
            return row;
          }
        }

        return null;
      };

      $scope.findTurnSheetRowByOrderNo = function (rows, orderNo) {
        for (var i = 0; rows && i < rows.length; i++) {
          if ($scope.sameNullableInt(rows[i].orderNo, orderNo)) {
            return rows[i];
          }
        }

        return null;
      };

      $scope.showTurnSheetOrderError = function (error) {
        var detail =
          error && error.data ? error.data : "Unable to save turn-sheet order.";
        alert(detail);
      };

      $scope.findMatchingRenameRow = function (rows, itemNo) {
        for (var i = 0; rows && i < rows.length; i++) {
          if ($scope.sameNullableInt(rows[i].itemNo, itemNo)) {
            return rows[i];
          }
        }

        return null;
      };

      $scope.findMatchingAdditionalBattalionRow = function (rows, brigadeNo) {
        for (var i = 0; rows && i < rows.length; i++) {
          if ($scope.sameNullableInt(rows[i].brigadeNo, brigadeNo)) {
            return rows[i];
          }
        }

        return null;
      };
    },
  };
});
