import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { VwapReclaimStrategy } from '../strategy/vwap-reclaim.strategy';
import { Backtester } from './backtester';
import { parseCsv } from './data-loader';

const loadSample = () => {
  const csv = readFileSync(join(__dirname, 'fixtures', 'sample-NVDA.csv'), 'utf8');
  return parseCsv(csv, 'NVDA');
};

const runSample = () =>
  new Backtester({ strategy: new VwapReclaimStrategy() }).run(loadSample(), {
    startingCash: 100000,
    sector: 'Semis',
  });

describe('backtest golden file (sample-NVDA.csv)', () => {
  it('matches the committed metrics snapshot', () => {
    const { metrics } = runSample();
    expect(metrics).toEqual({
      startingEquity: 100000,
      finalEquity: 100696.7,
      totalReturnPct: 0.6967,
      trades: 1,
      wins: 1,
      losses: 0,
      winRatePct: 100,
      profitFactor: Infinity,
      maxDrawdownPct: 0.0015,
      sharpe: 3.3766,
    });
  });
});

describe('backtest invariants', () => {
  it('keeps the equity curve aligned to the bar count', () => {
    const bars = loadSample();
    const result = new Backtester({ strategy: new VwapReclaimStrategy() }).run(bars, {
      startingCash: 100000,
      sector: 'Semis',
    });
    expect(result.equityCurve).toHaveLength(bars.length);
  });

  it('reconciles final equity with the sum of realized PnL', () => {
    const result = runSample();
    const realized = result.closedTrades.reduce((sum, t) => sum + t.pnl, 0);
    expect(result.metrics.finalEquity).toBeCloseTo(100000 + realized, 4);
  });

  it('never opens a position larger than the 10% ticker exposure cap', () => {
    const result = runSample();
    for (const trade of result.closedTrades) {
      const entryNotional = trade.shares * trade.entryPrice;
      // entry equity is ~starting equity here; cap is 10% of it
      expect(entryNotional).toBeLessThanOrEqual(100000 * 0.1 + 1e-6);
      expect(trade.shares).toBeGreaterThan(0);
    }
  });

  it('reports a non-negative max drawdown and a sane win rate', () => {
    const { metrics } = runSample();
    expect(metrics.maxDrawdownPct).toBeGreaterThanOrEqual(0);
    expect(metrics.winRatePct).toBeGreaterThanOrEqual(0);
    expect(metrics.winRatePct).toBeLessThanOrEqual(100);
  });
});
