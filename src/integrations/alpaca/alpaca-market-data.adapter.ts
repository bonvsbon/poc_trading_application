import { Bar } from '../../engine/market/bar';
import {
  HistoricalBarsRequest,
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

export class AlpacaMarketDataAdapter implements MarketDataPort {
  constructor(private readonly client: AlpacaSdkClient) {}

  async historicalBars(request: HistoricalBarsRequest): Promise<Bar[]> {
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

  async recentBars(symbol: string): Promise<Bar[]> {
    const end = new Date();
    const start = new Date(end.getTime() - 60 * 60 * 1000); // last hour
    return this.historicalBars({
      symbol,
      timeframe: '1Min',
      from: start.toISOString(),
      to: end.toISOString(),
    });
  }
}
