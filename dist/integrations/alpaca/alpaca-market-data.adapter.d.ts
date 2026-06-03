import { Bar } from '../../engine/market/bar';
import { HistoricalBarsRequest, LatestPrice, MarketDataPort } from '../../engine/ports/market-data.port';
import { AlpacaSdkClient } from './alpaca-client';
export declare const isCryptoSymbol: (symbol: string) => boolean;
export declare class AlpacaMarketDataAdapter implements MarketDataPort {
    private readonly client;
    constructor(client: AlpacaSdkClient);
    historicalBars(request: HistoricalBarsRequest): Promise<Bar[]>;
    private cryptoBars;
    recentBars(symbol: string): Promise<Bar[]>;
    latestPrice(symbol: string): Promise<LatestPrice>;
    latestPrices(symbols: string[]): Promise<LatestPrice[]>;
    private fetchTrades;
}
