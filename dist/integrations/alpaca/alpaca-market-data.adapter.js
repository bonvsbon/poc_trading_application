"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlpacaMarketDataAdapter = void 0;
const ALPACA_TIMEFRAME = {
    '1Min': '1Min',
    '5Min': '5Min',
    '15Min': '15Min',
    '1Hour': '1Hour',
    '1Day': '1Day',
};
class AlpacaMarketDataAdapter {
    client;
    constructor(client) {
        this.client = client;
    }
    async historicalBars(request) {
        if (!this.client.getBarsV2) {
            throw new Error('Alpaca client does not expose getBarsV2');
        }
        const iterator = this.client.getBarsV2(request.symbol, {
            start: request.from,
            end: request.to,
            timeframe: ALPACA_TIMEFRAME[request.timeframe],
            limit: request.limit,
        });
        const bars = [];
        for await (const raw of iterator) {
            bars.push({
                timestamp: raw.Timestamp,
                symbol: request.symbol,
                open: raw.OpenPrice,
                high: raw.HighPrice,
                low: raw.LowPrice,
                close: raw.ClosePrice,
                volume: raw.Volume,
            });
        }
        return bars;
    }
    async recentBars(symbol) {
        const end = new Date();
        const start = new Date(end.getTime() - 60 * 60 * 1000);
        return this.historicalBars({
            symbol,
            timeframe: '1Min',
            from: start.toISOString(),
            to: end.toISOString(),
        });
    }
}
exports.AlpacaMarketDataAdapter = AlpacaMarketDataAdapter;
//# sourceMappingURL=alpaca-market-data.adapter.js.map