"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Portfolio = void 0;
class Portfolio {
    cashBalance;
    open = new Map();
    closed = [];
    constructor(startingCash) {
        this.cashBalance = startingCash;
    }
    get cash() {
        return this.cashBalance;
    }
    get openPositions() {
        return [...this.open.values()];
    }
    get closedTrades() {
        return [...this.closed];
    }
    hasPosition(symbol) {
        return this.open.has(symbol);
    }
    openPosition(position) {
        if (position.side !== 'long') {
            throw new Error('Portfolio currently supports long-only positions');
        }
        if (this.open.has(position.symbol)) {
            throw new Error(`Position already open for ${position.symbol}`);
        }
        const cost = position.shares * position.entryPrice;
        if (cost > this.cashBalance) {
            throw new Error('Insufficient cash to open position');
        }
        this.cashBalance -= cost;
        this.open.set(position.symbol, position);
    }
    closePosition(symbol, exitPrice, reason) {
        const position = this.open.get(symbol);
        if (!position) {
            throw new Error(`No open position for ${symbol}`);
        }
        this.cashBalance += position.shares * exitPrice;
        this.open.delete(symbol);
        const pnl = position.shares * (exitPrice - position.entryPrice);
        const returnPct = ((exitPrice - position.entryPrice) / position.entryPrice) * 100;
        const trade = {
            symbol,
            side: position.side,
            shares: position.shares,
            entryPrice: position.entryPrice,
            exitPrice,
            pnl,
            returnPct,
            reason,
        };
        this.closed.push(trade);
        return trade;
    }
    equity(markPrices) {
        let marketValue = 0;
        for (const position of this.open.values()) {
            const price = markPrices[position.symbol] ?? position.entryPrice;
            marketValue += position.shares * price;
        }
        return this.cashBalance + marketValue;
    }
}
exports.Portfolio = Portfolio;
//# sourceMappingURL=portfolio.js.map