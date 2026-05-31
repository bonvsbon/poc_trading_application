import { ExitReason } from '../execution/order';
import { Side } from '../strategy/strategy';

export interface OpenPosition {
  symbol: string;
  side: Side;
  shares: number;
  entryPrice: number;
  stop: number;
  target: number;
}

export interface ClosedTrade {
  symbol: string;
  side: Side;
  shares: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  returnPct: number;
  reason: ExitReason;
}

/**
 * Long-only cash account. Opening a position commits cash (shares * price);
 * closing returns proceeds and books the realized PnL. No leverage.
 */
export class Portfolio {
  private cashBalance: number;
  private readonly open = new Map<string, OpenPosition>();
  private readonly closed: ClosedTrade[] = [];

  constructor(startingCash: number) {
    this.cashBalance = startingCash;
  }

  get cash(): number {
    return this.cashBalance;
  }

  get openPositions(): OpenPosition[] {
    return [...this.open.values()];
  }

  get closedTrades(): ClosedTrade[] {
    return [...this.closed];
  }

  hasPosition(symbol: string): boolean {
    return this.open.has(symbol);
  }

  openPosition(position: OpenPosition): void {
    if (position.side !== 'long') {
      throw new Error('Portfolio currently supports long-only positions');
    }
    if (this.open.has(position.symbol)) {
      throw new Error(`Position already open for ${position.symbol}`);
    }
    const cost = position.shares * position.entryPrice;
    if (cost > this.cashBalance) {
      throw new Error('Insufficient cash to open position');
    }
    this.cashBalance -= cost;
    this.open.set(position.symbol, position);
  }

  closePosition(symbol: string, exitPrice: number, reason: ExitReason): ClosedTrade {
    const position = this.open.get(symbol);
    if (!position) {
      throw new Error(`No open position for ${symbol}`);
    }

    this.cashBalance += position.shares * exitPrice;
    this.open.delete(symbol);

    const pnl = position.shares * (exitPrice - position.entryPrice);
    const returnPct = ((exitPrice - position.entryPrice) / position.entryPrice) * 100;
    const trade: ClosedTrade = {
      symbol,
      side: position.side,
      shares: position.shares,
      entryPrice: position.entryPrice,
      exitPrice,
      pnl,
      returnPct,
      reason,
    };
    this.closed.push(trade);
    return trade;
  }

  /** Mark-to-market equity given the latest prices for any open symbols. */
  equity(markPrices: Record<string, number>): number {
    let marketValue = 0;
    for (const position of this.open.values()) {
      const price = markPrices[position.symbol] ?? position.entryPrice;
      marketValue += position.shares * price;
    }
    return this.cashBalance + marketValue;
  }
}
