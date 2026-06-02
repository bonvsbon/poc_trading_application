import { Bar } from '../market/bar';

export type Timeframe = '1Min' | '5Min' | '15Min' | '1Hour' | '1Day';

export interface HistoricalBarsRequest {
  symbol: string;
  timeframe: Timeframe;
  from: string;
  to: string;
  limit?: number;
}

/** Source of market data — historical for backtest, live (later) for trading. */
export interface MarketDataPort {
  /** Most recent bars usable for live strategy evaluation. */
  recentBars(symbol: string): Promise<Bar[]> | Bar[];
  /** Bars over a date range (used by backtest replay or charts). */
  historicalBars?(request: HistoricalBarsRequest): Promise<Bar[]>;
}
