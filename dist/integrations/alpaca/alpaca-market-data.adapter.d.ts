import { Bar } from '../../engine/market/bar';
import { HistoricalBarsRequest, MarketDataPort } from '../../engine/ports/market-data.port';
import { AlpacaSdkClient } from './alpaca-client';
export declare class AlpacaMarketDataAdapter implements MarketDataPort {
    private readonly client;
    constructor(client: AlpacaSdkClient);
    historicalBars(request: HistoricalBarsRequest): Promise<Bar[]>;
    recentBars(symbol: string): Promise<Bar[]>;
}
