import { Bar, typicalPrice } from './bar';

/**
 * Volume-weighted average price across the supplied bars (treated as one session,
 * chronological). Returns null when there is no traded volume to weight against.
 */
export const sessionVwap = (bars: Bar[]): number | null => {
  let cumulativePriceVolume = 0;
  let cumulativeVolume = 0;

  for (const bar of bars) {
    cumulativePriceVolume += typicalPrice(bar) * bar.volume;
    cumulativeVolume += bar.volume;
  }

  if (cumulativeVolume === 0) {
    return null;
  }

  return cumulativePriceVolume / cumulativeVolume;
};

/**
 * Mean volume of the most recent `lookback` bars, excluding the current (last) bar.
 * Returns null when there are not enough prior bars.
 */
export const averageVolume = (bars: Bar[], lookback: number): number | null => {
  if (lookback <= 0) {
    return null;
  }

  const prior = bars.slice(0, -1);
  if (prior.length < lookback) {
    return null;
  }

  const window = prior.slice(-lookback);
  const total = window.reduce((sum, bar) => sum + bar.volume, 0);
  return total / lookback;
};

/** Lowest low across the most recent `lookback` bars (including the current bar). */
export const lowestLow = (bars: Bar[], lookback: number): number | null => {
  if (lookback <= 0 || bars.length === 0) {
    return null;
  }

  const window = bars.slice(-lookback);
  return Math.min(...window.map((bar) => bar.low));
};
