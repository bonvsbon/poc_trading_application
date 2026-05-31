import { Injectable } from '@nestjs/common';
import { Bar } from '../engine/market/bar';

/**
 * Supplies recent bars to the live engine. This PoC replays a deterministic
 * in-memory session (a VWAP reclaim on NVDA). Swap this out for a real market
 * data feed to drive live signals.
 */
@Injectable()
export class MarketDataProvider {
  recentBars(symbol = 'NVDA'): Bar[] {
    const baseline: Bar[] = Array.from({ length: 20 }, (_, i) => ({
      timestamp: `2026-05-29T13:${String(i).padStart(2, '0')}:00.000Z`,
      symbol,
      open: 100,
      high: 101,
      low: 99,
      close: 100,
      volume: 1000,
    }));

    const dip: Bar = {
      timestamp: '2026-05-29T13:50:00.000Z',
      symbol,
      open: 100,
      high: 100,
      low: 96,
      close: 98,
      volume: 1000,
    };

    const reclaim: Bar = {
      timestamp: '2026-05-29T13:51:00.000Z',
      symbol,
      open: 99,
      high: 104,
      low: 99,
      close: 103,
      volume: 2000,
    };

    return [...baseline, dip, reclaim];
  }
}
