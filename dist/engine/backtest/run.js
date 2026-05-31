"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const backtester_1 = require("./backtester");
const data_loader_1 = require("./data-loader");
const vwap_reclaim_strategy_1 = require("../strategy/vwap-reclaim.strategy");
function main(argv) {
    const [csvPath, symbolArg, cashArg, sectorArg] = argv;
    if (!csvPath) {
        console.error('Usage: backtest <csv-path> [symbol] [startingCash] [sector]');
        process.exitCode = 1;
        return;
    }
    const symbol = symbolArg ?? (0, node_path_1.basename)(csvPath).replace(/\.csv$/i, '').replace(/^sample-/i, '');
    const startingCash = cashArg ? Number(cashArg) : 100000;
    const sector = sectorArg ?? 'Default';
    const bars = (0, data_loader_1.parseCsv)((0, node_fs_1.readFileSync)(csvPath, 'utf8'), symbol);
    const backtester = new backtester_1.Backtester({ strategy: new vwap_reclaim_strategy_1.VwapReclaimStrategy() });
    const result = backtester.run(bars, { startingCash, sector });
    console.log(`Backtest: ${symbol}  (${bars.length} bars)`);
    console.log('Metrics:', JSON.stringify(result.metrics, null, 2));
    console.log(`Trades: ${result.closedTrades.length}`);
    for (const trade of result.closedTrades) {
        console.log(`  ${trade.symbol} ${trade.side} x${trade.shares}  ${trade.entryPrice.toFixed(2)} -> ` +
            `${trade.exitPrice.toFixed(2)}  pnl ${trade.pnl.toFixed(2)} (${trade.reason})`);
    }
}
if (require.main === module) {
    main(process.argv.slice(2));
}
//# sourceMappingURL=run.js.map