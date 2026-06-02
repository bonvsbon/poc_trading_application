import { Side } from '../strategy/strategy';
export interface BrokerAccount {
    accountId: string;
    equity: number;
    cash: number;
    buyingPower: number;
    currency: string;
    tradingBlocked: boolean;
}
export interface BrokerPosition {
    symbol: string;
    side: Side;
    shares: number;
    averageEntryPrice: number;
    marketValue: number;
    unrealizedPnl: number;
}
export interface SubmitBracketOrder {
    clientOrderId: string;
    symbol: string;
    side: Side;
    shares: number;
    stop: number;
    target: number;
    type: 'market' | 'limit';
    limitPrice?: number;
}
export interface SubmittedOrder {
    brokerOrderId: string;
    clientOrderId: string;
    status: string;
    submittedAt: string;
}
export interface BrokerPort {
    readonly canTrade: boolean;
    getAccount(): Promise<BrokerAccount>;
    getPositions(): Promise<BrokerPosition[]>;
    submitBracketOrder(order: SubmitBracketOrder): Promise<SubmittedOrder>;
    cancelOrder(brokerOrderId: string): Promise<void>;
}
export declare class BrokerNotConfiguredError extends Error {
    constructor();
}
export declare class TradingDisabledError extends Error {
    constructor();
}
