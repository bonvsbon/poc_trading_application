import {
  BadGatewayException,
  Controller,
  Get,
  Inject,
  Optional,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import { BrokerPort } from '../../engine/ports/broker.port';
import { MarketDataPort } from '../../engine/ports/market-data.port';
import { AlpacaConfig } from './alpaca.config';
import { ALPACA_BROKER, ALPACA_CONFIG, ALPACA_MARKET_DATA } from './alpaca.tokens';

/** Symbols shown when the client does not pass an explicit ?symbols= list. */
const DEFAULT_WATCHLIST = ['AAPL', 'NVDA', 'TSLA'];
const MAX_WATCHLIST = 20;

@Controller('alpaca')
export class AlpacaController {
  constructor(
    @Optional() @Inject(ALPACA_CONFIG) private readonly config: AlpacaConfig | null,
    @Optional() @Inject(ALPACA_BROKER) private readonly broker: BrokerPort | null,
    @Optional()
    @Inject(ALPACA_MARKET_DATA)
    private readonly marketData: MarketDataPort | null,
  ) {}

  @Get('status')
  status() {
    if (!this.config) {
      return { configured: false, paper: null, tradingEnabled: false };
    }
    return {
      configured: true,
      paper: this.config.paper,
      tradingEnabled: this.config.tradingEnabled,
    };
  }

  @Get('account')
  async account() {
    return (await this.requireBroker().getAccount());
  }

  @Get('positions')
  async positions() {
    return await this.requireBroker().getPositions();
  }

  /** Recent orders for monitoring fills/status. */
  @Get('orders')
  async orders() {
    const broker = this.requireBroker();
    try {
      return await broker.getOrders();
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'unknown error';
      throw new BadGatewayException(`Failed to fetch orders from Alpaca: ${detail}`);
    }
  }

  /**
   * Search tradable instruments before entering a trade.
   * GET /api/alpaca/assets?search=btc&class=crypto
   */
  @Get('assets')
  async assets(
    @Query('search') search?: string,
    @Query('class') assetClass?: string,
  ) {
    const broker = this.requireBroker();
    try {
      return await broker.searchAssets({
        search,
        assetClass: assetClass || undefined,
        limit: 25,
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'unknown error';
      throw new BadGatewayException(`Failed to fetch assets from Alpaca: ${detail}`);
    }
  }

  /**
   * Latest traded prices for a watchlist.
   * GET /api/alpaca/prices?symbols=AAPL,NVDA,TSLA
   */
  @Get('prices')
  async prices(@Query('symbols') symbols?: string) {
    const market = this.requireMarketData();
    const list = this.parseSymbols(symbols);
    try {
      const prices = market.latestPrices
        ? await market.latestPrices(list)
        : await Promise.all(list.map((s) => market.latestPrice!(s)));
      return { asOf: new Date().toISOString(), prices };
    } catch (error) {
      // Upstream failure (bad keys, rate limit, network) — surface a clean 502
      // instead of a raw 500 so the client can show a useful message.
      const detail = error instanceof Error ? error.message : 'unknown error';
      throw new BadGatewayException(`Failed to fetch prices from Alpaca: ${detail}`);
    }
  }

  private parseSymbols(raw?: string): string[] {
    const parsed = (raw ?? '')
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    const unique = [...new Set(parsed.length ? parsed : DEFAULT_WATCHLIST)];
    return unique.slice(0, MAX_WATCHLIST);
  }

  private requireBroker(): BrokerPort {
    if (!this.broker) {
      throw new ServiceUnavailableException(
        'Alpaca is not configured. Set ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY in env.',
      );
    }
    return this.broker;
  }

  private requireMarketData(): MarketDataPort {
    if (!this.marketData) {
      throw new ServiceUnavailableException(
        'Alpaca is not configured. Set ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY in env.',
      );
    }
    return this.marketData;
  }
}
