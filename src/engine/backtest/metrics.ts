import { ClosedTrade } from '../portfolio/portfolio';

export interface BacktestMetrics {
  startingEquity: number;
  finalEquity: number;
  totalReturnPct: number;
  trades: number;
  wins: number;
  losses: number;
  winRatePct: number;
  profitFactor: number;
  maxDrawdownPct: number;
  sharpe: number;
}

const round = (value: number, dp = 4): number => {
  const factor = 10 ** dp;
  return Math.round(value * factor) / factor;
};

/** Largest peak-to-trough decline on the equity curve, as a positive percent. */
export const maxDrawdownPct = (equityCurve: number[]): number => {
  let peak = -Infinity;
  let maxDrawdown = 0;

  for (const equity of equityCurve) {
    if (equity > peak) {
      peak = equity;
    }
    if (peak > 0) {
      const drawdown = ((peak - equity) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
  }

  return maxDrawdown;
};

/** Annualized Sharpe ratio from per-step equity returns (risk-free rate assumed 0). */
export const sharpeRatio = (equityCurve: number[], periodsPerYear = 252): number => {
  if (equityCurve.length < 2) {
    return 0;
  }

  const returns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const prev = equityCurve[i - 1];
    if (prev !== 0) {
      returns.push((equityCurve[i] - prev) / prev);
    }
  }

  if (returns.length === 0) {
    return 0;
  }

  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / returns.length;
  const std = Math.sqrt(variance);
  if (std === 0) {
    return 0;
  }

  return (mean / std) * Math.sqrt(periodsPerYear);
};

export const computeMetrics = (
  equityCurve: number[],
  closedTrades: ClosedTrade[],
  startingEquity: number,
): BacktestMetrics => {
  const finalEquity = equityCurve.length ? equityCurve[equityCurve.length - 1] : startingEquity;

  const wins = closedTrades.filter((t) => t.pnl > 0);
  const losses = closedTrades.filter((t) => t.pnl < 0);
  const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));

  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLoss;

  return {
    startingEquity: round(startingEquity),
    finalEquity: round(finalEquity),
    totalReturnPct: round(((finalEquity - startingEquity) / startingEquity) * 100),
    trades: closedTrades.length,
    wins: wins.length,
    losses: losses.length,
    winRatePct: closedTrades.length ? round((wins.length / closedTrades.length) * 100) : 0,
    profitFactor: Number.isFinite(profitFactor) ? round(profitFactor) : profitFactor,
    maxDrawdownPct: round(maxDrawdownPct(equityCurve)),
    sharpe: round(sharpeRatio(equityCurve)),
  };
};
