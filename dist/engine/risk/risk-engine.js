"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskEngine = exports.DEFAULT_RISK_LIMITS = void 0;
exports.DEFAULT_RISK_LIMITS = {
    riskPerTradePercent: 0.35,
    maxTrades: 8,
    maxTickerExposurePercent: 10,
    maxSectorExposurePercent: 25,
    dailyLossLimitPercent: 2,
    cooldownLossStreak: 3,
};
const reject = (reason) => ({
    approved: false,
    reason,
    shares: 0,
    riskAmount: 0,
    notional: 0,
});
class RiskEngine {
    sizePosition({ signal, sector, account, limits }) {
        const cfg = { ...exports.DEFAULT_RISK_LIMITS, ...limits };
        if (account.consecutiveLosses >= cfg.cooldownLossStreak) {
            return reject(`Cooldown active after ${account.consecutiveLosses} losses`);
        }
        if (account.dailyPnlPercent <= -cfg.dailyLossLimitPercent) {
            return reject('Daily loss limit reached');
        }
        if (account.openTradesCount >= cfg.maxTrades) {
            return reject('Max concurrent trades reached');
        }
        const perShareRisk = Math.abs(signal.price - signal.stop);
        if (perShareRisk <= 0) {
            return reject('Invalid stop: zero per-share risk');
        }
        const riskAmount = (account.equity * cfg.riskPerTradePercent) / 100;
        const riskShares = Math.floor(riskAmount / perShareRisk);
        const tickerRoom = Math.max(0, (account.equity * cfg.maxTickerExposurePercent) / 100 - (account.tickerNotional[signal.symbol] ?? 0));
        const sectorRoom = Math.max(0, (account.equity * cfg.maxSectorExposurePercent) / 100 - (account.sectorNotional[sector] ?? 0));
        const tickerShares = Math.floor(tickerRoom / signal.price);
        const sectorShares = Math.floor(sectorRoom / signal.price);
        const shares = Math.min(riskShares, tickerShares, sectorShares);
        if (shares <= 0) {
            return reject('Exposure limit leaves no room for this trade');
        }
        return {
            approved: true,
            reason: 'Approved',
            shares,
            riskAmount: shares * perShareRisk,
            notional: shares * signal.price,
        };
    }
}
exports.RiskEngine = RiskEngine;
//# sourceMappingURL=risk-engine.js.map