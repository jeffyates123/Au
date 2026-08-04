"use strict";

austerlitzModule.factory("economySphereFactory", function (economyConfigFactory) {
  var sphereByTab = economyConfigFactory.sphereByTab;

  function getWarehouseNoForTab(tabKey) {
    if (tabKey === "europe") {
      return 1;
    }
    if (tabKey === "caribbean") {
      return 2;
    }
    if (tabKey === "india") {
      return 3;
    }
    return 0;
  }

  function getSphereLabelForWarehouseNo(warehouseNo) {
    if (warehouseNo === 1) {
      return "Europe";
    }
    if (warehouseNo === 2) {
      return "Caribbean";
    }
    if (warehouseNo === 3) {
      return "India";
    }
    return "";
  }

  function inBounds(x, y, bounds) {
    return (
      x >= bounds.minX &&
      x <= bounds.maxX &&
      y >= bounds.minY &&
      y <= bounds.maxY
    );
  }

  function getComputedSphereForTab(tabKey) {
    if (tabKey === "europe") {
      return "Europe";
    }
    if (tabKey === "caribbean") {
      return "Caribbean";
    }
    if (tabKey === "india") {
      return "India";
    }
    return "";
  }

  function isEuropeCoordinate(x, y) {
    return inBounds(x, y, sphereByTab.europe);
  }

  return {
    getWarehouseNoForTab: getWarehouseNoForTab,
    getSphereLabelForWarehouseNo: getSphereLabelForWarehouseNo,
    inBounds: inBounds,
    getComputedSphereForTab: getComputedSphereForTab,
    isEuropeCoordinate: isEuropeCoordinate,
  };
});
