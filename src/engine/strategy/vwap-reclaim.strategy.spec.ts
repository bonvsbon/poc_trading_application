import { Bar } from '../market/bar';
import { VwapReclaimStrategy } from './vwap-reclaim.strategy';

const baselineBar = (i: number): Bar => ({
  timestamp: `2026-05-29T13:${String(i).padStart(2, '0')}:00.000Z`,
  symbol: 'NVDA',
  open: 100,
  high: 101,
  low: 99,
  close: 100,
  volume: 1000,
});

/** 20 flat baseline bars around price 100, then a dip bar, then a configurable current bar. */
const buildSeries = (current: Partial<Bar>, previous: Partial<Bar> = {}): Bar[] => {
  const baseline = Array.from({ length: 20 }, (_, i) => baselineBar(i));
  const dip: Bar = { ...baselineBar(20), high: 100, low: 96, close: 98, volume: 1000, ...previous };
  const now: Bar = { ...baselineBar(21), high: 104, low: 99, close: 103, volume: 2000, ...current };
  return [...baseline, dip, now];
};

describe('VwapReclaimStrategy', () => {
  const strategy = new VwapReclaimStrategy();

  it('emits a long signal on a VWAP reclaim with volume anomaly', () => {
    const signal = strategy.evaluate({ bars: buildSeries({}) });
    expect(signal).not.toBeNull();
    expect(signal?.side).toBe('long');
    expect(signal?.symbol).toBe('NVDA');
    expect(signal?.stop).toBeLessThan(signal!.price);
    expect(signal?.target).toBeGreaterThan(signal!.price);
    // risk:reward of 2 → target distance is twice the stop distance
    const risk = signal!.price - signal!.stop;
    expect(signal!.target - signal!.price).toBeCloseTo(risk * 2, 6);
  });

  it('returns null without enough bars', () => {
    const bars = [baselineBar(0), baselineBar(1), baselineBar(2)];
    expect(strategy.evaluate({ bars })).toBeNull();
  });

  it('returns null when price does not reclaim VWAP', () => {
    // current closes below VWAP
    const signal = strategy.evaluate({ bars: buildSeries({ close: 97, high: 98 }) });
    expect(signal).toBeNull();
  });

  it('returns null when volume is not anomalous', () => {
    const signal = strategy.evaluate({ bars: buildSeries({ volume: 1000 }) });
    expect(signal).toBeNull();
  });

  it('scales confidence between 0 and 100', () => {
    const signal = strategy.evaluate({ bars: buildSeries({}) });
    expect(signal!.confidence).toBeGreaterThanOrEqual(0);
    expect(signal!.confidence).toBeLessThanOrEqual(100);
  });

  it('honors a custom risk-reward ratio', () => {
    const custom = new VwapReclaimStrategy({ riskRewardRatio: 3 });
    const signal = custom.evaluate({ bars: buildSeries({}) });
    const risk = signal!.price - signal!.stop;
    expect(signal!.target - signal!.price).toBeCloseTo(risk * 3, 6);
  });
});
