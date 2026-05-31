import { ExecutionSimulator } from '../execution/execution-simulator';
import { Bar } from '../market/bar';
import { ClosedTrade, Portfolio } from '../portfolio/portfolio';
import { RiskEngine, RiskLimits } from '../risk/risk-engine';
import { Strategy } from '../strategy/strategy';
import { BacktestMetrics, computeMetrics } from './metrics';

export interface BacktestConfig {
  startingCash: number;
  sector: string;
  riskLimits?: Partial<RiskLimits>;
}

export interface BacktestResult {
  equityCurve: number[];
  closedTrades: ClosedTrade[];
  metrics: BacktestMetrics;
}

export interface BacktestDeps {
  strategy: Strategy;
  riskEngine?: RiskEngine;
  executionSimulator?: ExecutionSimulator;
}

/**
 * Single-symbol, long-only backtest. On each bar: manage the open position
 * (stop/target), then if flat, evaluate the strategy and size/enter via the risk
 * engine. Deterministic given the same bars and config.
 */
export class Backtester {
  private readonly strategy: Strategy;
  private readonly risk: RiskEngine;
  private readonly execution: ExecutionSimulator;

  constructor(deps: BacktestDeps) {
    this.strategy = deps.strategy;
    this.risk = deps.riskEngine ?? new RiskEngine();
    this.execution = deps.executionSimulator ?? new ExecutionSimulator();
  }

  run(bars: Bar[], config: BacktestConfig): BacktestResult {
    const portfolio = new Portfolio(config.startingCash);
    const equityCurve: number[] = [];
    let consecutiveLosses = 0;

    for (let i = 0; i < bars.length; i++) {
      const current = bars[i];
      const symbol = current.symbol;

      // 1. Manage an open position against the current bar.
      if (portfolio.hasPosition(symbol)) {
        const position = portfolio.openPositions.find((p) => p.symbol === symbol)!;
        const exit = this.execution.checkExit(position, current);
        if (exit) {
          const trade = portfolio.closePosition(symbol, exit.price, exit.reason);
          consecutiveLosses = trade.pnl < 0 ? consecutiveLosses + 1 : 0;
        }
      }

      // 2. If flat, look for a new entry.
      if (!portfolio.hasPosition(symbol)) {
        const signal = this.strategy.evaluate({ bars: bars.slice(0, i + 1) });
        if (signal && signal.side === 'long') {
          const equity = portfolio.equity({ [symbol]: current.close });
          const sizing = this.risk.sizePosition({
            signal,
            sector: config.sector,
            account: {
              equity,
              openTradesCount: portfolio.openPositions.length,
              tickerNotional: this.notionalByKey(portfolio, current.close, 'symbol'),
              sectorNotional: { [config.sector]: this.totalNotional(portfolio, current.close) },
              dailyPnlPercent: ((equity - config.startingCash) / config.startingCash) * 100,
              consecutiveLosses,
            },
            limits: config.riskLimits,
          });

          if (sizing.approved) {
            const fill = this.execution.fillEntry(
              { symbol, side: 'long', shares: sizing.shares, entry: signal.price, stop: signal.stop, target: signal.target },
              signal.price,
            );
            portfolio.openPosition({
              symbol,
              side: 'long',
              shares: fill.shares,
              entryPrice: fill.price,
              stop: signal.stop,
              target: signal.target,
            });
          }
        }
      }

      equityCurve.push(portfolio.equity({ [symbol]: current.close }));
    }

    // 3. Force-close anything still open at the last bar.
    if (bars.length > 0) {
      const last = bars[bars.length - 1];
      for (const position of portfolio.openPositions) {
        const exit = this.execution.forceClose(position, last);
        portfolio.closePosition(position.symbol, exit.price, exit.reason);
      }
      if (portfolio.openPositions.length === 0 && equityCurve.length > 0) {
        equityCurve[equityCurve.length - 1] = portfolio.equity({});
      }
    }

    return {
      equityCurve,
      closedTrades: portfolio.closedTrades,
      metrics: computeMetrics(equityCurve, portfolio.closedTrades, config.startingCash),
    };
  }

  private notionalByKey(portfolio: Portfolio, price: number, _key: 'symbol'): Record<string, number> {
    const out: Record<string, number> = {};
    for (const position of portfolio.openPositions) {
      out[position.symbol] = position.shares * price;
    }
    return out;
  }

  private totalNotional(portfolio: Portfolio, price: number): number {
    return portfolio.openPositions.reduce((sum, p) => sum + p.shares * price, 0);
  }
}
