import { PositionSizing } from '../risk/risk-engine';
import { StrategySignal } from '../strategy/strategy';
export interface DashboardSignalView {
    id: string;
    symbol: string;
    side: 'Long' | 'Short';
    status: 'pending';
    price: string;
    confidence: number;
    riskReward: string;
    stop: string;
    target: string;
    thesis: string;
    priority: boolean;
}
export declare const toDashboardSignal: (signal: StrategySignal, sizing?: PositionSizing) => DashboardSignalView;
