import { StrategySignal } from '../strategy/strategy';
export interface RiskLimits {
    riskPerTradePercent: number;
    maxTrades: number;
    maxTickerExposurePercent: number;
    maxSectorExposurePercent: number;
    dailyLossLimitPercent: number;
    cooldownLossStreak: number;
}
export declare const DEFAULT_RISK_LIMITS: RiskLimits;
export interface AccountSnapshot {
    equity: number;
    openTradesCount: number;
    tickerNotional: Record<string, number>;
    sectorNotional: Record<string, number>;
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
export declare class RiskEngine {
    sizePosition({ signal, sector, account, limits }: SizeRequest): PositionSizing;
}
