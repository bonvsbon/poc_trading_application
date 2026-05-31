import { Bar } from '../market/bar';
import { VwapReclaimStrategy } from '../strategy/vwap-reclaim.strategy';
import { Backtester } from './backtester';

const flat = (i: number, over: Partial<Bar> = {}): Bar => ({
  timestamp: `2026-05-29T13:${String(i).padStart(2, '0')}:00.000Z`,
  symbol: 'NVDA',
  open: 100,
  high: 101,
  low: 99,
  close: 100,
  volume: 1000,
  ...over,
});

/** 20 flat bars, a dip, a high-volume reclaim (entry), then a bar that tags the target. */
const winningSeries = (): Bar[] => {
  const baseline = Array.from({ length: 20 }, (_, i) => flat(i));
  const dip = flat(20, { high: 100, low: 96, close: 98 });
  const reclaim = flat(21, { high: 104, low: 99, close: 103, volume: 2000 });
  const runUp = flat(22, { open: 104, high: 120, low: 103, close: 118 });
  const cooldown = flat(23, { open: 118, high: 119, low: 116, close: 117 });
  return [...baseline, dip, reclaim, runUp, cooldown];
};

describe('Backtester', () => {
  const backtester = new Backtester({ strategy: new VwapReclaimStrategy() });

  it('runs a full long trade and books a win', () => {
    const result = backtester.run(winningSeries(), {
      startingCash: 100000,
      sector: 'Semis',
    });

    expect(result.closedTrades).toHaveLength(1);
    expect(result.closedTrades[0].reason).toBe('target');
    expect(result.metrics.trades).toBe(1);
    expect(result.metrics.wins).toBe(1);
    expect(result.metrics.totalReturnPct).toBeGreaterThan(0);
    expect(result.metrics.finalEquity).toBeGreaterThan(100000);
  });

  it('produces one equity point per bar', () => {
    const bars = winningSeries();
    const result = backtester.run(bars, { startingCash: 100000, sector: 'Semis' });
    expect(result.equityCurve).toHaveLength(bars.length);
  });

  it('takes no trades when the strategy never fires', () => {
    const bars = Array.from({ length: 30 }, (_, i) => flat(i));
    const result = backtester.run(bars, { startingCash: 100000, sector: 'Semis' });
    expect(result.closedTrades).toHaveLength(0);
    expect(result.metrics.finalEquity).toBe(100000);
  });

  it('force-closes a still-open position at the end of data', () => {
    const baseline = Array.from({ length: 20 }, (_, i) => flat(i));
    const dip = flat(20, { high: 100, low: 96, close: 98 });
    const reclaim = flat(21, { high: 104, low: 99, close: 103, volume: 2000 });
    // stays between stop (96) and target (117) so it never brackets out
    const drift = flat(22, { open: 103, high: 106, low: 101, close: 104 });
    const bars = [...baseline, dip, reclaim, drift];

    const result = backtester.run(bars, { startingCash: 100000, sector: 'Semis' });
    expect(result.closedTrades).toHaveLength(1);
    expect(result.closedTrades[0].reason).toBe('close');
  });

  it('is deterministic across repeated runs', () => {
    const a = backtester.run(winningSeries(), { startingCash: 100000, sector: 'Semis' });
    const b = backtester.run(winningSeries(), { startingCash: 100000, sector: 'Semis' });
    expect(a.metrics).toEqual(b.metrics);
  });
});
