export interface AlpacaSdkClient {
    getAccount(): Promise<AlpacaAccountResponse>;
    getPositions(): Promise<AlpacaPositionResponse[]>;
    createOrder(order: AlpacaCreateOrderRequest): Promise<AlpacaOrderResponse>;
    cancelOrder(brokerOrderId: string): Promise<void>;
    getBarsV2?(symbol: string, options: AlpacaBarsOptions): AsyncIterable<AlpacaBarResponse>;
    getLatestTrade?(symbol: string): Promise<AlpacaLatestTradeResponse>;
    getLatestTrades?(symbols: string[]): Promise<Map<string, AlpacaLatestTradeResponse>>;
    getLatestCryptoTrades?(symbols: string[]): Promise<Map<string, AlpacaLatestTradeResponse>>;
    getCryptoBars?(symbols: string[], options: AlpacaCryptoBarsOptions): Promise<Map<string, AlpacaCryptoBarResponse[]>>;
    getAssets?(options?: AlpacaAssetsQuery): Promise<AlpacaAssetResponse[]>;
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
export interface AlpacaCreateOrderRequest {
    symbol: string;
    qty?: number;
    notional?: number;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    time_in_force: 'day' | 'gtc' | 'ioc';
    limit_price?: number;
    client_order_id: string;
    order_class?: 'bracket' | 'simple';
    stop_loss?: {
        stop_price: number;
    };
    take_profit?: {
        limit_price: number;
    };
}
export interface AlpacaOrderResponse {
    id: string;
    client_order_id: string;
    status: string;
    submitted_at: string;
}
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
export interface AlpacaCryptoBarResponse {
    Timestamp: string;
    Open: number;
    High: number;
    Low: number;
    Close: number;
    Volume: number;
}
export interface AlpacaLatestTradeResponse {
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
