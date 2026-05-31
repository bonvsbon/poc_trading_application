"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lowestLow = exports.averageVolume = exports.sessionVwap = void 0;
const bar_1 = require("./bar");
const sessionVwap = (bars) => {
    let cumulativePriceVolume = 0;
    let cumulativeVolume = 0;
    for (const bar of bars) {
        cumulativePriceVolume += (0, bar_1.typicalPrice)(bar) * bar.volume;
        cumulativeVolume += bar.volume;
    }
    if (cumulativeVolume === 0) {
        return null;
    }
    return cumulativePriceVolume / cumulativeVolume;
};
exports.sessionVwap = sessionVwap;
const averageVolume = (bars, lookback) => {
    if (lookback <= 0) {
        return null;
    }
    const prior = bars.slice(0, -1);
    if (prior.length < lookback) {
        return null;
    }
    const window = prior.slice(-lookback);
    const total = window.reduce((sum, bar) => sum + bar.volume, 0);
    return total / lookback;
};
exports.averageVolume = averageVolume;
const lowestLow = (bars, lookback) => {
    if (lookback <= 0 || bars.length === 0) {
        return null;
    }
    const window = bars.slice(-lookback);
    return Math.min(...window.map((bar) => bar.low));
};
exports.lowestLow = lowestLow;
//# sourceMappingURL=indicators.js.map