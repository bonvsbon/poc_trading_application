"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDashboardSignal = void 0;
const money = (value) => `$${value.toFixed(2)}`;
const toDashboardSignal = (signal, sizing) => {
    const risk = Math.abs(signal.price - signal.stop);
    const reward = Math.abs(signal.target - signal.price);
    const riskReward = risk === 0 ? 'n/a' : `1:${(reward / risk).toFixed(1)}`;
    const sizeNote = sizing?.approved ? ` · size ${sizing.shares} shares` : '';
    return {
        id: `live-${signal.symbol.toLowerCase()}`,
        symbol: signal.symbol,
        side: signal.side === 'long' ? 'Long' : 'Short',
        status: 'pending',
        price: money(signal.price),
        confidence: signal.confidence,
        riskReward,
        stop: money(signal.stop),
        target: money(signal.target),
        thesis: `${signal.reason}${sizeNote}`,
        priority: true,
    };
};
exports.toDashboardSignal = toDashboardSignal;
//# sourceMappingURL=signal-adapter.js.map