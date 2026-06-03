import { AlpacaMarketDataAdapter } from './alpaca-market-data.adapter';
import {
  AlpacaBarResponse,
  AlpacaBarsOptions,
  AlpacaLatestTradeResponse,
  AlpacaSdkClient,
} from './alpaca-client';

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

  describe('latest prices', () => {
    it('latestPrice maps a single trade into LatestPrice', async () => {
      const client = clientWithBars([bar()]);
      client.getLatestTrades = async (symbols: string[]) =>
        new Map<string, AlpacaLatestTradeResponse>(
          symbols.map((s) => [s, { Symbol: s, Timestamp: '2026-06-02T13:30:05Z', Price: 123.45, Size: 10 }]),
        );
      const adapter = new AlpacaMarketDataAdapter(client);
      const result = await adapter.latestPrice('AAPL');
      expect(result).toEqual({
        symbol: 'AAPL',
        price: 123.45,
        timestamp: '2026-06-02T13:30:05Z',
      });
    });

    it('latestPrices uses the batch endpoint and preserves request order', async () => {
      const client = clientWithBars([bar()]);
      client.getLatestTrades = async (symbols: string[]) => {
        const prices: Record<string, number> = { AAPL: 200, NVDA: 1100, TSLA: 250 };
        const map = new Map<string, AlpacaLatestTradeResponse>();
        for (const symbol of symbols) {
          map.set(symbol, { Symbol: symbol, Timestamp: '2026-06-02T13:30:05Z', Price: prices[symbol] });
        }
        return map;
      };
      const adapter = new AlpacaMarketDataAdapter(client);
      const result = await adapter.latestPrices(['NVDA', 'AAPL', 'TSLA']);
      expect(result.map((p) => p.symbol)).toEqual(['NVDA', 'AAPL', 'TSLA']);
      expect(result.map((p) => p.price)).toEqual([1100, 200, 250]);
    });

    it('latestPrices returns null price for symbols missing from the feed', async () => {
      const client = clientWithBars([bar()]);
      client.getLatestTrades = async () =>
        new Map<string, AlpacaLatestTradeResponse>([
          ['AAPL', { Symbol: 'AAPL', Timestamp: '2026-06-02T13:30:05Z', Price: 200 }],
        ]);
      const adapter = new AlpacaMarketDataAdapter(client);
      const result = await adapter.latestPrices(['AAPL', 'ZZZZ']);
      expect(result[1]).toEqual({ symbol: 'ZZZZ', price: null, timestamp: null });
    });

    it('routes crypto symbols to the crypto trade endpoint', async () => {
      const client = clientWithBars([bar()]);
      let equityCalled = false;
      client.getLatestTrades = async (symbols: string[]) => {
        equityCalled = true;
        return new Map<string, AlpacaLatestTradeResponse>(
          symbols.map((s) => [s, { Symbol: s, Timestamp: '2026-06-02T13:30:05Z', Price: 200 }]),
        );
      };
      client.getLatestCryptoTrades = async (symbols: string[]) =>
        new Map<string, AlpacaLatestTradeResponse>(
          symbols.map((s) => [s, { Symbol: s, Timestamp: '2026-06-02T13:30:05Z', Price: 65000 }]),
        );
      const adapter = new AlpacaMarketDataAdapter(client);
      const result = await adapter.latestPrices(['BTC/USD', 'AAPL']);
      expect(result.find((p) => p.symbol === 'BTC/USD')?.price).toBe(65000);
      expect(result.find((p) => p.symbol === 'AAPL')?.price).toBe(200);
      expect(equityCalled).toBe(true);
    });

    it('does not call any equity endpoint when only crypto is requested', async () => {
      const client = clientWithBars([bar()]);
      client.getLatestTrades = async () => {
        throw new Error('equity endpoint must not be called for crypto-only');
      };
      client.getLatestCryptoTrades = async (symbols: string[]) =>
        new Map<string, AlpacaLatestTradeResponse>(
          symbols.map((s) => [s, { Symbol: s, Timestamp: '2026-06-02T13:30:05Z', Price: 65000 }]),
        );
      const adapter = new AlpacaMarketDataAdapter(client);
      const result = await adapter.latestPrices(['BTC/USD']);
      expect(result[0].price).toBe(65000);
    });

    it('latestPrice throws when the client cannot fetch trades', async () => {
      const adapter = new AlpacaMarketDataAdapter(clientWithBars([bar()]));
      await expect(adapter.latestPrice('AAPL')).rejects.toThrow('latest-trade');
    });
  });

  describe('crypto bars', () => {
    it('maps crypto bars (Open/High/Low/Close) into engine Bar objects', async () => {
      const client = clientWithBars([bar()]);
      client.getCryptoBars = async (symbols: string[]) =>
        new Map([
          [
            symbols[0],
            [
              { Timestamp: '2026-06-02T13:30:00Z', Open: 65000, High: 65100, Low: 64900, Close: 65050, Volume: 12 },
            ],
          ],
        ]);
      const adapter = new AlpacaMarketDataAdapter(client);
      const bars = await adapter.recentBars('BTC/USD');
      expect(bars).toHaveLength(1);
      expect(bars[0]).toMatchObject({ symbol: 'BTC/USD', open: 65000, close: 65050, volume: 12 });
    });
  });
});
