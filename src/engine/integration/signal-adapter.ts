import { PositionSizing } from '../risk/risk-engine';
import { StrategySignal } from '../strategy/strategy';

export interface DashboardSignalView {
  id: string;
  symbol: string;
  side: 'Long' | 'Short';
  status: 'pending';
  price: string;
  confidence: number;
  riskReward: string;
  stop: string;
  target: string;
  thesis: string;
  priority: boolean;
}

const money = (value: number): string => `$${value.toFixed(2)}`;

/** Convert an engine signal (+ optional sizing) into the dashboard's signal shape. */
export const toDashboardSignal = (
  signal: StrategySignal,
  sizing?: PositionSizing,
): DashboardSignalView => {
  const risk = Math.abs(signal.price - signal.stop);
  const reward = Math.abs(signal.target - signal.price);
  const riskReward = risk === 0 ? 'n/a' : `1:${(reward / risk).toFixed(1)}`;

  const sizeNote = sizing?.approved ? ` · size ${sizing.shares} shares` : '';

  return {
    id: `live-${signal.symbol.toLowerCase()}`,
    symbol: signal.symbol,
    side: signal.side === 'long' ? 'Long' : 'Short',
    status: 'pending',
    price: money(signal.price),
    confidence: signal.confidence,
    riskReward,
    stop: money(signal.stop),
    target: money(signal.target),
    thesis: `${signal.reason}${sizeNote}`,
    priority: true,
  };
};
