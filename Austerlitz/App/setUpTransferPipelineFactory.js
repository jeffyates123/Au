"use strict";

austerlitzModule.factory("setUpTransferPipelineFactory", function () {
  function getTransferGoodsRowByOrderNo(rows, orderNo, toInt) {
    if (!rows) return null;
    for (var i = 0; i < rows.length; i++) {
      if (toInt(rows[i] && rows[i].orderNo, 0) === toInt(orderNo, 0)) {
        return rows[i];
      }
    }
    return null;
  }

  function buildTs01BarracksSummaryRows(
    lines,
    hasAnyGoods,
    getLocationLabel,
    toInt,
  ) {
    var grouped = {};
    angular.forEach(lines || [], function (line) {
      if (!line || !line.goods || line.to == null) return;
      if (!hasAnyGoods(line.goods, toInt)) return;
      var toKey = toInt(line.to, 0);
      if (!toKey) return;

      if (!grouped[toKey]) {
        grouped[toKey] = {
          from: line.from,
          to: line.to,
          locationLabel: line.locationLabel || getLocationLabel(line.to),
          goods: {
            louisdore: 0,
            citizens: 0,
            ecPts: 0,
            horses: 0,
            wood: 0,
            textiles: 0,
          },
        };
      }

      grouped[toKey].from = grouped[toKey].from || line.from;
      grouped[toKey].goods.louisdore += toInt(line.goods.louisdore, 0);
      grouped[toKey].goods.citizens += toInt(line.goods.citizens, 0);
      grouped[toKey].goods.ecPts += toInt(line.goods.ecPts, 0);
      grouped[toKey].goods.horses += toInt(line.goods.horses, 0);
      grouped[toKey].goods.wood += toInt(line.goods.wood, 0);
      grouped[toKey].goods.textiles += toInt(line.goods.textiles, 0);
    });

    return Object.keys(grouped)
      .map(function (key) {
        return grouped[key];
      })
      .sort(function (left, right) {
        return toInt(left.to, 0) - toInt(right.to, 0);
      });
  }

  function writeManagedTransferGoodsRows(config) {
    var lines = config.lines || [];
    var previousManaged = (config.previousManagedOrderNos || []).slice();
    var existingManagedRows = previousManaged
      .map(function (orderNo) {
        return getTransferGoodsRowByOrderNo(
          config.transferGoodsRows,
          orderNo,
          config.toInt,
        );
      })
      .filter(Boolean)
      .sort(function (left, right) {
        return (
          config.toInt(left && left.orderNo, 0) -
          config.toInt(right && right.orderNo, 0)
        );
      });

    var availableEmptyRows = (config.transferGoodsRows || [])
      .filter(function (row) {
        var orderNo = config.toInt(row && row.orderNo, 0);
        if (!orderNo || previousManaged.indexOf(orderNo) >= 0) return false;
        return config.isTransferGoodsRowEmpty(row);
      })
      .sort(function (left, right) {
        return (
          config.toInt(left && left.orderNo, 0) -
          config.toInt(right && right.orderNo, 0)
        );
      });

    var targetRows = [];
    for (var i = 0; i < lines.length; i++) {
      if (i < existingManagedRows.length)
        targetRows.push(existingManagedRows[i]);
      else if (availableEmptyRows.length && targetRows.length < config.rowLimit)
        targetRows.push(availableEmptyRows.shift());
      else break;
    }

    var changed = false;
    var managedOrderNos = [];
    var used = {};

    angular.forEach(targetRows, function (row, idx) {
      var line = lines[idx];
      var before = config.getRowSignature(row);
      row.from = line.from;
      row.to = line.to;
      row.louisdore = config.toInt(line.goods.louisdore, 0) || null;
      row.citizens = config.toInt(line.goods.citizens, 0) || null;
      row.ecPts = config.toInt(line.goods.ecPts, 0) || null;
      row.horses = config.toInt(line.goods.horses, 0) || null;
      row.wood = config.toInt(line.goods.wood, 0) || null;
      row.textiles = config.toInt(line.goods.textiles, 0) || null;
      var after = config.getRowSignature(row);
      if (before !== after) changed = true;

      var orderNo = config.toInt(row.orderNo, 0);
      if (orderNo > 0) {
        managedOrderNos.push(orderNo);
        used[orderNo] = true;
      }
    });

    angular.forEach(existingManagedRows, function (row) {
      var orderNo = config.toInt(row.orderNo, 0);
      if (!orderNo || used[orderNo]) return;
      var before = config.getRowSignature(row);
      config.clearTransferGoodsRowValues(row);
      var after = config.getRowSignature(row);
      if (before !== after) changed = true;
    });

    managedOrderNos.sort(function (left, right) {
      return left - right;
    });
    if (managedOrderNos.join(",") !== previousManaged.join(",")) {
      changed = true;
    }

    return {
      changed: changed,
      managedOrderNos: managedOrderNos,
      overflowCount: lines.length - targetRows.length,
    };
  }

  return {
    getTransferGoodsRowByOrderNo: getTransferGoodsRowByOrderNo,
    buildTs01BarracksSummaryRows: buildTs01BarracksSummaryRows,
    writeManagedTransferGoodsRows: writeManagedTransferGoodsRows,
  };
});
