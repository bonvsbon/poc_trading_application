import { StrategySignal } from '../strategy/strategy';

export interface RiskLimits {
  /** Percent of equity risked per trade, e.g. 0.35 means 0.35%. */
  riskPerTradePercent: number;
  maxTrades: number;
  maxTickerExposurePercent: number;
  maxSectorExposurePercent: number;
  /** Daily loss budget as a positive percent; trading stops once exceeded. */
  dailyLossLimitPercent: number;
  /** Consecutive losses that trigger a cooldown (no new trades). */
  cooldownLossStreak: number;
}

export const DEFAULT_RISK_LIMITS: RiskLimits = {
  riskPerTradePercent: 0.35,
  maxTrades: 8,
  maxTickerExposurePercent: 10,
  maxSectorExposurePercent: 25,
  dailyLossLimitPercent: 2,
  cooldownLossStreak: 3,
};

export interface AccountSnapshot {
  equity: number;
  openTradesCount: number;
  /** Current notional ($) committed per ticker. */
  tickerNotional: Record<string, number>;
  /** Current notional ($) committed per sector. */
  sectorNotional: Record<string, number>;
  /** Signed daily PnL percent; negative means a loss. */
  dailyPnlPercent: number;
  consecutiveLosses: number;
}

export interface SizeRequest {
  signal: StrategySignal;
  sector: string;
  account: AccountSnapshot;
  limits?: Partial<RiskLimits>;
}

export interface PositionSizing {
  approved: boolean;
  reason: string;
  shares: number;
  riskAmount: number;
  notional: number;
}

const reject = (reason: string): PositionSizing => ({
  approved: false,
  reason,
  shares: 0,
  riskAmount: 0,
  notional: 0,
});

export class RiskEngine {
  sizePosition({ signal, sector, account, limits }: SizeRequest): PositionSizing {
    const cfg: RiskLimits = { ...DEFAULT_RISK_LIMITS, ...limits };

    if (account.consecutiveLosses >= cfg.cooldownLossStreak) {
      return reject(`Cooldown active after ${account.consecutiveLosses} losses`);
    }

    if (account.dailyPnlPercent <= -cfg.dailyLossLimitPercent) {
      return reject('Daily loss limit reached');
    }

    if (account.openTradesCount >= cfg.maxTrades) {
      return reject('Max concurrent trades reached');
    }

    const perShareRisk = Math.abs(signal.price - signal.stop);
    if (perShareRisk <= 0) {
      return reject('Invalid stop: zero per-share risk');
    }

    const riskAmount = (account.equity * cfg.riskPerTradePercent) / 100;
    const riskShares = Math.floor(riskAmount / perShareRisk);

    const tickerRoom = Math.max(
      0,
      (account.equity * cfg.maxTickerExposurePercent) / 100 - (account.tickerNotional[signal.symbol] ?? 0),
    );
    const sectorRoom = Math.max(
      0,
      (account.equity * cfg.maxSectorExposurePercent) / 100 - (account.sectorNotional[sector] ?? 0),
    );

    const tickerShares = Math.floor(tickerRoom / signal.price);
    const sectorShares = Math.floor(sectorRoom / signal.price);

    const shares = Math.min(riskShares, tickerShares, sectorShares);
    if (shares <= 0) {
      return reject('Exposure limit leaves no room for this trade');
    }

    return {
      approved: true,
      reason: 'Approved',
      shares,
      riskAmount: shares * perShareRisk,
      notional: shares * signal.price,
    };
  }
}
