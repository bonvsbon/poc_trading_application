"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAlpacaConfig = void 0;
const truthy = (value) => value === 'true' || value === '1';
const loadAlpacaConfig = (env = process.env) => {
    const keyId = env.ALPACA_API_KEY_ID;
    const secretKey = env.ALPACA_API_SECRET_KEY;
    if (!keyId || !secretKey) {
        return null;
    }
    const paper = !truthy(env.ALPACA_LIVE);
    const tradingEnabled = truthy(env.ALPACA_TRADING_ENABLED);
    return { keyId, secretKey, paper, tradingEnabled };
};
exports.loadAlpacaConfig = loadAlpacaConfig;
//# sourceMappingURL=alpaca.config.js.map