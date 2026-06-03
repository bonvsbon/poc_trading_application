import { Bar } from '../engine/market/bar';
import { EngineSignalService } from './engine-signal.service';
import { MarketDataProvider } from './market-data.provider';

describe('EngineSignalService', () => {
  it('produces a live dashboard signal from the strategy + risk sizing', async () => {
    const service = new EngineSignalService(new MarketDataProvider(), null);
    const signals = await service.liveSignals('NVDA');

    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({
      id: 'live-nvda',
      symbol: 'NVDA',
      side: 'Long',
      status: 'pending',
    });
    expect(signals[0].thesis).toContain('shares');
  });

  it('returns no signals when the strategy does not fire', async () => {
    const flatProvider: MarketDataProvider = {
      recentBars: (): Bar[] =>
        Array.from({ length: 25 }, (_, i) => ({
          timestamp: `2026-05-29T13:${String(i).padStart(2, '0')}:00.000Z`,
          symbol: 'NVDA',
          open: 100,
          high: 101,
          low: 99,
          close: 100,
          volume: 1000,
        })),
    } as MarketDataProvider;

    const service = new EngineSignalService(flatProvider, null);
    expect(await service.liveSignals('NVDA')).toEqual([]);
  });

  it('evaluates on real bars when a live market-data feed is injected', async () => {
    const liveBars: Bar[] = [
      ...Array.from({ length: 20 }, (_, i) => ({
        timestamp: `2026-05-29T13:${String(i).padStart(2, '0')}:00.000Z`,
        symbol: 'BTC/USD',
        open: 100,
        high: 101,
        low: 99,
        close: 100,
        volume: 1000,
      })),
      { timestamp: '2026-05-29T13:50:00.000Z', symbol: 'BTC/USD', open: 100, high: 100, low: 96, close: 98, volume: 1000 },
      { timestamp: '2026-05-29T13:51:00.000Z', symbol: 'BTC/USD', open: 99, high: 104, low: 99, close: 103, volume: 2000 },
    ];
    const liveFeed = { recentBars: async () => liveBars } as unknown as MarketDataProvider;
    // Pass the live feed in the second (Alpaca) slot; mock provider must NOT be used.
    const service = new EngineSignalService(
      { recentBars: () => { throw new Error('mock provider should not be called'); } } as unknown as MarketDataProvider,
      liveFeed,
    );

    expect(service.isLive).toBe(true);
    const signals = await service.liveSignals('BTC/USD');
    expect(signals[0]).toMatchObject({ symbol: 'BTC/USD', side: 'Long', status: 'pending' });
  });
});
