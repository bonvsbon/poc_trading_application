import { Injectable } from '@nestjs/common';
import { DashboardSignalView, toDashboardSignal } from '../engine/integration/signal-adapter';
import { RiskEngine } from '../engine/risk/risk-engine';
import { VwapReclaimStrategy } from '../engine/strategy/vwap-reclaim.strategy';
import { MarketDataProvider } from './market-data.provider';

const ACCOUNT_EQUITY = 100000;
const SECTOR = 'Semis';

/** Runs the live strategy + risk sizing over the latest bars for the dashboard. */
@Injectable()
export class EngineSignalService {
  private readonly strategy = new VwapReclaimStrategy();
  private readonly risk = new RiskEngine();

  constructor(private readonly marketData: MarketDataProvider) {}

  liveSignals(symbol = 'NVDA'): DashboardSignalView[] {
    const bars = this.marketData.recentBars(symbol);
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
