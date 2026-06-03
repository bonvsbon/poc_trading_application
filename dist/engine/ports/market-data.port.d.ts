import { Bar } from '../market/bar';
export type Timeframe = '1Min' | '5Min' | '15Min' | '1Hour' | '1Day';
export interface HistoricalBarsRequest {
    symbol: string;
    timeframe: Timeframe;
    from: string;
    to: string;
    limit?: number;
}
export interface LatestPrice {
    symbol: string;
    price: number | null;
    timestamp: string | null;
}
export interface MarketDataPort {
    recentBars(symbol: string): Promise<Bar[]> | Bar[];
    historicalBars?(request: HistoricalBarsRequest): Promise<Bar[]>;
    latestPrice?(symbol: string): Promise<LatestPrice>;
    latestPrices?(symbols: string[]): Promise<LatestPrice[]>;
}
