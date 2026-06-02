import { AlpacaMarketDataAdapter } from './alpaca-market-data.adapter';
import { AlpacaBarResponse, AlpacaBarsOptions, AlpacaSdkClient } from './alpaca-client';

const bar = (over: Partial<AlpacaBarResponse> = {}): AlpacaBarResponse => ({
  Timestamp: '2026-06-02T13:30:00Z',
  OpenPrice: 100,
  HighPrice: 101,
  LowPrice: 99,
  ClosePrice: 100,
  Volume: 1000,
  ...over,
});

const clientWithBars = (bars: AlpacaBarResponse[]): AlpacaSdkClient => ({
  getAccount: async () => ({
    id: '',
    equity: '0',
    cash: '0',
    buying_power: '0',
    currency: 'USD',
    trading_blocked: false,
  }),
  getPositions: async () => [],
  createOrder: async () => ({ id: '', client_order_id: '', status: '', submitted_at: '' }),
  cancelOrder: async () => undefined,
  getBarsV2: (_symbol: string, _opts: AlpacaBarsOptions) =>
    (async function* () {
      for (const b of bars) yield b;
    })(),
});

describe('AlpacaMarketDataAdapter', () => {
  it('streams historical bars into engine-friendly Bar objects', async () => {
    const adapter = new AlpacaMarketDataAdapter(
      clientWithBars([bar({ ClosePrice: 100 }), bar({ Timestamp: '2026-06-02T13:31:00Z', ClosePrice: 101 })]),
    );
    const bars = await adapter.historicalBars({
      symbol: 'NVDA',
      timeframe: '1Min',
      from: '2026-06-02T13:30:00Z',
      to: '2026-06-02T13:32:00Z',
    });
    expect(bars).toHaveLength(2);
    expect(bars[0]).toMatchObject({ symbol: 'NVDA', open: 100, close: 100, volume: 1000 });
    expect(bars[1].close).toBe(101);
  });

  it('throws when the SDK client does not expose getBarsV2', async () => {
    const noBars: AlpacaSdkClient = {
      getAccount: async () => ({ id: '', equity: '0', cash: '0', buying_power: '0', currency: 'USD', trading_blocked: false }),
      getPositions: async () => [],
      createOrder: async () => ({ id: '', client_order_id: '', status: '', submitted_at: '' }),
      cancelOrder: async () => undefined,
    };
    const adapter = new AlpacaMarketDataAdapter(noBars);
    await expect(
      adapter.historicalBars({ symbol: 'NVDA', timeframe: '1Min', from: 'a', to: 'b' }),
    ).rejects.toThrow('getBarsV2');
  });

  it('recentBars derives a one-hour window', async () => {
    const adapter = new AlpacaMarketDataAdapter(clientWithBars([bar()]));
    const bars = await adapter.recentBars('NVDA');
    expect(bars).toHaveLength(1);
  });
});
