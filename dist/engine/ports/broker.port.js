"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingDisabledError = exports.BrokerNotConfiguredError = void 0;
class BrokerNotConfiguredError extends Error {
    constructor() {
        super('Broker is not configured. Set ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY in env.');
    }
}
exports.BrokerNotConfiguredError = BrokerNotConfiguredError;
class TradingDisabledError extends Error {
    constructor() {
        super('Trading is disabled. Set ALPACA_TRADING_ENABLED=true to allow order submission.');
    }
}
exports.TradingDisabledError = TradingDisabledError;
//# sourceMappingURL=broker.port.js.map