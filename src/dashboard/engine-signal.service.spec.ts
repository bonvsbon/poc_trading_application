import { Bar } from '../engine/market/bar';
import { EngineSignalService } from './engine-signal.service';
import { MarketDataProvider } from './market-data.provider';

describe('EngineSignalService', () => {
  it('produces a live dashboard signal from the strategy + risk sizing', () => {
    const service = new EngineSignalService(new MarketDataProvider());
    const signals = service.liveSignals('NVDA');

    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({
      id: 'live-nvda',
      symbol: 'NVDA',
      side: 'Long',
      status: 'pending',
    });
    expect(signals[0].thesis).toContain('shares');
  });

  it('returns no signals when the strategy does not fire', () => {
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

    const service = new EngineSignalService(flatProvider);
    expect(service.liveSignals('NVDA')).toEqual([]);
  });
});
