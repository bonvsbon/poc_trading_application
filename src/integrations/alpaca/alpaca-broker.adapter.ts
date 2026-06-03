import {
  AssetQuery,
  BrokerAccount,
  BrokerAsset,
  BrokerOrder,
  BrokerPort,
  BrokerPosition,
  SubmitBracketOrder,
  SubmitSimpleOrder,
  SubmittedOrder,
  TradingDisabledError,
} from '../../engine/ports/broker.port';
import { Side } from '../../engine/strategy/strategy';
import { AlpacaConfig } from './alpaca.config';
import { AlpacaSdkClient } from './alpaca-client';
import { isCryptoSymbol } from './alpaca-market-data.adapter';

const num = (value: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Expected numeric string from Alpaca, got "${value}"`);
  }
  return parsed;
};

const numOrNull = (value: string | null): number | null =>
  value === null || value === undefined ? null : num(value);

const sideFromAlpaca = (side: 'buy' | 'sell'): Side => (side === 'buy' ? 'long' : 'short');

export class AlpacaBrokerAdapter implements BrokerPort {
  constructor(
    private readonly client: AlpacaSdkClient,
    private readonly config: AlpacaConfig,
  ) {}

  get canTrade(): boolean {
    return this.config.tradingEnabled;
  }

  async getAccount(): Promise<BrokerAccount> {
    const raw = await this.client.getAccount();
    return {
      accountId: raw.id,
      equity: num(raw.equity),
      cash: num(raw.cash),
      buyingPower: num(raw.buying_power),
      currency: raw.currency,
      tradingBlocked: raw.trading_blocked,
    };
  }

  async getPositions(): Promise<BrokerPosition[]> {
    const raw = await this.client.getPositions();
    return raw.map((p) => ({
      symbol: p.symbol,
      side: p.side,
      shares: num(p.qty),
      averageEntryPrice: num(p.avg_entry_price),
      marketValue: num(p.market_value),
      unrealizedPnl: num(p.unrealized_pl),
    }));
  }

  async submitBracketOrder(order: SubmitBracketOrder): Promise<SubmittedOrder> {
    if (!this.config.tradingEnabled) {
      throw new TradingDisabledError();
    }
    if (order.shares <= 0) {
      throw new Error('Cannot submit order with non-positive shares');
    }
    if (order.type === 'limit' && order.limitPrice === undefined) {
      throw new Error('limitPrice is required for limit orders');
    }

    const response = await this.client.createOrder({
      symbol: order.symbol,
      qty: order.shares,
      side: order.side === 'long' ? 'buy' : 'sell',
      type: order.type,
      time_in_force: 'day',
      limit_price: order.limitPrice,
      order_class: 'bracket',
      stop_loss: { stop_price: order.stop },
      take_profit: { limit_price: order.target },
      client_order_id: order.clientOrderId,
    });

    return {
      brokerOrderId: response.id,
      clientOrderId: response.client_order_id,
      status: response.status,
      submittedAt: response.submitted_at,
    };
  }

  async submitSimpleOrder(order: SubmitSimpleOrder): Promise<SubmittedOrder> {
    if (!this.config.tradingEnabled) {
      throw new TradingDisabledError();
    }
    const hasShares = order.shares !== undefined;
    const hasNotional = order.notional !== undefined;
    if (hasShares === hasNotional) {
      throw new Error('Provide exactly one of shares or notional');
    }
    if (hasShares && order.shares! <= 0) {
      throw new Error('Cannot submit order with non-positive shares');
    }
    if (hasNotional && order.notional! <= 0) {
      throw new Error('Cannot submit order with non-positive notional');
    }
    if (order.type === 'limit' && order.limitPrice === undefined) {
      throw new Error('limitPrice is required for limit orders');
    }

    // Crypto requires gtc/ioc (no 'day'); equities use 'day'.
    const timeInForce = isCryptoSymbol(order.symbol) ? 'gtc' : 'day';

    const response = await this.client.createOrder({
      symbol: order.symbol,
      qty: order.shares,
      notional: order.notional,
      side: order.side === 'long' ? 'buy' : 'sell',
      type: order.type,
      time_in_force: timeInForce,
      limit_price: order.limitPrice,
      order_class: 'simple',
      client_order_id: order.clientOrderId,
    });

    return {
      brokerOrderId: response.id,
      clientOrderId: response.client_order_id,
      status: response.status,
      submittedAt: response.submitted_at,
    };
  }

  async getOrders(): Promise<BrokerOrder[]> {
    if (!this.client.getOrders) {
      return [];
    }
    const raw = await this.client.getOrders({ status: 'all', limit: 50 });
    return raw.map((o) => ({
      brokerOrderId: o.id,
      clientOrderId: o.client_order_id,
      symbol: o.symbol,
      side: sideFromAlpaca(o.side),
      type: o.type,
      quantity: numOrNull(o.qty),
      notional: numOrNull(o.notional),
      filledQuantity: numOrNull(o.filled_qty),
      filledAvgPrice: numOrNull(o.filled_avg_price),
      status: o.status,
      submittedAt: o.submitted_at,
    }));
  }

  async searchAssets(query: AssetQuery): Promise<BrokerAsset[]> {
    if (!this.client.getAssets) {
      return [];
    }
    const raw = await this.client.getAssets({
      status: 'active',
      asset_class: query.assetClass,
    });
    const term = (query.search ?? '').trim().toLowerCase();
    const limit = query.limit ?? 25;
    return raw
      .filter((a) => a.tradable)
      .filter(
        (a) =>
          term === '' ||
          a.symbol.toLowerCase().includes(term) ||
          (a.name ?? '').toLowerCase().includes(term),
      )
      .slice(0, limit)
      .map((a) => ({
        symbol: a.symbol,
        name: a.name,
        assetClass: a.class,
        tradable: a.tradable,
        fractionable: a.fractionable,
      }));
  }

  async cancelOrder(brokerOrderId: string): Promise<void> {
    await this.client.cancelOrder(brokerOrderId);
  }
}
