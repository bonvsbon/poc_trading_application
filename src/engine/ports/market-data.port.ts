import { Bar } from '../market/bar';

export type Timeframe = '1Min' | '5Min' | '15Min' | '1Hour' | '1Day';

export interface HistoricalBarsRequest {
  symbol: string;
  timeframe: Timeframe;
  from: string;
  to: string;
  limit?: number;
}

/** Latest traded price for a single symbol — for live watchlist/quote display. */
export interface LatestPrice {
  symbol: string;
  /** Last trade price; null when the feed has no recent trade for the symbol. */
  price: number | null;
  /** ISO timestamp of that trade; null when unavailable. */
  timestamp: string | null;
}

/** Source of market data — historical for backtest, live (later) for trading. */
export interface MarketDataPort {
  /** Most recent bars usable for live strategy evaluation. */
  recentBars(symbol: string): Promise<Bar[]> | Bar[];
  /** Bars over a date range (used by backtest replay or charts). */
  historicalBars?(request: HistoricalBarsRequest): Promise<Bar[]>;
  /** Last traded price for one symbol. */
  latestPrice?(symbol: string): Promise<LatestPrice>;
  /** Last traded price for many symbols (watchlist) in one round-trip. */
  latestPrices?(symbols: string[]): Promise<LatestPrice[]>;
}
