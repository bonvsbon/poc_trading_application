"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionSimulator = exports.DEFAULT_EXECUTION_CONFIG = void 0;
exports.DEFAULT_EXECUTION_CONFIG = {
    slippageBps: 2,
    spreadBps: 1,
};
class ExecutionSimulator {
    config;
    constructor(config = {}) {
        this.config = { ...exports.DEFAULT_EXECUTION_CONFIG, ...config };
    }
    adverseCost() {
        return (this.config.slippageBps + this.config.spreadBps) / 10000;
    }
    fillEntry(order, referencePrice) {
        const cost = this.adverseCost();
        const price = order.side === 'long' ? referencePrice * (1 + cost) : referencePrice * (1 - cost);
        return { symbol: order.symbol, shares: order.shares, price };
    }
    checkExit(position, bar) {
        const cost = this.adverseCost();
        if (position.side === 'long') {
            if (bar.low <= position.stop) {
                return { price: position.stop * (1 - cost), reason: 'stop' };
            }
            if (bar.high >= position.target) {
                return { price: position.target * (1 - cost), reason: 'target' };
            }
            return null;
        }
        if (bar.high >= position.stop) {
            return { price: position.stop * (1 + cost), reason: 'stop' };
        }
        if (bar.low <= position.target) {
            return { price: position.target * (1 + cost), reason: 'target' };
        }
        return null;
    }
    forceClose(position, bar) {
        const cost = this.adverseCost();
        const price = position.side === 'long' ? bar.close * (1 - cost) : bar.close * (1 + cost);
        return { price, reason: 'close' };
    }
}
exports.ExecutionSimulator = ExecutionSimulator;
//# sourceMappingURL=execution-simulator.js.map