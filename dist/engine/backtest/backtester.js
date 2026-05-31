"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Backtester = void 0;
const execution_simulator_1 = require("../execution/execution-simulator");
const portfolio_1 = require("../portfolio/portfolio");
const risk_engine_1 = require("../risk/risk-engine");
const metrics_1 = require("./metrics");
class Backtester {
    strategy;
    risk;
    execution;
    constructor(deps) {
        this.strategy = deps.strategy;
        this.risk = deps.riskEngine ?? new risk_engine_1.RiskEngine();
        this.execution = deps.executionSimulator ?? new execution_simulator_1.ExecutionSimulator();
    }
    run(bars, config) {
        const portfolio = new portfolio_1.Portfolio(config.startingCash);
        const equityCurve = [];
        let consecutiveLosses = 0;
        for (let i = 0; i < bars.length; i++) {
            const current = bars[i];
            const symbol = current.symbol;
            if (portfolio.hasPosition(symbol)) {
                const position = portfolio.openPositions.find((p) => p.symbol === symbol);
                const exit = this.execution.checkExit(position, current);
                if (exit) {
                    const trade = portfolio.closePosition(symbol, exit.price, exit.reason);
                    consecutiveLosses = trade.pnl < 0 ? consecutiveLosses + 1 : 0;
                }
            }
            if (!portfolio.hasPosition(symbol)) {
                const signal = this.strategy.evaluate({ bars: bars.slice(0, i + 1) });
                if (signal && signal.side === 'long') {
                    const equity = portfolio.equity({ [symbol]: current.close });
                    const sizing = this.risk.sizePosition({
                        signal,
                        sector: config.sector,
                        account: {
                            equity,
                            openTradesCount: portfolio.openPositions.length,
                            tickerNotional: this.notionalByKey(portfolio, current.close, 'symbol'),
                            sectorNotional: { [config.sector]: this.totalNotional(portfolio, current.close) },
                            dailyPnlPercent: ((equity - config.startingCash) / config.startingCash) * 100,
                            consecutiveLosses,
                        },
                        limits: config.riskLimits,
                    });
                    if (sizing.approved) {
                        const fill = this.execution.fillEntry({ symbol, side: 'long', shares: sizing.shares, entry: signal.price, stop: signal.stop, target: signal.target }, signal.price);
                        portfolio.openPosition({
                            symbol,
                            side: 'long',
                            shares: fill.shares,
                            entryPrice: fill.price,
                            stop: signal.stop,
                            target: signal.target,
                        });
                    }
                }
            }
            equityCurve.push(portfolio.equity({ [symbol]: current.close }));
        }
        if (bars.length > 0) {
            const last = bars[bars.length - 1];
            for (const position of portfolio.openPositions) {
                const exit = this.execution.forceClose(position, last);
                portfolio.closePosition(position.symbol, exit.price, exit.reason);
            }
            if (portfolio.openPositions.length === 0 && equityCurve.length > 0) {
                equityCurve[equityCurve.length - 1] = portfolio.equity({});
            }
        }
        return {
            equityCurve,
            closedTrades: portfolio.closedTrades,
            metrics: (0, metrics_1.computeMetrics)(equityCurve, portfolio.closedTrades, config.startingCash),
        };
    }
    notionalByKey(portfolio, price, _key) {
        const out = {};
        for (const position of portfolio.openPositions) {
            out[position.symbol] = position.shares * price;
        }
        return out;
    }
    totalNotional(portfolio, price) {
        return portfolio.openPositions.reduce((sum, p) => sum + p.shares * price, 0);
    }
}
exports.Backtester = Backtester;
//# sourceMappingURL=backtester.js.map