import { Bar } from '../market/bar';
export type Side = 'long' | 'short';
export interface StrategySignal {
    symbol: string;
    side: Side;
    reason: string;
    confidence: number;
    price: number;
    stop: number;
    target: number;
}
export interface StrategyContext {
    bars: Bar[];
}
export interface Strategy {
    readonly name: string;
    evaluate(ctx: StrategyContext): StrategySignal | null;
}
