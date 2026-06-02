import {
  BrokerAccount,
  BrokerPort,
  BrokerPosition,
  SubmitBracketOrder,
  SubmittedOrder,
  TradingDisabledError,
} from '../../engine/ports/broker.port';
import { AlpacaConfig } from './alpaca.config';
import { AlpacaSdkClient } from './alpaca-client';

const num = (value: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Expected numeric string from Alpaca, got "${value}"`);
  }
  return parsed;
};

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

  async cancelOrder(brokerOrderId: string): Promise<void> {
    await this.client.cancelOrder(brokerOrderId);
  }
}
