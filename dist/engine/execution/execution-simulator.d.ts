import { Bar } from '../market/bar';
import { BracketOrder, ExitResult, Fill } from './order';
export interface ExecutionConfig {
    slippageBps: number;
    spreadBps: number;
}
export declare const DEFAULT_EXECUTION_CONFIG: ExecutionConfig;
export interface OpenPositionState {
    side: BracketOrder['side'];
    stop: number;
    target: number;
}
export declare class ExecutionSimulator {
    private readonly config;
    constructor(config?: Partial<ExecutionConfig>);
    private adverseCost;
    fillEntry(order: BracketOrder, referencePrice: number): Fill;
    checkExit(position: OpenPositionState, bar: Bar): ExitResult | null;
    forceClose(position: OpenPositionState, bar: Bar): ExitResult;
}
