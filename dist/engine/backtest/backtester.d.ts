import { ExecutionSimulator } from '../execution/execution-simulator';
import { Bar } from '../market/bar';
import { ClosedTrade } from '../portfolio/portfolio';
import { RiskEngine, RiskLimits } from '../risk/risk-engine';
import { Strategy } from '../strategy/strategy';
import { BacktestMetrics } from './metrics';
export interface BacktestConfig {
    startingCash: number;
    sector: string;
    riskLimits?: Partial<RiskLimits>;
}
export interface BacktestResult {
    equityCurve: number[];
    closedTrades: ClosedTrade[];
    metrics: BacktestMetrics;
}
export interface BacktestDeps {
    strategy: Strategy;
    riskEngine?: RiskEngine;
    executionSimulator?: ExecutionSimulator;
}
export declare class Backtester {
    private readonly strategy;
    private readonly risk;
    private readonly execution;
    constructor(deps: BacktestDeps);
    run(bars: Bar[], config: BacktestConfig): BacktestResult;
    private notionalByKey;
    private totalNotional;
}
