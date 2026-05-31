import { Strategy, StrategyContext, StrategySignal } from './strategy';
export interface VwapReclaimConfig {
    volumeLookback: number;
    volumeMultiplier: number;
    stopLookback: number;
    riskRewardRatio: number;
}
export declare const DEFAULT_VWAP_RECLAIM_CONFIG: VwapReclaimConfig;
export declare class VwapReclaimStrategy implements Strategy {
    readonly name = "vwap-reclaim";
    private readonly config;
    constructor(config?: Partial<VwapReclaimConfig>);
    evaluate(ctx: StrategyContext): StrategySignal | null;
    private confidence;
}
