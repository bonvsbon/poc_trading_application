import { ClosedTrade } from '../portfolio/portfolio';
import { computeMetrics, maxDrawdownPct, sharpeRatio } from './metrics';

const trade = (pnl: number): ClosedTrade => ({
  symbol: 'NVDA',
  side: 'long',
  shares: 10,
  entryPrice: 100,
  exitPrice: 100 + pnl / 10,
  pnl,
  returnPct: pnl / 10,
  reason: pnl >= 0 ? 'target' : 'stop',
});

describe('maxDrawdownPct', () => {
  it('finds the largest peak-to-trough decline', () => {
    expect(maxDrawdownPct([100, 120, 90, 110])).toBeCloseTo(25, 6);
  });

  it('is zero for a monotonically rising curve', () => {
    expect(maxDrawdownPct([100, 110, 120])).toBe(0);
  });
});

describe('sharpeRatio', () => {
  it('is zero when there is no variance', () => {
    expect(sharpeRatio([100, 100, 100])).toBe(0);
  });

  it('is positive for a steadily rising curve', () => {
    expect(sharpeRatio([100, 101, 102, 103])).toBeGreaterThan(0);
  });

  it('is zero with fewer than two points', () => {
    expect(sharpeRatio([100])).toBe(0);
  });
});

describe('computeMetrics', () => {
  it('summarizes a mixed set of trades', () => {
    const trades = [trade(100), trade(-50), trade(60)];
    const equityCurve = [10000, 10100, 10050, 10110];
    const m = computeMetrics(equityCurve, trades, 10000);

    expect(m.trades).toBe(3);
    expect(m.wins).toBe(2);
    expect(m.losses).toBe(1);
    expect(m.winRatePct).toBeCloseTo(66.6667, 3);
    expect(m.totalReturnPct).toBeCloseTo(1.1, 6);
    // gross profit 160 / gross loss 50 = 3.2
    expect(m.profitFactor).toBeCloseTo(3.2, 6);
  });

  it('reports an infinite profit factor when there are no losses', () => {
    const m = computeMetrics([10000, 10100], [trade(100)], 10000);
    expect(m.profitFactor).toBe(Infinity);
  });

  it('handles an empty trade list', () => {
    const m = computeMetrics([10000], [], 10000);
    expect(m.trades).toBe(0);
    expect(m.winRatePct).toBe(0);
    expect(m.profitFactor).toBe(0);
  });
});
