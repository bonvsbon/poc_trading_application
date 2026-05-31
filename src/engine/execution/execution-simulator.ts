import { Bar } from '../market/bar';
import { BracketOrder, ExitResult, Fill } from './order';

export interface ExecutionConfig {
  /** Adverse slippage in basis points applied to every fill. */
  slippageBps: number;
  /** Half-spread cost in basis points applied to every fill. */
  spreadBps: number;
}

export const DEFAULT_EXECUTION_CONFIG: ExecutionConfig = {
  slippageBps: 2,
  spreadBps: 1,
};

export interface OpenPositionState {
  side: BracketOrder['side'];
  stop: number;
  target: number;
}

/**
 * Deterministic fill/exit model for a single-symbol bracket order. No randomness:
 * fills move adverse to the trade by a fixed cost so backtests are reproducible.
 */
export class ExecutionSimulator {
  private readonly config: ExecutionConfig;

  constructor(config: Partial<ExecutionConfig> = {}) {
    this.config = { ...DEFAULT_EXECUTION_CONFIG, ...config };
  }

  private adverseCost(): number {
    return (this.config.slippageBps + this.config.spreadBps) / 10000;
  }

  /** Fill an entry at the reference price, moved adverse to the trade direction. */
  fillEntry(order: BracketOrder, referencePrice: number): Fill {
    const cost = this.adverseCost();
    const price =
      order.side === 'long' ? referencePrice * (1 + cost) : referencePrice * (1 - cost);

    return { symbol: order.symbol, shares: order.shares, price };
  }

  /**
   * Check whether a bar triggers the stop or target. Stop is evaluated first when
   * both are touched in the same bar (conservative). Returns null if neither is hit.
   */
  checkExit(position: OpenPositionState, bar: Bar): ExitResult | null {
    const cost = this.adverseCost();

    if (position.side === 'long') {
      if (bar.low <= position.stop) {
        return { price: position.stop * (1 - cost), reason: 'stop' };
      }
      if (bar.high >= position.target) {
        return { price: position.target * (1 - cost), reason: 'target' };
      }
      return null;
    }

    // short
    if (bar.high >= position.stop) {
      return { price: position.stop * (1 + cost), reason: 'stop' };
    }
    if (bar.low <= position.target) {
      return { price: position.target * (1 + cost), reason: 'target' };
    }
    return null;
  }

  /** Force an exit at the bar close (e.g. end of data), moved adverse to the trade. */
  forceClose(position: OpenPositionState, bar: Bar): ExitResult {
    const cost = this.adverseCost();
    const price = position.side === 'long' ? bar.close * (1 - cost) : bar.close * (1 + cost);
    return { price, reason: 'close' };
  }
}
