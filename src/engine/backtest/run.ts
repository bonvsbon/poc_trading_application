import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { Backtester } from './backtester';
import { parseCsv } from './data-loader';
import { VwapReclaimStrategy } from '../strategy/vwap-reclaim.strategy';

/**
 * CLI entry point: `ts-node src/engine/backtest/run.ts <csv> [symbol] [startingCash] [sector]`
 */
function main(argv: string[]): void {
  const [csvPath, symbolArg, cashArg, sectorArg] = argv;

  if (!csvPath) {
    console.error('Usage: backtest <csv-path> [symbol] [startingCash] [sector]');
    process.exitCode = 1;
    return;
  }

  const symbol = symbolArg ?? basename(csvPath).replace(/\.csv$/i, '').replace(/^sample-/i, '');
  const startingCash = cashArg ? Number(cashArg) : 100000;
  const sector = sectorArg ?? 'Default';

  const bars = parseCsv(readFileSync(csvPath, 'utf8'), symbol);
  const backtester = new Backtester({ strategy: new VwapReclaimStrategy() });
  const result = backtester.run(bars, { startingCash, sector });

  console.log(`Backtest: ${symbol}  (${bars.length} bars)`);
  console.log('Metrics:', JSON.stringify(result.metrics, null, 2));
  console.log(`Trades: ${result.closedTrades.length}`);
  for (const trade of result.closedTrades) {
    console.log(
      `  ${trade.symbol} ${trade.side} x${trade.shares}  ${trade.entryPrice.toFixed(2)} -> ` +
        `${trade.exitPrice.toFixed(2)}  pnl ${trade.pnl.toFixed(2)} (${trade.reason})`,
    );
  }
}

if (require.main === module) {
  main(process.argv.slice(2));
}

export { main };
