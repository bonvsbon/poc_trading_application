import { averageVolume, lowestLow, sessionVwap } from '../market/indicators';
import { Strategy, StrategyContext, StrategySignal } from './strategy';

export interface VwapReclaimConfig {
  /** Number of prior bars used for the average-volume baseline. */
  volumeLookback: number;
  /** Current volume must be at least this multiple of the baseline to qualify. */
  volumeMultiplier: number;
  /** Bars (including current) scanned for the protective stop's swing low. */
  stopLookback: number;
  /** Reward-to-risk multiple used to derive the target from entry and stop. */
  riskRewardRatio: number;
}

export const DEFAULT_VWAP_RECLAIM_CONFIG: VwapReclaimConfig = {
  volumeLookback: 20,
  volumeMultiplier: 1.8,
  stopLookback: 5,
  riskRewardRatio: 2,
};

/**
 * Long-only reference strategy: enter when price reclaims the session VWAP
 * (prior bar below, current bar closes above) on a volume anomaly.
 */
export class VwapReclaimStrategy implements Strategy {
  readonly name = 'vwap-reclaim';
  private readonly config: VwapReclaimConfig;

  constructor(config: Partial<VwapReclaimConfig> = {}) {
    this.config = { ...DEFAULT_VWAP_RECLAIM_CONFIG, ...config };
  }

  evaluate(ctx: StrategyContext): StrategySignal | null {
    const { bars } = ctx;
    if (bars.length < this.config.volumeLookback + 2) {
      return null;
    }

    const current = bars[bars.length - 1];
    const previous = bars[bars.length - 2];

    const vwapNow = sessionVwap(bars);
    const vwapPrev = sessionVwap(bars.slice(0, -1));
    if (vwapNow === null || vwapPrev === null) {
      return null;
    }

    const reclaimed = previous.close < vwapPrev && current.close > vwapNow;
    if (!reclaimed) {
      return null;
    }

    const baselineVolume = averageVolume(bars, this.config.volumeLookback);
    if (baselineVolume === null || baselineVolume === 0) {
      return null;
    }

    const volumeRatio = current.volume / baselineVolume;
    if (volumeRatio < this.config.volumeMultiplier) {
      return null;
    }

    const stop = lowestLow(bars, this.config.stopLookback);
    if (stop === null || stop >= current.close) {
      return null;
    }

    const entry = current.close;
    const risk = entry - stop;
    const target = entry + risk * this.config.riskRewardRatio;

    return {
      symbol: current.symbol,
      side: 'long',
      reason: `VWAP reclaim with ${volumeRatio.toFixed(2)}x volume`,
      confidence: this.confidence(volumeRatio, entry, vwapNow),
      price: entry,
      stop,
      target,
    };
  }

  private confidence(volumeRatio: number, entry: number, vwap: number): number {
    const volumeScore = Math.min(1, (volumeRatio - this.config.volumeMultiplier) / this.config.volumeMultiplier);
    const distanceScore = Math.min(1, (entry - vwap) / vwap / 0.01);
    const raw = 50 + volumeScore * 30 + distanceScore * 20;
    return Math.round(Math.max(0, Math.min(100, raw)));
  }
}
