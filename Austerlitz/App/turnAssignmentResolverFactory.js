"use strict";

austerlitzModule.factory(
  "turnAssignmentResolverFactory",
  function (navyFleetValidationFactory) {
    function toInt(value) {
      var parsed = parseInt(value, 10);
      return isNaN(parsed) ? null : parsed;
    }

    function getOrderNo(row) {
      var orderNo = toInt(row && row.orderNo);
      return orderNo == null ? 0 : orderNo;
    }

    function normalizeLandFederationNo(value) {
      var parsed = toInt(value);
      return parsed != null && parsed > 0 ? parsed : 0;
    }

    function getShipItemNo(ship) {
      if (!ship) {
        return null;
      }

      return toInt(ship.id != null ? ship.id : ship.itemNo);
    }

    function getShipBaseFleetNo(ship) {
      if (!ship) {
        return null;
      }

      var sourceFleetNo =
        ship.originalFleet != null && ship.originalFleet !== ""
          ? ship.originalFleet
          : ship.fleet != null && ship.fleet !== ""
            ? ship.fleet
            : ship.fleetNo;
      var parsed = toInt(sourceFleetNo);
      return navyFleetValidationFactory.isAssignedFleetNo(parsed) ? parsed : null;
    }

    function resolveEffectiveShipFleetNoForShip(ship, formFederationRows) {
      var shipItemNo = getShipItemNo(ship);
      if (shipItemNo == null) {
        return null;
      }

      var baseFleetNo = getShipBaseFleetNo(ship);
      var latestMatch = null;
      var latestOrderNo = -1;

      angular.forEach(formFederationRows || [], function (row) {
        var rowItemNo = toInt(row && row.itemNo);
        if (rowItemNo == null) {
          return;
        }

        if (
          rowItemNo !== shipItemNo &&
          !(baseFleetNo != null && rowItemNo === baseFleetNo)
        ) {
          return;
        }

        var targetFleetNo = toInt(row && row.federation_Fleet);
        if (!navyFleetValidationFactory.isValidOrderFleetNo(targetFleetNo)) {
          return;
        }

        var rowOrderNo = getOrderNo(row);
        if (latestMatch == null || rowOrderNo >= latestOrderNo) {
          latestMatch = targetFleetNo;
          latestOrderNo = rowOrderNo;
        }
      });

      if (latestMatch == null) {
        return baseFleetNo;
      }

      return navyFleetValidationFactory.isAssignedFleetNo(latestMatch)
        ? latestMatch
        : null;
    }

    function buildEffectiveShipFleetLookup(ships, formFederationRows) {
      var lookup = {};
      angular.forEach(ships || [], function (ship) {
        var shipItemNo = getShipItemNo(ship);
        if (shipItemNo == null) {
          return;
        }
        lookup[shipItemNo] = resolveEffectiveShipFleetNoForShip(
          ship,
          formFederationRows,
        );
      });
      return lookup;
    }

    function resolveEffectiveLandFederationNo(unit, stagedOrders) {
      if (!unit) {
        return 0;
      }

      var unitId = toInt(unit.id);
      var currentFederationNo = normalizeLandFederationNo(unit.fed);

      for (var i = (stagedOrders || []).length - 1; i >= 0; i--) {
        var order = stagedOrders[i];
        if (!order) {
          continue;
        }

        if (
          (order.type === "brigade" || order.type === "commander") &&
          unitId != null &&
          toInt(order.itemNo) === unitId
        ) {
          return normalizeLandFederationNo(order.federation_Fleet);
        }

        if (
          order.type === "federation" &&
          toInt(order.sourceFederationNo) === currentFederationNo
        ) {
          return normalizeLandFederationNo(order.federation_Fleet);
        }
      }

      return currentFederationNo;
    }

    function isLandFederationNo(value) {
      var parsed = toInt(value);
      return parsed != null && parsed >= 61 && parsed <= 90;
    }

    function isNavyFleetNo(value) {
      var parsed = toInt(value);
      return parsed != null && parsed >= 11 && parsed <= 30;
    }

    function buildEffectiveMovementFederationLookup(
      movementItems,
      formFederationRows,
      getMovementItemKind,
      shipsByItemNo,
    ) {
      var lookup = {};
      var kindLookup = {};
      var rows = (formFederationRows || []).slice().sort(function (a, b) {
        return (toInt(a && a.orderNo) || 0) - (toInt(b && b.orderNo) || 0);
      });

      angular.forEach(movementItems || [], function (item) {
        var itemNo = toInt(
          item && (item.originalItemNo != null ? item.originalItemNo : item.itemNo),
        );
        if (itemNo == null) {
          return;
        }

        lookup[itemNo] = item && item.federationNo != null ? item.federationNo : null;
        kindLookup[itemNo] = getMovementItemKind ? getMovementItemKind(item) : "";
      });

      angular.forEach(rows, function (row) {
        var sourceNo = toInt(row && row.itemNo);
        var targetNo = toInt(row && row.federation_Fleet);
        if (sourceNo == null || targetNo == null) {
          return;
        }

        if (isLandFederationNo(sourceNo)) {
          angular.forEach(lookup, function (effectiveNo, itemNoKey) {
            var kind = kindLookup[itemNoKey];
            if (
              (kind === "brigade" || kind === "commander") &&
              toInt(effectiveNo) === sourceNo
            ) {
              lookup[itemNoKey] = targetNo;
            }
          });
          return;
        }

        if (isNavyFleetNo(sourceNo)) {
          angular.forEach(lookup, function (effectiveNo, itemNoKey) {
            var kind = kindLookup[itemNoKey];
            if (
              (kind === "warship" || kind === "merchant") &&
              toInt(effectiveNo) === sourceNo
            ) {
              lookup[itemNoKey] = targetNo;
            }
          });
          return;
        }

        if (Object.prototype.hasOwnProperty.call(lookup, sourceNo)) {
          lookup[sourceNo] = targetNo;
        }
      });

      angular.forEach(shipsByItemNo || {}, function (ship, shipIdKey) {
        var shipId = toInt(shipIdKey);
        if (shipId == null || !Object.prototype.hasOwnProperty.call(lookup, shipId)) {
          return;
        }
        lookup[shipId] = resolveEffectiveShipFleetNoForShip(
          ship,
          formFederationRows || [],
        );
      });

      return lookup;
    }

    return {
      toInt: toInt,
      normalizeLandFederationNo: normalizeLandFederationNo,
      getShipItemNo: getShipItemNo,
      getShipBaseFleetNo: getShipBaseFleetNo,
      resolveEffectiveShipFleetNoForShip: resolveEffectiveShipFleetNoForShip,
      buildEffectiveShipFleetLookup: buildEffectiveShipFleetLookup,
      resolveEffectiveLandFederationNo: resolveEffectiveLandFederationNo,
      buildEffectiveMovementFederationLookup: buildEffectiveMovementFederationLookup,
    };
  },
);
