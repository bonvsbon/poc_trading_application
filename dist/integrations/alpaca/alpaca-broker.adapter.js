"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlpacaBrokerAdapter = void 0;
const broker_port_1 = require("../../engine/ports/broker.port");
const alpaca_market_data_adapter_1 = require("./alpaca-market-data.adapter");
const num = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        throw new Error(`Expected numeric string from Alpaca, got "${value}"`);
    }
    return parsed;
};
const numOrNull = (value) => value === null || value === undefined ? null : num(value);
const sideFromAlpaca = (side) => (side === 'buy' ? 'long' : 'short');
class AlpacaBrokerAdapter {
    client;
    config;
    constructor(client, config) {
        this.client = client;
        this.config = config;
    }
    get canTrade() {
        return this.config.tradingEnabled;
    }
    async getAccount() {
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
    async getPositions() {
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
    async submitBracketOrder(order) {
        if (!this.config.tradingEnabled) {
            throw new broker_port_1.TradingDisabledError();
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
    async submitSimpleOrder(order) {
        if (!this.config.tradingEnabled) {
            throw new broker_port_1.TradingDisabledError();
        }
        const hasShares = order.shares !== undefined;
        const hasNotional = order.notional !== undefined;
        if (hasShares === hasNotional) {
            throw new Error('Provide exactly one of shares or notional');
        }
        if (hasShares && order.shares <= 0) {
            throw new Error('Cannot submit order with non-positive shares');
        }
        if (hasNotional && order.notional <= 0) {
            throw new Error('Cannot submit order with non-positive notional');
        }
        if (order.type === 'limit' && order.limitPrice === undefined) {
            throw new Error('limitPrice is required for limit orders');
        }
        const timeInForce = (0, alpaca_market_data_adapter_1.isCryptoSymbol)(order.symbol) ? 'gtc' : 'day';
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
    async getOrders() {
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
    async searchAssets(query) {
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
            .filter((a) => term === '' ||
            a.symbol.toLowerCase().includes(term) ||
            (a.name ?? '').toLowerCase().includes(term))
            .slice(0, limit)
            .map((a) => ({
            symbol: a.symbol,
            name: a.name,
            assetClass: a.class,
            tradable: a.tradable,
            fractionable: a.fractionable,
        }));
    }
    async cancelOrder(brokerOrderId) {
        await this.client.cancelOrder(brokerOrderId);
    }
}
exports.AlpacaBrokerAdapter = AlpacaBrokerAdapter;
//# sourceMappingURL=alpaca-broker.adapter.js.map