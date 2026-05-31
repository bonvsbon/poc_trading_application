"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VwapReclaimStrategy = exports.DEFAULT_VWAP_RECLAIM_CONFIG = void 0;
const indicators_1 = require("../market/indicators");
exports.DEFAULT_VWAP_RECLAIM_CONFIG = {
    volumeLookback: 20,
    volumeMultiplier: 1.8,
    stopLookback: 5,
    riskRewardRatio: 2,
};
class VwapReclaimStrategy {
    name = 'vwap-reclaim';
    config;
    constructor(config = {}) {
        this.config = { ...exports.DEFAULT_VWAP_RECLAIM_CONFIG, ...config };
    }
    evaluate(ctx) {
        const { bars } = ctx;
        if (bars.length < this.config.volumeLookback + 2) {
            return null;
        }
        const current = bars[bars.length - 1];
        const previous = bars[bars.length - 2];
        const vwapNow = (0, indicators_1.sessionVwap)(bars);
        const vwapPrev = (0, indicators_1.sessionVwap)(bars.slice(0, -1));
        if (vwapNow === null || vwapPrev === null) {
            return null;
        }
        const reclaimed = previous.close < vwapPrev && current.close > vwapNow;
        if (!reclaimed) {
            return null;
        }
        const baselineVolume = (0, indicators_1.averageVolume)(bars, this.config.volumeLookback);
        if (baselineVolume === null || baselineVolume === 0) {
            return null;
        }
        const volumeRatio = current.volume / baselineVolume;
        if (volumeRatio < this.config.volumeMultiplier) {
            return null;
        }
        const stop = (0, indicators_1.lowestLow)(bars, this.config.stopLookback);
        if (stop === null || stop >= current.close) {
            return null;
        }
        const entry = current.close;
        const risk = entry - stop;
        const target = entry + risk * this.config.riskRewardRatio;
        return {
            symbol: current.symbol,
            side: 'long',
            reason: `VWAP reclaim with ${volumeRatio.toFixed(2)}x volume`,
            confidence: this.confidence(volumeRatio, entry, vwapNow),
            price: entry,
            stop,
            target,
        };
    }
    confidence(volumeRatio, entry, vwap) {
        const volumeScore = Math.min(1, (volumeRatio - this.config.volumeMultiplier) / this.config.volumeMultiplier);
        const distanceScore = Math.min(1, (entry - vwap) / vwap / 0.01);
        const raw = 50 + volumeScore * 30 + distanceScore * 20;
        return Math.round(Math.max(0, Math.min(100, raw)));
    }
}
exports.VwapReclaimStrategy = VwapReclaimStrategy;
//# sourceMappingURL=vwap-reclaim.strategy.js.map