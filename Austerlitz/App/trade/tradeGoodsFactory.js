"use strict";

austerlitzModule.factory("tradeGoodsFactory", function () {
  var tradingGoodsConfig = [
    { key: "ectPts", itemType: "ecpts", label: "EcPts", goodsId: 13, fallbackGoodsFactor: 6, fallbackPerTon: 25 },
    { key: "zinc", itemType: "zinc", label: "Zinc", goodsId: 21, fallbackGoodsFactor: 45, fallbackPerTon: 1 },
    { key: "gold", itemType: "gold", label: "Gold", goodsId: 29, fallbackGoodsFactor: 35, fallbackPerTon: 1 },
    { key: "ore", itemType: "ore", label: "Ore", goodsId: 20, fallbackGoodsFactor: 30, fallbackPerTon: 1 },
    { key: "horses", itemType: "horses", label: "Horses", goodsId: 22, fallbackGoodsFactor: 2, fallbackPerTon: 5 },
    { key: "wood", itemType: "wood", label: "Wood", goodsId: 19, fallbackGoodsFactor: 3, fallbackPerTon: 3 },
    { key: "wine", itemType: "wine", label: "Wine", goodsId: 30, fallbackGoodsFactor: 8, fallbackPerTon: 1 },
    { key: "textiles", itemType: "textiles", label: "Textiles", goodsId: 23, fallbackGoodsFactor: 5, fallbackPerTon: 1 },
    { key: "food", itemType: "food", label: "Food", goodsId: 16, fallbackGoodsFactor: 4, fallbackPerTon: 1 },
    { key: "wool", itemType: "wool", label: "Wool", goodsId: 24, fallbackGoodsFactor: 2, fallbackPerTon: 1 },
    { key: "stone", itemType: "stone", label: "Stone", goodsId: 18, fallbackGoodsFactor: 1, fallbackPerTon: 3 },
  ];

  var tradeGoodsIdByKey = {};
  var tradeGoodsKeyById = {};
  var tradeGoodsFactorByKey = {};

  (tradingGoodsConfig || []).forEach(function (good) {
    if (!good || !good.key || good.goodsId == null) {
      return;
    }
    tradeGoodsIdByKey[good.key] = good.goodsId;
    tradeGoodsKeyById[good.goodsId] = good.key;
    tradeGoodsFactorByKey[good.key] = good.fallbackGoodsFactor;
  });

  return {
    tradingGoodsConfig: tradingGoodsConfig,
    tradeGoodsIdByKey: tradeGoodsIdByKey,
    tradeGoodsKeyById: tradeGoodsKeyById,
    tradeGoodsFactorByKey: tradeGoodsFactorByKey,
  };
});
