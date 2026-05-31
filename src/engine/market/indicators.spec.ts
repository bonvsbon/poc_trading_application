import { Bar } from './bar';
import { averageVolume, lowestLow, sessionVwap } from './indicators';

const bar = (over: Partial<Bar>): Bar => ({
  timestamp: '2026-05-29T13:30:00.000Z',
  symbol: 'TEST',
  open: 100,
  high: 101,
  low: 99,
  close: 100,
  volume: 1000,
  ...over,
});

describe('sessionVwap', () => {
  it('weights typical price by volume', () => {
    const bars = [
      bar({ high: 12, low: 8, close: 10, volume: 100 }), // typical 10
      bar({ high: 22, low: 18, close: 20, volume: 300 }), // typical 20
    ];
    // (10*100 + 20*300) / 400 = 7000/400 = 17.5
    expect(sessionVwap(bars)).toBe(17.5);
  });

  it('returns null when there is no volume', () => {
    expect(sessionVwap([bar({ volume: 0 })])).toBeNull();
  });
});

describe('averageVolume', () => {
  it('averages the prior lookback bars excluding the current bar', () => {
    const bars = [
      bar({ volume: 100 }),
      bar({ volume: 200 }),
      bar({ volume: 300 }),
      bar({ volume: 9999 }), // current bar, excluded
    ];
    expect(averageVolume(bars, 3)).toBe(200);
  });

  it('returns null without enough prior bars', () => {
    expect(averageVolume([bar({}), bar({})], 3)).toBeNull();
  });

  it('returns null for a non-positive lookback', () => {
    expect(averageVolume([bar({}), bar({})], 0)).toBeNull();
  });
});

describe('lowestLow', () => {
  it('finds the minimum low in the window', () => {
    const bars = [bar({ low: 95 }), bar({ low: 90 }), bar({ low: 93 })];
    expect(lowestLow(bars, 2)).toBe(90);
  });

  it('returns null for empty input', () => {
    expect(lowestLow([], 5)).toBeNull();
  });
});
