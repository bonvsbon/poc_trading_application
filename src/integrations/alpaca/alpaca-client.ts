/**
 * Minimal structural typing of the Alpaca SDK client. We intentionally do NOT
 * import @alpacahq/alpaca-trade-api types into the adapter — this keeps the
 * adapter testable with a hand-rolled stub and decouples us from SDK churn.
 */
export interface AlpacaSdkClient {
  getAccount(): Promise<AlpacaAccountResponse>;
  getPositions(): Promise<AlpacaPositionResponse[]>;
  createOrder(order: AlpacaCreateOrderRequest): Promise<AlpacaOrderResponse>;
  cancelOrder(brokerOrderId: string): Promise<void>;
  getBarsV2?(
    symbol: string,
    options: AlpacaBarsOptions,
  ): AsyncIterable<AlpacaBarResponse>;
  /** Latest executed trade for one symbol (real-time last price). */
  getLatestTrade?(symbol: string): Promise<AlpacaLatestTradeResponse>;
  /** Latest executed trade for many symbols, keyed by symbol (watchlist). */
  getLatestTrades?(
    symbols: string[],
  ): Promise<Map<string, AlpacaLatestTradeResponse>>;
  /** Latest crypto trade(s), keyed by symbol e.g. "BTC/USD". */
  getLatestCryptoTrades?(
    symbols: string[],
  ): Promise<Map<string, AlpacaLatestTradeResponse>>;
  /** Historical crypto bars, keyed by symbol. */
  getCryptoBars?(
    symbols: string[],
    options: AlpacaCryptoBarsOptions,
  ): Promise<Map<string, AlpacaCryptoBarResponse[]>>;
  /** Tradable assets (us_equity / crypto) for the search/selector. */
  getAssets?(options?: AlpacaAssetsQuery): Promise<AlpacaAssetResponse[]>;
  /** Recent orders for monitoring. */
  getOrders?(options?: AlpacaOrdersQuery): Promise<AlpacaOrderDetailResponse[]>;
}

export interface AlpacaAccountResponse {
  id: string;
  equity: string;
  cash: string;
  buying_power: string;
  currency: string;
  trading_blocked: boolean;
}

export interface AlpacaPositionResponse {
  symbol: string;
  side: 'long' | 'short';
  qty: string;
  avg_entry_price: string;
  market_value: string;
  unrealized_pl: string;
}

/**
 * Alpaca create-order payload. Supports both the existing bracket path (stocks)
 * and a simple market/limit path (works for crypto, which has no bracket).
 * Provide exactly one of `qty` or `notional`.
 */
export interface AlpacaCreateOrderRequest {
  symbol: string;
  qty?: number;
  /** Dollar amount instead of shares/units (fractional). */
  notional?: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  time_in_force: 'day' | 'gtc' | 'ioc';
  limit_price?: number;
  client_order_id: string;
  order_class?: 'bracket' | 'simple';
  stop_loss?: { stop_price: number };
  take_profit?: { limit_price: number };
}

export interface AlpacaOrderResponse {
  id: string;
  client_order_id: string;
  status: string;
  submitted_at: string;
}

/** Richer order shape for monitoring (GET /v2/orders). */
export interface AlpacaOrderDetailResponse {
  id: string;
  client_order_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: string;
  qty: string | null;
  notional: string | null;
  filled_qty: string | null;
  filled_avg_price: string | null;
  status: string;
  submitted_at: string;
}

export interface AlpacaBarsOptions {
  start: string;
  end: string;
  timeframe: string;
  limit?: number;
}

export interface AlpacaCryptoBarsOptions {
  timeframe: string;
  start?: string;
  end?: string;
  limit?: number;
}

export interface AlpacaBarResponse {
  Timestamp: string;
  OpenPrice: number;
  HighPrice: number;
  LowPrice: number;
  ClosePrice: number;
  Volume: number;
}

/** Crypto bars use Open/High/Low/Close (no "Price" suffix) per the SDK. */
export interface AlpacaCryptoBarResponse {
  Timestamp: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
}

export interface AlpacaLatestTradeResponse {
  /** Present on multi-symbol responses (getLatestTrades). */
  Symbol?: string;
  Timestamp: string;
  Price: number;
  Size?: number;
}

export interface AlpacaAssetsQuery {
  asset_class?: string;
  status?: string;
}

export interface AlpacaAssetResponse {
  id: string;
  class: string;
  exchange: string;
  symbol: string;
  name: string;
  status: string;
  tradable: boolean;
  fractionable: boolean;
}

export interface AlpacaOrdersQuery {
  status?: 'open' | 'closed' | 'all';
  limit?: number;
}
