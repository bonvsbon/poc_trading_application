import { TradingDisabledError } from '../../engine/ports/broker.port';
import { AlpacaBrokerAdapter } from './alpaca-broker.adapter';
import {
  AlpacaAccountResponse,
  AlpacaCreateOrderRequest,
  AlpacaOrderResponse,
  AlpacaPositionResponse,
  AlpacaSdkClient,
} from './alpaca-client';

const account: AlpacaAccountResponse = {
  id: 'acc-1',
  equity: '100000.00',
  cash: '90000.00',
  buying_power: '180000.00',
  currency: 'USD',
  trading_blocked: false,
};

const position: AlpacaPositionResponse = {
  symbol: 'NVDA',
  side: 'long',
  qty: '50',
  avg_entry_price: '100.25',
  market_value: '5100.00',
  unrealized_pl: '50.00',
};

const orderResponse: AlpacaOrderResponse = {
  id: 'broker-123',
  client_order_id: 'co-1',
  status: 'accepted',
  submitted_at: '2026-06-02T13:30:00Z',
};

class StubClient implements AlpacaSdkClient {
  lastCreate?: AlpacaCreateOrderRequest;
  cancelled: string[] = [];
  getOrders?: AlpacaSdkClient['getOrders'];
  getAssets?: AlpacaSdkClient['getAssets'];

  constructor(private readonly opts: { failAccount?: boolean } = {}) {}

  async getAccount(): Promise<AlpacaAccountResponse> {
    if (this.opts.failAccount) throw new Error('boom');
    return account;
  }

  async getPositions(): Promise<AlpacaPositionResponse[]> {
    return [position];
  }

  async createOrder(req: AlpacaCreateOrderRequest): Promise<AlpacaOrderResponse> {
    this.lastCreate = req;
    return orderResponse;
  }

  async cancelOrder(id: string): Promise<void> {
    this.cancelled.push(id);
  }
}

const baseConfig = {
  keyId: 'k',
  secretKey: 's',
  paper: true,
  tradingEnabled: false,
};

