"use strict";

austerlitzModule.factory("landUnitsFederationFactory", function () {
  return {
    attach: function ($scope, turnSheetFactory) {
      $scope.persistFormFederationOrders = function (stagedOrders) {
        turnSheetFactory
          .getTSFormFederations($scope.masterData.turnId)
          .then(function (rows) {
            rows = rows || [];

            var conflicts = stagedOrders.filter(function (order) {
              return !!$scope.findMatchingFormFederationRow(rows, order.itemNo);
            });

            if (
              conflicts.length &&
              !window.confirm(
                "One or more TS14 orders already exist for these land unit/federation numbers. Overwrite them?",
              )
            ) {
              return;
            }

            for (var i = 0; i < stagedOrders.length; i++) {
              var order = stagedOrders[i];
              var targetRow =
                $scope.findMatchingFormFederationRow(rows, order.itemNo) ||
                $scope.findNextEmptyTurnSheetRowWithinLimit(
                  rows,
                  ["itemNo", "federation_Fleet"],
                  21,
                );

              if (!targetRow) {
                alert("No empty TS_14 row is available.");
                return;
              }

              targetRow.turnId = $scope.masterData.turnId;
              targetRow.itemNo = order.itemNo;
              targetRow.federation_Fleet = order.federation_Fleet;
            }

            return turnSheetFactory
              .postTSRecords(rows, "FormFederations")
              .then(function () {
                $scope.applyStagedFormFederationChanges(stagedOrders);
                $scope.closeFormFederationModal();
              }, $scope.showTurnSheetOrderError);
          }, $scope.showTurnSheetOrderError);
      };

      $scope.stageFormFederationBrigade = function (brigade, isOriginal) {
        if (!$scope.canStageFormFederationBrigade(brigade)) {
          return;
        }

        var brigadeId = parseInt(brigade.id, 10);
        if (isNaN(brigadeId)) {
          return;
        }

        $scope.stageFormFederationOrder({
          type: brigade.kind === "commander" ? "commander" : "brigade",
          itemNo: brigadeId,
          federation_Fleet: $scope.getFormFederationTargetNo(),
          sourceBrigadeId: brigade.id,
          affectedUnitKeys: [$scope.getLandUnitKey(brigade)],
          isOriginal: !!isOriginal,
        });
      };

      $scope.stageFormFederationOrder = function (order) {
        if (
          !order ||
          order.itemNo == null ||
          !$scope.isValidTargetFederationNo(order.federation_Fleet)
        ) {
          return;
        }

        var stagedOrders = $scope.formFederationModal.stagedOrders || [];
        var orderKey = $scope.getFormFederationOrderKey(order);
        for (var i = 0; i < stagedOrders.length; i++) {
          if ($scope.getFormFederationOrderKey(stagedOrders[i]) === orderKey) {
            stagedOrders[i].federation_Fleet = order.federation_Fleet;
            stagedOrders[i].affectedUnitKeys =
              order.affectedUnitKeys || stagedOrders[i].affectedUnitKeys;
            stagedOrders[i].type = order.type || stagedOrders[i].type;
            stagedOrders[i].sourceFederationNo = order.sourceFederationNo;
            stagedOrders[i].sourceBrigadeId =
              order.sourceBrigadeId || stagedOrders[i].sourceBrigadeId;
            stagedOrders[i].isOriginal =
              stagedOrders[i].isOriginal || !!order.isOriginal;
            return;
          }
        }

        stagedOrders.push(order);
        $scope.formFederationModal.stagedOrders = stagedOrders;
      };

      $scope.getFormFederationOrderKey = function (order) {
        if (!order || order.itemNo == null) {
          return "";
        }

        return (order.type || "brigade") + ":" + order.itemNo;
      };

      $scope.removeNoOpFormFederationOrders = function () {
        var targetFederationNo = $scope.getFormFederationTargetNo();
        $scope.formFederationModal.stagedOrders = (
          $scope.formFederationModal.stagedOrders || []
        ).filter(function (order) {
          if (!order) {
            return false;
          }

          if (order.type === "federation") {
            return (
              parseInt(order.sourceFederationNo, 10) !== targetFederationNo
            );
          }

          var brigade = $scope.getLandUnitById(order.itemNo);
          return (
            brigade &&
            $scope.getCurrentFederationNo(brigade) !== targetFederationNo
          );
        });
      };

      $scope.applyStagedFormFederationChanges = function (stagedOrders) {
        angular.forEach(stagedOrders || [], function (order) {
          if (order.type === "federation") {
            angular.forEach(
              $scope.getLandUnitsByFederation(order.sourceFederationNo),
              function (brigade) {
                $scope.setLandUnitFederation(brigade, order.federation_Fleet);
              },
            );
            return;
          }

          var brigade = $scope.getLandUnitById(order.itemNo);
          $scope.setLandUnitFederation(brigade, order.federation_Fleet);
        });
      };

      $scope.setBrigadeFederation = function (brigade, federationNo) {
        if (!brigade) {
          return;
        }

        var parsed = parseInt(federationNo, 10);
        var formatted = !isNaN(parsed) && parsed > 0 ? parsed : "";
        brigade.fed = formatted;
        brigade.fedChanged = true;

        if (brigade.source) {
          brigade.source.federation = formatted || 0;
        }
      };

      $scope.setCommanderFederation = function (commander, federationNo) {
        if (!commander) {
          return;
        }

        var parsed = parseInt(federationNo, 10);
        var formatted = !isNaN(parsed) && parsed > 0 ? parsed : "";
        commander.fed = formatted;
        commander.fedChanged = true;

        if (commander.source) {
          commander.source.federation = formatted || 0;
        }
      };

      $scope.setLandUnitFederation = function (unit, federationNo) {
        if (!unit) {
          return;
        }

        if (unit.kind === "commander") {
          $scope.setCommanderFederation(unit, federationNo);
          return;
        }

        $scope.setBrigadeFederation(unit, federationNo);
      };

      $scope.getFormFederationTargetNo = function () {
        var parsed = parseInt(
          $scope.formFederationModal.targetFederationNo,
          10,
        );
        return isNaN(parsed) ? null : parsed;
      };

      $scope.getCurrentFederationNo = function (brigade) {
        var parsed = parseInt(brigade && brigade.fed, 10);
        return isNaN(parsed) ? 0 : parsed;
      };

      $scope.getEffectiveFederationNo = function (brigade) {
        if (!brigade) {
          return 0;
        }

        var brigadeId = parseInt(brigade.id, 10);
        var currentFederationNo = $scope.getCurrentFederationNo(brigade);
        var stagedOrders = $scope.formFederationModal.stagedOrders || [];

        for (var i = stagedOrders.length - 1; i >= 0; i--) {
          var order = stagedOrders[i];
          if (!order) {
            continue;
          }

          if (
            (order.type === "brigade" || order.type === "commander") &&
            $scope.sameNullableInt(order.itemNo, brigadeId)
          ) {
            return parseInt(order.federation_Fleet, 10) || 0;
          }

          if (
            order.type === "federation" &&
            $scope.sameNullableInt(
              order.sourceFederationNo,
              currentFederationNo,
            )
          ) {
            return parseInt(order.federation_Fleet, 10) || 0;
          }
        }

        return currentFederationNo;
      };

      $scope.isValidTargetFederationNo = function (targetFederationNo) {
        if (targetFederationNo === 0) {
          $scope.formFederationModal.validationError = "";
          return true;
        }

        if (
          targetFederationNo >= 61 &&
          targetFederationNo <= 90 &&
          $scope.isFederationNoValidForModalCoordinate(targetFederationNo)
        ) {
          $scope.formFederationModal.validationError = "";
          return true;
        }

        if (
          targetFederationNo >= 61 &&
          targetFederationNo <= 90 &&
          $scope.isFederationNoOnModalCoordinate(targetFederationNo) &&
          $scope.isFederationNoValidForModalCoordinate(targetFederationNo)
        ) {
          $scope.formFederationModal.validationError = "";
          return true;
        }

        $scope.formFederationModal.validationError =
          "Enter 0, an unused land federation number from 61 to 90, or a federation number that already exists only on this coordinate.";
        return false;
      };

      $scope.getSameCoordinateBrigades = function (brigade) {
        if (!brigade) {
          return [];
        }

        var allRows = ($scope.brigadeRows || []).concat(
          $scope.commanderRows || [],
        );
        return allRows.filter(function (row) {
          if (row && row.kind === "commander" && row.boarded) {
            return false;
          }
          return $scope.isSameCoordinate(brigade, row);
        });
      };

      $scope.getNextAvailableLandFederationNo = function () {
        var used = {};
        angular.forEach($scope.brigadeRows || [], function (brigade) {
          var federationNo = parseInt(brigade.fed, 10);
          if (!isNaN(federationNo)) {
            used[federationNo] = true;
          }
        });
        angular.forEach($scope.commanderRows || [], function (commander) {
          var federationNo = parseInt(commander.fed, 10);
          if (!isNaN(federationNo)) {
            used[federationNo] = true;
          }
        });

        angular.forEach(
          ($scope.formFederationModal &&
            $scope.formFederationModal.stagedOrders) ||
            [],
          function (order) {
            var federationNo = parseInt(order.federation_Fleet, 10);
            if (!isNaN(federationNo) && federationNo > 0) {
              used[federationNo] = true;
            }
          },
        );

        for (var federationNo = 61; federationNo <= 90; federationNo++) {
          if (!used[federationNo]) {
            return federationNo;
          }
        }

        return null;
      };

      $scope.isFederationNoOnModalCoordinate = function (federationNo) {
        if (federationNo == null) {
          return false;
        }

        return ($scope.formFederationModal.coordinateBrigades || []).some(
          function (brigade) {
            return $scope.sameNullableInt(brigade.fed, federationNo);
          },
        );
      };

      $scope.isFederationNoValidForModalCoordinate = function (federationNo) {
        var existingBrigades = $scope.getLandUnitsByFederation(federationNo);
        if (!existingBrigades.length) {
          return true;
        }

        var modalBrigade = $scope.formFederationModal.brigade;
        return existingBrigades.every(function (brigade) {
          return $scope.isSameCoordinate(modalBrigade, brigade);
        });
      };

      $scope.isFormFederationBrigadeStaged = function (brigade) {
        if (!brigade) {
          return false;
        }

        return !!$scope.getFormFederationStagedBrigadeIds()[
          $scope.getLandUnitKey(brigade)
        ];
      };

      $scope.getFormFederationStagedBrigadeIds = function () {
        var staged = {};
        angular.forEach(
          $scope.formFederationModal.stagedOrders || [],
          function (order) {
            angular.forEach(order.affectedUnitKeys || [], function (unitKey) {
              staged[unitKey] = true;
            });
          },
        );
        return staged;
      };

      $scope.openFormFederationModal = function (brigade, $event) {
        if ($event && $event.preventDefault) $event.preventDefault();
        if ($event && $event.stopPropagation) $event.stopPropagation();
        if (!brigade) {
          return;
        }

        var targetFederationNo = parseInt(brigade.fed, 10);
        if (isNaN(targetFederationNo)) {
          targetFederationNo = $scope.getNextAvailableLandFederationNo();
          if (targetFederationNo == null) {
            alert("No available land federation numbers (61-90).");
            targetFederationNo = "";
          }
        }

        $scope.formFederationModal.isOpen = true;
        $scope.formFederationModal.brigade = brigade;
        $scope.formFederationModal.targetFederationNo = targetFederationNo;
        $scope.formFederationModal.validationError = "";
        $scope.formFederationModal.coordinateBrigades =
          $scope.getSameCoordinateBrigades(brigade);
        $scope.formFederationModal.stagedOrders = [];

        $scope.stageFormFederationBrigade(brigade, true);
      };

      $scope.closeFormFederationModal = function () {
        $scope.formFederationModal.isOpen = false;
        $scope.formFederationModal.brigade = null;
        $scope.formFederationModal.targetFederationNo = null;
        $scope.formFederationModal.validationError = "";
        $scope.formFederationModal.coordinateBrigades = [];
        $scope.formFederationModal.stagedOrders = [];
      };

      $scope.selectNextAvailableFederationNo = function () {
        if ($scope.isFormFederationTargetLocked()) {
          return;
        }

        var nextFederationNo = $scope.getNextAvailableLandFederationNo();
        if (nextFederationNo == null) {
          alert("No available land federation numbers (61-90).");
          return;
        }

        $scope.formFederationModal.targetFederationNo = nextFederationNo;
        $scope.onFormFederationTargetChanged();
      };

      $scope.onFormFederationTargetChanged = function () {
        if ($scope.isFormFederationTargetLocked()) {
          return;
        }

        var targetFederationNo = $scope.getFormFederationTargetNo();
        if (!$scope.isValidTargetFederationNo(targetFederationNo)) {
          return;
        }

        angular.forEach(
          $scope.formFederationModal.stagedOrders,
          function (order) {
            order.federation_Fleet = targetFederationNo;
          },
        );
        $scope.removeNoOpFormFederationOrders();
      };

      $scope.canStageFormFederationBrigade = function (brigade) {
        var targetFederationNo = $scope.getFormFederationTargetNo();
        return (
          !!brigade &&
          $scope.isValidTargetFederationNo(targetFederationNo) &&
          $scope.getEffectiveFederationNo(brigade) !== targetFederationNo
        );
      };

      $scope.stageFormFederationFed = function (brigade) {
        if (!$scope.canStageFormFederationFed(brigade)) {
          if (!brigade || !brigade.fed) {
            alert("This land unit is not currently in a federation.");
          }
          return;
        }

        var sourceFederationNo = parseInt(brigade.fed, 10);
        if (isNaN(sourceFederationNo)) {
          return;
        }

        $scope.stageFormFederationOrder({
          type: "federation",
          itemNo: sourceFederationNo,
          federation_Fleet: $scope.getFormFederationTargetNo(),
          sourceFederationNo: sourceFederationNo,
          sourceBrigadeId: brigade.id,
          affectedUnitKeys: $scope
            .getLandUnitsByFederation(sourceFederationNo)
            .map(function (row) {
              return $scope.getLandUnitKey(row);
            }),
        });
      };

      $scope.canStageFormFederationFed = function (brigade) {
        if (!brigade || !brigade.fed) {
          return false;
        }

        var targetFederationNo = $scope.getFormFederationTargetNo();
        var sourceFederationNo = parseInt(brigade.fed, 10);
        return (
          !isNaN(sourceFederationNo) &&
          $scope.isValidTargetFederationNo(targetFederationNo) &&
          $scope.getEffectiveFederationNo(brigade) !== targetFederationNo &&
          sourceFederationNo !== targetFederationNo
        );
      };

      $scope.isFormFederationTargetLocked = function () {
        return ($scope.formFederationModal.stagedOrders || []).some(
          function (order) {
            return !order || !order.isOriginal;
          },
        );
      };

      $scope.getFormFederationDisplayFed = function (brigade) {
        var federationNo = $scope.getEffectiveFederationNo(brigade);
        return federationNo > 0 ? federationNo : "-";
      };

      $scope.isFormFederationOriginal = function (brigade) {
        return !!(
          $scope.formFederationModal.brigade &&
          brigade &&
          $scope.sameNullableInt(
            $scope.formFederationModal.brigade.id,
            brigade.id,
          ) &&
          ($scope.formFederationModal.brigade.kind || "brigade") ===
            (brigade.kind || "brigade")
        );
      };

      $scope.isFormFederationStaged = function (brigade) {
        if (!brigade) {
          return false;
        }

        var stagedIds = $scope.getFormFederationStagedBrigadeIds();
        return !!stagedIds[$scope.getLandUnitKey(brigade)];
      };

      $scope.getFormFederationOrderSummary = function (order) {
        if (!order) {
          return "";
        }

        var sourceLabel = order.itemNo;
        var unit = $scope.getLandUnitById(order.itemNo);
        if (unit) {
          sourceLabel =
            (unit.kind === "commander" ? "Com " : "Bde ") +
            unit.id +
            " " +
            unit.name;
        } else if (order.type === "federation") {
          sourceLabel = "Fed " + order.itemNo;
        }

        return (
          sourceLabel +
          " -> " +
          order.federation_Fleet +
          " (" +
          $scope.getLandFederationPartSummary(order.federation_Fleet) +
          ")"
        );
      };

      $scope.saveFormFederationModal = function () {
        if (
          !$scope.isValidTargetFederationNo($scope.getFormFederationTargetNo())
        ) {
          return;
        }

        var stagedOrders = $scope.formFederationModal.stagedOrders || [];
        if (!stagedOrders.length) {
          alert("No federation changes are staged.");
          return;
        }

        $scope.persistFormFederationOrders(stagedOrders);
      };
    },
  };
});
