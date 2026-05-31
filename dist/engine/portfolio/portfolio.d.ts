import { ExitReason } from '../execution/order';
import { Side } from '../strategy/strategy';
export interface OpenPosition {
    symbol: string;
    side: Side;
    shares: number;
    entryPrice: number;
    stop: number;
    target: number;
}
export interface ClosedTrade {
    symbol: string;
    side: Side;
    shares: number;
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    returnPct: number;
    reason: ExitReason;
}
export declare class Portfolio {
    private cashBalance;
    private readonly open;
    private readonly closed;
    constructor(startingCash: number);
    get cash(): number;
    get openPositions(): OpenPosition[];
    get closedTrades(): ClosedTrade[];
    hasPosition(symbol: string): boolean;
    openPosition(position: OpenPosition): void;
    closePosition(symbol: string, exitPrice: number, reason: ExitReason): ClosedTrade;
    equity(markPrices: Record<string, number>): number;
}
