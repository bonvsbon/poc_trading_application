"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlpacaMarketDataAdapter = exports.isCryptoSymbol = void 0;
const ALPACA_TIMEFRAME = {
    '1Min': '1Min',
    '5Min': '5Min',
    '15Min': '15Min',
    '1Hour': '1Hour',
    '1Day': '1Day',
};
const isCryptoSymbol = (symbol) => symbol.includes('/');
exports.isCryptoSymbol = isCryptoSymbol;
class AlpacaMarketDataAdapter {
    client;
    constructor(client) {
        this.client = client;
    }
    async historicalBars(request) {
        if ((0, exports.isCryptoSymbol)(request.symbol)) {
            return this.cryptoBars(request);
        }
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
    async cryptoBars(request) {
        if (!this.client.getCryptoBars) {
            throw new Error('Alpaca client does not expose getCryptoBars');
        }
        const map = await this.client.getCryptoBars([request.symbol], {
            timeframe: ALPACA_TIMEFRAME[request.timeframe],
            start: request.from,
            end: request.to,
            limit: request.limit,
        });
        const raw = map.get(request.symbol) ?? [];
        return raw.map((bar) => ({
            timestamp: bar.Timestamp,
            symbol: request.symbol,
            open: bar.Open,
            high: bar.High,
            low: bar.Low,
            close: bar.Close,
            volume: bar.Volume,
        }));
    }
    async recentBars(symbol) {
        const crypto = (0, exports.isCryptoSymbol)(symbol);
        const end = new Date();
        const lookbackMs = crypto ? 6 * 60 * 60 * 1000 : 60 * 60 * 1000;
        const start = new Date(end.getTime() - lookbackMs);
        return this.historicalBars({
            symbol,
            timeframe: crypto ? '5Min' : '1Min',
            from: start.toISOString(),
            to: end.toISOString(),
        });
    }
    async latestPrice(symbol) {
        const [price] = await this.latestPrices([symbol]);
        return price;
    }
    async latestPrices(symbols) {
        const crypto = symbols.filter(exports.isCryptoSymbol);
        const equity = symbols.filter((s) => !(0, exports.isCryptoSymbol)(s));
        const [cryptoTrades, equityTrades] = await Promise.all([
            this.fetchTrades(crypto, this.client.getLatestCryptoTrades?.bind(this.client)),
            this.fetchTrades(equity, this.client.getLatestTrades?.bind(this.client)),
        ]);
        const merged = new Map([...cryptoTrades, ...equityTrades]);
        return symbols.map((symbol) => {
            const trade = merged.get(symbol);
            return {
                symbol,
                price: trade ? trade.Price : null,
                timestamp: trade ? trade.Timestamp : null,
            };
        });
    }
    async fetchTrades(symbols, fetcher) {
        if (symbols.length === 0) {
            return new Map();
        }
        if (!fetcher) {
            throw new Error('Alpaca client does not expose the required latest-trade endpoint');
        }
        return fetcher(symbols);
    }
}
exports.AlpacaMarketDataAdapter = AlpacaMarketDataAdapter;
//# sourceMappingURL=alpaca-market-data.adapter.js.map