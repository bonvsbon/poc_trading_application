import { Bar } from '../../engine/market/bar';
import {
  HistoricalBarsRequest,
  LatestPrice,
  MarketDataPort,
  Timeframe,
} from '../../engine/ports/market-data.port';
import { AlpacaSdkClient } from './alpaca-client';

const ALPACA_TIMEFRAME: Record<Timeframe, string> = {
  '1Min': '1Min',
  '5Min': '5Min',
  '15Min': '15Min',
  '1Hour': '1Hour',
  '1Day': '1Day',
};

/** Alpaca crypto symbols are slash-separated, e.g. "BTC/USD". Equities are not. */
export const isCryptoSymbol = (symbol: string): boolean => symbol.includes('/');

export class AlpacaMarketDataAdapter implements MarketDataPort {
  constructor(private readonly client: AlpacaSdkClient) {}

  async historicalBars(request: HistoricalBarsRequest): Promise<Bar[]> {
    if (isCryptoSymbol(request.symbol)) {
      return this.cryptoBars(request);
    }
    if (!this.client.getBarsV2) {
      throw new Error('Alpaca client does not expose getBarsV2');
    }

    const iterator = this.client.getBarsV2(request.symbol, {
      start: request.from,
      end: request.to,
      timeframe: ALPACA_TIMEFRAME[request.timeframe],
      limit: request.limit,
    });

    const bars: Bar[] = [];
    for await (const raw of iterator) {
      bars.push({
        timestamp: raw.Timestamp,
        symbol: request.symbol,
        open: raw.OpenPrice,
        high: raw.HighPrice,
        low: raw.LowPrice,
        close: raw.ClosePrice,
        volume: raw.Volume,
      });
    }
    return bars;
  }

  private async cryptoBars(request: HistoricalBarsRequest): Promise<Bar[]> {
    if (!this.client.getCryptoBars) {
      throw new Error('Alpaca client does not expose getCryptoBars');
    }
    const map = await this.client.getCryptoBars([request.symbol], {
      timeframe: ALPACA_TIMEFRAME[request.timeframe],
      start: request.from,
      end: request.to,
      limit: request.limit,
    });
    const raw = map.get(request.symbol) ?? [];
    return raw.map((bar) => ({
      timestamp: bar.Timestamp,
      symbol: request.symbol,
      open: bar.Open,
      high: bar.High,
      low: bar.Low,
      close: bar.Close,
      volume: bar.Volume,
    }));
  }

  async recentBars(symbol: string): Promise<Bar[]> {
    const crypto = isCryptoSymbol(symbol);
    const end = new Date();
    // Crypto trades 24/7 (5Min window); equities use a 1-hour 1Min window.
    const lookbackMs = crypto ? 6 * 60 * 60 * 1000 : 60 * 60 * 1000;
    const start = new Date(end.getTime() - lookbackMs);
    return this.historicalBars({
      symbol,
      timeframe: crypto ? '5Min' : '1Min',
      from: start.toISOString(),
      to: end.toISOString(),
    });
  }

  async latestPrice(symbol: string): Promise<LatestPrice> {
    const [price] = await this.latestPrices([symbol]);
    return price;
  }

  async latestPrices(symbols: string[]): Promise<LatestPrice[]> {
    // Split by asset class — crypto and equities use different endpoints.
    const crypto = symbols.filter(isCryptoSymbol);
    const equity = symbols.filter((s) => !isCryptoSymbol(s));

    const [cryptoTrades, equityTrades] = await Promise.all([
      this.fetchTrades(crypto, this.client.getLatestCryptoTrades?.bind(this.client)),
      this.fetchTrades(equity, this.client.getLatestTrades?.bind(this.client)),
    ]);

    const merged = new Map([...cryptoTrades, ...equityTrades]);
    return symbols.map((symbol) => {
      const trade = merged.get(symbol);
      return {
        symbol,
        price: trade ? trade.Price : null,
        timestamp: trade ? trade.Timestamp : null,
      };
    });
  }

  private async fetchTrades(
    symbols: string[],
    fetcher?: (s: string[]) => Promise<Map<string, { Price: number; Timestamp: string }>>,
  ): Promise<Map<string, { Price: number; Timestamp: string }>> {
    if (symbols.length === 0) {
      return new Map();
    }
    if (!fetcher) {
      throw new Error('Alpaca client does not expose the required latest-trade endpoint');
    }
    return fetcher(symbols);
  }
}
