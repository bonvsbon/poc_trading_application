import { Inject, Injectable, Optional } from '@nestjs/common';
import { DashboardSignalView, toDashboardSignal } from '../engine/integration/signal-adapter';
import { MarketDataPort } from '../engine/ports/market-data.port';
import { RiskEngine } from '../engine/risk/risk-engine';
import { VwapReclaimStrategy } from '../engine/strategy/vwap-reclaim.strategy';
import { ALPACA_MARKET_DATA } from '../integrations/alpaca/alpaca.tokens';
import { MarketDataProvider } from './market-data.provider';

const ACCOUNT_EQUITY = 100000;
const SECTOR = 'Semis';

/**
 * Runs the live strategy + risk sizing over the latest bars for the dashboard.
 * When Alpaca is configured, it evaluates on REAL bars (e.g. BTC/USD); otherwise
 * it falls back to the deterministic in-memory replay so the app still runs.
 */
@Injectable()
export class EngineSignalService {
  private readonly strategy = new VwapReclaimStrategy();
  private readonly risk = new RiskEngine();

  constructor(
    private readonly marketData: MarketDataProvider,
    @Optional()
    @Inject(ALPACA_MARKET_DATA)
    private readonly liveMarketData: MarketDataPort | null,
  ) {}

  /** True when signals are derived from a real broker feed (not the mock). */
  get isLive(): boolean {
    return this.liveMarketData != null;
  }

  async liveSignals(symbol = 'NVDA'): Promise<DashboardSignalView[]> {
    const bars = this.liveMarketData
      ? await this.liveMarketData.recentBars(symbol)
      : this.marketData.recentBars(symbol);

    const signal = this.strategy.evaluate({ bars });
    if (!signal) {
      return [];
    }

    const sizing = this.risk.sizePosition({
      signal,
      sector: SECTOR,
      account: {
        equity: ACCOUNT_EQUITY,
        openTradesCount: 0,
        tickerNotional: {},
        sectorNotional: {},
        dailyPnlPercent: 0,
        consecutiveLosses: 0,
      },
    });

    return [toDashboardSignal(signal, sizing)];
  }
}
