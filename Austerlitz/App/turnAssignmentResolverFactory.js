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

    return {
      toInt: toInt,
      normalizeLandFederationNo: normalizeLandFederationNo,
      getShipItemNo: getShipItemNo,
      getShipBaseFleetNo: getShipBaseFleetNo,
      resolveEffectiveShipFleetNoForShip: resolveEffectiveShipFleetNoForShip,
      buildEffectiveShipFleetLookup: buildEffectiveShipFleetLookup,
      resolveEffectiveLandFederationNo: resolveEffectiveLandFederationNo,
    };
  },
);