describe('AlpacaBrokerAdapter', () => {
  it('exposes canTrade=false when trading is disabled', () => {
    const adapter = new AlpacaBrokerAdapter(new StubClient(), baseConfig);
    expect(adapter.canTrade).toBe(false);
  });

  it('parses the account snapshot', async () => {
    const adapter = new AlpacaBrokerAdapter(new StubClient(), baseConfig);
    expect(await adapter.getAccount()).toEqual({
      accountId: 'acc-1',
      equity: 100000,
      cash: 90000,
      buyingPower: 180000,
      currency: 'USD',
      tradingBlocked: false,
    });
  });

  it('maps positions including side and PnL', async () => {
    const adapter = new AlpacaBrokerAdapter(new StubClient(), baseConfig);
    const positions = await adapter.getPositions();
    expect(positions).toEqual([
      {
        symbol: 'NVDA',
        side: 'long',
        shares: 50,
        averageEntryPrice: 100.25,
        marketValue: 5100,
        unrealizedPnl: 50,
      },
    ]);
  });

  it('blocks submitBracketOrder when trading is disabled', async () => {
    const adapter = new AlpacaBrokerAdapter(new StubClient(), baseConfig);
    await expect(
      adapter.submitBracketOrder({
        clientOrderId: 'co-1',
        symbol: 'NVDA',
        side: 'long',
        shares: 10,
        stop: 96,
        target: 117,
        type: 'market',
      }),
    ).rejects.toBeInstanceOf(TradingDisabledError);
  });

  it('submits a bracket order with bracket payload when trading is enabled', async () => {
    const client = new StubClient();
    const adapter = new AlpacaBrokerAdapter(client, { ...baseConfig, tradingEnabled: true });

    const result = await adapter.submitBracketOrder({
      clientOrderId: 'co-1',
      symbol: 'NVDA',
      side: 'long',
      shares: 10,
      stop: 96,
      target: 117,
      type: 'market',
    });

    expect(result).toEqual({
      brokerOrderId: 'broker-123',
      clientOrderId: 'co-1',
      status: 'accepted',
      submittedAt: '2026-06-02T13:30:00Z',
    });
    expect(client.lastCreate).toMatchObject({
      symbol: 'NVDA',
      qty: 10,
      side: 'buy',
      order_class: 'bracket',
      stop_loss: { stop_price: 96 },
      take_profit: { limit_price: 117 },
      client_order_id: 'co-1',
    });
  });

  it('requires a limit price for limit orders', async () => {
    const adapter = new AlpacaBrokerAdapter(new StubClient(), { ...baseConfig, tradingEnabled: true });
    await expect(
      adapter.submitBracketOrder({
        clientOrderId: 'co-1',
        symbol: 'NVDA',
        side: 'long',
        shares: 10,
        stop: 96,
        target: 117,
        type: 'limit',
      }),
    ).rejects.toThrow('limitPrice is required');
  });

  it('rejects non-positive share counts', async () => {
    const adapter = new AlpacaBrokerAdapter(new StubClient(), { ...baseConfig, tradingEnabled: true });
    await expect(
      adapter.submitBracketOrder({
        clientOrderId: 'co-1',
        symbol: 'NVDA',
        side: 'long',
        shares: 0,
        stop: 96,
        target: 117,
        type: 'market',
      }),
    ).rejects.toThrow('non-positive shares');
  });

  it('throws a clear error on non-numeric strings', async () => {
    const broken = new StubClient();
    broken.getAccount = async () => ({ ...account, equity: 'NaN' });
    const adapter = new AlpacaBrokerAdapter(broken, baseConfig);
    await expect(adapter.getAccount()).rejects.toThrow('Expected numeric string');
  });

  it('proxies cancelOrder to the client', async () => {
    const client = new StubClient();
    const adapter = new AlpacaBrokerAdapter(client, baseConfig);
    await adapter.cancelOrder('broker-123');
    expect(client.cancelled).toEqual(['broker-123']);
  });

  describe('simple orders (crypto-capable)', () => {
    it('submits a crypto order with gtc tif and notional (no bracket)', async () => {
      const client = new StubClient();
      const adapter = new AlpacaBrokerAdapter(client, { ...baseConfig, tradingEnabled: true });
      const result = await adapter.submitSimpleOrder({
        clientOrderId: 'co-2',
        symbol: 'BTC/USD',
        side: 'long',
        notional: 10,
        type: 'market',
      });
      expect(result.brokerOrderId).toBe('broker-123');
      expect(client.lastCreate).toMatchObject({
        symbol: 'BTC/USD',
        notional: 10,
        side: 'buy',
        type: 'market',
        time_in_force: 'gtc',
        order_class: 'simple',
      });
      expect(client.lastCreate?.qty).toBeUndefined();
      expect(client.lastCreate?.stop_loss).toBeUndefined();
    });

    it('uses day tif and qty for equity simple orders', async () => {
      const client = new StubClient();
      const adapter = new AlpacaBrokerAdapter(client, { ...baseConfig, tradingEnabled: true });
      await adapter.submitSimpleOrder({
        clientOrderId: 'co-3',
        symbol: 'AAPL',
        side: 'long',
        shares: 2,
        type: 'market',
      });
      expect(client.lastCreate).toMatchObject({ symbol: 'AAPL', qty: 2, time_in_force: 'day', order_class: 'simple' });
    });

    it('rejects when both shares and notional are provided', async () => {
      const adapter = new AlpacaBrokerAdapter(new StubClient(), { ...baseConfig, tradingEnabled: true });
      await expect(
        adapter.submitSimpleOrder({ clientOrderId: 'c', symbol: 'BTC/USD', side: 'long', shares: 1, notional: 10, type: 'market' }),
      ).rejects.toThrow('exactly one');
    });

    it('blocks simple order when trading is disabled', async () => {
      const adapter = new AlpacaBrokerAdapter(new StubClient(), baseConfig);
      await expect(
        adapter.submitSimpleOrder({ clientOrderId: 'c', symbol: 'BTC/USD', side: 'long', notional: 10, type: 'market' }),
      ).rejects.toBeInstanceOf(TradingDisabledError);
    });
  });

  describe('monitoring + asset search', () => {
    it('returns [] from getOrders when the client lacks the endpoint', async () => {
      const adapter = new AlpacaBrokerAdapter(new StubClient(), baseConfig);
      expect(await adapter.getOrders()).toEqual([]);
    });

    it('maps orders for monitoring', async () => {
      const client = new StubClient();
      client.getOrders = async () => [
        {
          id: 'o1',
          client_order_id: 'c1',
          symbol: 'BTC/USD',
          side: 'buy',
          type: 'market',
          qty: null,
          notional: '10',
          filled_qty: '0',
          filled_avg_price: null,
          status: 'accepted',
          submitted_at: 't',
        },
      ];
      const adapter = new AlpacaBrokerAdapter(client, baseConfig);
      const orders = await adapter.getOrders();
      expect(orders[0]).toMatchObject({ symbol: 'BTC/USD', side: 'long', notional: 10, filledQuantity: 0, quantity: null });
    });

    it('filters tradable assets by search term', async () => {
      const client = new StubClient();
      client.getAssets = async () => [
        { id: '1', class: 'crypto', exchange: 'CRYPTO', symbol: 'BTC/USD', name: 'Bitcoin', status: 'active', tradable: true, fractionable: true },
        { id: '2', class: 'crypto', exchange: 'CRYPTO', symbol: 'ETH/USD', name: 'Ether', status: 'active', tradable: true, fractionable: true },
        { id: '3', class: 'crypto', exchange: 'CRYPTO', symbol: 'DOGE/USD', name: 'Dogecoin', status: 'active', tradable: false, fractionable: true },
      ];
      const adapter = new AlpacaBrokerAdapter(client, baseConfig);
      const assets = await adapter.searchAssets({ search: 'bit', assetClass: 'crypto' });
      expect(assets.map((a) => a.symbol)).toEqual(['BTC/USD']);
    });
  });
});
