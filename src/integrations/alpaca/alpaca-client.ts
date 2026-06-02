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

export interface AlpacaCreateOrderRequest {
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  time_in_force: 'day' | 'gtc';
  limit_price?: number;
  order_class: 'bracket';
  stop_loss: { stop_price: number };
  take_profit: { limit_price: number };
  client_order_id: string;
}

export interface AlpacaOrderResponse {
  id: string;
  client_order_id: string;
  status: string;
  submitted_at: string;
}

export interface AlpacaBarsOptions {
  start: string;
  end: string;
  timeframe: string;
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
