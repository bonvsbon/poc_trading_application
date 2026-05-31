import { Bar } from '../market/bar';

export type Side = 'long' | 'short';

export interface StrategySignal {
  symbol: string;
  side: Side;
  reason: string;
  confidence: number;
  price: number;
  stop: number;
  target: number;
}

export interface StrategyContext {
  /** Chronological bars for a single symbol's session; the last bar is the current one. */
  bars: Bar[];
}

export interface Strategy {
  readonly name: string;
  evaluate(ctx: StrategyContext): StrategySignal | null;
}
