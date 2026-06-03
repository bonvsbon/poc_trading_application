import { Side } from '../strategy/strategy';

export interface BrokerAccount {
  /** Identifier from the broker. */
  accountId: string;
  /** Total account value. */
  equity: number;
  /** Cash available to open new positions. */
  cash: number;
  /** Maximum notional the broker will let us deploy (may include margin). */
  buyingPower: number;
  /** Currency the account is denominated in (USD for Alpaca). */
  currency: string;
  /** True when trading is blocked at the broker (e.g. PDT, restrictions). */
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
  /** Idempotency key — must be unique per logical order, replay-safe. */
  clientOrderId: string;
  symbol: string;
  side: Side;
  shares: number;
  /** Bracket protective stop. */
  stop: number;
  /** Bracket profit target. */
  target: number;
  /** 'market' fills now, 'limit' waits for a price. */
  type: 'market' | 'limit';
  /** Required when type is 'limit'. */
  limitPrice?: number;
}

/**
 * A simple (non-bracket) entry order. Works for both equities and crypto.
 * Crypto on Alpaca has no bracket orders, so protective stop/target are NOT
 * sent here — they live as advisory metadata on the recommendation.
 * Provide exactly one of `shares` (units) or `notional` (USD amount).
 */
export interface SubmitSimpleOrder {
  /** Idempotency key — unique per logical order, replay-safe. */
  clientOrderId: string;
  symbol: string;
  side: Side;
  /** Units/shares to buy/sell. Mutually exclusive with `notional`. */
  shares?: number;
  /** USD amount (fractional). Mutually exclusive with `shares`. */
  notional?: number;
  type: 'market' | 'limit';
  /** Required when type is 'limit'. */
  limitPrice?: number;
}

export interface SubmittedOrder {
  brokerOrderId: string;
  clientOrderId: string;
  status: string;
  submittedAt: string;
}

/** A tradable instrument from the broker, for the search/selector UI. */
export interface BrokerAsset {
  symbol: string;
  name: string;
  assetClass: string;
  tradable: boolean;
  fractionable: boolean;
}

export interface AssetQuery {
  /** Case-insensitive match against symbol or name. */
  search?: string;
  /** e.g. "crypto" or "us_equity". */
  assetClass?: string;
  limit?: number;
}

/** Order snapshot used for monitoring (not for placing). */
export interface BrokerOrder {
  brokerOrderId: string;
  clientOrderId: string;
  symbol: string;
  side: Side;
  type: string;
  quantity: number | null;
  notional: number | null;
  filledQuantity: number | null;
  filledAvgPrice: number | null;
  status: string;
  submittedAt: string;
}

/**
 * Broker execution interface. Backtest uses ExecutionSimulator + Portfolio;
 * live uses an adapter (e.g. AlpacaBrokerAdapter) that implements this port.
 */
export interface BrokerPort {
  /** Returns true when an env-gated live mode is enabled. False = read-only. */
  readonly canTrade: boolean;
  getAccount(): Promise<BrokerAccount>;
  getPositions(): Promise<BrokerPosition[]>;
  submitBracketOrder(order: SubmitBracketOrder): Promise<SubmittedOrder>;
  /** Simple market/limit entry — the crypto-capable path. */
  submitSimpleOrder(order: SubmitSimpleOrder): Promise<SubmittedOrder>;
  /** Recent orders for monitoring fills/status. */
  getOrders(): Promise<BrokerOrder[]>;
  /** Search tradable instruments (for the pre-trade selector). */
  searchAssets(query: AssetQuery): Promise<BrokerAsset[]>;
  cancelOrder(brokerOrderId: string): Promise<void>;
}

export class BrokerNotConfiguredError extends Error {
  constructor() {
    super('Broker is not configured. Set ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY in env.');
  }
}

export class TradingDisabledError extends Error {
  constructor() {
    super('Trading is disabled. Set ALPACA_TRADING_ENABLED=true to allow order submission.');
  }
}
