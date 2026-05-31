import { ClosedTrade } from '../portfolio/portfolio';
export interface BacktestMetrics {
    startingEquity: number;
    finalEquity: number;
    totalReturnPct: number;
    trades: number;
    wins: number;
    losses: number;
    winRatePct: number;
    profitFactor: number;
    maxDrawdownPct: number;
    sharpe: number;
}
export declare const maxDrawdownPct: (equityCurve: number[]) => number;
export declare const sharpeRatio: (equityCurve: number[], periodsPerYear?: number) => number;
export declare const computeMetrics: (equityCurve: number[], closedTrades: ClosedTrade[], startingEquity: number) => BacktestMetrics;
